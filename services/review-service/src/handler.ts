import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { v4 as uuidv4 } from "uuid";
import {
  CreateReviewInput,
  CreateReviewOutput,
  Review,
  GetReviewsByListingOutput
} from "@airbnb-clone/contracts";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const eventBridge = new EventBridgeClient({});

export const createReview = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const claims = (event.requestContext as any)?.authorizer?.claims;
    const userId = claims?.sub;

    if (!userId) {
      return response(401, { message: "Unauthorized" });
    }

    const body: CreateReviewInput = event.body
      ? JSON.parse(event.body)
      : ({} as CreateReviewInput);

    const listingId = String(body.listingId ?? "").trim();
    const rating = Number(body.rating ?? 0);
    const comment = String(body.comment ?? "").trim();

    if (!listingId || rating < 1 || rating > 5 || !comment) {
      return response(400, {
        error: { code: "VALIDATION_ERROR", message: "Invalid review input" }
      });
    }

    const review: Review = {
      reviewId: uuidv4(),
      listingId,
      userId,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    await dynamo.send(
      new PutCommand({
        TableName: process.env.REVIEWS_TABLE,
        Item: review
      })
    );

    await eventBridge.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: "review.service",
            DetailType: "review.created",
            EventBusName: process.env.EVENT_BUS_NAME,
            Detail: JSON.stringify(review)
          }
        ]
      })
    );

    const output: CreateReviewOutput = { review };

    return response(201, output);
  } catch (error) {
    console.error(error);
    return response(500, { message: "Internal error" });
  }
};

export const getReviewsByListing = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const listingId = event.pathParameters?.listingId;

    if (!listingId) {
      return response(400, { message: "listingId required" });
    }

    const result = await dynamo.send(
      new QueryCommand({
        TableName: process.env.REVIEWS_TABLE,
        IndexName: "listingId-index",
        KeyConditionExpression: "listingId = :l",
        ExpressionAttributeValues: {
          ":l": listingId
        }
      })
    );

    const output: GetReviewsByListingOutput = {
      reviews: (result.Items ?? []) as Review[]
    };

    return response(200, output);
  } catch (error) {
    console.error(error);
    return response(500, { message: "Internal error" });
  }
};

function response(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}
