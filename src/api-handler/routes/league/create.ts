import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { z } from "zod"
import { DATABASE_ERROR, NO_BODY_ERROR, PARSING_ERROR } from "../../utils/constants"
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"

const createLeagueSchema = z.object({
  leagueId: z.string(),
})

const LEAGUE_TABLE_NAME = process.env.LEAGUE_TABLE_NAME as string

export const createLeagueHandler = async (event: APIGatewayProxyEvent, userId: string, dynamoClient: DynamoDBClient): Promise<APIGatewayProxyResult> => {

  if (!event.body) return NO_BODY_ERROR
  const league = createLeagueSchema.safeParse(JSON.parse(event.body))
  if (!league.success) return PARSING_ERROR
  const { leagueId } = league.data

  // TODO: Need to do a conditional write to make sure league doesn't already exist
  const params: PutItemCommandInput = {
    TableName: LEAGUE_TABLE_NAME,
    Item: marshall({
      leagueId, userIds: [userId]
    }),
  }

  try {
    await dynamoClient.send(new PutItemCommand(params))
  } catch (error) {
    console.log(error)
    return DATABASE_ERROR
  }


  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Successfully created league" })
  }
}