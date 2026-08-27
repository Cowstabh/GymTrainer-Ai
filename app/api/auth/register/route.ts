import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { dynamoDbClient } from "@/lib/dynamodb";
import { PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";

export async function POST(request: Request) {
  try {
    const { username, password, email } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    // Check if user exists
    const getParams = {
      TableName: process.env.DYNAMODB_TABLE_USERS || "Users",
      Key: {
        username: { S: username },
      },
    };
    const checkCommand = new GetItemCommand(getParams);
    const existingUser = await dynamoDbClient.send(checkCommand);

    if (existingUser.Item) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const putParams = {
      TableName: process.env.DYNAMODB_TABLE_USERS || "Users",
      Item: {
        username: { S: username },
        password: { S: hashedPassword },
        ...(email && { email: { S: email } }),
        createdAt: { S: new Date().toISOString() },
      },
    };

    const putCommand = new PutItemCommand(putParams);
    await dynamoDbClient.send(putCommand);

    return NextResponse.json({ success: true, message: "User registered successfully" }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
  }
}
