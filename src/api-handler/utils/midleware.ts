import express from "express"
import { getUser } from "../routes/auth/utils"
import { returnError, UNAUTHORIZED } from "./constants"

export const authRequired: express.Handler = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authToken = req.headers["authorization"]
  if (!authToken || typeof authToken !== "string") {
    return returnError(res, UNAUTHORIZED)
  }
  const result = await getUser(authToken)
  if (!result.success) {
    return returnError(res, UNAUTHORIZED)
  }
  req.user = result.user! // If result.success is true then result.user will be defined
  next()
}