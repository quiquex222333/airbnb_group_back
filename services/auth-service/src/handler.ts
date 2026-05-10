import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  GetUserCommand
} from "@aws-sdk/client-cognito-identity-provider";

import {
  AdminGetUserCommand
} from "@aws-sdk/client-cognito-identity-provider";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { randomUUID } from "crypto";

import {
  RegisterUserInput,
  RegisterUserOutput,
  ConfirmUserInput,
  ConfirmUserOutput,
  LoginUserInput,
  LoginUserOutput
} from "@airbnb-clone/contracts";

const cognito = new CognitoIdentityProviderClient({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const eventBridge = new EventBridgeClient({});

export const register = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userPoolClientId = process.env.USER_POOL_CLIENT_ID ?? "";

    if (!userPoolClientId) {
      return response(500, {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "USER_POOL_CLIENT_ID is missing"
        }
      });
    }

    const body: RegisterUserInput = event.body
      ? JSON.parse(event.body)
      : ({} as RegisterUserInput);

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.fullName ?? "").trim();

    if (!email || !isValidEmail(email)) {
      return response(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "A valid email is required"
        }
      });
    }

    if (!password || password.length < 8) {
      return response(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "Password must have at least 8 characters"
        }
      });
    }

    if (!fullName || fullName.length < 2) {
      return response(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "fullName is required"
        }
      });
    }

    const result = await cognito.send(
      new SignUpCommand({
        ClientId: userPoolClientId,
        Username: email,
        Password: password,
        UserAttributes: [
          {
            Name: "email",
            Value: email
          },
          {
            Name: "name",
            Value: fullName
          },
          {
            Name: "custom:role",
            Value: String(body.role ?? "guest")
          }
        ]
      })
    );

    const output: RegisterUserOutput = {
      message: "User registered. Please confirm the account with the verification code.",
      userSub: result.UserSub
    };

    return response(201, output);
  } catch (error: any) {
    console.error("RegisterError", sanitizeError(error));

    if (error?.name === "UsernameExistsException") {
      return response(409, {
        error: {
          code: "USER_ALREADY_EXISTS",
          message: "User already exists"
        }
      });
    }

    if (error?.name === "InvalidPasswordException") {
      return response(400, {
        error: {
          code: "INVALID_PASSWORD",
          message: error.message
        }
      });
    }

    return response(500, {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error registering user"
      }
    });
  }
};

export const confirm = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userPoolClientId = process.env.USER_POOL_CLIENT_ID ?? "";
    const userPoolId = process.env.USER_POOL_ID ?? "";
    const usersTable = process.env.USERS_TABLE ?? "";
    const eventBusName = process.env.EVENT_BUS_NAME ?? "";

    if (!userPoolClientId || !userPoolId || !usersTable || !eventBusName) {
      return response(500, {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "Missing required Auth Service environment variables"
        }
      });
    }

    const body: ConfirmUserInput = event.body
      ? JSON.parse(event.body)
      : ({} as ConfirmUserInput);

    const email = String(body.email ?? "").trim().toLowerCase();
    const confirmationCode = String(body.confirmationCode ?? "").trim();

    if (!email || !confirmationCode) {
      return response(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "email and confirmationCode are required"
        }
      });
    }

    await cognito.send(
      new ConfirmSignUpCommand({
        ClientId: userPoolClientId,
        Username: email,
        ConfirmationCode: confirmationCode
      })
    );

    const cognitoUser = await cognito.send(
      new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: email
      })
    );

    const fullName =
      cognitoUser.UserAttributes?.find((attr) => attr.Name === "name")?.Value ??
      email;

    const role =
      cognitoUser.UserAttributes?.find((attr) => attr.Name === "custom:role")?.Value ??
      "guest";

    const user = {
      email,
      userId: randomUUID(),
      cognitoSub:
        cognitoUser.UserAttributes?.find((attr) => attr.Name === "sub")?.Value ??
        cognitoUser.Username ??
        email,
      fullName,
      role,
      createdAt: new Date().toISOString()
    };

    await dynamo.send(
      new PutCommand({
        TableName: usersTable,
        Item: user,
        ConditionExpression: "attribute_not_exists(email)"
      })
    );

    await eventBridge.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: "auth.service",
            DetailType: "user.created",
            EventBusName: eventBusName,
            Detail: JSON.stringify({
              userId: user.userId,
              cognitoSub: user.cognitoSub,
              email: user.email,
              fullName: user.fullName,
              createdAt: user.createdAt
            })
          }
        ]
      })
    );

    const output: ConfirmUserOutput = {
      message: "User confirmed and internal profile created successfully"
    };

    return response(200, output);
  } catch (error: any) {
    console.error("ConfirmError", sanitizeError(error));

    if (error?.name === "CodeMismatchException") {
      return response(400, {
        error: {
          code: "INVALID_CONFIRMATION_CODE",
          message: "Invalid confirmation code"
        }
      });
    }

    if (error?.name === "ExpiredCodeException") {
      return response(400, {
        error: {
          code: "EXPIRED_CONFIRMATION_CODE",
          message: "Confirmation code has expired"
        }
      });
    }

    if (error?.name === "UserNotFoundException") {
      return response(404, {
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      });
    }

    if (error?.name === "ConditionalCheckFailedException") {
      return response(409, {
        error: {
          code: "USER_PROFILE_ALREADY_EXISTS",
          message: "Internal user profile already exists"
        }
      });
    }

    return response(500, {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error confirming user"
      }
    });
  }
};

