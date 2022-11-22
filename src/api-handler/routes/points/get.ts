import { GetItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import express from "express"
import { dynamoClient } from "../../utils/clients"
import {
  leagueTableSchema,
  MatchesTableItem,
  PointsTableItem,
  pointsTableSchema,
  PredictionsTableItem,
  predictionsTableSchema,
  userTableSchema,
} from "../../../common/dbModels/models"
import { calculatePoints } from "../../utils/points"
import {
  LEAGUE_TABLE_NAME,
  PREDICTIONS_TABLE_NAME,
  USERS_TABLE_NAME,
} from "../../utils/database"
import { getUserId } from "../auth/utils"
import { batchGetFromDynamo } from "../../utils/dynamo"
import { arrayToObject } from "../../utils/utils"

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

export const getPointsForLeagueHandler: express.Handler = async (req, res) => {
  const leagueId = req.query["league-id"] as string | undefined
  if (!leagueId) {
    res.status(400)
    res.json({ message: "leagueId must be included as query paramter" })
  }

  const league = await dynamoClient.send(
    new GetItemCommand({
      TableName: LEAGUE_TABLE_NAME,
      Key: marshall({ leagueId }),
    })
  )

  if (!league.Item) {
    res.status(400)
    res.json({ message: "Cannot find league" })
    return
  }
  const parsedLeague = leagueTableSchema.parse(unmarshall(league.Item))
  const userIds = parsedLeague.userIds
  const keys = userIds.map((userId) => {
    return { userId }
  })

  const pointsRecords = await batchGetFromDynamo(
    keys,
    pointsTableSchema,
    dynamoClient,
    POINTS_TABLE_NAME,
    ["userId", "pointsHistory", "totalPoints"]
  )
  const userRecords = await batchGetFromDynamo(
    keys,
    userTableSchema,
    dynamoClient,
    USERS_TABLE_NAME,
    ["userId", "familyName", "givenName", "leagueIds"]
  )

  const pointsRecordsObjects = arrayToObject(
    pointsRecords,
    (pointsRecord) => pointsRecord.userId
  )
  const userRecordsObjects = arrayToObject(
    userRecords,
    (userRecord) => userRecord.userId
  )

  const userPointsRecords = userIds.map((userId) => {
    const pointsRecord = pointsRecordsObjects[userId]
    const userRecord = userRecordsObjects[userId]
    return {
      userId,
      givenName: userRecord.givenName,
      familyName: userRecord.familyName,
      pointsHistory: pointsRecord.pointsHistory,
      totalPoints: pointsRecord.totalPoints,
    }
  })

  res.status(200)
  res.json({
    message: "Succesfully fetched points",
    data: userPointsRecords,
  })
}

export const getPointsForUserHandler: express.Handler = async (req, res) => {
  const userId = getUserId(req.user!)
  const points = await dynamoClient.send(
    new GetItemCommand({
      TableName: POINTS_TABLE_NAME,
      Key: marshall({ userId }),
    })
  )
  if (!points.Item) {
    res.status(400)
    res.json({ message: "Cannot find points for user" })
    return
  }
  const parsedPoints = pointsTableSchema.parse(unmarshall(points.Item))
  res.status(200)
  res.json({
    message: "Successfully retrieved points for user",
    data: parsedPoints,
  })
}
