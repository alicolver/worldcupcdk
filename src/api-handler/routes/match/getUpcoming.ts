import { ScanCommand, ScanCommandInput } from "@aws-sdk/client-dynamodb"
import { matchesTableSchema } from "../../../common/dbModels/models"
import { unmarshall } from "@aws-sdk/util-dynamodb"
import { addDays, getFormattedDate } from "../../utils/date"
import { MATCHES_TABLE_NAME } from "../../utils/database"
import { DATABASE_ERROR, returnError } from "../../utils/constants"
import express from "express"
import { dynamoClient } from "../../utils/clients"

export const getUpcomingMatchHandler: express.Handler = async (req, res) => {
  const today = getFormattedDate(new Date())
  const tomorrow = getFormattedDate(addDays(new Date(), 1))
  const params: ScanCommandInput = {
    FilterExpression: "matchDate = :matchDate1 OR matchDate = :matchDate2",
    ExpressionAttributeValues: {
      ":matchDate1": { S: today },
      ":matchDate2": { S: tomorrow }
    },
    TableName: MATCHES_TABLE_NAME
  }

  try {
    const matches = await dynamoClient.send(new ScanCommand(params))
    const parsedMatches = matches.Items?.map(item => matchesTableSchema.parse(unmarshall(item)))
    const futureMatches = parsedMatches?.filter(match => match.isFinished === false)

    res.status(200)
    res.json({ message: "Successfully fetched matches", data: futureMatches })
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }
}