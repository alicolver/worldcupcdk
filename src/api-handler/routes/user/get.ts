import { GetItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { z } from "zod"
import { userTableSchema } from "../../../common/dbModels/models"
import { PARSING_ERROR, returnError } from "../../utils/constants"
import express from "express"
import { dynamoClient } from "../../utils/clients"

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME as string

const getUser = z.object({
  userId: z.string(),
})

export const getUserHandler: express.Handler = async (req, res) => {
  const parsedGetUser = getUser.safeParse(req.body)
  if (!parsedGetUser.success) return returnError(res, PARSING_ERROR)
  const { userId } = parsedGetUser.data
  const userData = await dynamoClient.send(new GetItemCommand({
    TableName: USERS_TABLE_NAME,
    Key: marshall({ userId })
  }))
  if (!userData.Item) {
    res.status(500)
    return res.json({ message: "Unable to find user" })
  }
  const parsedUserData = userTableSchema.parse(unmarshall(userData.Item))
  res.status(200)
  res.json({
    message: "Successfully got user",
    data: parsedUserData
  })
}