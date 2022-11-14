import { APIGatewayProxyEvent } from "aws-lambda"
import { z } from "zod"
import { DEFAULT_ERROR } from "../../utils/constants"
import { v4 as uuidv4 } from "uuid"
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"

const createLeagueSchema = z.object({
  leagueName: z.string(),
})

const LEAGUE_TABLE_NAME = process.env.LEAGUE_TABLE_NAME as string

export const createLeagueHandler = async (event: APIGatewayProxyEvent, userId: string, dynamoClient: DynamoDBClient) => {

  if (!event.body) {
    console.log("Body is missing from request")
    return DEFAULT_ERROR
  }
  const league = createLeagueSchema.safeParse(JSON.parse(event.body))
  if (!league.success) {
    console.log(JSON.stringify(league.error))
    return DEFAULT_ERROR
  }
  const { leagueName } = league.data
  const leagueId = uuidv4()

  const params: PutItemCommandInput = {
    TableName: LEAGUE_TABLE_NAME,
    Item: marshall({
      leagueId, leagueName, userIds: [userId]
    }),
  }

  try {
    await dynamoClient.send(new PutItemCommand(params))
  } catch (error) {
    console.log(error)
    return DEFAULT_ERROR
  }


  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Successfully created league" })
  }
}