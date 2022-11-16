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
  leagueTableSchema,
  MatchesTableItem,
  matchesTableSchema,
  PredictionsTableItem,
  predictionsTableSchema,
  userTableSchema,
} from "../../../common/dbModels/models"
import {
  LEAGUE_TABLE_NAME,
  MATCHES_TABLE_NAME,
  USERS_TABLE_NAME,
} from "../../utils/database"
import { getFormattedDate } from "../../utils/date"

const getMatchPredictionsSchema = z.object({
  leagueId: z.string(),
  matchId: z.string(),
})

const PREDICTIONS_TABLE_NAME = process.env.PREDICTIONS_TABLE_NAME as string

export const getMatchPredictionsForLeagueHandler: express.Handler = async (
  req,
  res
) => {
  const getMatchPredictions = getMatchPredictionsSchema.safeParse(req.body)
  if (!getMatchPredictions.success) return returnError(res, PARSING_ERROR)
  const getMatchPredictionsData = getMatchPredictions.data
  const { leagueId, matchId } = getMatchPredictionsData

  const league = await dynamoClient.send(
    new GetItemCommand({
      TableName: LEAGUE_TABLE_NAME,
      Key: marshall({ leagueId }),
    })
  )
  if (!league.Item) throw new Error("Could not find league")
  const parsedLeague = leagueTableSchema.parse(unmarshall(league.Item))

  const match = await dynamoClient.send(
    new GetItemCommand({
      TableName: MATCHES_TABLE_NAME,
      Key: marshall({ matchId }),
    })
  )
  if (!match.Item) throw new Error("Could not find match")
  const parsedMatch = matchesTableSchema.parse(unmarshall(match.Item))
  if (isFutureMatch(parsedMatch)) {
    res.status(500)
    res.json({
      message: "Cannot view predictions for future matches",
    })
  }

  try {
    const leaguePredictions = await Promise.all(
      parsedLeague.userIds.map(async (userId) => {
        const prediction = await dynamoClient.send(
          new GetItemCommand({
            TableName: PREDICTIONS_TABLE_NAME,
            Key: marshall({ userId, matchId }),
          })
        )
        let parsedPrediction: PredictionsTableItem
        if (!prediction.Item) {
          parsedPrediction = {
            userId,
            matchId
          }
        } else {
          parsedPrediction = predictionsTableSchema.parse(
            unmarshall(prediction.Item)
          )
        }
        
        const user = await dynamoClient.send(
          new GetItemCommand({
            TableName: USERS_TABLE_NAME,
            Key: marshall({ userId }),
          })
        )
        if (!user.Item) throw new Error("Could not find user")
        const parsedUser = userTableSchema.parse(unmarshall(user.Item))

        return {
          user: parsedUser,
          prediction: parsedPrediction,
        }
      })
    )

    res.status(200)
    res.json({
      message: "Successfully fetched predictions",
      body: leaguePredictions,
    })
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }
}

const isFutureMatch = (match: MatchesTableItem): boolean => {
  const currentDate = getFormattedDate(new Date())
  const currentTime = new Date().toISOString().split("T")[1].slice(0, 5)
  if (currentDate > match.matchDate) return false
  if (currentDate === match.matchDate && currentTime >= match.matchTime)
    return false
  else return true
}
