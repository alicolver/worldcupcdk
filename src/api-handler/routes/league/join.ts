import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { z } from "zod"
import { NO_BODY_ERROR, PARSING_ERROR } from "../../utils/constants"
import { addLeagueIdToUser, addUserIdToLeague } from "./utils"

const joinLeagueSchema = z.object({
  leagueId: z.string(),
})

export const joinLeague = async (leagueId: string, userId: string, dynamoClient: DynamoDBClient): Promise<{ success: boolean, message: string }> => {
  try {
    await Promise.all([addLeagueIdToUser(leagueId, userId, dynamoClient), addUserIdToLeague(leagueId, userId, dynamoClient)])
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

export const joinLeagueHandler = async (event: APIGatewayProxyEvent, userId: string, dynamoClient: DynamoDBClient): Promise<APIGatewayProxyResult> => {
  if (!event.body) return NO_BODY_ERROR
  const parsedJoinLeague = joinLeagueSchema.safeParse(JSON.parse(event.body))
  if (!parsedJoinLeague.success) return PARSING_ERROR
  const { leagueId } = parsedJoinLeague.data
  const joinLeagueResult = await joinLeague(leagueId, userId, dynamoClient)
  return {
    statusCode: joinLeagueResult.success ? 200 : 500,
    body: JSON.stringify({ message: joinLeagueResult.message })
  }
}