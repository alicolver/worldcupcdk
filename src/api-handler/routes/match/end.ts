import { ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { z } from "zod"
import {
  DATABASE_ERROR,
  PARSING_ERROR,
  returnError,
} from "../../utils/constants"
import { MATCHES_TABLE_NAME, USERS_TABLE_NAME } from "../../utils/database"
import express from "express"
import { dynamoClient } from "../../utils/clients"
import { UserPoolIdentityProviderSaml } from "aws-cdk-lib/aws-cognito"
import { getPointsForUsers } from "../points/get"

const endMatchSchema = z.object({
  matchid: z.string(),
  homeScore: z.number(),
  awayScore: z.number(),
})

// TODO: Wrap with admin
export const endMatchHandler: express.Handler = async (req, res) => {
  const match = endMatchSchema.safeParse(req.body)
  if (!match.success) return returnError(res, PARSING_ERROR)

  const matchData = match.data

  try {
    await dynamoClient.send(
      new UpdateItemCommand({
        TableName: MATCHES_TABLE_NAME,
        Key: {
          matchId: { S: matchData.matchid },
        },
        UpdateExpression:
          "set homeScore = :x, set awayScore = :y, set isFinished: :z",
        ExpressionAttributeValues: marshall({
          ":x": matchData.homeScore,
          ":y": matchData.awayScore,
          ":z": true,
        }),
      })
    )
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }

  try {
    const userIdsScan = await dynamoClient.send(
      new ScanCommand({
        TableName: USERS_TABLE_NAME,
        ProjectionExpression: "userId",
      })
    )
    const userIds = z.array(z.string()).parse(userIdsScan.Items?.map(
      (userId) => unmarshall(userId).userId
    ))

    await Promise.all(userIds.map(async (userId) => {
      // get prediction for match
      const userPoints = (await getPointsForUsers([userId]))[0]
      // calculate points user should get
      // update prediction with points
      // add points onto points record
      // write points and prediction record to dynamo
      return userId
    }))

  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }

  res.status(200)
  res.json({ message: "Successfully ended match" })
}
