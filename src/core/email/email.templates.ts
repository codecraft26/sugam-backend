// Email templates
import { EmailTemplateData } from './email.types';

/**
 * Generate welcome email HTML
 */
export function getWelcomeEmailTemplate(data: EmailTemplateData & { name: string; email: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Sugam Platform!</h1>
        </div>
        <div class="content">
          <p>Hello ${data.name},</p>
          <p>Welcome to Sugam Platform! Your account has been successfully created.</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p>You can now log in and start using the platform.</p>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Sugam Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate password reset email HTML
 */
export function getPasswordResetEmailTemplate(data: EmailTemplateData & { name: string; resetLink: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${data.name},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <p style="text-align: center;">
            <a href="${data.resetLink}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${data.resetLink}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The Sugam Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate request approval email HTML
 */
export function getRequestApprovedEmailTemplate(data: EmailTemplateData & { name: string; requestDescription: string; adminComments?: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .request-box { background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Request Approved ✓</h1>
        </div>
        <div class="content">
          <p>Hello ${data.name},</p>
          <p>Your request has been approved!</p>
          <div class="request-box">
            <p><strong>Request:</strong> ${data.requestDescription}</p>
            ${data.adminComments ? `<p><strong>Admin Comments:</strong> ${data.adminComments}</p>` : ''}
          </div>
          <p>You can now proceed with your request.</p>
          <p>Best regards,<br>The Sugam Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate request rejection email HTML
 */
export function getRequestRejectedEmailTemplate(data: EmailTemplateData & { name: string; requestDescription: string; adminComments?: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .request-box { background-color: white; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Request Rejected</h1>
        </div>
        <div class="content">
          <p>Hello ${data.name},</p>
          <p>Unfortunately, your request has been rejected.</p>
          <div class="request-box">
            <p><strong>Request:</strong> ${data.requestDescription}</p>
            ${data.adminComments ? `<p><strong>Admin Comments:</strong> ${data.adminComments}</p>` : ''}
          </div>
          <p>If you have any questions, please contact your administrator.</p>
          <p>Best regards,<br>The Sugam Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate user approval email HTML
 */
export function getUserApprovedEmailTemplate(data: EmailTemplateData & { name: string; email: string; loginUrl?: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account Approved ✓</h1>
        </div>
        <div class="content">
          <p>Hello ${data.name},</p>
          <p>Great news! Your account has been approved by the administrator.</p>
          <p><strong>Email:</strong> ${data.email}</p>
          ${data.loginUrl ? `
            <p style="text-align: center;">
              <a href="${data.loginUrl}" class="button">Log In Now</a>
            </p>
          ` : ''}
          <p>You can now log in and start using the platform.</p>
          <p>Best regards,<br>The Sugam Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate generic notification email HTML
 */
export function getNotificationEmailTemplate(data: EmailTemplateData & { name: string; title: string; message: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.title}</h1>
        </div>
        <div class="content">
          <p>Hello ${data.name},</p>
          <p>${data.message}</p>
          <p>Best regards,<br>The Sugam Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

