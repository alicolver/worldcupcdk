import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb"
import { Construct } from "constructs"

interface DynamoTableProps {
  tableName: string;
  partitionKeyName: string;
  sortKeyName?: string;
}

export class DynamoTable {
  readonly dynamoTable: Table

  constructor(scope: Construct, props: DynamoTableProps) {
    this.dynamoTable = new Table(scope, props.tableName, {
      partitionKey: { name: props.partitionKeyName, type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      ...(props.sortKeyName && {
        sortKey: { name: props.sortKeyName, type: AttributeType.STRING },
      }),
    })
  }
}
