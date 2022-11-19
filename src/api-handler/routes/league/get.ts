import { GetItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { z } from "zod"
import {
  leagueTableSchema,
  PointsTableItem,
  pointsTableSchema,
  UserTableItem,
  userTableSchema,
} from "../../../common/dbModels/models"
import { PARSING_ERROR, returnError } from "../../utils/constants"
import express from "express"
import { dynamoClient } from "../../utils/clients"
import {
  LEAGUE_TABLE_NAME,
  POINTS_TABLE_NAME,
  USERS_TABLE_NAME,
} from "../../utils/database"
import { getLivePointsForUser } from "../points/get"
import { rank } from "../../utils/rank"
import { getLiveMatches } from "../match/getLive"
import { batchGetFromDynamo } from "../../utils/dynamo"

const getLeagueSchema = z.object({
  leagueId: z.string(),
})

export const getLeagueHandler: express.Handler = async (req, res) => {
  const parsedGetLeague = getLeagueSchema.safeParse(req.body)
  if (!parsedGetLeague.success) return returnError(res, PARSING_ERROR)
  const { leagueId } = parsedGetLeague.data
  const leagueData = await dynamoClient.send(
    new GetItemCommand({
      TableName: LEAGUE_TABLE_NAME,
      Key: marshall({ leagueId }),
    })
  )
  if (!leagueData.Item) {
    res.status(500)
    return res.json({ message: "Unable to find league" })
  }

  const liveMatches = await getLiveMatches()

  const parsedLeagueData = leagueTableSchema.parse(unmarshall(leagueData.Item))

  const userIds = parsedLeagueData.userIds.map(userId => {return { userId }})

  const users = await batchGetFromDynamo<UserTableItem, {userId: string}>(
    userIds,
    userTableSchema,
    dynamoClient,
    USERS_TABLE_NAME,
    ["userId", "givenName", "familyName", "leagueIds"]
  )

  const points = await batchGetFromDynamo<PointsTableItem, {userId: string}>(
    userIds,
    pointsTableSchema,
    dynamoClient,
    POINTS_TABLE_NAME,
    ["userId", "pointsHistory", "totalPoints"]
  )

  const liveTotalPointsAndPrevious = await Promise.all(points.map(async pointRecord => {
    const livePoints = await getLivePointsForUser(pointRecord.userId, liveMatches)
    return {
      userId: pointRecord.userId,
      totalPoints: livePoints + pointRecord.totalPoints,
      previousTotalPoints: pointRecord.pointsHistory
        .slice(0, 1)
        .reduce((partial, a) => a + partial, 0),
    }
  }))

  const merged = []

  for(let i=0; i<users.length; i++) {
    merged.push({
      ...users[i], 
      ...(liveTotalPointsAndPrevious.find((itmInner) => itmInner.userId === users[i].userId))}
    )
  }

  const userPointsObjects = merged.map(userPoints => {
    return {
      ...userPoints,
      totalPoints: userPoints.totalPoints || 0,
      previousTotalPoints: userPoints.previousTotalPoints || 0
    }
  })

  const usersWithCurrentRankings = rank(
    userPointsObjects,
    (a, b) => b.totalPoints - a.totalPoints,
    true
  )

  const usersWithCurrentAndPreviousRankings = rank(
    usersWithCurrentRankings,
    (a, b) => (b.previousTotalPoints as number) - (a.previousTotalPoints as number),
    true,
    "yesterdayRank"
  )

  const data = {
    leagueId: parsedLeagueData.leagueId,
    leagueName: parsedLeagueData.leagueName,
    users: usersWithCurrentAndPreviousRankings,
  }
  res.status(200)
  res.json({
    message: "Successfully got league",
    data,
  })
}
