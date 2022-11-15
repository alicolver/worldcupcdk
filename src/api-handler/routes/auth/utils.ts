import { cognito } from "../../utils/clients"
import { InitiateAuthCommand, GetUserCommand, GetUserCommandOutput } from "@aws-sdk/client-cognito-identity-provider"

const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID as string

interface userAuth {
  success: boolean
  user?: GetUserCommandOutput
}

export const getUser = async (token: string): Promise<userAuth> => {
  try {
    await cognito.send(new InitiateAuthCommand({
      AuthFlow: "USER_SRP_AUTH",
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        AccessToken: token,
      }
    }))

    const user = await cognito.send(new GetUserCommand({ AccessToken: String(token) }))

    return {
      success: true,
      user: user,
    }
  } catch (error) {
    console.log("Auth error:", error)
    return {
      success: false,
    }
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
    (attribute) => attribute.Name === "sub"
  )[0].Value)
}