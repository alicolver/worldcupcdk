import { DynamoDBClient, QueryCommand, QueryCommandInput } from "@aws-sdk/client-dynamodb"
import { APIGatewayProxyEvent } from "aws-lambda"
import { matchesTableSchema } from "../../../common/dbModels/models"
import { DEFAULT_ERROR } from "../../utils/constants"

const MATCHES_TABLE_NAME = process.env.MATCHES_TABLE_NAME

export const getUpcomingMatchHandler = async (event: APIGatewayProxyEvent, userId: string, dynamoClient: DynamoDBClient) => {
  try {
    // const date = new Date().getUTCDate()

    const params: QueryCommandInput = {
      FilterExpression: "date IN (:date1, :date2)",
      ExpressionAttributeValues: {
        "date1": { S: "2022-11-20" },
        "date2": { S: "2022-11-21" }
      },
      TableName: MATCHES_TABLE_NAME
    }

    const matches = await dynamoClient.send(new QueryCommand(params))
    const parsedMatches = matches.Items?.map(item => matchesTableSchema.parse(item))

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Successfully fetched matches", data: parsedMatches })
    }

    // get user predictions for the upcoming games
    // if no prediction return 0-0
  } catch {
    return DEFAULT_ERROR
  }
}