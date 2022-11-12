import { Duration } from "aws-cdk-lib"
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito"
import { Construct } from "constructs"

interface CognitoUserClientProps {
  cognitoUserPool: UserPool;
}

export class CognitoUserClient {
  readonly cognitoUserClient: UserPoolClient
  constructor(scope: Construct, props: CognitoUserClientProps) {
    this.cognitoUserClient = new UserPoolClient(
      scope,
      "worldCup2022UserClient",
      {
        userPool: props.cognitoUserPool,
        authFlows: {
          adminUserPassword: true,
          userPassword: true,
        },
        accessTokenValidity: Duration.minutes(60),
        idTokenValidity: Duration.minutes(60),
        refreshTokenValidity: Duration.days(30),
        userPoolClientName: "worldCup2022UserClient",
      }
    )
  }
}
