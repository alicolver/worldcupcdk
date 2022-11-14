import { DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { z } from "zod"
import { leagueTableSchema } from "../../../common/dbModels/models"
import { NO_BODY_ERROR, PARSING_ERROR } from "../../utils/constants"

const joinLeagueSchema = z.object({
  leagueId: z.string(),
})

const LEAGUE_TABLE_NAME = process.env.LEAGUE_TABLE_NAME as string

export const joinLeague = async (leagueId: string, userId: string, dynamoClient: DynamoDBClient): Promise<{ success: boolean, message: string }> => {
  const getLeagueParams: GetItemCommandInput = {
    TableName: LEAGUE_TABLE_NAME,
    Key: marshall({ leagueId })
  }
  console.log(`get league params: ${JSON.stringify(getLeagueParams)}`)
  try {
    const leagueData = await dynamoClient.send(new GetItemCommand(getLeagueParams))
    if (!leagueData.Item) {
      return {
        success: false,
        message: "Could not find league"
      }
    }
    const parsedLeagueData = leagueTableSchema.safeParse(unmarshall(leagueData.Item))
    if (!parsedLeagueData.success) {
      return {
        success: false,
        message: "Could not parse league"
      }
    }
    const updatedLeagueData = {
      ...parsedLeagueData.data,
      userIds: [...parsedLeagueData.data.userIds, userId]
    }
    const postItemParams = {
      TableName: LEAGUE_TABLE_NAME,
      Item: marshall(updatedLeagueData)
    }
    await dynamoClient.send(new PutItemCommand(postItemParams))
    // TODO: need to also update the user table to add user-league mapping
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
  const joinLeagueResult =  await joinLeague(leagueId, userId, dynamoClient)
  return {
    statusCode: joinLeagueResult.success ? 200 : 500,
    body: JSON.stringify({message: joinLeagueResult.message})
  }
}