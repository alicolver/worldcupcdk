import { GetItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { z } from "zod"
import { leagueTableSchema } from "../../../common/dbModels/models"
import { PARSING_ERROR, returnError } from "../../utils/constants"
import express from "express"
import { dynamoClient } from "../../utils/clients"

const LEAGUE_TABLE_NAME = process.env.LEAGUE_TABLE_NAME as string

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
  res.status(200)
  res.json({
    message: "Successfully got league",
    data: parsedLeagueData
  })
}