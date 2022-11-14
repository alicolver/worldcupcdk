import express from "express"
import { z } from "zod"
import { cognito } from "../../utils/clients"
import { PARSING_ERROR, returnError } from "../../utils/constants"

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

  const response = await cognito.adminInitiateAuth(params).promise()

  if (!response.AuthenticationResult?.AccessToken) {
    res.status(500)
    return res.json({
      message: "User not found",
    })
  }

  const user = await cognito
    .getUser({ AccessToken: response.AuthenticationResult?.AccessToken })
    .promise()

  res.status(200)
  return res.json({
    message: "Success",
    token: response.AuthenticationResult?.AccessToken,
    user,
  })
}
