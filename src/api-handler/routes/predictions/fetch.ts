import {
  BatchGetItemCommand,
  BatchGetItemCommandInput,
  DynamoDBClient
} from "@aws-sdk/client-dynamodb"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { z } from "zod"
import { DATABASE_ERROR, NO_BODY_ERROR, PARSING_ERROR } from "../../utils/constants"

const getPredictionSchema = z.object({
  userId: z.string(),
  matchIds: z.array(z.string()),
})

const PREDICTIONS_TABLE_NAME = process.env.PREDICTIONS_TABLE_NAME as string

export const getPredictionHandler = async (
  event: APIGatewayProxyEvent,
  dynamoClient: DynamoDBClient,
): Promise<APIGatewayProxyResult> => {
  if (!event.body) return NO_BODY_ERROR
  const getPredictions = getPredictionSchema.safeParse(JSON.parse(event.body))
  if (!getPredictions.success) return PARSING_ERROR

  const getPredictionsData = getPredictions.data
  const { userId, matchIds } = getPredictionsData
  const queryKeys = matchIds.map((matchId) => {
    return { userId: { S: userId }, matchId: { S: matchId } }
  })
  const getBatchParams: BatchGetItemCommandInput = {
    RequestItems: {
      [PREDICTIONS_TABLE_NAME]: {
        Keys: queryKeys,
        ProjectionExpression: "ATTRIBUTE_NAME",
      },
    },
  }
  try {
    const data = await dynamoClient.send(new BatchGetItemCommand(getBatchParams))
    if (!data.Responses) {
      console.log("No responses")
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No predictions for matches"
        })
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        message:  "Successfully fetched predictions",
        body: data.Responses[PREDICTIONS_TABLE_NAME]
      })
    }
  } catch (error) {
    console.log(error)
    return DATABASE_ERROR
  }
}
