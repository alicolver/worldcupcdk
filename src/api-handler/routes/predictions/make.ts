import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { z } from "zod"
import { DATABASE_ERROR, NO_BODY_ERROR, PARSING_ERROR } from "../../utils/constants"
import { marshall } from "@aws-sdk/util-dynamodb"
import { PredictionsTableItem } from "../../../common/dbModels/models"

const postPredictionSchema = z.object({
  matchId: z.string(),
  homeScore: z.number(),
  awayScore: z.number(),
})

const PREDICTIONS_TABLE_NAME = process.env.PREDICTIONS_TABLE_NAME as string

export const postPredictionHandler = async (
  event: APIGatewayProxyEvent,
  userId: string,
  dynamoClient: DynamoDBClient,
): Promise<APIGatewayProxyResult> => {
  if (!event.body) return NO_BODY_ERROR
  const prediction = postPredictionSchema.safeParse(JSON.parse(event.body))
  if (!prediction.success) return PARSING_ERROR
  const { matchId, homeScore, awayScore } = prediction.data

  const predictionItem: PredictionsTableItem = {
    userId,
    matchId,
    homeScore: homeScore,
    awayScore: awayScore,
  }

  const params = {
    TableName: PREDICTIONS_TABLE_NAME,
    Item: marshall(predictionItem),
  }

  try {
    await dynamoClient.send(new PutItemCommand(params))
  } catch (error) {
    console.log(error)
    return DATABASE_ERROR
  }


  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Succesfully entered prediction" }),
  }
}
