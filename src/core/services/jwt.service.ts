// JWT Service - Single Responsibility: JWT Token Management
import { IJWTService } from '../interfaces/service.interface';
import { generateToken, verifyToken } from '../../utils/jwt';

export class JWTService implements IJWTService {
  generateToken(payload: any): string {
    return generateToken(payload);
  }

  verifyToken(token: string): any {
    return verifyToken(token);
  }
}

