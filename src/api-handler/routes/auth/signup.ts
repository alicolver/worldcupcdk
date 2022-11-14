import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { z } from "zod"
import { UserTableItem } from "../../../common/dbModels/models"
import { DATABASE_ERROR, NO_BODY_ERROR, PARSING_ERROR } from "../../utils/constants"
import { checkUserId } from "./utils"

const USER_POOL_ID = process.env.USER_POOL_ID as string
const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME as string

const signupSchema = z.object({
  password: z.string().min(6),
  email: z.string(),
  givenName: z.string(),
  familyName: z.string(),
})

export const signupHandler = async (
  event: APIGatewayProxyEvent,
  cognito: AWS.CognitoIdentityServiceProvider,
  dynamoClient: DynamoDBClient
): Promise<APIGatewayProxyResult> => {
  if (!event.body) return NO_BODY_ERROR
  const parsedEvent = signupSchema.safeParse(JSON.parse(event.body))
  if (!parsedEvent.success) return PARSING_ERROR
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
    response = await cognito.adminCreateUser(params).promise()
  } catch (error) {
    console.log(JSON.stringify(error))
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error creating user in cognito",
      }),
    }
  }
  if (!response.User || !response.User.Attributes) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "User not returned from cognito",
      }),
    }
  }

  console.log(`Created user: ${JSON.stringify(response.User)}`)
  const userId = checkUserId(response.User.Attributes.filter(
    (attribute) => attribute.Name === "sub"
  )[0].Value)

  const userItem: UserTableItem = {
    userId,
    leagueIds: []
  }

  const createUserLeageuMappingParams = {
    TableName: USERS_TABLE_NAME,
    Item: marshall(userItem)
  }

  try {
    await dynamoClient.send(new PutItemCommand(createUserLeageuMappingParams))
  } catch (error) {
    console.log(error)
    return DATABASE_ERROR
  }

  const paramsForSetPass = {
    Password: password,
    UserPoolId: USER_POOL_ID,
    Username: email,
    Permanent: true,
  }

  try {
    await cognito.adminSetUserPassword(paramsForSetPass).promise()
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error setting user password in cognito",
      }),
    }
  }  

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "User registration successful",
    }),
  }
}
