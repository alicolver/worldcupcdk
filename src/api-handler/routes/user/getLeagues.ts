import { GetItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import {
  LeagueTableItem,
  leagueTableSchema,
  PointsTableItem,
  pointsTableSchema,
  userTableSchema,
} from "../../../common/dbModels/models"
import express from "express"
import { dynamoClient } from "../../utils/clients"
import { getUserId } from "../auth/utils"
import { LEAGUE_TABLE_NAME, POINTS_TABLE_NAME } from "../../utils/database"
import { rank } from "../../utils/rank"
import { getLivePointsForUser } from "../points/get"
import { batchGetFromDynamo } from "../../utils/dynamo"
import { getLiveMatches } from "../match/getLive"

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

  const leagueObjects = await batchGetFromDynamo<
    LeagueTableItem,
    { leagueId: string }
  >(
    parsedUserData.leagueIds.map((leagueId) => {
      return { leagueId }
    }),
    leagueTableSchema,
    dynamoClient,
    LEAGUE_TABLE_NAME,
    ["leagueId", "leagueName", "userIds"]
  )

  const userIds = [
    ...new Set(leagueObjects.map((league) => league.userIds).flat()),
  ].map((userId) => {
    return { userId }
  })

  const pointsObjects = await batchGetFromDynamo<
    PointsTableItem,
    { userId: string }
  >(userIds, pointsTableSchema, dynamoClient, POINTS_TABLE_NAME, [
    "userId",
    "pointsHistory",
    "totalPoints",
  ])

  const liveMatches = await getLiveMatches()

  const livePoints = await Promise.all(
    userIds.map(async (user) => {
      const livePoints = await getLivePointsForUser(user.userId, liveMatches)
      return {
        userId: user.userId,
        livePoints,
      }
    })
  )

  const merged = []

  for(let i=0; i<pointsObjects.length; i++) {
    merged.push({
      ...pointsObjects[i], 
      ...(livePoints.find((itmInner) => itmInner.userId === pointsObjects[i].userId))}
    )
  }

  const pointsObjectsWithLive = merged.map((pointsObject) => {
    return {
      userId: pointsObject.userId,
      pointsHistory: pointsObject.pointsHistory,
      totalPoints: pointsObject.totalPoints + (pointsObject.livePoints || 0)
    }
  })

  const leagueObjectsWithRankings = leagueObjects.map((league) => {
    const usersWithPoints = league.userIds.map((userId) => {
      const userPoints = pointsObjectsWithLive.filter(
        (points) => points.userId === userId
      )[0]
      return {
        userId,
        totalPoints: userPoints.totalPoints,
        previousTotalPoints: userPoints.pointsHistory
          .slice(0, -1)
          .reduce((partial, a) => a + partial, 0),
      }
    })
    const usersWithCurrentRankings = rank(
      usersWithPoints,
      (a, b) => b.totalPoints - a.totalPoints,
      false
    )
    const usersWithCurrentAndPreviousRankings = rank(
      usersWithCurrentRankings,
      (a, b) =>
        (b.previousTotalPoints as number) - (a.previousTotalPoints as number),
      false,
      "yesterdayRank"
    )
    return {
      ...league,
      users: usersWithCurrentAndPreviousRankings,
      currentRanking: usersWithCurrentRankings.filter(
        (user) => user.userId == userId
      )[0].rank,
      previousRanking: usersWithCurrentAndPreviousRankings.filter(
        (user) => user.userId == userId
      )[0].yesterdayRank,
    }
  })

  const globalLeague = leagueObjectsWithRankings.filter(league => league.leagueId == "global")[0]
  const otherLeagues = leagueObjectsWithRankings.filter(league => league.leagueId !== "global")



  const data = {
    userId: parsedUserData.userId,
    givenName: parsedUserData.givenName,
    familyName: parsedUserData.familyName,
    leagues: [globalLeague, ...otherLeagues],
  }

  res.status(200)
  res.json({
    message: "Successfully got user",
    data,
  })
}
