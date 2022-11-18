import {
  GetItemCommand,
} from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { z } from "zod"
import {
  DATABASE_ERROR,
  PARSING_ERROR,
  returnError,
} from "../../utils/constants"
import express from "express"
import { dynamoClient } from "../../utils/clients"
import {
  MatchesTableItem,
  PointsTableItem,
  pointsTableSchema,
  PredictionsTableItem,
  predictionsTableSchema,
} from "../../../common/dbModels/models"
import { getLiveMatches } from "../match/getLive"
import { calculatePoints } from "../../utils/points"
import { PREDICTIONS_TABLE_NAME } from "../../utils/database"

const getPointsSchema = z.object({
  userIds: z.array(z.string()),
})

const POINTS_TABLE_NAME = process.env.POINTS_TABLE_NAME as string

export const getPointsForUsers = async (
  userIds: string[]
): Promise<PointsTableItem[]> => {
  const unmarshalledResponses = await Promise.all(userIds.map(async userId => {
    const user = await dynamoClient.send(new GetItemCommand({
      TableName: POINTS_TABLE_NAME,
      Key: marshall({userId})
    }))
    if (!user.Item) throw Error(`Cannot find user points: ${userId}`)
    return unmarshall(user.Item)
  }))
  const parsedResponses = unmarshalledResponses.map((points) =>
    pointsTableSchema.parse(points)
  )
  return parsedResponses
}

export const getLivePointsForUser = async (userId: string, liveMatches: MatchesTableItem[]) => {
  if (!liveMatches) return 0
  const livePoints = await Promise.all(
    liveMatches.map(async (liveMatch) => {
      const prediction = await dynamoClient.send(
        new GetItemCommand({
          TableName: PREDICTIONS_TABLE_NAME,
          Key: marshall({ userId, matchId: liveMatch.matchId }),
        })
      )
      let parsedPrediction: PredictionsTableItem
      if (!prediction.Item) {
        parsedPrediction = {
          userId,
          matchId: liveMatch.matchId
        }
      } else {
        parsedPrediction = predictionsTableSchema.parse(
          unmarshall(prediction.Item)
        )
      }
      
      if (
        parsedPrediction &&
        (parsedPrediction.awayScore === 0 || parsedPrediction.awayScore) &&
        (parsedPrediction.homeScore === 0 || parsedPrediction.homeScore)
      ) {
        console.log(JSON.stringify({ homeScore: parsedPrediction.homeScore, awayScore: parsedPrediction.awayScore }),
          JSON.stringify({
            homeScore: liveMatch.result ? liveMatch.result.home : 0,
            awayScore: liveMatch.result ? liveMatch.result.away : 0,
          }))
        const points = calculatePoints(
          { homeScore: parsedPrediction.homeScore, awayScore: parsedPrediction.awayScore },
          {
            homeScore: liveMatch.result ? liveMatch.result.home : 0,
            awayScore: liveMatch.result ? liveMatch.result.away : 0,
          }
        )
        console.log(points)
        return points
      }
      return 0
    })
  )
  return livePoints.reduce((partialSum, a) => partialSum + a, 0)
}

export const getPointsHandler: express.Handler = async (req, res) => {
  const getPoints = getPointsSchema.safeParse(req.body)
  if (!getPoints.success) return returnError(res, PARSING_ERROR)

  const liveMatches = await getLiveMatches()

  const getPointsData = getPoints.data
  const { userIds } = getPointsData
  try {
    const pointsRecords = await getPointsForUsers(userIds)

    const pointsWithLive = await Promise.all(
      pointsRecords.map(async (userPoints) => {
        const livePoints = await getLivePointsForUser(userPoints.userId, liveMatches)
        return { ...userPoints, livePoints }
      })
    )

    res.status(200)
    res.json({
      message: "Successfully fetched points",
      body: pointsWithLive,
    })
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }
}
