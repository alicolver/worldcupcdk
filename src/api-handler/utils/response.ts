import { APIGatewayProxyResult } from "aws-lambda"

type ResponseHeaders = {
  [header: string]: string | number | boolean;
}


export const convertResponse = (result: APIGatewayProxyResult) => {
  return createResponse(result.statusCode, result.body, result.headers)
}

const createResponse = (statusCode: number, body: string, headers?: ResponseHeaders) => {
  return {
    statusCode: statusCode,
    body: body,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      ...headers,
    }
  }
}