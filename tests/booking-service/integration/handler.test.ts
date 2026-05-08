import { describe, it, expect } from '@jest/globals';
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { createBooking, getBookingById } from "../../../services/booking-service/src/handler";

// These tests require real AWS credentials and environment variables to be set.
// BOOKINGS_TABLE and EVENT_BUS_NAME must point to real resources.

describe("Booking Service Handler Integration Tests", () => {
    let createdBookingId: string;

    it("should create a booking in the real DynamoDB table", async () => {
        // Skip if environment variables are not set
        if (!process.env.BOOKINGS_TABLE || !process.env.EVENT_BUS_NAME) {
            console.warn("Skipping integration test because BOOKINGS_TABLE or EVENT_BUS_NAME is not set");
            return;
        }

        const event = {
            requestContext: {
                authorizer: {
                    claims: { sub: "integration-test-user" },
                },
            },
            body: JSON.stringify({
                listingId: "integration-test-listing",
                checkIn: "2025-01-01",
                checkOut: "2025-01-05",
                guests: 2,
                totalAmount: 150,
            }),
        } as unknown as APIGatewayProxyEventV2;

        const response = await createBooking(event) as any;

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.booking).toBeDefined();
        expect(body.booking.bookingId).toBeDefined();
        expect(body.booking.status).toBe("pending");

        createdBookingId = body.booking.bookingId;
    });

    it("should retrieve the created booking from DynamoDB", async () => {
        if (!process.env.BOOKINGS_TABLE || !createdBookingId) {
            console.warn("Skipping integration test because BOOKINGS_TABLE is not set or booking was not created");
            return;
        }

        const event = {
            pathParameters: { bookingId: createdBookingId },
            requestContext: {
                authorizer: {
                    claims: { sub: "integration-test-user" },
                },
            },
        } as unknown as APIGatewayProxyEventV2;

        const response = await getBookingById(event) as any;

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.booking).toBeDefined();
        expect(body.booking.bookingId).toBe(createdBookingId);
        expect(body.booking.listingId).toBe("integration-test-listing");
    });
});
