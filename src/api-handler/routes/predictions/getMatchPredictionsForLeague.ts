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
  predictionsTableSchema,
  userTableSchema,
} from "../../../common/dbModels/models"
import {
  LEAGUE_TABLE_NAME,
  MATCHES_TABLE_NAME,
  USERS_TABLE_NAME,
} from "../../utils/database"
import { getFormattedDate } from "../../utils/date"
import { batchGetFromDynamo } from "../../utils/dynamo"
import { arrayToObject } from "../../utils/utils"
import { calculatePoints } from "../../utils/points"

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
    const keysForPredictions = parsedLeague.userIds.map((userId) => {
      return { userId, matchId }
    })

    const userPredictions = await batchGetFromDynamo(
      keysForPredictions,
      predictionsTableSchema,
      dynamoClient,
      PREDICTIONS_TABLE_NAME,
      ["userId", "matchId", "homeScore", "awayScore", "points"]
    )

    const keysForUsers = parsedLeague.userIds.map((userId) => {
      return { userId }
    })

    const users = await batchGetFromDynamo(
      keysForUsers,
      userTableSchema,
      dynamoClient,
      USERS_TABLE_NAME,
      ["userId", "givenName", "familyName", "leagueIds"]
    )

    const usersObject = arrayToObject(users, (user) => user.userId)
    const predictionsObject = arrayToObject(
      userPredictions,
      (prediction) => prediction.userId
    )

    const userPredictionObjects: Data = parsedLeague.userIds.map((userId) => {
      const prediction = predictionsObject[userId]
      const points = calculatePoints(
        {
          homeScore: parsedMatch.result ? parsedMatch.result.away : 0,
          awayScore: parsedMatch.result ? parsedMatch.result.home : 0,
        },
        {
          homeScore: prediction ? prediction.homeScore : null,
          awayScore: prediction ? prediction.awayScore : null,
        }
      )
      return {
        userId,
        givenName: usersObject[userId].givenName,
        familyName: usersObject[userId].familyName,
        homeScore: prediction ? prediction.homeScore : null,
        awayScore: prediction ? prediction.awayScore : null,
        points,
      }
    })

    res.status(200)
    res.json({
      message: "Successfully fetched predictions",
      data: userPredictionObjects,
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

interface UserPrediction {
  userId: string;
  givenName: string;
  familyName: string;
  homeScore: number | undefined | null;
  awayScore: number | undefined | null;
  points: number | undefined | null;
}

type Data = UserPrediction[];
