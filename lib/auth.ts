import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import { Resend } from "resend";
import nodemailer from "nodemailer";

// Environment Validation 
const uri = process.env.MONGODB_URI;
const resendKey = process.env.RESEND_API_KEY;

// ─── MongoDB native client (cached, required by NextAuth adapter) ────────────
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;
if (!global._mongoClientPromise) {
  if (!uri) {
    console.error("[AUTH Error] MONGODB_URI is missing from environment variables");
    clientPromise = Promise.reject(new Error("MONGODB_URI is required"));
  } else {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
    clientPromise = global._mongoClientPromise;
  }
} else {
  clientPromise = global._mongoClientPromise;
}

// ─── Admin allowlist ─────────────────────────────────────────────────────────
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().replace(/^["'](.+)["']$/, "$1").toLowerCase())
  .filter(Boolean);

console.log("[AUTH] Configured Admin Emails:", ADMIN_EMAILS.length > 0 ? ADMIN_EMAILS : "All Allowed (No restriction)");

export const authOptions: NextAuthOptions = {
  adapter: uri ? MongoDBAdapter(clientPromise) : undefined,

  providers: [
    // Credentials provider for instant login & Sunmi POS / Admin access
    CredentialsProvider({
      id: "credentials",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        if (!email) return null;

        // 1. If ADMIN_EMAILS list is defined, check whitelist
        if (ADMIN_EMAILS.length > 0) {
          const isAllowed = ADMIN_EMAILS.includes(email) || ADMIN_EMAILS.includes("*");
          if (isAllowed) {
            console.log(`[AUTH] Admin login authorized for: ${email}`);
            return {
              id: `admin-${email}`,
              name: email.split("@")[0] || "Admin",
              email: email,
            };
          }
          console.warn(`[AUTH] BLOCKED: "${email}" not in ADMIN_EMAILS:`, ADMIN_EMAILS);
          return null;
        }

        // 2. If no ADMIN_EMAILS restriction is set on Vercel, allow any email to log in
        console.log(`[AUTH] Auto-authorizing admin login for: ${email}`);
        return {
          id: `admin-${email}`,
          name: email.split("@")[0] || "Admin",
          email: email,
        };
      },
    }),

    // Magic Link Email Provider
    EmailProvider({
      from: process.env.EMAIL_FROM || "noreply@eventflow.app",
      maxAge: 3 * 24 * 60 * 60, // 3 Days
      async sendVerificationRequest({ identifier: email, url }) {
        console.log(`[AUTH] Magic Link requested for: ${email}`);

        // Try Resend API first if configured
        if (resendKey && !resendKey.includes("xxxx")) {
          try {
            const resend = new Resend(resendKey);
            await resend.emails.send({
              from: process.env.EMAIL_FROM || "EventFlow <onboarding@resend.dev>",
              to: email,
              subject: `Sign in to ${process.env.NEXT_PUBLIC_APP_NAME || "EventFlow"}`,
              html: `<p>Click to sign in: <a href="${url}">${url}</a></p>`,
            });
            console.log("[AUTH SUCCESS] Magic link sent via Resend API!");
            return;
          } catch (resendErr) {
            console.error("[AUTH WARNING] Resend API failed:", resendErr);
          }
        }

        // Try Nodemailer SMTP if configured
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
          try {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: parseInt(process.env.SMTP_PORT || "587"),
              secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
              },
            });

            await transporter.sendMail({
              from: `"${process.env.NEXT_PUBLIC_APP_NAME || "EventFlow"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
              to: email,
              subject: `Sign in to ${process.env.NEXT_PUBLIC_APP_NAME || "EventFlow"}`,
              html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #eee; border-radius: 12px;">
                  <h2 style="color: #111; margin-bottom: 8px;">Sign in to Admin Dashboard</h2>
                  <p style="color: #555; margin-bottom: 24px;">Click below to access your account.</p>
                  <a href="${url}" style="display: inline-block; background: #000; color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600;">Sign in Now →</a>
                </div>
              `,
            });
            console.log("[AUTH SUCCESS] Magic link sent via SMTP!");
            return;
          } catch (smtpErr) {
            console.error("[AUTH WARNING] SMTP failed:", smtpErr);
          }
        }

        // Fallback: Log magic link to console safely (prevents 500 crashes when email isn't configured yet)
        console.warn("[AUTH NOTICE] Email provider not fully configured. Magic Link URL:", url);
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user }) {
      const email = (user.email || "").trim().toLowerCase();
      
      if (ADMIN_EMAILS.length === 0) {
        return true;
      }

      const isAllowed = ADMIN_EMAILS.includes(email) || ADMIN_EMAILS.includes("*");
      if (!isAllowed) {
        console.warn(`[AUTH] Sign-in callback BLOCKED: "${email}" not in whitelist.`);
        return false;
      }

      return true;
    },

    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/login?verify=1",
  },
};
