import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { v4 as uuidv4 } from "uuid";
import {
  CreateListingInput,
  CreateListingOutput,
  Listing
} from "@airbnb-clone/contracts";


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

    const body: CreateListingInput = event.body
      ? JSON.parse(event.body)
      : ({} as CreateListingInput);

    const title = String(body.title ?? "").trim();
    const price = Number(body.price ?? 0);

    if (!title || price <= 0) {
      return response(400, {
        error: { code: "VALIDATION_ERROR", message: "Invalid input" }
      });
    }

    const listing: Listing = {
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

    return response(201, { listing } as CreateListingOutput);
  } catch (error) {
    console.error(error);
    return response(500, {
      error: { code: "INTERNAL_ERROR", message: "Unexpected error" }
    });
  }
};

// NUEVO
export const getListingsByOwner = async (
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

    const result = await dynamo.send(
      new QueryCommand({
        TableName: process.env.LISTINGS_TABLE,
        IndexName: "ownerId-index",
        KeyConditionExpression: "ownerId = :o",
        ExpressionAttributeValues: { ":o": ownerId }
      })
    );

    return response(200, { listings: (result.Items ?? []) as Listing[] });
  } catch (error) {
    console.error(error);
    return response(500, {
      error: { code: "INTERNAL_ERROR", message: "Unexpected error" }
    });
  }
};

export const getAllListings = async (
  _event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const result = await dynamo.send(
      new ScanCommand({
        TableName: process.env.LISTINGS_TABLE
      })
    );
    return response(200, { listings: (result.Items ?? []) as Listing[] });
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
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": process.env.FRONTEND_URL!,
      "Access-Control-Allow-Credentials": "true"
    },
    body: JSON.stringify(body)
  };
}