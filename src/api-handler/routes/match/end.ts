import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { z } from "zod"
import { DATABASE_ERROR, DEFAULT_ERROR, PARSING_ERROR } from "../../utils/constants"
import { MATCHES_TABLE_NAME } from "../../utils/database"

const endMatchSchema = z.object({
  matchid: z.string(),
  homeScore: z.number(),
  awayScore: z.number()
})

// TODO: Wrap with admin
export const endMatchHandler = async (
  event: APIGatewayProxyEvent,
  dynamoClient: DynamoDBClient
): Promise<APIGatewayProxyResult> => {
  if (!event.body) return DEFAULT_ERROR
  const match = endMatchSchema.safeParse(JSON.parse(event.body))
  if (!match.success) return PARSING_ERROR

  const matchData = match.data

  try {
    dynamoClient.send(new UpdateItemCommand({ 
      TableName: MATCHES_TABLE_NAME,
      Key: {
        matchId: { S: matchData.matchid }
      },
      UpdateExpression: "set homeScore = :x, set awayScore = :y, set isFinished: :z",
      ExpressionAttributeValues: marshall({
        ":x":  matchData.homeScore,
        ":y":  matchData.awayScore,
        ":z":  true
      })
    }))

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Successfully ended match" })
    } 
  } catch (error) {
    console.log(error)
    return DATABASE_ERROR
  }
}