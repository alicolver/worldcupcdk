import { GetItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import {
  MatchesTableItem,
  matchesTableSchema,
} from "../../../common/dbModels/models"
import { dynamoClient } from "../../utils/clients"
import { MATCHES_TABLE_NAME } from "../../utils/database"

export const getMatchFromId = async (
  matchId: string
): Promise<MatchesTableItem> => {
  const matchData = await dynamoClient.send(
    new GetItemCommand({
      TableName: MATCHES_TABLE_NAME,
      Key: marshall({ matchId }),
    })
  )
  if (!matchData.Item) {
    throw new Error("Match not found")
  }
  const parsedMatchData = matchesTableSchema.parse(unmarshall(matchData.Item))
  return parsedMatchData
}
