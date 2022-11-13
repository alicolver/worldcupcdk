import { DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommandInput } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { APIGatewayProxyEvent } from "aws-lambda"
import { z } from "zod"
import { DEFAULT_ERROR } from "../../utils/constants"

const joinLeagueSchema = z.object({
  leagueId: z.string(),
})

const LEAGUE_TABLE_NAME = process.env.LEAGUE_TABLE_NAME as string

export const joinLeagueHandler = async (event: APIGatewayProxyEvent, userId: string, dynamoClient: DynamoDBClient) => {
  try {
    const joinLeague = joinLeagueSchema.safeParse(JSON.parse(event.body!))
    if (!joinLeague.success) {
      console.log(JSON.stringify(joinLeague.error))
      return DEFAULT_ERROR
    }
    const { leagueId } = joinLeague.data

    const getLeagueParams: GetItemCommandInput = {
      TableName: LEAGUE_TABLE_NAME,
      Key: marshall({leagueId})
    }

    const leagueData = await dynamoClient.send(new GetItemCommand(getLeagueParams))

    if (!leagueData.Item) {
      console.log("Cannot find league")
      return DEFAULT_ERROR
    }
    
    // parse league item against schema
    // add userId to userIds
    // put item in dynamo


    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Successfully joined league" })
    }
  } catch {
    return DEFAULT_ERROR
  }
}