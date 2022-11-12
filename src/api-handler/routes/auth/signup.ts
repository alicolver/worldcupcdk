import { APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { z } from "zod";

const cognito = new AWS.CognitoIdentityServiceProvider();

const USER_POOL_ID = process.env.USER_POOL_ID as string;

const signupSchema = z.object({
  password: z.string().min(6),
  email: z.string(),
  givenName: z.string(),
  familyName: z.string(),
});

export const signupHandler = async (
  event: any
): Promise<APIGatewayProxyResult> => {
  try {
    const parsedEvent = signupSchema.safeParse(JSON.parse(event.body));
    if (!parsedEvent.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid Input",
        }),
      };
    }
    const { givenName, familyName, email, password } = parsedEvent.data;
    const params = {
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
        {
          Name: "given_name",
          Value: givenName,
        },
        {
          Name: "family_name",
          Value: familyName,
        },
        {
          Name: "email_verified",
          Value: "true",
        },
      ],
      MessageAction: "SUPPRESS",
    };
    let response;
    try {
      response = await cognito.adminCreateUser(params).promise();
    } catch (error) {
      console.log(JSON.stringify(error));
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Error creating user in cognito",
        }),
      };
    }
    if (!response.User) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "User not returned from cognito",
        }),
      };
    }

    const paramsForSetPass = {
      Password: password,
      UserPoolId: USER_POOL_ID,
      Username: email,
      Permanent: true,
    };

    try {
      await cognito.adminSetUserPassword(paramsForSetPass).promise();
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Error setting user password in cognito",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User registration successful",
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
