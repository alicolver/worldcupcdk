import { Cors, LambdaRestApi } from "aws-cdk-lib/aws-apigateway"
import { Construct } from "constructs"
import { ENV_PREFIX } from "../utils/environment"
import { Lambda } from "./lambda"

interface ApiGatewayProps {
  readonly lambda: Lambda
}

export class ApiGateway {
  constructor(scope: Construct, props: ApiGatewayProps) {
    new LambdaRestApi(scope, "WorldCupApi", {
      restApiName: `${ENV_PREFIX}WorldCupApi`,
      defaultCorsPreflightOptions: {
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "Refresh"
        ],
        allowMethods: ["GET", "POST", "PUT"],
        allowCredentials: true,
        allowOrigins: Cors.ALL_ORIGINS,
      },
      handler: props.lambda.function,
    })
  }
}