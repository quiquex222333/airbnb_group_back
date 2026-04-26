import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { v4 as uuidv4 } from "uuid";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const eventBridge = new EventBridgeClient({});

export const createBooking = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const claims = (event.requestContext as any)?.authorizer?.claims;
    const guestId = claims?.sub;

    if (!guestId) {
      return response(401, {
        error: { code: "UNAUTHORIZED", message: "User not authenticated" }
      });
    }

    const body = event.body ? JSON.parse(event.body) : {};

    const listingId = String(body.listingId ?? "").trim();
    const checkIn = String(body.checkIn ?? "").trim();
    const checkOut = String(body.checkOut ?? "").trim();
    const guests = Number(body.guests ?? 0);
    const totalAmount = Number(body.totalAmount ?? 0);

    if (!listingId || !checkIn || !checkOut || guests <= 0 || totalAmount <= 0) {
      return response(400, {
        error: { code: "VALIDATION_ERROR", message: "Invalid booking input" }
      });
    }

    const booking = {
      bookingId: uuidv4(),
      listingId,
      guestId,
      checkIn,
      checkOut,
      guests,
      totalAmount,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    await dynamo.send(
      new PutCommand({
        TableName: process.env.BOOKINGS_TABLE,
        Item: booking,
        ConditionExpression: "attribute_not_exists(bookingId)"
      })
    );

    await eventBridge.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: "booking.service",
            DetailType: "booking.created",
            EventBusName: process.env.EVENT_BUS_NAME,
            Detail: JSON.stringify(booking)
          }
        ]
      })
    );

    return response(201, { booking });
  } catch (error) {
    console.error("CreateBookingError", error);

    return response(500, {
      error: { code: "INTERNAL_ERROR", message: "Unexpected error creating booking" }
    });
  }
};

export const getBookingById = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const bookingId = event.pathParameters?.bookingId;

    if (!bookingId) {
      return response(400, {
        error: { code: "VALIDATION_ERROR", message: "bookingId is required" }
      });
    }

    const result = await dynamo.send(
      new GetCommand({
        TableName: process.env.BOOKINGS_TABLE,
        Key: { bookingId }
      })
    );

    if (!result.Item) {
      return response(404, {
        error: { code: "NOT_FOUND", message: "Booking not found" }
      });
    }

    return response(200, { booking: result.Item });
  } catch (error) {
    console.error("GetBookingError", error);

    return response(500, {
      error: { code: "INTERNAL_ERROR", message: "Unexpected error getting booking" }
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
