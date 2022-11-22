import express from "express"
import { authRequired } from "../../utils/midleware"
import { getPointsForLeagueHandler, getPointsForUserHandler } from "./get"

export const registerPointsRoutes = (app: express.Express) => {
  app.get("/points/league", authRequired, getPointsForLeagueHandler)
  app.get("/points", authRequired, getPointsForUserHandler)
}