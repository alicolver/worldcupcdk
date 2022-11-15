import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider"

export const cognito = new CognitoIdentityProviderClient({
  region: "eu-west-2"
})

export const dynamoClient = new DynamoDBClient({ region: "eu-west-2" })