import { ScanCommand, ScanCommandInput } from "@aws-sdk/client-dynamodb"
import { MatchesTableItem, matchesTableSchema } from "../../../common/dbModels/models"
import { unmarshall } from "@aws-sdk/util-dynamodb"
import { MATCHES_TABLE_NAME } from "../../utils/database"
import { DATABASE_ERROR, returnError } from "../../utils/constants"
import express from "express"
import { dynamoClient } from "../../utils/clients"

export const getFinishedMatches = async (): Promise<MatchesTableItem[]> => {
  const params: ScanCommandInput = {
    FilterExpression: "isFinished = :isFinished",
    ExpressionAttributeValues: {
      ":isFinished": { BOOL: true },
    },
    TableName: MATCHES_TABLE_NAME,
  }
  const matches = await dynamoClient.send(new ScanCommand(params))
  if (!matches.Items) return []
  const parsedMatches = matches.Items?.map((item) => {
    return matchesTableSchema.parse(unmarshall(item))
  }
  )
  return parsedMatches
}

export const getFinishedMatchesHandler: express.Handler = async (req, res) => {
  try {
    const matches = await getFinishedMatches()

    res.status(200)
    res.json({ message: "Successfully fetched matches", data: matches })
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }
}
