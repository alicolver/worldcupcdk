import * as cdk from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { ApiGateway } from './resources/apiGateway';
import { S3Buckets } from './resources/s3';
import { DynamoTable } from "./resources/dynamodb"
import { Lambda } from './resources/lambda';

export class WorldcupcdkStack extends cdk.Stack {
  
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // cognito 

    // dynamo
    const dynamoTable = new DynamoTable(this)

    // api gateway
    new ApiGateway(this)
    
    // lambda 
    new Lambda(this, {
      dynamoTable: dynamoTable.dynamoTable,
    })

    // S3 bucket for fun little pictures
    new S3Buckets(this)

  }
}