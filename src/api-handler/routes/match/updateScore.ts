import { z } from "zod"
import { dynamoClient } from "../../utils/clients"
import {
  DATABASE_ERROR,
  NO_MATCH,
  PARSING_ERROR,
  returnError,
} from "../../utils/constants"
import express from "express"
import { GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { MATCHES_TABLE_NAME } from "../../utils/database"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import {
  MatchesTableItem,
  matchesTableSchema,
} from "../../../common/dbModels/models"

const updateScoreSchema = z.object({
  matchId: z.string(),
  homeScore: z.number(),
  awayScore: z.number(),
  toGoThrough: z.enum(["home", "away"]).nullish(),
})

const isMatchLive = (match: MatchesTableItem): boolean => {
  if (match.isFinished) return false
  if (new Date() < new Date(`${match.matchDate}T${match.matchTime}`))
    return false
  return true
}

export const updateScoreHandler: express.Handler = async (req, res) => {
  const updateScore = updateScoreSchema.safeParse(req.body)
  if (!updateScore.success) return returnError(res, PARSING_ERROR)
  const { matchId, homeScore, awayScore, toGoThrough } = updateScore.data
  const match = await dynamoClient.send(
    new GetItemCommand({
      TableName: MATCHES_TABLE_NAME,
      Key: marshall({ matchId }),
    })
  )
  if (!match.Item) return returnError(res, NO_MATCH)
  const parsedMatch = matchesTableSchema.parse(unmarshall(match.Item))

  if (!isMatchLive(parsedMatch)) {
    res.status(400),
    res.json({ message: "Cannot update score for game that isn't live" })
  }

  const updatedMatch: MatchesTableItem = {
    ...parsedMatch,
    result: {
      home: homeScore,
      away: awayScore,
    },
    toGoThrough: toGoThrough ? toGoThrough : null
  }
  try {
    await dynamoClient.send(
      new PutItemCommand({
        TableName: MATCHES_TABLE_NAME,
        Item: marshall(updatedMatch),
      })
    )
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }

  res.status(200)
  res.json({ message: "Successfully updated match" })
}
