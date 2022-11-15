/* eslint-disable @typescript-eslint/no-namespace */
import { registerAuthRoutes } from "./routes/auth/router"
import express from "express"
import cors from "cors"
import serverless from "serverless-http"
import { registerLeagueRoutes } from "./routes/league/router"
import { registerMatchRoutes } from "./routes/match/router"
import { registerUserRoutes } from "./routes/user/router"
import { registerPointsRoutes } from "./routes/points/router"
import { GetUserCommandOutput } from "@aws-sdk/client-cognito-identity-provider"

declare global {
  namespace Express {
    interface Request {
      user?: GetUserCommandOutput
    }
  }
}

const app = express()
app.use(cors())

app.use(express.json())

registerAuthRoutes(app)
registerLeagueRoutes(app)
registerMatchRoutes(app)
registerUserRoutes(app)
registerPointsRoutes(app)

export const handler = serverless(app)
