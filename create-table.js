const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });

async function createTable() {
  const command = new CreateTableCommand({
    TableName: "KineticHistory",
    KeySchema: [
      { AttributeName: "userId", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  });

  try {
    const response = await client.send(command);
    console.log("Table created successfully:", response.TableDescription?.TableName);
  } catch (error) {
    if (error.name === "ResourceInUseException") {
      console.log("Table already exists.");
    } else {
      console.error("Error creating table:", error);
    }
  }
}

createTable();
