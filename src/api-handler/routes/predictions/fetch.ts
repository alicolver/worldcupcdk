import {
  BatchGetItemCommand,
  BatchGetItemCommandInput,
} from "@aws-sdk/client-dynamodb"
import { unmarshall } from "@aws-sdk/util-dynamodb"
import { z } from "zod"
import { DATABASE_ERROR, PARSING_ERROR, returnError } from "../../utils/constants"
import express from "express"
import { dynamoClient } from "../../utils/clients"

const getPredictionSchema = z.object({
  userId: z.string(),
  matchIds: z.array(z.string()),
})

const PREDICTIONS_TABLE_NAME = process.env.PREDICTIONS_TABLE_NAME as string

export const getPredictionHandler: express.Handler = async (req, res) => {
  const getPredictions = getPredictionSchema.safeParse(req.body)
  if (!getPredictions.success) return returnError(res, PARSING_ERROR)

  const getPredictionsData = getPredictions.data
  const { userId, matchIds } = getPredictionsData
  const queryKeys = matchIds.map((matchId) => {
    return { userId: { S: userId }, matchId: { S: matchId } }
  })
  const getBatchParams: BatchGetItemCommandInput = {
    RequestItems: {
      [PREDICTIONS_TABLE_NAME]: {
        Keys: queryKeys
      },
    },
  }
  try {
    const data = await dynamoClient.send(new BatchGetItemCommand(getBatchParams))
    if (!data.Responses) {
      console.log("No responses")
      res.status(200)
      return res.json({
        message: "No predictions for matches"
      })
    }

    const parsedResponses = data.Responses[PREDICTIONS_TABLE_NAME].map(response => unmarshall(response))

    res.status(200)
    res.json({
      message: "Successfully fetched predictions",
      body: parsedResponses
    })
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }
}
