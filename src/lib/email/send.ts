import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";
const FROM_ADDRESS = process.env.EMAIL_FROM ?? "ContentRepurpose <noreply@contentrepurpose.com>";

export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${APP_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Verify your email — ContentRepurpose",
    text: [
      "Welcome to ContentRepurpose!",
      "",
      "Please verify your email address by clicking the link below:",
      "",
      verifyUrl,
      "",
      "This link expires in 24 hours.",
      "",
      "If you didn't create an account, you can safely ignore this email.",
    ].join("\n"),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Reset your password — ContentRepurpose",
    text: [
      "You requested a password reset for your ContentRepurpose account.",
      "",
      "Click the link below to set a new password:",
      "",
      resetUrl,
      "",
      "This link expires in 1 hour.",
      "",
      "If you didn't request this, you can safely ignore this email.",
    ].join("\n"),
  });
}
