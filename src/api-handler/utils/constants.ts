import express from "express"

interface errorResponse {
  statusCode: number
  body: {
    message: string
  }
}

export const DEFAULT_ERROR = {
  statusCode: 400,
  body: { message: "Invalid input" },
}

export const DATABASE_ERROR = {
  statusCode: 424,
  body: { message: "Error accessing database" },
}

export const LEAGUE_EXISTS_ERROR = {
  statusCode: 424,
  body: JSON.stringify({ message: "League already exists" }),
}

export const UNKOWN_ENDPOINT = {
  statusCode: 404,
  body: { message: "Unknown endpoint" },
}

export const SERVER_ERROR = (error: Error) => {
  return {
    statusCode: 500,
    body: {
      message: error.message
    },
  }
}

export const UNAUTHORIZED: errorResponse = {
  statusCode: 401,
  body: {
    message: "User is not authorized"
  },
}

export const PARSING_ERROR = {
  statusCode: 400,
  body: { message: "Error parsing request body" },
}

export const UNKNOWN_SERVER_ERROR = {
  statusCode: 500,
  body: { message: "Unknown server error" }
}

export const NO_BODY_ERROR = {
  statusCode: 400,
  body: { message: "No body included in request" }
}

export const returnError = (res: express.Response, error: errorResponse) => {
  res.status(error.statusCode)
  res.json(error.body)
}