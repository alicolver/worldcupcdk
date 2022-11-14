import express from "express"
import { authRequired } from "../../utils/midleware"
import { getPredictionHandler } from "./fetch"
import { makePredictionHandler } from "./make"

export const registerPredictionsRoutes = (app: express.Express) => {
  app.post("/predictions/fetch", authRequired, getPredictionHandler)
  app.post("/predictions/make", authRequired, makePredictionHandler)
}