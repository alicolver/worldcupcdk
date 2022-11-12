import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiGateway } from './resources/apiGateway';
import { S3Buckets } from './resources/s3';
import { DynamoTable } from "./resources/dynamodb"
import { Lambda } from './resources/lambda';
import { CognitoUserPool } from './resources/cognito/cognitoUserPool';
import { CognitoUserClient } from './resources/cognito/cognitoUserClient';

export class WorldcupcdkStack extends cdk.Stack {
  
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // cognito 
    const cognitoUserPool = new CognitoUserPool(this)
    const cognitoUserClient = new CognitoUserClient(this, {
      cognitoUserPool: cognitoUserPool.cognitoUserPool
    })

    // dynamo
    const dynamoTable = new DynamoTable(this)

    // api gateway
    new ApiGateway(this)
    
    // lambda 
    new Lambda(this, {
      dynamoTable: dynamoTable.dynamoTable,
      cognitoUserClient: cognitoUserClient.cognitoUserClient,
      cognitoUserPool: cognitoUserPool.cognitoUserPool
    })

    // S3 bucket for fun little pictures
    new S3Buckets(this)

  }
}