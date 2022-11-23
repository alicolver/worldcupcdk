import { z } from "zod"
import {
  DATABASE_ERROR,
  PARSING_ERROR,
  returnError,
} from "../../utils/constants"
import express from "express"
import { getFinishedMatches } from "../match/getPrevious"
import { dynamoClient } from "../../utils/clients"
import {
  predictionsTableSchema,
} from "../../../common/dbModels/models"
import { getLiveMatches } from "../match/getLive"
import { batchGetFromDynamo } from "../../utils/dynamo"
import { arrayToObject } from "../../utils/utils"

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
  // const liveMatches = await getLiveMatches()
  const matches = pastMatches

  const predictionKeys = matches.map((match) => {
    return { matchId: match.matchId, userId }
  })

  const predictions = await batchGetFromDynamo(
    predictionKeys,
    predictionsTableSchema,
    dynamoClient,
    PREDICTIONS_TABLE_NAME,
    ["userId", "matchId", "homeScore", "awayScore", "points"]
  )

  const predictionObjects = arrayToObject(predictions, prediction => prediction.matchId)

  const matchPredictions = matches.map(match => {
    const prediction = predictionObjects[match.matchId]
    return {
      ...match,
      prediction: {
        homeScore: prediction ? prediction.homeScore : null,
        awayScore: prediction ? prediction.awayScore : null,
      },
      points: prediction ? prediction.points : 0
    }
  })

  try {
    res.status(200)
    res.json({
      message: "Successfully fetched predictions",
      data: matchPredictions,
    })
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }
}
