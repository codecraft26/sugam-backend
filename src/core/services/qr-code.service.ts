// QR Code Service - Single Responsibility: QR Code Generation
import { IQRCodeService } from '../interfaces/service.interface';
import { v4 as uuidv4 } from 'uuid';

export class QRCodeService implements IQRCodeService {
  generateQRCode(): string {
    return `QR-${uuidv4().substring(0, 8).toUpperCase()}`;
  }
}

