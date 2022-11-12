import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import { loginHandler } from "./routes/auth/login";
import { signupHandler } from "./routes/auth/signup";

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const endpoint = event.path;
  switch (endpoint) {
    case "/auth/login": {
      return await loginHandler(event);
    }
    case "/auth/signup": {
      return await signupHandler(event);
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
