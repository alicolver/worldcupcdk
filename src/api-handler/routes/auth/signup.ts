import { GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"
import { z } from "zod"
import { PointsTableItem, UserTableItem } from "../../../common/dbModels/models"
import { DATABASE_ERROR, PARSING_ERROR, returnError } from "../../utils/constants"
import { createLeague } from "../league/create"
import { joinLeague } from "../league/join"
import { checkUserId } from "./utils"
import express from "express"
import { cognito, dynamoClient } from "../../utils/clients"
import { AdminCreateUserCommand, AdminSetUserPasswordCommand } from "@aws-sdk/client-cognito-identity-provider"
import { POINTS_TABLE_NAME } from "../../utils/database"
import { getFormattedDate, numberOfPreviousMatchDays } from "../../utils/date"

const USER_POOL_ID = process.env.USER_POOL_ID as string
const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME as string
const LEAGUE_TABLE_NAME = process.env.LEAGUE_TABLE_NAME as string

const signupSchema = z.object({
  password: z.string().min(6),
  email: z.string(),
  givenName: z.string(),
  familyName: z.string(),
})

function containsNumbers(str: string) {
  return /\d/.test(str)
}

export const signupHandler: express.Handler = async (req, res) => {
  const parsedEvent = signupSchema.safeParse(req.body)
  if (!parsedEvent.success) {
    console.log(parsedEvent.error)
    return returnError(res, PARSING_ERROR)
  }
  const { givenName, familyName, email, password } = parsedEvent.data
  if (!containsNumbers(password)) {
    res.status(403)
    return res.json({
      message: "Password must contain numbers",
    })
  }
  const params = {
    UserPoolId: USER_POOL_ID,
    Username: email,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
      {
        Name: "given_name",
        Value: givenName,
      },
      {
        Name: "family_name",
        Value: familyName,
      },
      {
        Name: "email_verified",
        Value: "true",
      },
    ],
    MessageAction: "SUPPRESS",
  }
  let response
  try {
    response = await cognito.send(new AdminCreateUserCommand(params))
  } catch (error) {
    console.log(error)
    res.status(500)
    return res.json({
      message: "Error creating user in cognito",
    })
  }
  if (!response.User || !response.User.Attributes) {
    res.status(500)
    return res.json({
      message: "User not returned from cognito",
    })
  }

  console.log(`Created user: ${JSON.stringify(response.User)}`)
  const userId = checkUserId(response.User.Attributes.filter(
    (attribute) => attribute.Name === "sub"
  )[0].Value)

  const paramsForSetPass = {
    Password: password,
    UserPoolId: USER_POOL_ID,
    Username: email,
    Permanent: true,
  }

  try {
    await cognito.send(new AdminSetUserPasswordCommand(paramsForSetPass))
  } catch (error) {
    res.status(500)
    return res.json({
      message: "Error setting user password in cognito",
    })
  }

  const userItem: UserTableItem = {
    userId,
    givenName,
    familyName,
    leagueIds: []
  }

  try {
    await dynamoClient.send(new PutItemCommand({
      TableName: USERS_TABLE_NAME,
      Item: marshall(userItem)
    }))
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }



  const globalLeague = await dynamoClient.send(new GetItemCommand({
    TableName: LEAGUE_TABLE_NAME,
    Key: marshall({ leagueId: "global" })
  }))

  if (!globalLeague.Item) {
    console.log("Global league does not exist yet")
    createLeague("Global", userId)
  } else {
    console.log("Found global league yet")
    const joinGlobalLeagueResult = await joinLeague("global", userId, dynamoClient)
    console.log(`Join league message: ${joinGlobalLeagueResult.message}`)
  }

  try {
    const previousMatchDays = numberOfPreviousMatchDays[getFormattedDate(new Date())] || 0
    const pointsHistory: number[] = new Array(previousMatchDays).fill(0)
    const initiatePointsItem: PointsTableItem = { userId, pointsHistory, totalPoints: 0 }
    await dynamoClient.send(new PutItemCommand({
      TableName: POINTS_TABLE_NAME,
      Item: marshall(initiatePointsItem)
    }))
  } catch (error) {
    console.log(error)
    return returnError(res, DATABASE_ERROR)
  }

  res.status(200)
  return res.json({
    message: "User registration successful",
  })
}
