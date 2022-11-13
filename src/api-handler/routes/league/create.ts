import { APIGatewayProxyEvent } from "aws-lambda"
import { z } from "zod"
import { DEFAULT_ERROR } from "../../utils/constants"

const createLeagueSchema = z.object({
  leagueName: z.string(),
  userId: z.string()
})

export const createLeagueHandler = async (event: APIGatewayProxyEvent, userId: string) => {
  return DEFAULT_ERROR
}