// Email types and interfaces

export interface EmailOptions {
  to: string | string[]; // Recipient email address(es)
  subject: string; // Email subject
  text?: string; // Plain text version
  html?: string; // HTML version
  cc?: string | string[]; // CC recipients
  bcc?: string | string[]; // BCC recipients
  replyTo?: string; // Reply-to address
  attachments?: EmailAttachment[]; // Email attachments
  priority?: 'high' | 'normal' | 'low'; // Email priority
  from?: string; // Sender email (optional, uses default if not provided)
  fromName?: string; // Sender name (optional, uses default if not provided)
}

export interface EmailAttachment {
  filename: string;
  path?: string; // File path
  content?: string | Buffer; // File content
  contentType?: string; // MIME type
  cid?: string; // Content ID for inline images
}

export interface EmailJobData extends EmailOptions {
  from?: string; // Sender email (optional, uses default if not provided)
  fromName?: string; // Sender name (optional, uses default if not provided)
}

export interface EmailTemplateData {
  [key: string]: any; // Template variables
}

