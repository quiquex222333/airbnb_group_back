import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/AuthController';
import { CognitoAuthProvider } from '../../providers/CognitoAuthProvider';
import { RegisterUseCase } from '../../../application/use-cases/auth/RegisterUseCase';
import { ConfirmRegisterUseCase } from '../../../application/use-cases/auth/ConfirmRegisterUseCase';
import { LoginUseCase } from '../../../application/use-cases/auth/LoginUseCase';
import { RefreshSessionUseCase } from '../../../application/use-cases/auth/RefreshSessionUseCase';
import { LogoutUseCase } from '../../../application/use-cases/auth/LogoutUseCase';
import { requireAuth } from '../middlewares/AuthGuard';

const authRouter = Router();

// Dependecy Injection Setup
const authProvider = new CognitoAuthProvider();
const authController = new AuthController(
  new RegisterUseCase(authProvider),
  new ConfirmRegisterUseCase(authProvider),
  new LoginUseCase(authProvider),
  new RefreshSessionUseCase(authProvider),
  new LogoutUseCase(authProvider)
);

// Rotas API
authRouter.post('/register', (req, res) => authController.register(req, res));
authRouter.post('/confirm', (req, res) => authController.confirm(req, res));
authRouter.post('/login', (req, res) => authController.login(req, res));
authRouter.post('/refresh', (req, res) => authController.refresh(req, res));
authRouter.post('/logout', (req, res) => authController.logout(req, res));

// Endpoint Protegido: Obtener perfil usando req.user inyectado y consultando Cognito
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader!.split(' ')[1];
    
    // Obtenemos el perfil enriquecido
    const user = await authProvider.getUserProfile(accessToken);
    res.status(200).json(user);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message }});
  }
});

export { authRouter };
