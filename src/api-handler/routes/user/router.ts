import express from "express"
import { authRequired } from "../../utils/midleware"
import { getUserHandler } from "./getLeagues"

export const registerUserRoutes = (app: express.Express) => {
  app.post("/user/get-leagues", authRequired, getUserHandler)
}