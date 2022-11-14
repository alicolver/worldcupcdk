import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { UNAUTHORIZED, UNKOWN_ENDPOINT } from "../../utils/constants"
import { loginHandler } from "./login"
import { signupHandler } from "./signup"
import { getUser } from "./utils"

export const authHandler = async (
  event: APIGatewayProxyEvent,
  cognito: AWS.CognitoIdentityServiceProvider,
  dynamoClient: DynamoDBClient
): Promise<APIGatewayProxyResult> => {
  switch (event.path) {
  case "/auth/login": {
    return await loginHandler(event, cognito)
  }
  case "/auth/signup": {
    return await signupHandler(event, cognito, dynamoClient)
  }
  case "/auth/check": {
    const authToken = event.headers["Authorization"]
    if (!authToken) {
      return UNAUTHORIZED
    }
    const result = await getUser(cognito, authToken)
    if (!result.success) {
      return UNAUTHORIZED
    }
    return {
      statusCode: 200,
      body: "Success"
    }
  }
  default: {
    return UNKOWN_ENDPOINT
  }
  }
}