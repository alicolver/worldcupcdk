import { APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { z } from "zod";

const cognito = new AWS.CognitoIdentityServiceProvider();

const loginSchema = z.object({
  password: z.string(),
  email: z.string(),
});

export const loginHandler = async (event: any): Promise<APIGatewayProxyResult> => {
  try {
    const parsedEvent = loginSchema.safeParse(JSON.parse(event.body));
    if (!parsedEvent.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid input" }),
      };
    }
    const { email, password } = parsedEvent.data;
    const user_pool_id = process.env.user_pool_id as string;
    const client_id = process.env.client_id as string;
    const params = {
      AuthFlow: "ADMIN_NO_SRP_AUTH",
      UserPoolId: user_pool_id,
      ClientId: client_id,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    const response = await cognito.adminInitiateAuth(params).promise();

    if (!response.AuthenticationResult?.AccessToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
    }

    const user = await cognito
      .getUser({ AccessToken: response.AuthenticationResult?.AccessToken })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Success",
        token: response.AuthenticationResult?.IdToken,
        user,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: (error as any).messsage || "Internal server error",
      }),
    };
  }
};
