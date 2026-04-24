import { CreateUserInput, CreateUserOutput } from "@airbnb-clone/contracts";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function createUser(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const usersTable = process.env.USERS_TABLE ?? "";
  const claims = (event.requestContext as any)?.authorizer?.claims;
  const userEmailFromToken = claims?.email;
  try {
    if (!userEmailFromToken) {
      return response(401, {
        error: {
          code: "UNAUTHORIZED",
          message: "User identity not found in token"
        }
      });
    }

    if (!usersTable) {
      return response(500, {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "USERS_TABLE environment variable is missing"
        }
      });
    }

    const body: CreateUserInput = event.body
      ? JSON.parse(event.body)
      : ({} as CreateUserInput);

    const fullName = String(body.fullName ?? "").trim();
    const email = userEmailFromToken.toLowerCase();

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
      email,
      userId: uuidv4(),
      fullName,
      createdAt: now
    };

    await dynamoClient.send(
      new PutCommand({
        TableName: usersTable,
        Item: user,
        ConditionExpression: "attribute_not_exists(email)"
      })
    );

    const output: CreateUserOutput = {
      user
    };

    return response(201, output);
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
