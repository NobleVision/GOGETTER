import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { ENV } from "../_core/env";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    if (!ENV.smtpHost || !ENV.smtpUser || !ENV.smtpPass) {
      console.warn("[Email] SMTP not configured — emails will be logged to console only");
    }
    transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: ENV.smtpPort,
      secure: true, // SSL/TLS on port 465
      auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPass,
      },
    });
  }
  return transporter;
}

export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #10b981; font-size: 28px; margin: 0;">GO-GETTER OS</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Autonomous Business Platform</p>
      </div>
      <div style="background: #1e293b; border-radius: 12px; padding: 32px; text-align: center;">
        <h2 style="color: #f1f5f9; font-size: 20px; margin: 0 0 8px;">Verify Your Email</h2>
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 24px;">Enter this code to complete your registration:</p>
        <div style="background: #0f172a; border: 2px solid #10b981; border-radius: 8px; padding: 16px; margin: 0 auto; display: inline-block;">
          <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; color: #10b981; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">This code expires in 10 minutes.</p>
      </div>
      <p style="color: #475569; font-size: 12px; text-align: center; margin-top: 24px;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>
  `;

  // Always log the code for debugging / local dev
  console.log(`[Email] OTP for ${to}: ${code}`);

  if (!ENV.smtpHost || !ENV.smtpUser) {
    console.warn("[Email] SMTP not configured — code logged above only");
    return true;
  }

  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: `"GO-GETTER OS" <${ENV.smtpFrom}>`,
      to,
      subject: `${code} — Your GO-GETTER OS verification code`,
      html,
    });
    console.log(`[Email] OTP sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send OTP:", error);
    return false;
  }
}
