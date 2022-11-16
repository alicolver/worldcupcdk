import express from "express"
import { authRequired } from "../../utils/midleware"
import { getPredictionHandler } from "./fetch"
import { getMatchPredictionsForLeagueHandler } from "./getMatchPredictionsForLeague"
import { getPreviousPredictionsForUserHandler } from "./getPreviousPredictionsForUser"
import { makePredictionHandler } from "./make"

export const registerPredictionsRoutes = (app: express.Express) => {
  app.post("/predictions/fetch", authRequired, getPredictionHandler)
  app.post("/predictions/make", authRequired, makePredictionHandler)
  app.post(
    "/predictions/get-match-predictions-for-league",
    authRequired,
    getMatchPredictionsForLeagueHandler
  )
  app.post(
    "/predictions/get-previous-predictions-for-user",
    authRequired,
    getPreviousPredictionsForUserHandler
  )
}
