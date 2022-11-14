import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { z } from "zod"
import { leagueTableSchema } from "../../../common/dbModels/models"
import { NO_BODY_ERROR, PARSING_ERROR } from "../../utils/constants"

const LEAGUE_TABLE_NAME = process.env.LEAGUE_TABLE_NAME as string

const getUsersInLeagueSchema = z.object({
  leagueId: z.string(),
})

export const getLeagueHandler = async (event: APIGatewayProxyEvent, dynamoClient: DynamoDBClient): Promise<APIGatewayProxyResult> => {
  if (!event.body) return NO_BODY_ERROR
  const parsedGetUserInLeague = getUsersInLeagueSchema.safeParse(JSON.parse(event.body))
  if (!parsedGetUserInLeague.success) return PARSING_ERROR
  const { leagueId } = parsedGetUserInLeague.data
  const leagueData = await dynamoClient.send(new GetItemCommand({
    TableName: LEAGUE_TABLE_NAME,
    Key: marshall({leagueId})
  }))
  if (!leagueData.Item) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Unable to find league" })
    }
  }
  const parsedLeagueData = leagueTableSchema.parse(unmarshall(leagueData.Item))
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Successfully got league",
      data: parsedLeagueData
    })
  }
}