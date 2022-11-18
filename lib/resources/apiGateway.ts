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
      handler: props.lambda.function,
    })
  }
}