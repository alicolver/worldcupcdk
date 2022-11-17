import express from "express"
import { z } from "zod"
import { cognito } from "../../utils/clients"
import { PARSING_ERROR, returnError } from "../../utils/constants"
import { PasswordResetRequiredException, AdminInitiateAuthCommand, GetUserCommand, NotAuthorizedException } from "@aws-sdk/client-cognito-identity-provider"

const USER_POOL_ID = process.env.USER_POOL_ID as string
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID as string

const loginSchema = z.object({
  password: z.string(),
  email: z.string(),
})

export const loginHandler: express.Handler = async (req, res) => {
  const parsedEvent = loginSchema.safeParse(req.body)
  if (!parsedEvent.success) {
    return returnError(res, PARSING_ERROR)
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
  try {
    const response = await cognito.send(new AdminInitiateAuthCommand(params))

    if (!response.AuthenticationResult?.AccessToken) {
      res.status(500)
      return res.json({
        message: "User not found",
      })
    }

    const user = await cognito.send(new GetUserCommand({ AccessToken: response.AuthenticationResult?.AccessToken }))

    res.status(200)
    res.setHeader("authorization", response.AuthenticationResult?.AccessToken)
    res.setHeader("refresh", response.AuthenticationResult.RefreshToken || "")
    return res.json({
      message: "Success",
      token: response.AuthenticationResult?.AccessToken,
      refresh: response.AuthenticationResult.RefreshToken,
      user,
    })
  } catch (error) {
    console.log(error)
    if (error instanceof PasswordResetRequiredException) {
      res.status(307)
      return res.json({
        message: error.message,
        reset: true,
      })
    }
    if (error instanceof NotAuthorizedException) {
      res.status(401)
      return res.json({
        message: error.message,
        reset: false,
      })
    }
    res.status(500)
    res.json({
      message: "Login failed"
    })
  }
}
