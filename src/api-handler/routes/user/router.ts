import express from "express"
import { authRequired } from "../../utils/midleware"
import { getUserHandler } from "./get"

export const registerUserRoutes = (app: express.Express) => {
  app.post("/user/get", authRequired, getUserHandler)
}