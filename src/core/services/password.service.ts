// Password Service - Single Responsibility: Password Hashing & Verification
import { IPasswordService } from '../interfaces/service.interface';
import * as bcrypt from 'bcryptjs';

export class PasswordService implements IPasswordService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

