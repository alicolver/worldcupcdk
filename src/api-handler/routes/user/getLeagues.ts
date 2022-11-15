import { GetItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { userTableSchema } from "../../../common/dbModels/models"
import express from "express"
import { dynamoClient } from "../../utils/clients"
import { getUserId } from "../auth/utils"
import { LEAGUE_TABLE_NAME } from "../../utils/database"

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME as string

export const getUserHandler: express.Handler = async (req, res) => {
  const userId = getUserId(req.user!)
  const userData = await dynamoClient.send(
    new GetItemCommand({
      TableName: USERS_TABLE_NAME,
      Key: marshall({ userId }),
    })
  )
  if (!userData.Item) {
    res.status(500)
    return res.json({ message: "Unable to find user" })
  }
  const parsedUserData = userTableSchema.parse(unmarshall(userData.Item))
  const leagueObejcts = await Promise.all(
    parsedUserData.leagueIds.map(async (leagueId) => {
      const leagueData = await dynamoClient.send(
        new GetItemCommand({
          TableName: LEAGUE_TABLE_NAME,
          Key: marshall({ leagueId }),
        })
      )
      if (!leagueData.Item) {
        return { leagueId }
      }
      return unmarshall(leagueData.Item)
    })
  )
  res.status(200)
  res.json({
    message: "Successfully got user",
    data: {
      ...parsedUserData,
      leagueObejcts,
    },
  })
}
