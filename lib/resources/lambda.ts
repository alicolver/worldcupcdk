import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { join } from "path";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

interface LambdaProps {
  dynamoTable: Table;
  cognitoUserClient: UserPoolClient;
  cognitoUserPool: UserPool;
}

export class Lambda {
  constructor(scope: Construct, props: LambdaProps) {
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ["aws-sdk"],
      },
      depsLockFilePath: join(
        __dirname,
        "../../",
        "src/lambdas",
        "package-lock.json"
      ),
      environment: {
        PRIMARY_KEY: "itemId",
        TABLE_NAME: props.dynamoTable.tableName,
        USER_POOL_CLIENT_ID: props.cognitoUserClient.userPoolClientId,
        USER_POOL_IT: props.cognitoUserPool.userPoolId,
      },
      runtime: Runtime.NODEJS_16_X,
    };

    const apiHandler = new NodejsFunction(scope, "deleteItemFunction", {
      entry: join(__dirname, "../../", "src/", "bigGiantLambda.ts"),
      ...nodeJsFunctionProps,
    });

    apiHandler.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "cognito-idp:AdminInitiateAuth",
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
        ],
        resources: [
          `arn:aws:cognito-idp:${props.cognitoUserPool.stack.region}:${props.cognitoUserPool.stack.account}:userpool/${props.cognitoUserPool.userPoolId}`,
        ],
      })
    );
  }
}
