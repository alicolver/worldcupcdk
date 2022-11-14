import { APIGatewayProxyEvent } from "aws-lambda"
import { z } from "zod"
import { DATABASE_ERROR, DEFAULT_ERROR } from "../../utils/constants"
import { v4 as uuidv4 } from "uuid"
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"
import { MatchesTableItem } from "../../../common/dbModels/models"
import { MATCHES_TABLE_NAME } from "../../utils/database"

const createMatchSchema = z.object({
  homeTeam: z.string(),
  awayTeam: z.string(),
  gameStage: z.enum(["GROUP", "FINAL", "SEMIFINAL", "QUARTERFINAL", "OCTOFINAL"]),
  matchDate: z.string(),
  matchTime: z.string(),
  matchDay: z.number()
})

export const createMatchHandler = async (event: APIGatewayProxyEvent, dynamoClient: DynamoDBClient) => {
  try {
    if (!event.body) return DEFAULT_ERROR
    const match = createMatchSchema.safeParse(JSON.parse(event.body))
    if (!match.success) {
      console.log(JSON.stringify(match.error))
      return DEFAULT_ERROR
    }
    const { homeTeam, awayTeam, gameStage, matchDate, matchTime, matchDay } = match.data
    const matchId = uuidv4()

    const matchItem: MatchesTableItem = {
      matchId,
      homeTeam,
      awayTeam,
      gameStage,
      matchDate,
      matchTime,
      matchDay,
      isFinished: false
    }

    const params: PutItemCommandInput = {
      TableName: MATCHES_TABLE_NAME,
      Item: marshall(matchItem),
    }
    try {
      await dynamoClient.send(new PutItemCommand(params))
    } catch (error) {
      console.log(error)
      return DATABASE_ERROR
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Successfully created match" })
    }
  } catch {
    return DEFAULT_ERROR
  }
}