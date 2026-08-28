import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const globalForDynamoDB = global as unknown as { dynamoDbClient: DynamoDBClient };

export const dynamoDbClient =
  globalForDynamoDB.dynamoDbClient ||
  new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "dummy",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "dummy",
    },
  });

if (process.env.NODE_ENV !== "production") globalForDynamoDB.dynamoDbClient = dynamoDbClient;

export const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

// Access patterns
export async function getWorkoutPlan(userId: string) {
  const command = new GetCommand({
    TableName: "WorkoutPlans",
    Key: { userId },
  });
  const response = await docClient.send(command);
  return response.Item;
}

export async function saveWorkoutPlan(userId: string, plan: any) {
  const command = new PutCommand({
    TableName: "WorkoutPlans",
    Item: {
      userId,
      plan,
      updatedAt: new Date().toISOString(),
    },
  });
  return await docClient.send(command);
}

export async function getSessionFeedback(userId: string) {
  const command = new QueryCommand({
    TableName: "SessionFeedback",
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  });
  const response = await docClient.send(command);
  return response.Items;
}

export async function getKineticHistory(userId: string) {
  const command = new GetCommand({
    TableName: "KineticHistory",
    Key: { userId },
  });
  const response = await docClient.send(command);
  return response.Item;
}

export async function saveKineticHistory(userId: string, history: any) {
  const command = new PutCommand({
    TableName: "KineticHistory",
    Item: {
      userId,
      history,
      updatedAt: new Date().toISOString(),
    },
  });
  return await docClient.send(command);
}

export async function getUserProfile(userId: string) {
  const command = new GetCommand({
    TableName: "UserProfiles",
    Key: { userId },
  });
  const response = await docClient.send(command);
  return response.Item;
}

export async function saveUserProfile(userId: string, bioData: any) {
  const command = new PutCommand({
    TableName: "UserProfiles",
    Item: {
      userId,
      bioData,
      updatedAt: new Date().toISOString(),
    },
  });
  return await docClient.send(command);
}
