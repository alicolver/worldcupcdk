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
  const cognito = new AWS.CognitoIdentityServiceProvider()

  const authToken = event.headers["Authorization"]
  if (!authToken) return DEFAULT_ERROR

  const user = await cognito.getUser({AccessToken: String(authToken)}).promise()
  const userId = user.UserAttributes.filter(
    (attribute) => attribute.Name === "sub"
  )[0].Value

  const endpoint = event.path
  const method = event.httpMethod
  switch (endpoint) {
  case "/auth/login": {
    return await loginHandler(event, cognito)
  }
  case "/auth/signup": {
    return await signupHandler(event, cognito)
  }
  case "/match/end": {
    return await endMatchHandler(event, cognito)
  }
  case "/match/create": {
    return await createMatchHandler(event)
  }
  case "/league/create": {
    const cconfirmedUserId = checkUserId(userId)
    return await createLeagueHandler(event, cconfirmedUserId)
  }
  case "/league/join": {
    const cconfirmedUserId = checkUserId(userId)
    return await joinLeagueHandler(event, cconfirmedUserId)
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
    }}
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
