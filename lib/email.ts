import nodemailer from "nodemailer";

export async function sendConfirmationEmail(reg: any) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  // If SMTP is not configured or uses placeholder credentials, skip gracefully
  if (!host || !user || !pass || user.includes("your-email") || pass.includes("your-app-password")) {
    console.warn(`[EMAIL] SMTP credentials not configured. Skipping confirmation email to ${reg.email}.`);
    return { success: false, warning: "SMTP not configured" };
  }

  console.log(`[EMAIL] Sending confirmation email (Nodemailer) to ${reg.email}...`);
  
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "EventFlow";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fromEmail = process.env.EMAIL_FROM || user || "noreply@eventflow.app";

  const statusLabel = reg.status === "pre_registered" ? "Pre-registered" : "Registered";
  const verifyUrl = `${appUrl}/verify/${reg._id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #eee; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="background: #000; color: #fff; width: 40px; height: 40px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px;">⚡</div>
        <h1 style="color: #111; font-size: 24px; margin-top: 16px; margin-bottom: 8px;">You're confirmed for ${appName}!</h1>
        <p style="color: #666; font-size: 16px;">We're excited to see you at the event.</p>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="color: #64748b; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; margin-top: 0;">Show this at the entrance</p>
        <img src="${qrCodeUrl}" width="150" height="150" alt="Check-in QR Code" style="border: 4px solid #fff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
        <p style="margin-top: 16px; color: #020617; font-weight: bold; font-size: 18px;">${reg.name}</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">ID: ${reg._id}</p>
      </div>

      <div style="border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 20px 0; margin-bottom: 24px;">
         <h3 style="margin-top: 0; font-size: 14px; color: #64748b; text-transform: uppercase;">Registration Details</h3>
         <table style="width: 100%; font-size: 14px; color: #334155;">
           <tr><td style="padding: 4px 0;"><strong>Company:</strong></td><td>${reg.company || "—"}</td></tr>
           <tr><td style="padding: 4px 0;"><strong>Email:</strong></td><td>${reg.email}</td></tr>
           <tr><td style="padding: 4px 0;"><strong>Status:</strong></td><td>${statusLabel}</td></tr>
         </table>
      </div>

      <div style="text-align: center;">
        <p style="color: #94a3b8; font-size: 12px;">
          If you didn't register for this event, please ignore this email.
        </p>
      </div>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
      auth: {
        user: user,
        pass: pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"${appName}" <${fromEmail}>`,
      to: reg.email,
      subject: `Your registration confirmation — ${appName}`,
      html: html,
    });
    console.log(`[EMAIL] Message sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[EMAIL WARNING] Nodemailer sending failed (suppressed):", error.message || error);
    return { success: false, error: error.message || "Failed to send email" };
  }
}
