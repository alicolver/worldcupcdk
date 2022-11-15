import {
  BatchGetItemCommand,
  BatchGetItemCommandInput,
} from "@aws-sdk/client-dynamodb"
import { unmarshall } from "@aws-sdk/util-dynamodb"
import { z } from "zod"
import { DATABASE_ERROR, PARSING_ERROR, returnError } from "../../utils/constants"
import express from "express"
import { dynamoClient } from "../../utils/clients"
import { PointsTableItem, pointsTableSchema } from "../../../common/dbModels/models"

const getPointsSchema = z.object({
  userIds: z.array(z.string()),
})

const POINTS_TABLE_NAME = process.env.POINTS_TABLE_NAME as string

export const getPointsForUsers = async (userIds: string[]): Promise<PointsTableItem[]> => {
  const queryKeys = userIds.map((userId) => {
    return { userId: { S: userId } }
  })
  const getBatchParams: BatchGetItemCommandInput = {
    RequestItems: {
      [POINTS_TABLE_NAME]: {
        Keys: queryKeys
      },
    },
  }
  const data = await dynamoClient.send(new BatchGetItemCommand(getBatchParams))
  if (!data.Responses) {
    throw new Error("Error retreiving points")
  }

  const unmarshalledResponses = data.Responses[POINTS_TABLE_NAME].map(response => unmarshall(response))
  const parsedResponses = unmarshalledResponses.map(points => pointsTableSchema.parse(points))
  return parsedResponses
}

export const getPointsHandler: express.Handler = async (req, res) => {
  const getPoints = getPointsSchema.safeParse(req.body)
  if (!getPoints.success) return returnError(res, PARSING_ERROR)

  const getPointsData = getPoints.data
  const { userIds } = getPointsData
  try {
    const pointsRecords = await getPointsForUsers(userIds)

    res.status(200)
    res.json({
      message: "Successfully fetched points",
      body: pointsRecords
    })
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }
}
