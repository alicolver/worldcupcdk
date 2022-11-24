import express from "express"
import { IncomingHttpHeaders } from "node:http"
import { getUser } from "../routes/auth/utils"
import { returnError, UNAUTHORIZED } from "./constants"

const getRefreshToken = (headers: IncomingHttpHeaders): string | undefined => {
  const token = headers["refresh"]
  if (token && typeof token !== "string") {
    return undefined
  }
  return token
}

export const authRequired: express.Handler = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authToken = req.headers["authorization"]

  if (authToken && typeof authToken !== "string") {
    return returnError(res, UNAUTHORIZED)
  }

  const result = await getUser(authToken, getRefreshToken(req.headers))
  if (!result.success) {
    return returnError(res, UNAUTHORIZED)
  }

  if (result.result?.newAuthToken) {
    res.setHeader("authorization", result.result.newAuthToken)
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  req.user = result.result!.commandResult! // If result.success is true then result.result will be defined
  next()
}

export const adminRequired: express.Handler = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // if we have called authRequired before adminRequired this should exist
  const user = req.user!
  const isAdmin = user.UserAttributes?.filter(attribute => attribute.Name === "custom:isAdmin")[0]
  if (!isAdmin) {
    return returnError(res, UNAUTHORIZED)
  }
  console.log(`isAdmin: ${isAdmin.Value}`)
  if (isAdmin.Value !== "true") {
    return returnError(res, UNAUTHORIZED)
  }
  next()
}