import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import { loginHandler } from "./routes/auth/login";

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const endpoint = event.path;
  switch (endpoint) {
    case "/auth/login": {
      return await loginHandler();
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
