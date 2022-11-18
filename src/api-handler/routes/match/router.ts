import express from "express"
import { authRequired } from "../../utils/midleware"
import { createMatchHandler } from "./create"
import { endMatchHandler } from "./end"
import { getLiveMatchHandler } from "./getLive"
import { getFinishedMatchesHandler } from "./getPrevious"
import { getUpcomingMatchHandler } from "./getUpcoming"
import { updateScoreHandler } from "./updateScore"

export const registerMatchRoutes = (app: express.Express) => {
  app.post("/match/create", authRequired, createMatchHandler)
  app.post("/match/end", authRequired, endMatchHandler)
  app.get("/match/get-upcoming", authRequired, getUpcomingMatchHandler)
  app.get("/match/get-previous", authRequired, getFinishedMatchesHandler)
  app.get("/match/get-live", authRequired, getLiveMatchHandler)
  app.post("/match/update-score", authRequired, updateScoreHandler)
}