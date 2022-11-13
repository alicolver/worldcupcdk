import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { z } from "zod"
import { DEFAULT_ERROR } from "../../utils/constants"
import { marshall } from "@aws-sdk/util-dynamodb"

const postPredictionSchema = z.object({
  matchId: z.string(),
  homeScore: z.number(),
  awayScore: z.number(),
})

const TABLE_NAME = process.env.TABLE_NAME as string

export const postPredictionHandler = async (
  event: APIGatewayProxyEvent,
  cognito: AWS.CognitoIdentityServiceProvider
): Promise<APIGatewayProxyResult> => {
  try {
    const prediction = postPredictionSchema.safeParse(JSON.parse(event.body!))
    if (!prediction.success) return DEFAULT_ERROR
    const { matchId, homeScore, awayScore } = prediction.data

    // TODO: we should be able to add this authorization to the api gateway and then pass user information down to lambda
    const authToken = event.headers!["Authorization"]
    if (!authToken) return DEFAULT_ERROR

    const user = await cognito
      .getUser({AccessToken: String(authToken)})
      .promise()

    const userId = user.UserAttributes.filter(
      (attribute: any) => attribute.Name === "sub"
    )[0].Value

    if (!userId) return DEFAULT_ERROR

    const predictionItem = {
      partitionKey: userId,
      sortKey: matchId,
      homeTeam: homeScore,
      awayTeam: awayScore,
    }

    // TODO: get the region from somewhere
    const dynamoClient = new DynamoDBClient({ region: "eu-west-2 " })
    const params = {
      TableName: TABLE_NAME,
      Item: marshall(predictionItem),
    }

    await dynamoClient.send(new PutItemCommand(params))

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Succesfully entered prediction" }),
    }
  } catch {
    return DEFAULT_ERROR
  }
}
