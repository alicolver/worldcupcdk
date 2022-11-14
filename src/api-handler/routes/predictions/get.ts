import {
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
} from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { z } from "zod"
import { DEFAULT_ERROR } from "../../utils/constants"

const getPredictionSchema = z.object({
  userId: z.string(),
  matchId: z.string(),
})

const TABLE_NAME = process.env.TABLE_NAME as string

export const getPredictionHandler = async (
  event: APIGatewayProxyEvent,
  dynamoClient: DynamoDBClient,
  cognito: AWS.CognitoIdentityServiceProvider
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) return DEFAULT_ERROR
    const prediction = getPredictionSchema.safeParse(JSON.parse(event.body))
    if (!prediction.success) return DEFAULT_ERROR
    const { userId, matchId } = prediction.data

    const getPredictionQuery = {
      partitionKey: userId,
      sortKey: matchId,
    }

    const params: GetItemCommandInput = {
      TableName: TABLE_NAME,
      Key: marshall(getPredictionQuery),
      ProjectionExpression: "ATTRIBUTE_NAME",
    }

    const data = await dynamoClient.send(new GetItemCommand(params))

    if (!data.Item) return DEFAULT_ERROR

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Succesfully entered prediction",
        data: JSON.stringify(unmarshall(data.Item)),
      }),
    }
  } catch {
    return DEFAULT_ERROR
  }
}
