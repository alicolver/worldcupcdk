
export enum deploymentStage {
    PROD,
    DEV,
}

export const STAGE = process.env["STAGE"] === "prod" ? deploymentStage.PROD : deploymentStage.DEV