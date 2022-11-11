import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from "path";

interface LambdaProps {
    dynamoTable: Table
}

export class Lambda {
    constructor(scope: Construct, props: LambdaProps) {
        const nodeJsFunctionProps: NodejsFunctionProps = {
            bundling: {
                externalModules: [
                    'aws-sdk',
                ],
            },
            depsLockFilePath: join(__dirname, '../../', 'src/lambdas', 'package-lock.json'),
            environment: {
                PRIMARY_KEY: 'itemId',
                TABLE_NAME: props.dynamoTable.tableName,
            },
            runtime: Runtime.NODEJS_16_X,
        }

        const apiHandler = new NodejsFunction(scope, 'deleteItemFunction', {
            entry: join(__dirname, '../../', 'src/', 'bigGiantLambda.ts'),
            ...nodeJsFunctionProps,
        });

        props.dynamoTable.grantReadWriteData(apiHandler);

    }
}