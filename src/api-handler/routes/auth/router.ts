import { loginHandler } from "./login"
import { signupHandler } from "./signup"
import { checkHandler } from "./check"
import express from "express"
import { authRequired } from "../../utils/midleware"

export const registerAuthRoutes = (app: express.Express) => {
  app.post("/auth/login", loginHandler)
  app.post("/auth/signup", signupHandler)
  app.get("/auth/check", authRequired, checkHandler)
}