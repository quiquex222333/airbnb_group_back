import { createUser } from "./handler";

function asHttpResult(result: any) {
  return result as {
    statusCode: number;
    body: string;
  };
}

function createAuthenticatedEvent(body: unknown, email = "test@test.com") {
  return {
    body: JSON.stringify(body),
    requestContext: {
      authorizer: {
        claims: {
          email
        }
      }
    }
  } as any;
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
    const result = asHttpResult(await createUser(
      createAuthenticatedEvent({})
    ));

    expect(result.statusCode).toBe(400);
  });

  it("should return 401 when token email is missing", async () => {
    const result = asHttpResult(await createUser({
      body: JSON.stringify({
        fullName: "Juan Perez"
      }),
      requestContext: {
        authorizer: {
          claims: {}
        }
      }
    } as any));

    expect(result.statusCode).toBe(401);
  });

  it("should return 201 when user is valid", async () => {
    const result = asHttpResult(await createUser(
      createAuthenticatedEvent({
        fullName: "Juan Perez"
      }, "juan@test.com")
    ));

    expect(result.statusCode).toBe(201);

    const body = JSON.parse(result.body);

    expect(body.user.fullName).toBe("Juan Perez");
    expect(body.user.email).toBe("juan@test.com");
    expect(body.user.userId).toBeDefined();
    expect(body.user.createdAt).toBeDefined();
  });

  it("should return 400 when body is empty", async () => {
    const result = asHttpResult(await createUser(
      createAuthenticatedEvent({})
    ));

    expect(result.statusCode).toBe(400);
  });
});
