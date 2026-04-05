import { User, UserRole } from '../entities/User';
import { Session, RefreshSessionResult } from '../entities/Session';

export interface IAuthService {
  register(name: string, email: string, password: string, role: UserRole): Promise<User>;
  confirmRegistration(email: string, code: string): Promise<void>;
  login(email: string, password: string): Promise<Session>;
  refreshSession(refreshToken: string): Promise<RefreshSessionResult>;
  logout(accessToken: string): Promise<void>;
  
  // Method to extract user profile from a valid token or Cognito service backend
  getUserProfile(accessToken: string): Promise<User>;
}
