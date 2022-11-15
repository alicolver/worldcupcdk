import { GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"
import { z } from "zod"
import { UserTableItem } from "../../../common/dbModels/models"
import { DATABASE_ERROR, PARSING_ERROR, returnError } from "../../utils/constants"
import { createLeague } from "../league/create"
import { joinLeague } from "../league/join"
import { checkUserId } from "./utils"
import express from "express"
import { cognito, dynamoClient } from "../../utils/clients"
import { AdminCreateUserCommand, AdminSetUserPasswordCommand } from "@aws-sdk/client-cognito-identity-provider"

const USER_POOL_ID = process.env.USER_POOL_ID as string
const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME as string
const LEAGUE_TABLE_NAME = process.env.LEAGUE_TABLE_NAME as string

const signupSchema = z.object({
  password: z.string().min(6),
  email: z.string(),
  givenName: z.string(),
  familyName: z.string(),
})

export const signupHandler: express.Handler = async (req, res) => {
  const parsedEvent = signupSchema.safeParse(req.body)
  if (!parsedEvent.success) {
    console.log(parsedEvent.error)
    return returnError(res, PARSING_ERROR)
  }
  const { givenName, familyName, email, password } = parsedEvent.data
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

  res.status(200)
  return res.json({
    message: "User registration successful",
  })
}
