import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockDynamoSend: any = jest.fn();

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
  };
});

import { handleUserCreated } from "../../../services/notification-service/src/handler";

describe("Notification Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NOTIFICATIONS_TABLE = "test-notifications-table"; 
    mockDynamoSend.mockResolvedValueOnce({});                      
  });

  it("should process user.created event", async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            userId: "123",
            email: "test@test.com",
            fullName: "Test User",
            createdAt: "2026-01-01"
          })
        }
      ]
    } as any;

    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });

    await handleUserCreated(event);

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});