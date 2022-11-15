import {
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { z } from "zod"
import {
  DATABASE_ERROR,
  PARSING_ERROR,
  returnError,
} from "../../utils/constants"
import {
  MATCHES_TABLE_NAME,
  POINTS_TABLE_NAME,
  PREDICTIONS_TABLE_NAME,
  USERS_TABLE_NAME,
} from "../../utils/database"
import express from "express"
import { dynamoClient } from "../../utils/clients"
import { getPointsForUsers } from "../points/get"
import { getPredictionsForUserId } from "../predictions/fetch"
import { getMatchFromId } from "./utils"
import {
  PointsTableItem,
  PredictionsTableItem,
} from "../../../common/dbModels/models"

const endMatchSchema = z.object({
  matchId: z.string(),
  homeScore: z.number(),
  awayScore: z.number(),
})

// TODO: Wrap with admin
export const endMatchHandler: express.Handler = async (req, res) => {
  const endMatch = endMatchSchema.safeParse(req.body)
  if (!endMatch.success) return returnError(res, PARSING_ERROR)

  const { matchId, homeScore, awayScore } = endMatch.data

  const match = await getMatchFromId(matchId)
  const updatedMatch = {
    ...match,
    isFinished: true,
    result: {
      home: homeScore,
      away: awayScore,
    },
  }

  try {
    await dynamoClient.send(
      new PutItemCommand({
        TableName: MATCHES_TABLE_NAME,
        Item: marshall(updatedMatch),
      })
    )
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }

  try {
    const userIdsScan = await dynamoClient.send(
      new ScanCommand({
        TableName: USERS_TABLE_NAME,
        ProjectionExpression: "userId",
      })
    )
    const userIds = z
      .array(z.string())
      .parse(userIdsScan.Items?.map((userId) => unmarshall(userId).userId))

    await Promise.all(
      userIds.map(async (userId) => {
        const prediction = (
          await getPredictionsForUserId(userId, [matchId])
        )[0]
        const userPoints = (await getPointsForUsers([userId]))[0]
        const points = (prediction && prediction.homeScore && prediction.awayScore) ? calculatePoints(
          { homeScore: prediction.homeScore, awayScore: prediction.awayScore },
          { homeScore, awayScore }
        ) : 0

        const updatedPrediction: PredictionsTableItem = prediction ? {
          ...prediction,
          points,
        } : {
          matchId,
          userId,
          points
        }

        const pointsHistory = userPoints.pointsHistory
        if (pointsHistory.length < match.matchDay) {
          pointsHistory.push(points)
        } else {
          const todaysPoints = pointsHistory.pop()
          pointsHistory.push((todaysPoints || 0) + points)
        }

        const updatedUserPoints: PointsTableItem = {
          ...userPoints,
          pointsHistory,
          totalPoints: userPoints.totalPoints + points,
        }
        await dynamoClient.send(
          new PutItemCommand({
            TableName: POINTS_TABLE_NAME,
            Item: marshall(updatedUserPoints),
          })
        )
        await dynamoClient.send(
          new PutItemCommand({
            TableName: PREDICTIONS_TABLE_NAME,
            Item: marshall(updatedPrediction),
          })
        )
        return userId
      })
    )
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }

  res.status(200)
  res.json({ message: "Successfully ended match" })
}

type Score = {
  homeScore: number;
  awayScore: number;
};

const calculatePoints = (prediction: Score, result: Score): number => {
  let points = 0

  // correct result 2 points
  if (
    (prediction.homeScore <= prediction.awayScore &&
      result.homeScore <= result.awayScore) ||
    (prediction.homeScore > prediction.awayScore &&
      result.homeScore > result.awayScore)
  ) {
    points += 2
  }

  // correct score 1 bonus point
  if (
    prediction.awayScore === result.awayScore &&
    prediction.homeScore === result.homeScore
  ) {
    points += 1
  }

  return points
}
