import * as cdk from "aws-cdk-lib"
import { Table } from "aws-cdk-lib/aws-dynamodb"
import { Construct } from "constructs"
import { ApiGateway } from "./resources/apiGateway"
import { S3Buckets } from "./resources/s3"
import { DynamoTable } from "./resources/dynamodb"
import { Lambda } from "./resources/lambda"
import { deploymentStage } from "./utils/environment"
import { CognitoUserPool } from "./resources/cognito/cognitoUserPool"
import { CognitoUserClient } from "./resources/cognito/cognitoUserClient"

interface WorldcupcdkStackProps extends cdk.StackProps {
  stage: deploymentStage
}

export class WorldcupcdkStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: WorldcupcdkStackProps) {
    super(scope, id, props)

    // cognito 
    const cognitoUserPool = new CognitoUserPool(this)
    const cognitoUserClient = new CognitoUserClient(this, {
      cognitoUserPool: cognitoUserPool.cognitoUserPool
    })

    // dynamo
    const dynamoTable = new DynamoTable(this)

    // lambda 
    const lambda = new Lambda(this, {
      dynamoTable: dynamoTable.dynamoTable,
      cognitoUserClient: cognitoUserClient.cognitoUserClient,
      cognitoUserPool: cognitoUserPool.cognitoUserPool
    })

    // api gateway
    new ApiGateway(this, {
      lambda: lambda
    })

    // S3 bucket for fun little pictures
    new S3Buckets(this, {
      stage: props.stage,
    })

  }
}