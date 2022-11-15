import { ScanCommand, ScanCommandInput } from "@aws-sdk/client-dynamodb"
import { matchesTableSchema } from "../../../common/dbModels/models"
import { unmarshall } from "@aws-sdk/util-dynamodb"
import { getFormattedDate } from "../../utils/date"
import { MATCHES_TABLE_NAME } from "../../utils/database"
import { DATABASE_ERROR, returnError } from "../../utils/constants"
import express from "express"
import { dynamoClient } from "../../utils/clients"

export const getLiveMatchHandler: express.Handler = async (req, res) => {
  const today = getFormattedDate(new Date())
  const time = new Date().toISOString().split("T")[1].slice(0,5)
  const params: ScanCommandInput = {
    FilterExpression: "matchDate = :today AND matchTime <= :time AND isFinished = :isFinished",
    ExpressionAttributeValues: {
      ":today": { S: today },
      ":time": { S: time },
      ":isFinished": { BOOL: false }
    },
    TableName: MATCHES_TABLE_NAME
  }

  try {
    const matches = await dynamoClient.send(new ScanCommand(params))
    const parsedMatches = matches.Items?.map(item => matchesTableSchema.parse(unmarshall(item)))

    res.status(200)
    res.json({ message: "Successfully fetched matches", data: parsedMatches })
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }
}