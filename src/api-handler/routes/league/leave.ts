import { GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import express from "express"
import { z } from "zod"
import {
  leagueTableSchema,
  userTableSchema,
} from "../../../common/dbModels/models"
import { dynamoClient } from "../../utils/clients"
import {
  DATABASE_ERROR,
  PARSING_ERROR,
  returnError,
} from "../../utils/constants"
import { LEAGUE_TABLE_NAME, USERS_TABLE_NAME } from "../../utils/database"
import { getUserId } from "../auth/utils"

const leaveLeagueSchema = z.object({
  leagueId: z.string(),
})

export const leaveLeagueHandler: express.Handler = async (req, res) => {
  const parsedLeaveLeague = leaveLeagueSchema.safeParse(req.body)
  if (!parsedLeaveLeague.success) return returnError(res, PARSING_ERROR)
  const { leagueId } = parsedLeaveLeague.data
  const userId = getUserId(req.user!)
  const league = await dynamoClient.send(
    new GetItemCommand({
      TableName: LEAGUE_TABLE_NAME,
      Key: marshall({ leagueId }),
    })
  )
  if (!league.Item) {
    res.status(400)
    res.json({ message: "Cannot find league" })
    return
  }
  const parsedLeague = leagueTableSchema.parse(unmarshall(league.Item))
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
  const updatedLeague = {
    ...parsedLeague,
    userIds: parsedLeague.userIds.filter(
      (userIdInLeague) => userIdInLeague !== userId
    ),
  }
  const updatedUser = {
    ...parsedUser,
    leagueIds: parsedUser.leagueIds.filter(
      (leagueUserIsIn) => leagueUserIsIn !== leagueId
    ),
  }
  try {
    await dynamoClient.send(
      new PutItemCommand({
        TableName: USERS_TABLE_NAME,
        Item: marshall(updatedUser),
      })
    )
    await dynamoClient.send(
      new PutItemCommand({
        TableName: LEAGUE_TABLE_NAME,
        Item: marshall(updatedLeague),
      })
    )
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }
  res.status(200)
  res.json({ message: "Successfully left league" })
}
