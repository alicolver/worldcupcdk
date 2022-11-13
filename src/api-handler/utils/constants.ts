export const DEFAULT_ERROR = {
  statusCode: 400,
  body: JSON.stringify({ message: "Invalid input" }),
}

export const SERVER_ERROR = (error: Error) => {
  return {
    statusCode: 500,
    body: JSON.stringify({
      message: error.message
    }),
  }
}
