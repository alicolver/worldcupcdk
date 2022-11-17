import { GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { z } from "zod"
import {
  DATABASE_ERROR,
  PARSING_ERROR,
  returnError,
} from "../../utils/constants"
import { marshall } from "@aws-sdk/util-dynamodb"
import {
  matchesTableSchema,
  PredictionsTableItem,
} from "../../../common/dbModels/models"
import express from "express"
import { getUserId } from "../auth/utils"
import { dynamoClient } from "../../utils/clients"
import { MATCHES_TABLE_NAME } from "../../utils/database"

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
    const match = await dynamoClient.send(
      new GetItemCommand({
        TableName: MATCHES_TABLE_NAME,
        Key: marshall({ matchId }),
      })
    )
    if (!match.Item) throw new Error("Match not found")
    const parsedMatch = matchesTableSchema.parse(match.Item)
    if (
      new Date() > new Date(`${parsedMatch.matchDate}T${parsedMatch.matchTime}`)
    ) {
      res.status(403)
      res.json({message: "Cannot enter prediction after kick off"})
    }
    await dynamoClient.send(new PutItemCommand(params))
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }

  res.status(200)
  res.json({ message: "Succesfully entered prediction" })
}
