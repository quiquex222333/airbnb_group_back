import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const USERS_TABLE = process.env.USERS_TABLE ?? "";

export async function createUser(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  try {
    if (!USERS_TABLE) {
      return response(500, {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "USERS_TABLE environment variable is missing"
        }
      });
    }

    const body = event.body ? JSON.parse(event.body) : {};

    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!fullName || fullName.length < 2) {
      return response(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "fullName is required and must have at least 2 characters"
        }
      });
    }

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return response(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "email is required and must be valid"
        }
      });
    }

    const now = new Date().toISOString();

    const user = {
      userId: uuidv4(),
      fullName,
      email,
      createdAt: now
    };

    await dynamoClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: user,
        ConditionExpression: "attribute_not_exists(email)"
      })
    );

    return response(201, { user });
  } catch (error: any) {
    if (error?.name === "ConditionalCheckFailedException") {
      return response(409, {
        error: {
          code: "CONFLICT_ERROR",
          message: "A user with this email already exists"
        }
      });
    }

    console.error("CreateUserError", error);

    return response(500, {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error creating user"
      }
    });
  }
}

function response(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}
