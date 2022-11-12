export enum deploymentStage {
    PROD,
    DEV,
}

export const STAGE = process.env["CI"] === "true" ? deploymentStage.PROD : deploymentStage.DEV