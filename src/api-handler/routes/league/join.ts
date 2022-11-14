import { DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { APIGatewayProxyEvent } from "aws-lambda"
import { z } from "zod"
import { leagueTableSchema } from "../../../common/dbModels/models"
import { DATABASE_ERROR, NO_BODY_ERROR, PARSING_ERROR } from "../../utils/constants"

const joinLeagueSchema = z.object({
  leagueId: z.string(),
})

const LEAGUE_TABLE_NAME = process.env.LEAGUE_TABLE_NAME as string

export const joinLeagueHandler = async (event: APIGatewayProxyEvent, userId: string, dynamoClient: DynamoDBClient) => {
  if (!event.body) return NO_BODY_ERROR
  const joinLeague = joinLeagueSchema.safeParse(JSON.parse(event.body))
  if (!joinLeague.success) return PARSING_ERROR
  const { leagueId } = joinLeague.data

  const getLeagueParams: GetItemCommandInput = {
    TableName: LEAGUE_TABLE_NAME,
    Key: marshall({ leagueId })
  }

  try {
    const leagueData = await dynamoClient.send(new GetItemCommand(getLeagueParams))
    if (!leagueData.Item) return {
      statusCode: 500,
      body: JSON.stringify({message: "Could not find league"})
    }
    const parsedLeagueData = leagueTableSchema.safeParse(unmarshall(leagueData.Item))
    if (!parsedLeagueData.success) return PARSING_ERROR
    const updatedLeagueData = {
      ...parsedLeagueData.data,
      userIds: [...parsedLeagueData.data.userIds, userId]
    }
    const postItemParams = {
      TableName: LEAGUE_TABLE_NAME,
      Item: marshall(updatedLeagueData)
    }
    await dynamoClient.send(new PutItemCommand(postItemParams))
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Successfully joined league" })
    }
  } catch (error) {
    console.log(error)
    return DATABASE_ERROR
  }
  
}