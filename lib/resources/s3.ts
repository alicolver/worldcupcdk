import { StackProps } from "aws-cdk-lib";
import { Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class S3Buckets {
    constructor(scope: Construct) {
        const teamCrestBucket = new Bucket(scope, "TeamCrestBucket", {
            bucketName: "world-cup-2022-predictor-crest-bucket",
            cors: [
                {
                  allowedMethods: [
                    HttpMethods.GET
                  ],
                  allowedOrigins: ['http://localhost:3000', 'https:://alicolver.com'],
                  allowedHeaders: ['*'],
                },
            ],
        }
    }
}
