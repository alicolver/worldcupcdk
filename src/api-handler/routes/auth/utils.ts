import { cognito } from "../../utils/clients"
import { GetUserCommand, GetUserCommandOutput, CognitoIdentityProviderServiceException, InitiateAuthCommand, InitiateAuthCommandOutput } from "@aws-sdk/client-cognito-identity-provider"

const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID as string

interface cognitoResult<T> {
  success: boolean
  result?: T
  error?: CognitoIdentityProviderServiceException
}

interface getUserResult {
  commandResult?: GetUserCommandOutput,
  newAuthToken?: string,
}

const sendGetUserCommand = async (accessToken: string): Promise<cognitoResult<GetUserCommandOutput>> => {
  try {
    const user = await cognito.send(new GetUserCommand({ AccessToken: String(accessToken) }))
    return {
      success: true,
      result: user,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof CognitoIdentityProviderServiceException ? error : undefined,
    }
  }
}

const refreshAuthToken = async (refreshToken: string): Promise<cognitoResult<InitiateAuthCommandOutput>> => {
  try {
    const result = await cognito.send(new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    }))
    return {
      success: true,
      result: result,
    }
  } catch (error) {
    console.log(error)
    return {
      success: false,
      error: error instanceof CognitoIdentityProviderServiceException ? error : undefined,
    }
  }
}

export const getUser = async (accessToken: string, refreshToken?: string): Promise<cognitoResult<getUserResult>> => {
  let getUserResult = await sendGetUserCommand(accessToken)
  let newAuthToken = undefined

  if (!getUserResult.success && refreshToken) {
    console.log("Failed initial command, trying again with refresh token")
    const refreshResult = await refreshAuthToken(refreshToken)
    if (refreshResult.success && refreshResult.result?.AuthenticationResult?.AccessToken) {
      console.log("Second get user was successful")
      newAuthToken = refreshResult.result?.AuthenticationResult?.AccessToken
      getUserResult = await sendGetUserCommand(newAuthToken)
    }
  }

  return {
    success: getUserResult.success,
    result: {
      commandResult: getUserResult.result,
      newAuthToken: newAuthToken,
    },
  }
}

export const checkUserId = (userId: string | undefined): string => {
  if (!userId) {
    throw new Error("userId required for this endpoint")
  }
  return userId
}

export const getUserId = (user: GetUserCommandOutput): string => {
  return checkUserId(user.UserAttributes?.filter(
    attribute => attribute.Name === "sub"
  )[0].Value)
}