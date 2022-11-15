import express from "express"
import { authRequired } from "../../utils/midleware"
import { getPointsHandler } from "./get"

export const registerPointsRoutes = (app: express.Express) => {
  app.post("/points/get", authRequired, getPointsHandler)
}