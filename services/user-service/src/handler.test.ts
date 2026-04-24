import { createUser } from "./handler";

function asHttpResult(result: any) {
  return result as {
    statusCode: number;
    body: string;
  };
}

jest.mock("@aws-sdk/lib-dynamodb", () => {
  return {
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: jest.fn(async () => ({}))
      }))
    },
    PutCommand: jest.fn()
  };
});

describe("User Service - createUser", () => {
  beforeEach(() => {
    process.env.USERS_TABLE = "UsersTableTest";
  });

  it("should return 400 when fullName is missing", async () => {
    const result = asHttpResult(await createUser({
      body: JSON.stringify({
        email: "test@email.com"
      })
    } as any));

    expect(result.statusCode).toBe(400);
  });

  it("should return 400 when email is invalid", async () => {
    const result = asHttpResult(await createUser({
      body: JSON.stringify({
        fullName: "Juan Perez",
        email: "invalid-email"
      })
    } as any));

    expect(result.statusCode).toBe(400);
  });

  it("should return 201 when user is valid", async () => {
    const result = asHttpResult(await createUser({
      body: JSON.stringify({
        fullName: "Juan Perez",
        email: "juan@test.com"
      })
    } as any));

    expect(result.statusCode).toBe(201);

    const body = JSON.parse(result.body as string);

    expect(body.user.fullName).toBe("Juan Perez");
    expect(body.user.email).toBe("juan@test.com");
    expect(body.user.userId).toBeDefined();
    expect(body.user.createdAt).toBeDefined();
  });
});
