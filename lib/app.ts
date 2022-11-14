import * as cdk from "aws-cdk-lib"
import { ENV_PREFIX, STAGE } from "./utils/environment"
import { WorldcupcdkStack } from "./worldcupcdk-stack"

const app = new cdk.App()
new WorldcupcdkStack(app, `${ENV_PREFIX}WorldCupStack`, {
  stage: STAGE,
})