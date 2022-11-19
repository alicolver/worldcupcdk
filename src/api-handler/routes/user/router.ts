import express from "express"
import { adminRequired, authRequired } from "../../utils/midleware"
import { deleteUserHandler } from "./delete"
import { getUserHandler } from "./getLeagues"

export const registerUserRoutes = (app: express.Express) => {
  app.post("/user/get-leagues", authRequired, getUserHandler)
  app.post("/user/delete", authRequired, adminRequired, deleteUserHandler)
}