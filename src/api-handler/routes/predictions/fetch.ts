import { GetItemCommand } from "@aws-sdk/client-dynamodb"
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
import { getUserId } from "../auth/utils"

const getPredictionSchema = z.object({
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
      if (!prediction.Item) return { matchId, userId }
      return unmarshall(prediction.Item)
    })
  )
  const parsedResponses = unmarshalledResponses.map((points) =>
    predictionsTableSchema.parse(points)
  )

  return parsedResponses
}

export const getPredictionHandler: express.Handler = async (req, res) => {
  const userId = getUserId(req.user!)
  const getPredictions = getPredictionSchema.safeParse(req.body)
  if (!getPredictions.success) return returnError(res, PARSING_ERROR)

  const getPredictionsData = getPredictions.data
  const { matchIds } = getPredictionsData
  try {
    const predictionsRecord = await getPredictionsForUserId(userId, matchIds)

    const transformedPredictions = convertArrayToObject(predictionsRecord)

    predictionsRecord.reduce((obj, item) => {
      return {
        ...obj,
        [item["matchId"]]: {
          homeScore: item.homeScore,
          awayScore: item.awayScore,
          ...(item.toGoThrough ? {toGoThrough: item.toGoThrough} : {})
        },
      }
    }, transformedPredictions)

    res.status(200)
    res.json({
      message: "Successfully fetched predictions",
      body: transformedPredictions,
    })
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }
}

const convertArrayToObject = (array: PredictionsTableItem[]) => {
  const initialValue = {}
  return array.reduce((obj, item) => {
    return {
      ...obj,
      [item["matchId"]]: {
        homeScore:
          item.homeScore || item.homeScore === 0 ? item.homeScore : null,
        awayScore:
          item.awayScore || item.awayScore === 0 ? item.awayScore : null,
        ...(item.toGoThrough ? {toGoThrough: item.toGoThrough} : {})
      },
    }
  }, initialValue)
}
