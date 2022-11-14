import { z } from "zod"
import { PARSING_ERROR, returnError } from "../../utils/constants"
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"
import express from "express"
import { addLeagueIdToUser } from "./utils"
import { getUserId } from "../auth/utils"
import { dynamoClient } from "../../utils/clients"

const createLeagueSchema = z.object({
  leagueName: z.string(),
})

const LEAGUE_TABLE_NAME = process.env.LEAGUE_TABLE_NAME as string

export const createLeague = async (leagueName: string, userId: string, dynamoClient: DynamoDBClient) => {
  const leagueId = leagueName.toLowerCase().replace(/\s+/g, " ").replace(" ", "-")

  const params: PutItemCommandInput = {
    TableName: LEAGUE_TABLE_NAME,
    Item: marshall({
      leagueId, leagueName, userIds: [userId]
    }),
    ConditionExpression: "attribute_not_exists(leagueId)"
  }

  await dynamoClient.send(new PutItemCommand(params))

  await addLeagueIdToUser(leagueId, userId, dynamoClient)
}

export const createLeagueHandler: express.Handler = async (req, res) => {
  const league = createLeagueSchema.safeParse(req.body)
  if (!league.success) return returnError(res, PARSING_ERROR)
  const { leagueName } = league.data
  const userId = getUserId(req.user!)

  try {
    await createLeague(leagueName, userId, dynamoClient)
  } catch (error) {
    console.log(error)
    res.status(500)
    return res.json({ message: "Error creating league" })
  }

  res.status(200)
  res.json({ message: "Successfully created league" })
}