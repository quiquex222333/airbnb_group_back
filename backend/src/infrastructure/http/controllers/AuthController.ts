import { Request, Response } from 'express';
import { RegisterUseCase } from '../../../application/use-cases/auth/RegisterUseCase';
import { ConfirmRegisterUseCase } from '../../../application/use-cases/auth/ConfirmRegisterUseCase';
import { LoginUseCase } from '../../../application/use-cases/auth/LoginUseCase';
import { RefreshSessionUseCase } from '../../../application/use-cases/auth/RefreshSessionUseCase';
import { LogoutUseCase } from '../../../application/use-cases/auth/LogoutUseCase';

export class AuthController {
  constructor(
    private registerUseCase: RegisterUseCase,
    private confirmRegisterUseCase: ConfirmRegisterUseCase,
    private loginUseCase: LoginUseCase,
    private refreshSessionUseCase: RefreshSessionUseCase,
    private logoutUseCase: LogoutUseCase
  ) {}

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;
      const user = await this.registerUseCase.execute({ name, email, password, role });
      
      res.status(201).json({
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status
      });
    } catch (error: any) {
      if (error.message === 'EMAIL_ALREADY_EXISTS') res.status(409).json({ error: { code: 'EMAIL_ALREADY_EXISTS', message: 'Email in use' }});
      else if (error.message === 'INVALID_PASSWORD_POLICY') res.status(422).json({ error: { code: 'INVALID_PASSWORD_POLICY', message: 'Weak password' }});
      else res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message }});
    }
  }

  public async confirm(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;
      await this.confirmRegisterUseCase.execute({ email, code });
      res.status(200).json({ message: 'Account confirmed successfully' });
    } catch (error: any) {
      if (error.message === 'INVALID_CODE') res.status(400).json({ error: { code: 'INVALID_CODE', message: 'Incorrect confirmation code' }});
      else if (error.message === 'EXPIRED_CODE') res.status(400).json({ error: { code: 'EXPIRED_CODE', message: 'Code expired' }});
      else res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message }});
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const session = await this.loginUseCase.execute({ email, password });

      // BFF Magic: The refresh token goes to an HTTPOnly cookie
      if (session.refreshToken) {
        res.cookie('refreshToken', session.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
      }

      res.status(200).json({
        accessToken: session.accessToken,
        expiresIn: session.expiresIn,
        user: session.user
      });
    } catch (error: any) {
      if (error.message === 'INVALID_CREDENTIALS') res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Wrong email or password' }});
      else if (error.message === 'USER_DISABLED') res.status(403).json({ error: { code: 'USER_DISABLED', message: 'User is disabled or unconfirmed' }});
      else res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message }});
    }
  }

  public async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        res.status(401).json({ error: { code: 'TOKEN_MISSING', message: 'No refresh token in cookies' }});
        return;
      }

      const result = await this.refreshSessionUseCase.execute(refreshToken);

      if (result.newRefreshToken) {
        res.cookie('refreshToken', result.newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000 
        });
      }

      res.status(200).json({
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user
      });
    } catch (error: any) {
      res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Refresh token expired' }});
    }
  }

  public async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.split(' ')[1];

      if (accessToken) {
        await this.logoutUseCase.execute(accessToken);
      }

      res.cookie('refreshToken', '', {
        httpOnly: true,
        expires: new Date(0) // Expire immediately
      });

      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message }});
    }
  }
}
