import { StringAttribute, UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class CognitoUserPool {
  readonly cognitoUserPool: UserPool;
  readonly cognitoUserClient: UserPoolClient
  constructor(scope: Construct) {
    this.cognitoUserPool = new UserPool(scope, "worldCup2022UserPool", {
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
      },
      userPoolName: "worldCup2022UserPool",
      customAttributes: {
        givenName: new StringAttribute({ mutable: false }),
        familyName: new StringAttribute({ mutable: false }),
        email: new StringAttribute({ mutable: false }),
        isAdmin: new StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: false,
        requireSymbols: false,
      },
    });
  }
}
