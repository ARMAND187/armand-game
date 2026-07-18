"use server";

import nodemailer from "nodemailer";

export async function sendOtpEmail(email: string, code: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const htmlBody = `
      <div style="font-family: sans-serif; padding: 40px; text-align: center; background-color: #f4f4f5; border-radius: 12px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #18181b; margin-bottom: 24px;">Your Verification Code</h2>
        <div style="font-size: 36px; font-weight: 800; letter-spacing: 0.3em; color: #a78bfa; background: #fff; padding: 24px; border-radius: 12px; border: 2px solid #e4e4e7; display: inline-block;">
          ${code}
        </div>
        <p style="color: #71717a; margin-top: 24px; font-size: 14px; line-height: 1.5;">
          Enter this code in the app to verify your account.<br>
          This code will expire in 15 minutes.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: \`"Armand Games" <\${process.env.GMAIL_USER}>\`,
      to: email,
      subject: "Your Verification Code - Armand Games",
      html: htmlBody,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error sending OTP email:", error);
    return { success: false, error: error.message || "Failed to send verification email" };
  }
}
