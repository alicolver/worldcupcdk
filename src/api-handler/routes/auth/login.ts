import { APIGatewayProxyResult } from "aws-lambda";
export const loginHandler = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello world',
      input: event,
    })
  }
};
