import { ScanCommand, ScanCommandInput } from "@aws-sdk/client-dynamodb"
import { matchesTableSchema } from "../../../common/dbModels/models"
import { unmarshall } from "@aws-sdk/util-dynamodb"
import { MATCHES_TABLE_NAME } from "../../utils/database"
import { DATABASE_ERROR, returnError } from "../../utils/constants"
import express from "express"
import { dynamoClient } from "../../utils/clients"

export const getFinishedMatchesHandler: express.Handler = async (req, res) => {
  const params: ScanCommandInput = {
    FilterExpression: "isFinished = :isFinished",
    ExpressionAttributeValues: {
      ":isFinished": { BOOL: true },
    },
    TableName: MATCHES_TABLE_NAME,
  }

  try {
    const matches = await dynamoClient.send(new ScanCommand(params))
    const parsedMatches = matches.Items?.map((item) =>
      matchesTableSchema.parse(unmarshall(item))
    )

    res.status(200)
    res.json({ message: "Successfully fetched matches", data: parsedMatches })
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }
}
