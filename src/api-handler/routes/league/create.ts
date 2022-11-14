import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { z } from "zod"
import { NO_BODY_ERROR, PARSING_ERROR } from "../../utils/constants"
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"
import { addLeagueIdToUser } from "./utils"

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

export const createLeagueHandler = async (event: APIGatewayProxyEvent, userId: string, dynamoClient: DynamoDBClient): Promise<APIGatewayProxyResult> => {

  if (!event.body) return NO_BODY_ERROR
  const league = createLeagueSchema.safeParse(JSON.parse(event.body))
  if (!league.success) return PARSING_ERROR
  const { leagueName } = league.data

  try {
    await createLeague(leagueName, userId, dynamoClient)
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error creating league" })
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Successfully created league" })
  }
}