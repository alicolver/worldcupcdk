import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { z } from "zod"
import { PARSING_ERROR, returnError } from "../../utils/constants"
import { addLeagueIdToUser, addUserIdToLeague } from "./utils"
import express from "express"
import { dynamoClient } from "../../utils/clients"
import { getUserId } from "../auth/utils"

const joinLeagueSchema = z.object({
  leagueId: z.string(),
})

export const joinLeague = async (leagueId: string, userId: string, dynamoClient: DynamoDBClient): Promise<{ success: boolean, message: string }> => {
  try {
    await addUserIdToLeague(leagueId, userId, dynamoClient)
    await addLeagueIdToUser(leagueId, userId, dynamoClient)
    return {
      success: true,
      message: "Successfully joined league"
    }
  } catch (error) {
    console.log(error)
    return {
      success: false,
      message: "Error joining league"
    }
  }
}

export const joinLeagueHandler: express.Handler = async (req, res) => {
  const parsedJoinLeague = joinLeagueSchema.safeParse(req.body)
  if (!parsedJoinLeague.success) return returnError(res, PARSING_ERROR)
  const { leagueId } = parsedJoinLeague.data
  const userId = getUserId(req.user!)

  const joinLeagueResult = await joinLeague(leagueId, userId, dynamoClient)

  res.status(joinLeagueResult.success ? 200 : 500)
  res.json({ message: joinLeagueResult.message })
}