import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { z } from "zod"
import { DEFAULT_ERROR, SERVER_ERROR } from "../../utils/constants"

const USER_POOL_ID = process.env.USER_POOL_ID as string
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID as string

const loginSchema = z.object({
  password: z.string(),
  email: z.string(),
})

export const loginHandler = async (
  event: APIGatewayProxyEvent,
  cognito: AWS.CognitoIdentityServiceProvider
): Promise<APIGatewayProxyResult> => {
  if (!event.body) return DEFAULT_ERROR
  const parsedEvent = loginSchema.safeParse(JSON.parse(event.body))
  if (!parsedEvent.success) {
    return DEFAULT_ERROR
  }
  const { email, password } = parsedEvent.data
  const params = {
    AuthFlow: "ADMIN_NO_SRP_AUTH",
    UserPoolId: USER_POOL_ID,
    ClientId: USER_POOL_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  }

  const response = await cognito.adminInitiateAuth(params).promise()

  if (!response.AuthenticationResult?.AccessToken) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "User not found",
      }),
    }
  }

  const user = await cognito
    .getUser({ AccessToken: response.AuthenticationResult?.AccessToken })
    .promise()

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Success",
      token: response.AuthenticationResult?.AccessToken,
      user,
    }),
  }
}
