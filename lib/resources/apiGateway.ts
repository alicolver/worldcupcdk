import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway"
import { HttpMethod } from "aws-cdk-lib/aws-events"
import { Construct } from "constructs"
import { Lambda } from "./lambda"

interface ApiGatewayProps {
  readonly lambda: Lambda
}

export class ApiGateway {
  constructor(scope: Construct, props: ApiGatewayProps) {
    const gateway = new RestApi(scope, "WorldCupApi", {
      restApiName: "WorldCupApi",
      
      defaultCorsPreflightOptions: {
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
        ],
        allowMethods: ["GET", "POST"],
        allowCredentials: true,
        allowOrigins: ["http://localhost:3000", "https://alicolver.com"],
      }
    })
    
    const backend = props.lambda.function

    gateway.root.addResource("scores").addMethod(HttpMethod.GET, new LambdaIntegration(backend))
    gateway.root.addResource("predictions").addMethod(HttpMethod.POST, new LambdaIntegration(backend))
    gateway.root.addResource("leaderboard").addMethod(HttpMethod.GET, new LambdaIntegration(backend))
    const match = gateway.root.addResource("match")
    match.addMethod(HttpMethod.GET, new LambdaIntegration(backend))
    match.addMethod(HttpMethod.POST, new LambdaIntegration(backend))
  }
}