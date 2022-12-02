import { PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb"
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
import { getMatchFromId } from "./utils"
import {
  pointsTableSchema,
  predictionsTableSchema,
} from "../../../common/dbModels/models"
import { calculatePoints } from "../../utils/points"
import { batchGetFromDynamo, batchPutInDynamo } from "../../utils/dynamo"
import { arrayToObject } from "../../utils/utils"

const endMatchSchema = z.object({
  matchId: z.string(),
  homeScore: z.number(),
  awayScore: z.number(),
  toGoThrough: z.enum(["home", "away"]).nullish(),
})

export const endMatchHandler: express.Handler = async (req, res) => {
  const endMatch = endMatchSchema.safeParse(req.body)
  if (!endMatch.success) return returnError(res, PARSING_ERROR)

  const { matchId, homeScore, awayScore, toGoThrough } = endMatch.data

  const match = await getMatchFromId(matchId)
  if (match.isFinished) {
    res.status(409), res.json({ message: "Match has already been ended" })
    return
  }
  if (match.gameStage != "GROUP" && !toGoThrough) {
    res.status(403)
    res.json({ message: "toGoThrough must be defined for knockout game" })
  }
  const updatedMatch = {
    ...match,
    isFinished: true,
    result: {
      home: homeScore,
      away: awayScore,
    },
    toGoThrough
  }

  try {
    await dynamoClient.send(
      new PutItemCommand({
        TableName: MATCHES_TABLE_NAME,
        Item: marshall(updatedMatch),
        ConditionExpression: "#finished = :false",

        ExpressionAttributeNames: { "#finished": "isFinished" },
        ExpressionAttributeValues: { ":false": { BOOL: false } },
      })
    )
  } catch (error) {
    console.log(error)
    res.status(409)
    res.json({ message: "Match has already been ended" })
    return
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

    const predictionKeys = userIds.map((userId) => {
      return { userId, matchId }
    })

    const predictions = await batchGetFromDynamo(
      predictionKeys,
      predictionsTableSchema,
      dynamoClient,
      PREDICTIONS_TABLE_NAME,
      ["userId", "matchId", "homeScore", "awayScore", "points"]
    )

    const pointKeys = userIds.map((userId) => {
      return { userId }
    })

    const userPoints = await batchGetFromDynamo(
      pointKeys,
      pointsTableSchema,
      dynamoClient,
      POINTS_TABLE_NAME,
      ["userId", "pointsHistory", "totalPoints"]
    )

    const updatedPredictions = predictions.map(
      (prediction) => {
        return {
          ...prediction,
          points: calculatePoints(
            { homeScore, awayScore, stage: match.gameStage },
            { homeScore: prediction.homeScore, awayScore: prediction.awayScore }
          ) || 0,
        }
      }
    )
    
    const predictionWithPointsObj = arrayToObject(updatedPredictions, prediction => prediction.userId)

    const updatedUserPoints = userPoints.map(pointsObj => {
      const prediction = predictionWithPointsObj[pointsObj.userId]
      const pointsHistory = pointsObj.pointsHistory
      const points = prediction ? prediction.points : 0
      if (pointsHistory.length < match.matchDay) {
        pointsHistory.push(points)
      } else {
        const todaysPoints = pointsHistory.pop()
        pointsHistory.push((todaysPoints || 0) + points)
      }
      return {
        ...pointsObj,
        pointsHistory,
        totalPoints: pointsObj.totalPoints + points,
      }
    })

    await batchPutInDynamo(updatedPredictions, dynamoClient, PREDICTIONS_TABLE_NAME)
    await batchPutInDynamo(updatedUserPoints, dynamoClient, POINTS_TABLE_NAME)
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }

  res.status(200)
  res.json({ message: "Successfully ended match" })
}