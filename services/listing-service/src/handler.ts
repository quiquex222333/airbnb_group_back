import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { v4 as uuidv4 } from "uuid";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const eventBridge = new EventBridgeClient({});

export const createListing = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const claims = (event.requestContext as any)?.authorizer?.claims;
    const ownerId = claims?.sub;

    if (!ownerId) {
      return response(401, {
        error: { code: "UNAUTHORIZED", message: "User not authenticated" }
      });
    }

    const body = event.body ? JSON.parse(event.body) : {};

    const title = String(body.title ?? "").trim();
    const price = Number(body.price ?? 0);

    if (!title || price <= 0) {
      return response(400, {
        error: { code: "VALIDATION_ERROR", message: "Invalid input" }
      });
    }

    const listing = {
      listingId: uuidv4(),
      ownerId,
      title,
      price,
      status: "draft",
      createdAt: new Date().toISOString()
    };

    await dynamo.send(
      new PutCommand({
        TableName: process.env.LISTINGS_TABLE,
        Item: listing
      })
    );

    await eventBridge.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: "listing.service",
            DetailType: "listing.created",
            EventBusName: process.env.EVENT_BUS_NAME,
            Detail: JSON.stringify(listing)
          }
        ]
      })
    );

    return response(201, { listing });
  } catch (error) {
    console.error(error);
    return response(500, {
      error: { code: "INTERNAL_ERROR", message: "Unexpected error" }
    });
  }
};

function response(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}
