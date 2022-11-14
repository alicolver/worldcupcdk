import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda"
import AWS from "aws-sdk"
import { authHandler } from "./routes/auth/handler"
import { getUser } from "./routes/auth/utils"
import { createLeagueHandler } from "./routes/league/create"
import { joinLeagueHandler } from "./routes/league/join"
import { createMatchHandler } from "./routes/match/create"
import { endMatchHandler } from "./routes/match/end"
import { getUpcomingMatchHandler } from "./routes/match/getUpcoming"
import { getPredictionHandler } from "./routes/predictions/fetch"
import { postPredictionHandler } from "./routes/predictions/make"
import { DEFAULT_ERROR, UNAUTHORIZED, UNKNOWN_SERVER_ERROR } from "./utils/constants"
import { convertResponse } from "./utils/response"

const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID as string

const checkUserId = (userId: string | undefined): string => {
  if (!userId) {
    throw new Error("userId required for this endpoint")
  }
  return userId
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    return convertResponse(await routeRequest(event, context))
  } catch (error) {
    console.log(error)
    return UNKNOWN_SERVER_ERROR
  }

}

export const routeRequest = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const cognito = new AWS.CognitoIdentityServiceProvider()
  const dynamoClient = new DynamoDBClient({ region: "eu-west-2" })

  const endpoint = event.path

  if (endpoint.startsWith("/auth")) {
    return await authHandler(event, cognito)
  }

  const authToken = event.headers["Authorization"]
  console.log(authToken)
  if (!authToken) {
    return {
      statusCode: 304,
      body: JSON.stringify({ message: "No auth token included in request" })
    }
  }

  const result = await getUser(cognito, authToken)
  if (!result.success) {
    return UNAUTHORIZED
  }

  const userId = result.user?.UserAttributes.filter(
    (attribute) => attribute.Name === "sub"
  )[0].Value

  switch (endpoint) {
  case "/match/end": {
    return await endMatchHandler(event, dynamoClient)
  }
  case "/match/create": {
    return await createMatchHandler(event, dynamoClient)
  }
  case "/match/get-upcoming": {
    return await getUpcomingMatchHandler(event, checkUserId(userId), dynamoClient)
  }
  case "/league/create": {
    return await createLeagueHandler(event, checkUserId(userId), dynamoClient)
  }
  case "/league/join": {
    return await joinLeagueHandler(event, checkUserId(userId), dynamoClient)
  }
  case "/predictions/fetch": {
    return await getPredictionHandler(event, dynamoClient)
  }
  case "/predictions/make": {
    return await postPredictionHandler(event, checkUserId(userId), dynamoClient)
  }
  default: {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    }
  }
  }
}
