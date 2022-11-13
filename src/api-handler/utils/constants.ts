import AWS from "aws-sdk"

export const DEFAULT_ERROR = {
  statusCode: 400,
  body: JSON.stringify({ message: "Invalid input" }),
}

export const SERVER_ERROR = (error: any) => {
  return {
    statusCode: 500,
    body: JSON.stringify({
      message: (error as any).messsage || "Internal server error",
    }),
  }
}
