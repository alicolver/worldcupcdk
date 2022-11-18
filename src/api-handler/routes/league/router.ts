import express from "express"
import { authRequired } from "../../utils/midleware"
import { createLeagueHandler } from "./create"
import { getLeagueHandler } from "./get"
import { joinLeagueHandler } from "./join"
import { leaveLeagueHandler } from "./leave"

export const registerLeagueRoutes = (app: express.Express) => {
  app.post("/league/create", authRequired, createLeagueHandler)
  app.post("/league/join", authRequired, joinLeagueHandler)
  app.post("/league/get", authRequired, getLeagueHandler)
  app.post("/league/leave", authRequired, leaveLeagueHandler)
}