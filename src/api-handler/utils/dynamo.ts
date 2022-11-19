import {
  BatchGetItemCommand,
  BatchWriteItemCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { ZodSchema } from "zod"

const batchItems = <T>(items: T[]): T[][] => {
  const batches: T[][] = []
  let current_batch = []
  let item_count = 0
  for (const x in items) {
    item_count++
    current_batch.push(items[x])
    if (item_count % 25 == 0) {
      batches.push(current_batch)
      current_batch = []
    }
  }
  if (current_batch.length > 0 && current_batch.length != 25)
    batches.push(current_batch)
  return batches
} 

export const batchGetFromDynamo = async <T1, T2>(
  keys: T2[],
  schema: ZodSchema<T1>,
  dynamoClient: DynamoDBClient,
  tableName: string,
  projectionKeys: string[]
): Promise<T1[]> => {
  const batches = batchItems(keys)
  const data = (
    await Promise.all(
      batches.map(async (batch) => {
        const dynamoResult = await dynamoClient.send(
          new BatchGetItemCommand({
            RequestItems: {
              [tableName]: {
                Keys: batch.map((key) => marshall(key)),
                ProjectionExpression: projectionKeys.join(", "),
              },
            },
          })
        )
        if (!dynamoResult.Responses) throw new Error("No results returned")
        const unmarshalled = dynamoResult.Responses[tableName].map((response) =>
          unmarshall(response)
        )
        return unmarshalled
      })
    )
  ).flat()

  const parsedData = data.map((record) => schema.parse(record))
  return parsedData
}

export const batchPutInDynamo = async <T>(
  items: T[],
  dynamoClient: DynamoDBClient,
  tableName: string
) => {
  const batches = batchItems(items)

  await Promise.all(
    batches.map(async (batch) => {
      await dynamoClient.send(
        new BatchWriteItemCommand({
          RequestItems: {
            [tableName]: batch.map((item) => {
              return {
                PutRequest: {
                  Item: marshall(item),
                },
              }
            }),
          },
        })
      )
    })
  )
}
