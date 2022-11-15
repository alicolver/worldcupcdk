import express from "express"
import { authRequired } from "../../utils/midleware"
import { createMatchHandler } from "./create"
import { endMatchHandler } from "./end"
import { getFinishedMatchesHandler } from "./getPrevious"
import { getUpcomingMatchHandler } from "./getUpcoming"

export const registerMatchRoutes = (app: express.Express) => {
  app.post("/match/create", authRequired, createMatchHandler)
  app.post("/match/end", authRequired, endMatchHandler)
  app.get("/match/get-upcoming", authRequired, getUpcomingMatchHandler)
  app.get("/match/get-previous", authRequired, getFinishedMatchesHandler)
}