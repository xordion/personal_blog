import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "./dynamoClient";

export type StoredComment = {
  id: string;
  page: string;
  quote?: string;
  content: string;
  author: string;
  createdAt: string;
};

const TABLE_NAME = process.env.DYNAMODB_TABLE || "cv_builder_comments";

export async function listComments(page: string): Promise<StoredComment[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "#page = :page",
      ExpressionAttributeNames: { "#page": "page" },
      ExpressionAttributeValues: { ":page": page },
      ScanIndexForward: false,
    })
  );

  const items = result.Items || [];
  return items as StoredComment[];
}

export async function addComment(
  input: Omit<StoredComment, "id" | "createdAt">
) {
  const now = new Date().toISOString();
  const row: StoredComment = {
    ...input,
    id: `${input.page}#${Date.now()}`,
    createdAt: now,
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: row,
    })
  );

  return row;
}
