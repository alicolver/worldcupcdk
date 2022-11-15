import express from "express"
import { z } from "zod"
import { cognito } from "../../utils/clients"
import { PARSING_ERROR, returnError } from "../../utils/constants"
import { ForgotPasswordCommand, ConfirmForgotPasswordCommand } from "@aws-sdk/client-cognito-identity-provider"

const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID as string

const resetSchema = z.object({
  email: z.string(),
})

export const resetHandler: express.Handler = async (req, res) => {
  const parsedEvent = resetSchema.safeParse(req.body)
  if (!parsedEvent.success) {
    return returnError(res, PARSING_ERROR)
  }
  const { email } = parsedEvent.data

  await cognito.send(new ForgotPasswordCommand({
    ClientId: USER_POOL_CLIENT_ID,
    Username: email,
  }))

  res.status(200)
  res.json({
    message: "Password reset"
  })
}

const confirmSchema = z.object({
  email: z.string(),
  password: z.string(),
  confirmationCode: z.string(),
})

export const confirmHandler: express.Handler = async (req, res) => {
  const parsedEvent = confirmSchema.safeParse(req.body)
  if (!parsedEvent.success) {
    return returnError(res, PARSING_ERROR)
  }
  const { email, password, confirmationCode } = parsedEvent.data

  try {
    await cognito.send(new ConfirmForgotPasswordCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: email,
      Password: password,
      ConfirmationCode: confirmationCode,
    }))

    res.status(200)
    res.json({
      message: "Password reset"
    })
  } catch (error) {
    console.log(error)
    res.status(400)
    res.json({
      message: "Failed to reset password"
    })
  }
}