import { PutItemCommand } from "@aws-sdk/client-dynamodb"
import { z } from "zod"
import { DATABASE_ERROR, PARSING_ERROR, returnError } from "../../utils/constants"
import { marshall } from "@aws-sdk/util-dynamodb"
import { PredictionsTableItem } from "../../../common/dbModels/models"
import express from "express"
import { getUserId } from "../auth/utils"
import { dynamoClient } from "../../utils/clients"

const postPredictionSchema = z.object({
  matchId: z.string(),
  homeScore: z.number(),
  awayScore: z.number(),
})

const PREDICTIONS_TABLE_NAME = process.env.PREDICTIONS_TABLE_NAME as string

export const makePredictionHandler: express.Handler = async (req, res) => {
  const prediction = postPredictionSchema.safeParse(req.body)
  if (!prediction.success) return returnError(res, PARSING_ERROR)
  const { matchId, homeScore, awayScore } = prediction.data
  const userId = getUserId(req.user!)

  const predictionItem: PredictionsTableItem = {
    userId,
    matchId,
    homeScore: homeScore,
    awayScore: awayScore,
  }

  const params = {
    TableName: PREDICTIONS_TABLE_NAME,
    Item: marshall(predictionItem),
  }

  try {
    await dynamoClient.send(new PutItemCommand(params))
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }

  res.status(200)
  res.json({ message: "Succesfully entered prediction" })
}
