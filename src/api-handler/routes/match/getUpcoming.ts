import { DynamoDBClient, ScanCommand, ScanCommandInput } from "@aws-sdk/client-dynamodb"
import { APIGatewayProxyEvent } from "aws-lambda"
import { matchesTableSchema } from "../../../common/dbModels/models"
import { unmarshall } from "@aws-sdk/util-dynamodb"
import { addDays, getFormattedDate } from "../../utils/date"
import { MATCHES_TABLE_NAME } from "../../utils/database"
import { DATABASE_ERROR } from "../../utils/constants"

export const getUpcomingMatchHandler = async (event: APIGatewayProxyEvent, userId: string, dynamoClient: DynamoDBClient) => {
  const today = getFormattedDate(new Date())
  const tomorrow = getFormattedDate(addDays(new Date(), 1))
  const params: ScanCommandInput = {
    FilterExpression: "matchDate = :matchDate1 OR matchDate = :matchDate2",
    ExpressionAttributeValues: {
      ":matchDate1": { S: today },
      ":matchDate2": { S: tomorrow }
    },
    TableName: MATCHES_TABLE_NAME
  }

  try {
    const matches = await dynamoClient.send(new ScanCommand(params))
    const parsedMatches = matches.Items?.map(item => matchesTableSchema.parse(unmarshall(item)))

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Successfully fetched matches", data: parsedMatches })
    }
  } catch (error) {
    console.log(error)
    return DATABASE_ERROR
  }
}