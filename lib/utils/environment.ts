export enum deploymentStage {
    PROD,
    DEV,
}

export const STAGE = process.env["CI"] === "true" ? deploymentStage.PROD : deploymentStage.DEV

export const ENV_PREFIX = STAGE === deploymentStage.PROD ? "" : `${process.env["USER"]}-`