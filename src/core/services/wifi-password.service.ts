// WiFi Password Service - Single Responsibility: WiFi Password Generation
import { IWiFiPasswordService } from '../interfaces/service.interface';

export class WiFiPasswordService implements IWiFiPasswordService {
  generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

