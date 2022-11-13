import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda"
import AWS from "aws-sdk"
import { loginHandler } from "./routes/auth/login"
import { signupHandler } from "./routes/auth/signup"
import { createLeagueHandler } from "./routes/league/create"
import { joinLeagueHandler } from "./routes/league/join"
import { createMatchHandler } from "./routes/match/create"
import { endMatchHandler } from "./routes/match/end"
import { getPredictionHandler } from "./routes/predictions/get"
import { postPredictionHandler } from "./routes/predictions/post"
import { DEFAULT_ERROR } from "./utils/constants"
import { convertResponse } from "./utils/response"

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
  return convertResponse(await routeRequest(event, context))
}

export const routeRequest = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const cognito = new AWS.CognitoIdentityServiceProvider()
  const dynamoClient = new DynamoDBClient({ region: "eu-west-2" })

  const endpoint = event.path
  const method = event.httpMethod

  // unauthenticated endpoints
  if (endpoint === "/auth/login") {
    return await loginHandler(event, cognito)
  }
  if (endpoint === "/auth/signup") {
    return await signupHandler(event, cognito)
  }

  const authToken = event.headers["Authorization"]
  console.log(authToken)
  if (!authToken) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "No auth token included in request" })
    }
  }
  const user = await cognito.getUser({ AccessToken: authToken }).promise()
  const userId = user.UserAttributes.filter(
    (attribute) => attribute.Name === "sub"
  )[0].Value

  switch (endpoint) {
  case "/match/end": {
    return await endMatchHandler(event, cognito)
  }
  case "/match/create": {
    return await createMatchHandler(event, dynamoClient)
  }
  case "/league/create": {
    return await createLeagueHandler(event, checkUserId(userId), dynamoClient)
  }
  case "/league/join": {
    return await joinLeagueHandler(event, checkUserId(userId), dynamoClient)
  }
  case "/predictions": {
    switch (method) {
    case "GET": {
      return await getPredictionHandler(event, cognito)
    }
    case "POST": {
      return await postPredictionHandler(event, cognito)
    }
    default: {
      return DEFAULT_ERROR
    }
    }
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
