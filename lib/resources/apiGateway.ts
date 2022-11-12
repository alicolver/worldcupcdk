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
    const integration = new LambdaIntegration(backend)

    gateway.root.addResource("leaderboard").addMethod(HttpMethod.GET, integration)

    const score = gateway.root.addResource("score")
    score.addMethod(HttpMethod.GET, integration)
    score.addMethod(HttpMethod.POST, integration)

    const predictions = gateway.root.addResource("predictions")
    predictions.addMethod(HttpMethod.GET, integration)
    predictions.addMethod(HttpMethod.POST, integration)

    const match = gateway.root.addResource("match")
    match.addMethod(HttpMethod.GET, integration)
    match.addMethod(HttpMethod.POST, integration)
  }
}