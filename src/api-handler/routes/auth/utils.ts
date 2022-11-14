
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID as string

interface userAuth {
  success: boolean
  user?: AWS.CognitoIdentityServiceProvider.GetUserResponse
}

export const getUser = async (cognito: AWS.CognitoIdentityServiceProvider, token: string): Promise<userAuth> => {
  try {
    await cognito.initiateAuth({
      AuthFlow: "USER_SRP_AUTH",
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        AccessToken: token,
      }
    })

    const user = await cognito.getUser({ AccessToken: String(token) }).promise()

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