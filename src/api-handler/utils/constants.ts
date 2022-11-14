export const DEFAULT_ERROR = {
  statusCode: 400,
  body: JSON.stringify({ message: "Invalid input" }),
}

export const DATABASE_ERROR = {
  statusCode: 424,
  body: JSON.stringify({ message: "Error accessing database" }),
}

export const UNKOWN_ENDPOINT = {
  statusCode: 404,
  body: JSON.stringify({ message: "Unknown endpoint" }),
}

export const SERVER_ERROR = (error: Error) => {
  return {
    statusCode: 500,
    body: JSON.stringify({
      message: error.message
    }),
  }
}

export const UNAUTHORIZED = {
  statusCode: 401,
  body: JSON.stringify({ message: "User is not authorized" }),
}

export const PARSING_ERROR = {
  statusCode: 400,
  body: JSON.stringify({ message: "Error parsing request body" }),
}

export const UNKNOWN_SERVER_ERROR = {
  statusCode: 500,
  body: JSON.stringify({ message: "Unknown server error" })
}

export const NO_BODY_ERROR = {
  statusCode: 400,
  body: JSON.stringify({ message: "No body included in request" })
}