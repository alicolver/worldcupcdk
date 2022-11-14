import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { z } from "zod"
import { DATABASE_ERROR, NO_BODY_ERROR, PARSING_ERROR, returnError } from "../../utils/constants"
import { MATCHES_TABLE_NAME } from "../../utils/database"
import express from "express"
import { dynamoClient } from "../../utils/clients"

const endMatchSchema = z.object({
  matchid: z.string(),
  homeScore: z.number(),
  awayScore: z.number()
})

// TODO: Wrap with admin
export const endMatchHandler: express.Handler = async (req, res) => {
  const match = endMatchSchema.safeParse(req.body)
  if (!match.success) return returnError(res, PARSING_ERROR)

  const matchData = match.data

  try {
    await dynamoClient.send(new UpdateItemCommand({
      TableName: MATCHES_TABLE_NAME,
      Key: {
        matchId: { S: matchData.matchid }
      },
      UpdateExpression: "set homeScore = :x, set awayScore = :y, set isFinished: :z",
      ExpressionAttributeValues: marshall({
        ":x": matchData.homeScore,
        ":y": matchData.awayScore,
        ":z": true
      })
    }))
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }

  res.status(200)
  res.json({ message: "Successfully ended match" })
}