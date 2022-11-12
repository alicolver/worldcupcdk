# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Initial Setup

#### Install AWS CLI

Follow this [guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) to install the AWS CLI.

#### Install CDK CLI

```
npm install -g aws-cdk@latest
```

### Setting up AWS credentals

#### Creating AWS Access Key

Sign into your AWS IAM account on the AWS console and follow this [guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html#cli-configure-quickstart-creds) to create an access key. Make sure you download the csv as you will only see the credentials once.

#### Setting up AWS CLI profile

Run the following command in your terminal to create an aws profile.

```
aws configure --profile worldcup
```

### Setup VSCode
#### Installing packages

First install the node packages in the root of the package.

```
npm install
```

Next install the packages in the src dir

``` bash
cd src/
npm install
```

## Deploying

In order to test the system you can deploy a personal version of the stack to the AWS account which should replicate the one deployed in production.

#### Compile the code
```
npm run build
```

This will also lint the code and fix any issues

#### Generate the cloudformation templates and code artifacts
```
cdk synth
```

This step may require docker. If it does and this is a problem then we can move to a system where we use zip files as code artifacts rather than docker images.

#### Deploy to the AWS account
```
cdk deploy --profile worldcup
```

Once your stack is deployed you should be able to go to cloudformation in the AWS console and view your personal stack. This should contain all the same resources as the production stack.