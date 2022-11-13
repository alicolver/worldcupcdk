import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { UNKOWN_ENDPOINT } from "../../utils/constants"
import { loginHandler } from "./login"
import { signupHandler } from "./signup"

export const authHandler = async (
  event: APIGatewayProxyEvent,
  cognito: AWS.CognitoIdentityServiceProvider
): Promise<APIGatewayProxyResult> => {
  switch (event.path) {
  case "/auth/login": {
    return await loginHandler(event, cognito)
  }
  case "/auth/signup": {
    return await signupHandler(event, cognito)
  }
  default: {
    return UNKOWN_ENDPOINT
  }
  }
}