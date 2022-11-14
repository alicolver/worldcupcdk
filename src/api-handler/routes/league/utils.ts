import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { LeagueTableItem, leagueTableSchema, UserTableItem, userTableSchema } from "../../../common/dbModels/models"

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME as string
const LEAGUE_TABLE_NAME = process.env.LEAGUE_TABLE_NAME as string

export const addLeagueIdToUser = async (leagueId: string, userId: string, dynamoClient: DynamoDBClient) => {
  const user = await dynamoClient.send(new GetItemCommand({
    TableName: USERS_TABLE_NAME,
    Key: marshall({ userId })
  }))
  if (!user.Item) {
    throw new Error("User not found")
  }
  const parsedUser = userTableSchema.parse(unmarshall(user.Item))
  const updatedUser: UserTableItem = { ...parsedUser, leagueIds: [...parsedUser.leagueIds, leagueId] }
  await dynamoClient.send(new PutItemCommand({
    TableName: USERS_TABLE_NAME,
    Item: marshall(updatedUser)
  }))
}

export const addUserIdToLeague = async (leagueId: string, userId: string, dynamoClient: DynamoDBClient) => {
  const league = await dynamoClient.send(new GetItemCommand({
    TableName: LEAGUE_TABLE_NAME,
    Key: marshall({ leagueId })
  }))
  if (!league.Item) {
    throw new Error("League not found")
  }
  const parsedLeague = leagueTableSchema.parse(unmarshall(league.Item))
  const updatedLeague: LeagueTableItem = { ...parsedLeague, userIds: [...parsedLeague.userIds, userId]}
  await dynamoClient.send(new PutItemCommand({
    TableName: LEAGUE_TABLE_NAME,
    Item: marshall(updatedLeague)
  }))
}