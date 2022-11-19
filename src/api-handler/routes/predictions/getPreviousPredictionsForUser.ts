import { z } from "zod"
import {
  DATABASE_ERROR,
  PARSING_ERROR,
  returnError,
} from "../../utils/constants"
import express from "express"
import { getFinishedMatches } from "../match/getPrevious"
import { dynamoClient } from "../../utils/clients"
import { GetItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import {
  PredictionsTableItem,
  predictionsTableSchema,
} from "../../../common/dbModels/models"
import { getLiveMatches } from "../match/getLive"

const getPreviousPredictionsForUserSchema = z.object({
  userId: z.string(),
})

const PREDICTIONS_TABLE_NAME = process.env.PREDICTIONS_TABLE_NAME as string

export const getPreviousPredictionsForUserHandler: express.Handler = async (
  req,
  res
) => {
  const getPreviousPredictionsForUser =
    getPreviousPredictionsForUserSchema.safeParse(req.body)
  if (!getPreviousPredictionsForUser.success)
    return returnError(res, PARSING_ERROR)
  const { userId } = getPreviousPredictionsForUser.data

  const pastMatches = await getFinishedMatches()
  const liveMatches = await getLiveMatches()
  const matches = pastMatches.concat(liveMatches)

  const userMatchesPredictions = await Promise.all(
    matches.map(async (match) => {
      const prediction = await dynamoClient.send(
        new GetItemCommand({
          TableName: PREDICTIONS_TABLE_NAME,
          Key: marshall({ matchId: match.matchId, userId }),
        })
      )
      let parsedPrediction: PredictionsTableItem
      if (!prediction.Item) {
        parsedPrediction = {
          userId,
          matchId: match.matchId,
        }
      } else {
        parsedPrediction = predictionsTableSchema.parse(
          unmarshall(prediction.Item)
        )
      }
      return {
        match,
        prediction: parsedPrediction,
      }
    })
  )

  try {
    res.status(200)
    res.json({
      message: "Successfully fetched predictions",
      data: userMatchesPredictions,
    })
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }
}
