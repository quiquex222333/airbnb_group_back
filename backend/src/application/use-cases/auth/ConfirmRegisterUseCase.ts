import { IAuthService } from '../../../domain/interfaces/IAuthService';

interface ConfirmInput {
  email: string;
  code: string;
}

export class ConfirmRegisterUseCase {
  constructor(private authService: IAuthService) {}

  async execute(input: ConfirmInput): Promise<void> {
    if (!input.email || !input.code) {
      throw new Error('MISSING_DATA');
    }
    await this.authService.confirmRegistration(input.email, input.code);
  }
}
