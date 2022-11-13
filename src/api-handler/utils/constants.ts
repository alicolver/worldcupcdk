export const DEFAULT_ERROR = {
  statusCode: 400,
  body: JSON.stringify({ message: "Invalid input" }),
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
