import { GetItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import {
  leagueTableSchema,
  pointsTableSchema,
  userTableSchema,
} from "../../../common/dbModels/models"
import express from "express"
import { dynamoClient } from "../../utils/clients"
import { getUserId } from "../auth/utils"
import { LEAGUE_TABLE_NAME, POINTS_TABLE_NAME } from "../../utils/database"
import { rank } from "../../utils/rank"
import { getLivePointsForUser } from "../points/get"

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
  const leagueObjects = await Promise.all(
    parsedUserData.leagueIds.map(async (leagueId) => {
      const leagueData = await dynamoClient.send(
        new GetItemCommand({
          TableName: LEAGUE_TABLE_NAME,
          Key: marshall({ leagueId }),
        })
      )
      if (!leagueData.Item) {
        res.status(500)
        throw new Error("Unable to find league")
      }
      return leagueTableSchema.parse(unmarshall(leagueData.Item))
    })
  )

  const leagueObjectsWithPoints = await Promise.all(
    leagueObjects.map(async (leagueObject) => {
      const leagueWithPoints = await Promise.all(
        leagueObject.userIds.map(async (userId) => {
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
            userId: pointsItem.userId,
            totalPoints: pointsItem.totalPoints + livePoints,
          }
        })
      )
      const usersWithRankings = rank(
        leagueWithPoints,
        (a, b) => b.totalPoints - a.totalPoints,
        true
      )
      return {
        ...leagueObject,
        users: usersWithRankings,
        currentRanking: usersWithRankings.filter(
          (user) => user.userId == userId
        )[0].rank,
      }
    })
  )

  const data = {
    userId: parsedUserData.userId,
    givenName: parsedUserData.givenName,
    familyName: parsedUserData.familyName,
    leagues: leagueObjectsWithPoints,
  }

  res.status(200)
  res.json({
    message: "Successfully got user",
    data,
  })
}
