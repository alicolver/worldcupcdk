import { GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import express from "express"
import { z } from "zod"
import {
  LeagueTableItem,
  leagueTableSchema,
  UserTableItem,
  userTableSchema,
} from "../../../common/dbModels/models"
import { dynamoClient } from "../../utils/clients"
import {
  DATABASE_ERROR,
  PARSING_ERROR,
  returnError,
} from "../../utils/constants"
import { LEAGUE_TABLE_NAME, USERS_TABLE_NAME } from "../../utils/database"
import { batchGetFromDynamo, batchPutInDynamo } from "../../utils/dynamo"

const deleteUserSchema = z.object({
  userId: z.string(),
})

export const deleteUserHandler: express.Handler = async (req, res) => {
  const parsedDeleteUser = deleteUserSchema.safeParse(req.body)
  if (!parsedDeleteUser.success) return returnError(res, PARSING_ERROR)
  const { userId } = parsedDeleteUser.data
  const user = await dynamoClient.send(
    new GetItemCommand({
      TableName: USERS_TABLE_NAME,
      Key: marshall({ userId }),
    })
  )
  if (!user.Item) {
    res.status(400)
    res.json({ message: "Cannot find user" })
    return
  }
  const parsedUser = userTableSchema.parse(unmarshall(user.Item))
  const leagueIds = parsedUser.leagueIds.map((leagueId) => {
    return { leagueId }
  })
  const leagues = await batchGetFromDynamo(
    leagueIds,
    leagueTableSchema,
    dynamoClient,
    LEAGUE_TABLE_NAME,
    ["leagueId", "leagueName", "userIds"]
  )
  const updatedUser = {
    ...parsedUser,
    leagueIds: [],
  }
  const updatedLeagues = leagues.map((league) => {
    return {
      ...league,
      userIds: league.userIds.filter(
        (userIdInLeague) => userIdInLeague !== userId
      ),
    }
  })

  try {
    await batchPutInDynamo(
      updatedLeagues,
      dynamoClient,
      LEAGUE_TABLE_NAME
    )
    await dynamoClient.send(
      new PutItemCommand({
        TableName: USERS_TABLE_NAME,
        Item: marshall(updatedUser),
      })
    )
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }
  res.status(200)
  res.json({ message: "Successfully removed user" })
}