export const login = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userPoolClientId = process.env.USER_POOL_CLIENT_ID ?? "";

    if (!userPoolClientId) {
      return response(500, {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "USER_POOL_CLIENT_ID is missing"
        }
      });
    }

    const body: LoginUserInput = event.body
      ? JSON.parse(event.body)
      : ({} as LoginUserInput);

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return response(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "email and password are required"
        }
      });
    }

    const result = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: userPoolClientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password
        }
      })
    );

    const refreshToken = result.AuthenticationResult?.RefreshToken;
    
    const usersTable = process.env.USERS_TABLE ?? "";
    let user = null;

    if (usersTable) {
      const userResult = await dynamo.send(
        new GetCommand({
          TableName: usersTable,
          Key: { email }
        })
      );
      user = userResult.Item;
    }

    const output: LoginUserOutput = {
      tokenType: result.AuthenticationResult?.TokenType,
      idToken: result.AuthenticationResult?.IdToken,
      accessToken: result.AuthenticationResult?.AccessToken,
      refreshToken: refreshToken,
      expiresIn: result.AuthenticationResult?.ExpiresIn,
      user: user as any
    };

    const headers: Record<string, string> = {};
    if (refreshToken) {
      // Establecemos la cookie para el frontend. 
      // Nota: SameSite=None y Secure son obligatorios para cross-site en la mayoría de navegadores.
      headers["Set-Cookie"] = `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=2592000`;
    }

    return response(200, output, headers);
  } catch (error: any) {
    console.error("LoginError", sanitizeError(error));

    if (error?.name === "NotAuthorizedException") {
      return response(401, {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password"
        }
      });
    }

    if (error?.name === "UserNotConfirmedException") {
      return response(403, {
        error: {
          code: "USER_NOT_CONFIRMED",
          message: "User is not confirmed"
        }
      });
    }

    if (error?.name === "UserNotFoundException") {
      return response(404, {
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      });
    }

    return response(500, {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error logging in"
      }
    });
  }
};

export const refresh = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userPoolClientId = process.env.USER_POOL_CLIENT_ID ?? "";

    if (!userPoolClientId) {
      return response(500, {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "USER_POOL_CLIENT_ID is missing"
        }
      });
    }

    // Extraer Refresh Token de la cookie
    const cookieHeader = (event.headers as any)?.Cookie || (event.headers as any)?.cookie || "";
    const refreshToken = getCookie("refreshToken", cookieHeader);

    if (!refreshToken) {
      return response(401, {
        error: {
          code: "MISSING_REFRESH_TOKEN",
          message: "Refresh token is missing from cookies"
        }
      });
    }

    const result = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: userPoolClientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken
        }
      })
    );

    const newAccessToken = result.AuthenticationResult?.AccessToken;
    const idToken = result.AuthenticationResult?.IdToken;
    const expiresIn = result.AuthenticationResult?.ExpiresIn;

    const usersTable = process.env.USERS_TABLE ?? "";
    let user = null;

    if (newAccessToken && usersTable) {
      try {
        // Obtenemos el email del usuario usando el nuevo token de acceso
        const cognitoUser = await cognito.send(
          new GetUserCommand({ AccessToken: newAccessToken })
        );
        
        const email = cognitoUser.UserAttributes?.find(attr => attr.Name === "email")?.Value;

        if (email) {
          const userResult = await dynamo.send(
            new GetCommand({
              TableName: usersTable,
              Key: { email }
            })
          );
          user = userResult.Item;
        }
      } catch (e) {
        console.error("Error fetching user data during refresh", e);
      }
    }

    const output = {
      accessToken: newAccessToken,
      idToken: idToken,
      expiresIn: expiresIn,
      user: user as any
    };

    return response(200, output);
  } catch (error: any) {
    console.error("RefreshError", sanitizeError(error));

    if (error?.name === "NotAuthorizedException") {
      return response(401, {
        error: {
          code: "INVALID_REFRESH_TOKEN",
          message: "Refresh token is invalid or expired"
        }
      });
    }

    return response(500, {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error refreshing token"
      }
    });
  }
};

export const logout = async (): Promise<APIGatewayProxyResultV2> => {
  return response(
    200, 
    { message: "Logged out successfully" }, 
    {
      "Set-Cookie": "refreshToken=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
    }
  );
};

function response(
  statusCode: number, 
  body: unknown, 
  headers: Record<string, string> = {}
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": process.env.FRONTEND_URL!,
      "Access-Control-Allow-Credentials": "true",
      ...headers
    },
    body: JSON.stringify(body)
  };
}

function getCookie(name: string, cookieString: string): string | null {
  const match = cookieString.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function sanitizeError(error: any) {
  return {
    name: error?.name,
    message: error?.message
  };
}