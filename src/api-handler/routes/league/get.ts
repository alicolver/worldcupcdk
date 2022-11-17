import { GetItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { z } from "zod"
import { leagueTableSchema, pointsTableSchema, userTableSchema } from "../../../common/dbModels/models"
import { PARSING_ERROR, returnError } from "../../utils/constants"
import express from "express"
import { dynamoClient } from "../../utils/clients"
import { LEAGUE_TABLE_NAME, POINTS_TABLE_NAME, USERS_TABLE_NAME } from "../../utils/database"
import { getLivePointsForUser } from "../points/get"
import { rank } from "../../utils/rank"

const getLeagueSchema = z.object({
  leagueId: z.string(),
})

export const getLeagueHandler: express.Handler = async (req, res) => {
  const parsedGetLeague = getLeagueSchema.safeParse(req.body)
  if (!parsedGetLeague.success) return returnError(res, PARSING_ERROR)
  const { leagueId } = parsedGetLeague.data
  const leagueData = await dynamoClient.send(new GetItemCommand({
    TableName: LEAGUE_TABLE_NAME,
    Key: marshall({leagueId})
  }))
  if (!leagueData.Item) {
    res.status(500)
    return res.json({ message: "Unable to find league" })
  }
  const parsedLeagueData = leagueTableSchema.parse(unmarshall(leagueData.Item))
  const userObjects = await Promise.all(
    parsedLeagueData.userIds.map(async (userId) => {
      const usersData = await dynamoClient.send(
        new GetItemCommand({
          TableName: USERS_TABLE_NAME,
          Key: marshall({ userId }),
        })
      )
      if (!usersData.Item) {
        throw new Error("Unable to find user data")
      }
      const parsedUsersData = userTableSchema.parse(unmarshall(usersData.Item))
      
      const userPoints = await dynamoClient.send(
        new GetItemCommand({
          TableName: POINTS_TABLE_NAME,
          Key: marshall({ userId }),
        })
      )
      if (!userPoints.Item) {
        throw new Error("Unable to find user points")
      }
      const pointsItem = pointsTableSchema.parse(
        unmarshall(userPoints.Item)
      )

      const livePoints = await getLivePointsForUser(userId)

      return {
        ...parsedUsersData,
        totalPoints: pointsItem.totalPoints + livePoints,
      }
    })
  )

  const usersWithRankings = rank(userObjects, (a, b) => b.totalPoints - a.totalPoints, true)

  const data = {
    leagueId: parsedLeagueData.leagueId,
    leagueName: parsedLeagueData.leagueName,
    users: usersWithRankings
  }
  res.status(200)
  res.json({
    message: "Successfully got league",
    data
  })
}