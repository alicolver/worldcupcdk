import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb"
import { Construct } from "constructs"

export class DynamoTable {

  readonly dynamoTable: Table

  constructor(scope: Construct) {
    this.dynamoTable = new Table(scope, "worldCup2022Table", {
      partitionKey: { name: "partitionKey", type: AttributeType.STRING },
      sortKey: { name: "sortKey", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST
    })
  }
}
