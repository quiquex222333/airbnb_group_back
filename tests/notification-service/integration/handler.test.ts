import { describe, it, expect } from '@jest/globals';
import { handleUserCreated } from "../../../services/notification-service/src/handler";

describe("Notification Service Handler Integration Tests", () => {
    it("should process user.created event without throwing errors", async () => {
        if (!process.env.NOTIFICATIONS_TABLE) {
            console.warn("Skipping integration test because NOTIFICATIONS_TABLE is not set");
            return;
        }

        const event = {
            Records: [
                {
                    body: JSON.stringify({
                        "detail-type": "user.created",
                        source: "user.service",
                        detail: {
                            userId: "integration-123",
                            email: "integration@test.com",
                            fullName: "Integration Test User",
                            createdAt: new Date().toISOString()
                        }
                    })
                }
            ]
        } as any;

        // We don't mock console.log here, we just verify the handler doesn't throw
        await expect(handleUserCreated(event)).resolves.not.toThrow();
    });
});
