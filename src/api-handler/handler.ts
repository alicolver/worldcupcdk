import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import AWS from "aws-sdk";
import { loginHandler } from "./routes/auth/login";
import { signupHandler } from "./routes/auth/signup";
import { endMatchHandler } from "./routes/match/end";

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const cognito = new AWS.CognitoIdentityServiceProvider();

  const endpoint = event.path;
  switch (endpoint) {
    case "/auth/login": {
      return await loginHandler(event, cognito);
    }
    case "/auth/signup": {
      return await signupHandler(event, cognito);
    }
    case "/match": {
      return await endMatchHandler(event, cognito);
    }
    default: {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Internal server error",
        }),
      };
    }
  }
};
