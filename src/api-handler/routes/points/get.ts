import {
  BatchGetItemCommand,
  BatchGetItemCommandInput,
} from "@aws-sdk/client-dynamodb"
import { unmarshall } from "@aws-sdk/util-dynamodb"
import { z } from "zod"
import {
  DATABASE_ERROR,
  PARSING_ERROR,
  returnError,
} from "../../utils/constants"
import express from "express"
import { dynamoClient } from "../../utils/clients"
import {
  PointsTableItem,
  pointsTableSchema,
} from "../../../common/dbModels/models"
import { getLiveMatches } from "../match/getLive"
import { getPredictionsForUserId } from "../predictions/fetch"
import { calculatePoints } from "../../utils/points"

const getPointsSchema = z.object({
  userIds: z.array(z.string()),
})

const POINTS_TABLE_NAME = process.env.POINTS_TABLE_NAME as string

export const getPointsForUsers = async (
  userIds: string[]
): Promise<PointsTableItem[]> => {
  const queryKeys = userIds.map((userId) => {
    return { userId: { S: userId } }
  })
  const getBatchParams: BatchGetItemCommandInput = {
    RequestItems: {
      [POINTS_TABLE_NAME]: {
        Keys: queryKeys,
      },
    },
  }
  const data = await dynamoClient.send(new BatchGetItemCommand(getBatchParams))
  if (!data.Responses) {
    throw new Error("Error retreiving points")
  }

  const unmarshalledResponses = data.Responses[POINTS_TABLE_NAME].map(
    (response) => unmarshall(response)
  )
  const parsedResponses = unmarshalledResponses.map((points) =>
    pointsTableSchema.parse(points)
  )
  return parsedResponses
}

export const getLivePointsForUser = async (userId: string) => {
  const liveMatches = await getLiveMatches()
  if (!liveMatches) return 0
  const livePoints = await Promise.all(
    liveMatches.map(async (liveMatch) => {
      const prediction = (
        await getPredictionsForUserId(userId, [liveMatch.matchId])
      )[0]
      console.log(`prediction: ${JSON.stringify(prediction)}, userId: ${userId}`)
      if (
        prediction &&
        (prediction.awayScore === 0 || prediction.awayScore) &&
        (prediction.homeScore === 0 || prediction.homeScore)
      ) {
        console.log("Prediction exists")
        console.log(JSON.stringify({ homeScore: prediction.homeScore, awayScore: prediction.awayScore }),
          JSON.stringify({
            homeScore: liveMatch.result ? liveMatch.result.home : 0,
            awayScore: liveMatch.result ? liveMatch.result.away : 0,
          }))
        const points = calculatePoints(
          { homeScore: prediction.homeScore, awayScore: prediction.awayScore },
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

  const getPointsData = getPoints.data
  const { userIds } = getPointsData
  try {
    const pointsRecords = await getPointsForUsers(userIds)

    const pointsWithLive = await Promise.all(
      pointsRecords.map(async (userPoints) => {
        const livePoints = await getLivePointsForUser(userPoints.userId)
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
