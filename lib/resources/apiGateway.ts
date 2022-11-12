import { RestApi } from "aws-cdk-lib/aws-apigateway"
import { Construct } from "constructs"


export class ApiGateway {
  constructor(scope: Construct) {
    const apiGateway = new RestApi(scope, "WorldCupApi", {
      restApiName: "WorldCupApi"
    })
  }
}