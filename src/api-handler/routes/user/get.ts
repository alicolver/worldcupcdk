import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { z } from "zod"
import { userTableSchema } from "../../../common/dbModels/models"
import { NO_BODY_ERROR, PARSING_ERROR } from "../../utils/constants"

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME as string

const getUser = z.object({
  userId: z.string(),
})

export const getUserHandler = async (event: APIGatewayProxyEvent, dynamoClient: DynamoDBClient): Promise<APIGatewayProxyResult> => {
  if (!event.body) return NO_BODY_ERROR
  const parsedGetUser = getUser.safeParse(JSON.parse(event.body))
  if (!parsedGetUser.success) return PARSING_ERROR
  const { userId } = parsedGetUser.data
  const userData = await dynamoClient.send(new GetItemCommand({
    TableName: USERS_TABLE_NAME,
    Key: marshall({userId})
  }))
  if (!userData.Item) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Unable to find user" })
    }
  }
  const parsedUserData = userTableSchema.parse(unmarshall(userData.Item))
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Successfully got user",
      data: parsedUserData
    })
  }
}