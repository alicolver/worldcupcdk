import express from "express"

export const checkAdminHandler: express.Handler = async (req, res) => {
  // The middleware would have rejected the request if the user wasn't admin so we can just return 200
  res.status(200)
  res.send("Success")
}