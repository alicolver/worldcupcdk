import { RemovalPolicy } from "aws-cdk-lib"
import { Bucket, HttpMethods } from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"
import { deploymentStage } from "../utils/environment"

interface S3BucketsProps {
  stage: deploymentStage
}

export class S3Buckets {
  constructor(scope: Construct, props: S3BucketsProps) {
    new Bucket(scope, "TeamCrestBucket", {
      cors: [
        {
          allowedMethods: [
            HttpMethods.GET
          ],
          allowedOrigins: ["http://localhost:3000", "https:://alicolver.com"],
          allowedHeaders: ["*"],
        },
      ],
      removalPolicy: props.stage === deploymentStage.PROD ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    })
  }
}
