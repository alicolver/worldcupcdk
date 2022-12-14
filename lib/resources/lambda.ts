import { Table } from "aws-cdk-lib/aws-dynamodb"
import { Function as LambdaFunction, Runtime } from "aws-cdk-lib/aws-lambda"
import { Construct } from "constructs"
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs"
import { join } from "path"
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito"
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam"

interface LambdaProps {
  matchesTable: Table;
  predictionsTable: Table;
  pointsTable: Table;
  leagueTable: Table;
  usersTable: Table;
  cognitoUserClient: UserPoolClient;
  cognitoUserPool: UserPool;
}

export class Lambda {
  readonly function: LambdaFunction

  constructor(scope: Construct, props: LambdaProps) {
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ["aws-sdk"],
      },
      depsLockFilePath: join(
        __dirname,
        "../../../",
        "src",
        "package-lock.json"
      ),
      environment: {
        PRIMARY_KEY: "itemId",
        MATCHES_TABLE_NAME: props.matchesTable.tableName,
        PREDICTIONS_TABLE_NAME: props.predictionsTable.tableName,
        POINTS_TABLE_NAME: props.pointsTable.tableName,
        LEAGUE_TABLE_NAME: props.leagueTable.tableName,
        USERS_TABLE_NAME: props.usersTable.tableName,
        USER_POOL_CLIENT_ID: props.cognitoUserClient.userPoolClientId,
        USER_POOL_ID: props.cognitoUserPool.userPoolId,
      },
      runtime: Runtime.NODEJS_16_X,
    }

    this.function = new NodejsFunction(scope, "apihandler", {
      entry: join(__dirname, "../../../", "src/api-handler", "handler.ts"),
      ...nodeJsFunctionProps,
    })

    props.matchesTable.grantReadWriteData(this.function)
    props.predictionsTable.grantReadWriteData(this.function)
    props.pointsTable.grantReadWriteData(this.function)
    props.leagueTable.grantReadWriteData(this.function)
    props.usersTable.grantReadWriteData(this.function)
    this.function.addToRolePolicy(
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
    )
  }
}
