import { APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { DEFAULT_ERROR } from "../../utils/constants";

const endMatchSchema = z.object({
  matchid: z.string(),
  homeScore: z.number(),
  awayScore: z.number()
})

export const endMatchHandler = async (
  event: any,
  cognito: AWS.CognitoIdentityServiceProvider
): Promise<APIGatewayProxyResult> => {
  try {
    const match = endMatchSchema.safeParse(JSON.parse(event.body));
    if (!match.success) return DEFAULT_ERROR;

    const authToken = event.headers.get('Authorization');
    if (!authToken) return DEFAULT_ERROR;

    const user = await cognito.getUser({
      AccessToken: event.headers.get('Authorization')!
    }).promise();

    return DEFAULT_ERROR;
  } catch {
    return DEFAULT_ERROR;
  }
}