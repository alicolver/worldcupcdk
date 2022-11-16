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
  PredictionsTableItem,
  predictionsTableSchema,
} from "../../../common/dbModels/models"

const getPredictionSchema = z.object({
  userId: z.string(),
  matchIds: z.array(z.string()),
})

const PREDICTIONS_TABLE_NAME = process.env.PREDICTIONS_TABLE_NAME as string

export const getPredictionsForUserId = async (
  userId: string,
  matchIds: string[]
): Promise<PredictionsTableItem[]> => {
  const unmarshalledResponses = await Promise.all(
    matchIds.map(async (matchId) => {
      const prediction = await dynamoClient.send(
        new GetItemCommand({
          TableName: PREDICTIONS_TABLE_NAME,
          Key: marshall({ userId, matchId }),
        })
      )
      if (!prediction.Item) throw new Error("Cannot find prediction")
      return unmarshall(prediction.Item)
    })
  )
  const parsedResponses = unmarshalledResponses.map((points) =>
    predictionsTableSchema.parse(points)
  )
  return parsedResponses
}

export const getPredictionHandler: express.Handler = async (req, res) => {
  const getPredictions = getPredictionSchema.safeParse(req.body)
  if (!getPredictions.success) return returnError(res, PARSING_ERROR)

  const getPredictionsData = getPredictions.data
  const { userId, matchIds } = getPredictionsData
  try {
    const predictionsRecord = await getPredictionsForUserId(userId, matchIds)

    res.status(200)
    res.json({
      message: "Successfully fetched predictions",
      body: predictionsRecord,
    })
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }
}
