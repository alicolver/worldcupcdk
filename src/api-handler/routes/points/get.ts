import { GetItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { DATABASE_ERROR, returnError } from "../../utils/constants"
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
import { calculatePoints, calculateTodaysPoints } from "../../utils/points"
import { PREDICTIONS_TABLE_NAME } from "../../utils/database"
import { getUserId } from "../auth/utils"

const POINTS_TABLE_NAME = process.env.POINTS_TABLE_NAME as string

export const getPointsForUsers = async (
  userIds: string[]
): Promise<PointsTableItem[]> => {
  const unmarshalledResponses = await Promise.all(
    userIds.map(async (userId) => {
      const user = await dynamoClient.send(
        new GetItemCommand({
          TableName: POINTS_TABLE_NAME,
          Key: marshall({ userId }),
        })
      )
      if (!user.Item) throw Error(`Cannot find user points: ${userId}`)
      return unmarshall(user.Item)
    })
  )
  const parsedResponses = unmarshalledResponses.map((points) =>
    pointsTableSchema.parse(points)
  )
  return parsedResponses
}

export const getLivePointsForUser = async (
  userId: string,
  liveMatches: MatchesTableItem[]
) => {
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
          matchId: liveMatch.matchId,
        }
      } else {
        parsedPrediction = predictionsTableSchema.parse(
          unmarshall(prediction.Item)
        )
      }

      const points = calculatePoints(
        {
          homeScore: liveMatch.result ? liveMatch.result.home : 0,
          awayScore: liveMatch.result ? liveMatch.result.away : 0,
        },
        {
          homeScore: parsedPrediction.homeScore,
          awayScore: parsedPrediction.awayScore,
        }
      )
      return points
    })
  )
  return livePoints.reduce((partialSum, a) => partialSum + a, 0)
}

export const getPointsHandler: express.Handler = async (req, res) => {
  const liveMatches = await getLiveMatches()

  const userId = getUserId(req.user!)
  try {
    const pointsRecords = await getPointsForUsers([userId])

    const pointsWithLive = await Promise.all(
      pointsRecords.map(async (userPoints) => {
        const livePoints = await getLivePointsForUser(
          userPoints.userId,
          liveMatches
        )
        const todaysPoints = calculateTodaysPoints(
          userPoints.pointsHistory,
          livePoints
        )
        return {
          ...userPoints,
          totalPoints: userPoints.totalPoints + livePoints,
          livePoints,
          todaysPoints,
        }
      })
    )

    res.status(200)
    res.json({
      message: "Successfully fetched points",
      data: pointsWithLive,
    })
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }
}
