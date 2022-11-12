import * as cdk from "aws-cdk-lib"
import { deploymentStage, STAGE } from "./utils/environment"
import { WorldcupcdkStack } from "./worldcupcdk-stack"

const user = process.env["USER"]

const app = new cdk.App()
if (STAGE === deploymentStage.DEV) {
  new WorldcupcdkStack(app, `${user}-WorldCupStack`, {
    stage: STAGE,
  })
} else {
  new WorldcupcdkStack(app, "WorldCupStack", {
    stage: STAGE,
  })
}