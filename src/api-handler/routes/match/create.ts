import { APIGatewayProxyEvent } from "aws-lambda"
import { z } from "zod"
import { DEFAULT_ERROR } from "../../utils/constants"
import { v4 as uuidv4 } from "uuid"
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"

const createMatchSchema = z.object({
  homeTeam: z.string(),
  awayTeam: z.string(),
  gameStage: z.enum(["GROUP", "FINAL", "SEMIFINAL", "QUARTERFINAL", "OCTOFINAL"]),
  date: z.string(),
  time: z.string()
})

const MATCHES_TABLE_NAME = process.env.MATCHES_TABLE_NAME as string

export const createMatchHandler = async (event: APIGatewayProxyEvent, dynamoClient: DynamoDBClient) => {
  try {
    const match = createMatchSchema.safeParse(JSON.parse(event.body!))
    if (!match.success) {
      console.log(JSON.stringify(match.error))
      return DEFAULT_ERROR}
    const { homeTeam, awayTeam, gameStage, date, time } = match.data
    const matchId = uuidv4()

    const params: PutItemCommandInput = {
      TableName: MATCHES_TABLE_NAME,
      Item: marshall({
        matchId, homeTeam, awayTeam, gameStage, date, time
      }),
    }
    try {
      await dynamoClient.send(new PutItemCommand(params))
    } catch (error) {
      console.log(error)
      return DEFAULT_ERROR
    }
    

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Successfully created match" })
    }
  } catch {
    return DEFAULT_ERROR
  }
}