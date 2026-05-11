import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { v4 as uuidv4 } from "uuid";

const mockDynamoSend: any = jest.fn();
const mockEventBridgeSend: any = jest.fn();

jest.mock("@aws-sdk/lib-dynamodb", () => {
    const originalModule = jest.requireActual("@aws-sdk/lib-dynamodb") as object;
    return {
        ...originalModule,
        DynamoDBDocumentClient: {
            from: jest.fn().mockReturnValue({
                send: mockDynamoSend,
            }),
        },
        PutCommand: jest.fn(),
        GetCommand: jest.fn(),
    };
});

jest.mock("@aws-sdk/client-eventbridge", () => {
    return {
        EventBridgeClient: jest.fn().mockImplementation(() => ({
            send: mockEventBridgeSend,
        })),
        PutEventsCommand: jest.fn(),
    };
});

jest.mock("uuid", () => ({
    v4: jest.fn(),
}));

import { createBooking, getBookingById } from "../../../services/booking-service/src/handler";

describe("Booking Service Handler Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { });
        process.env.BOOKINGS_TABLE = "test-bookings-table";
        process.env.EVENT_BUS_NAME = "test-event-bus";
        (uuidv4 as any).mockReturnValue("test-uuid-1234");
    });

    describe("createBooking", () => {
        it("should return 401 if user is not authenticated", async () => {
            const event = {
                requestContext: {},
            } as unknown as APIGatewayProxyEventV2;

            const response = await createBooking(event) as any;

            expect(response.statusCode).toBe(401);
            expect(JSON.parse(response.body)).toEqual({
                error: { code: "UNAUTHORIZED", message: "User not authenticated" },
            });
        });

        it("should return 400 if validation fails", async () => {
            const event = {
                requestContext: {
                    authorizer: {
                        claims: { sub: "user-123" },
                    },
                },
                body: JSON.stringify({
                    listingId: "",
                    checkIn: "2023-01-01",
                    checkOut: "2023-01-05",
                    guests: 2,
                    totalAmount: 100,
                }),
            } as unknown as APIGatewayProxyEventV2;

            const response = await createBooking(event) as any;

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toEqual({
                error: { code: "VALIDATION_ERROR", message: "Invalid booking input" },
            });
        });

        it("should create a booking successfully", async () => {
            const event = {
                requestContext: {
                    authorizer: {
                        claims: { sub: "user-123" },
                    },
                },
                body: JSON.stringify({
                    listingId: "listing-456",
                    checkIn: "2023-01-01",
                    checkOut: "2023-01-05",
                    guests: 2,
                    totalAmount: 100,
                }),
            } as unknown as APIGatewayProxyEventV2;

            mockDynamoSend.mockResolvedValueOnce({});
            mockEventBridgeSend.mockResolvedValueOnce({});

            const mockDate = new Date("2023-01-01T00:00:00.000Z");
            const spy = jest.spyOn(global, "Date").mockImplementation(() => mockDate as any);

            const response = await createBooking(event) as any;

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body.booking).toEqual({
                bookingId: "test-uuid-1234",
                listingId: "listing-456",
                guestId: "user-123",
                checkIn: "2023-01-01",
                checkOut: "2023-01-05",
                guests: 2,
                totalAmount: 100,
                status: "pending",
                createdAt: "2023-01-01T00:00:00.000Z",
            });

            expect(mockDynamoSend).toHaveBeenCalledTimes(1);
            expect(mockEventBridgeSend).toHaveBeenCalledTimes(1);

            spy.mockRestore();
        });

        it("should return 500 if DynamoDB fails", async () => {
            const event = {
                requestContext: {
                    authorizer: {
                        claims: { sub: "user-123" },
                    },
                },
                body: JSON.stringify({
                    listingId: "listing-456",
                    checkIn: "2023-01-01",
                    checkOut: "2023-01-05",
                    guests: 2,
                    totalAmount: 100,
                }),
            } as unknown as APIGatewayProxyEventV2;

            mockDynamoSend.mockRejectedValueOnce(new Error("DynamoDB error"));

            const response = await createBooking(event) as any;

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body)).toEqual({
                error: { code: "INTERNAL_ERROR", message: "Unexpected error creating booking" },
            });
        });
    });

    describe("getBookingById", () => {
        it("should return 400 if bookingId is missing", async () => {
            const event = {
                pathParameters: {},
                requestContext: {
                    authorizer: {
                        claims: { sub: "user-123" },
                    },
                },
            } as unknown as APIGatewayProxyEventV2;

            const response = await getBookingById(event) as any;

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toEqual({
                error: { code: "VALIDATION_ERROR", message: "bookingId is required" },
            });
        });

        it("should return 401 if user is not authenticated", async () => {
            const event = {
                pathParameters: { bookingId: "existing-id" },
                requestContext: {},
            } as unknown as APIGatewayProxyEventV2;

            const response = await getBookingById(event) as any;

            expect(response.statusCode).toBe(401);
            expect(JSON.parse(response.body)).toEqual({
                error: { code: "UNAUTHORIZED", message: "User not authenticated" },
            });
        });

        it("should return 404 if booking is not found", async () => {
            const event = {
                pathParameters: { bookingId: "non-existent-id" },
                requestContext: {
                    authorizer: {
                        claims: { sub: "user-123" },
                    },
                },
            } as unknown as APIGatewayProxyEventV2;

            mockDynamoSend.mockResolvedValueOnce({ Item: undefined });

            const response = await getBookingById(event) as any;

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.body)).toEqual({
                error: { code: "NOT_FOUND", message: "Booking not found" },
            });
        });

        it("should return 403 if user is not allowed to access the booking", async () => {
            const event = {
                pathParameters: { bookingId: "existing-id" },
                requestContext: {
                    authorizer: {
                        claims: { sub: "user-456" }, // Different user
                    },
                },
            } as unknown as APIGatewayProxyEventV2;

            const mockBooking = {
                bookingId: "existing-id",
                listingId: "listing-456",
                guestId: "user-123", // Booking belongs to user-123
                status: "pending",
            };

            mockDynamoSend.mockResolvedValueOnce({ Item: mockBooking });

            const response = await getBookingById(event) as any;

            expect(response.statusCode).toBe(403);
            expect(JSON.parse(response.body)).toEqual({
                error: { code: "FORBIDDEN", message: "You are not allowed to access this booking" },
            });
        });

        it("should return 200 and the booking if found and authorized", async () => {
            const event = {
                pathParameters: { bookingId: "existing-id" },
                requestContext: {
                    authorizer: {
                        claims: { sub: "user-123" },
                    },
                },
            } as unknown as APIGatewayProxyEventV2;

            const mockBooking = {
                bookingId: "existing-id",
                listingId: "listing-456",
                guestId: "user-123",
                status: "pending",
            };

            mockDynamoSend.mockResolvedValueOnce({ Item: mockBooking });

            const response = await getBookingById(event) as any;

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toEqual({
                booking: mockBooking,
            });
        });

        it("should return 500 if DynamoDB fails", async () => {
            const event = {
                pathParameters: { bookingId: "existing-id" },
                requestContext: {
                    authorizer: {
                        claims: { sub: "user-123" },
                    },
                },
            } as unknown as APIGatewayProxyEventV2;

            mockDynamoSend.mockRejectedValueOnce(new Error("DynamoDB error"));

            const response = await getBookingById(event) as any;

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body)).toEqual({
                error: { code: "INTERNAL_ERROR", message: "Unexpected error getting booking" },
            });
        });
    });
});