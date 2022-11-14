import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import AWS from "aws-sdk"

export const cognito = new AWS.CognitoIdentityServiceProvider()
export const dynamoClient = new DynamoDBClient({ region: "eu-west-2" })