import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { APIGatewayProxyEvent } from "aws-lambda"
import { z } from "zod"
import { DEFAULT_ERROR } from "../../utils/constants"

const joinLeagueSchema = z.object({
  leagueName: z.string(),
  userId: z.string()
})

export const joinLeagueHandler = async (event: APIGatewayProxyEvent, userId: string, dynamoClient: DynamoDBClient) => {
  return DEFAULT_ERROR
}