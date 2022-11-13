import { APIGatewayProxyEvent } from "aws-lambda"
import { DEFAULT_ERROR } from "../../utils/constants"

export const createLeagueHandler = async (event: APIGatewayProxyEvent) => {
  return DEFAULT_ERROR
}