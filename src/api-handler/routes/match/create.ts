import { z } from "zod"
import { DATABASE_ERROR, PARSING_ERROR, returnError } from "../../utils/constants"
import { v4 as uuidv4 } from "uuid"
import { PutItemCommand, PutItemCommandInput } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"
import { MatchesTableItem } from "../../../common/dbModels/models"
import { MATCHES_TABLE_NAME } from "../../utils/database"
import express from "express"
import { dynamoClient } from "../../utils/clients"

const createMatchSchema = z.object({
  homeTeam: z.string(),
  awayTeam: z.string(),
  gameStage: z.enum(["GROUP", "FINAL", "SEMIFINAL", "QUARTERFINAL", "OCTOFINAL"]),
  matchDate: z.string(),
  matchTime: z.string(),
  matchDay: z.number()
})

export const createMatchHandler: express.Handler = async (req, res) => {
  const match = createMatchSchema.safeParse(req.body)
  if (!match.success) return returnError(res, PARSING_ERROR)
  const { homeTeam, awayTeam, gameStage, matchDate, matchTime, matchDay } = match.data
  const matchId = uuidv4()

  const matchItem: MatchesTableItem = {
    matchId,
    homeTeam,
    awayTeam,
    gameStage,
    matchDate,
    matchTime,
    matchDay,
    isFinished: false
  }

  const params: PutItemCommandInput = {
    TableName: MATCHES_TABLE_NAME,
    Item: marshall(matchItem),
  }
  try {
    await dynamoClient.send(new PutItemCommand(params))
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }

  res.status(200)
  res.json({ message: "Successfully created match" })
}