import {
  CognitoIdentityProviderClient, 
  SignUpCommand, 
  ConfirmSignUpCommand,
  InitiateAuthCommand, 
  GlobalSignOutCommand,
  GetUserCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { IAuthService } from '../../domain/interfaces/IAuthService';
import { User, UserRole } from '../../domain/entities/User';
import { Session, RefreshSessionResult } from '../../domain/entities/Session';
import { env } from '../../config/env';

export class CognitoAuthProvider implements IAuthService {
  private client: CognitoIdentityProviderClient;

  constructor() {
    this.client = new CognitoIdentityProviderClient({ region: env.AWS_REGION });
  }

  async register(name: string, email: string, password: string, role: UserRole): Promise<User> {
    const command = new SignUpCommand({
      ClientId: env.COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name },
        { Name: 'custom:role', Value: role }, // Ensure Custom attribute logic
      ],
    });

    try {
      const response = await this.client.send(command);
      return {
        id: response.UserSub || '',
        email,
        name,
        role,
        status: 'UNCONFIRMED', 
      };
    } catch (error: any) {
      if (error.name === 'UsernameExistsException') throw new Error('EMAIL_ALREADY_EXISTS');
      if (error.name === 'InvalidPasswordException') throw new Error('INVALID_PASSWORD_POLICY');
      throw error;
    }
  }

  async confirmRegistration(email: string, code: string): Promise<void> {
    const command = new ConfirmSignUpCommand({
      ClientId: env.COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    });

    try {
      await this.client.send(command);
    } catch (error: any) {
      if (error.name === 'CodeMismatchException') throw new Error('INVALID_CODE');
      if (error.name === 'ExpiredCodeException') throw new Error('EXPIRED_CODE');
      throw error;
    }
  }

  async login(email: string, password: string): Promise<Session> {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    try {
      const response = await this.client.send(command);
      
      if (!response.AuthenticationResult) {
        throw new Error('AUTH_FAILED');
      }

      // Normally we decode JWT or fetch robust user profile, here we assume getting it natively
      // Note: Decoding the IdToken is usually better, but for purity we fetch from Cognito API.
      const userCommand = new GetUserCommand({
        AccessToken: response.AuthenticationResult.AccessToken
      });
      const userRes = await this.client.send(userCommand);
      
      const roleAttr = userRes.UserAttributes?.find(attr => attr.Name === 'custom:role')?.Value;
      const nameAttr = userRes.UserAttributes?.find(attr => attr.Name === 'name')?.Value;

      return {
        accessToken: response.AuthenticationResult.AccessToken!,
        refreshToken: response.AuthenticationResult.RefreshToken,
        expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
        user: {
          id: userRes.Username || '',
          email: email,
          name: nameAttr || '',
          role: (roleAttr as UserRole) || UserRole.GUEST,
        }
      };
    } catch (error: any) {
      if (error.name === 'NotAuthorizedException') throw new Error('INVALID_CREDENTIALS');
      if (error.name === 'UserNotFoundException') throw new Error('USER_NOT_FOUND');
      if (error.name === 'UserNotConfirmedException') throw new Error('USER_DISABLED');
      throw error;
    }
  }

  async refreshSession(refreshToken: string): Promise<RefreshSessionResult> {
    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: env.COGNITO_CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    try {
      const response = await this.client.send(command);
      if (!response.AuthenticationResult) throw new Error('REFRESH_FAILED');

      const userCommand = new GetUserCommand({
        AccessToken: response.AuthenticationResult.AccessToken
      });
      const userRes = await this.client.send(userCommand);
      
      const roleAttr = userRes.UserAttributes?.find(attr => attr.Name === 'custom:role')?.Value;
      const nameAttr = userRes.UserAttributes?.find(attr => attr.Name === 'name')?.Value;
      const emailAttr = userRes.UserAttributes?.find(attr => attr.Name === 'email')?.Value;

      return {
        accessToken: response.AuthenticationResult.AccessToken!,
        expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
        newRefreshToken: response.AuthenticationResult.RefreshToken,
        user: {
          id: userRes.Username || '',
          email: emailAttr || '',
          name: nameAttr || '',
          role: (roleAttr as UserRole) || UserRole.GUEST,
        }
      };
    } catch (error: any) {
      throw new Error('TOKEN_EXPIRED');
    }
  }

  async logout(accessToken: string): Promise<void> {
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken
    });
    try {
      await this.client.send(command);
    } catch (e) {
      // Si el log out falla porque el token expiró, no es critico, porque igual lo borramos locales
      console.error('Logout error on cloud', e); 
    }
  }

  async getUserProfile(accessToken: string): Promise<User> {
    const userCommand = new GetUserCommand({ AccessToken: accessToken });
    try {
      const userRes = await this.client.send(userCommand);
      const roleAttr = userRes.UserAttributes?.find(attr => attr.Name === 'custom:role')?.Value;
      const nameAttr = userRes.UserAttributes?.find(attr => attr.Name === 'name')?.Value;
      const emailAttr = userRes.UserAttributes?.find(attr => attr.Name === 'email')?.Value;

      return {
        id: userRes.Username || '',
        email: emailAttr || '',
        name: nameAttr || '',
        role: (roleAttr as UserRole) || UserRole.GUEST,
      };
    } catch (e) {
      throw new Error('TOKEN_INVALID');
    }
  }
}
