import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import { Resend } from "resend";

// Environment Validation 
const uri = process.env.MONGODB_URI;
const resendKey = process.env.RESEND_API_KEY;

if (!uri) {
  console.error("ERROR: MONGODB_URI is missing in .env.local");
}
if (!resendKey || resendKey.includes("xxxx")) {
  console.warn("WARNING: RESEND_API_KEY is not set or is still a placeholder");
}

// ─── MongoDB native client (cached, required by NextAuth adapter) ────────────
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;
if (!global._mongoClientPromise) {
  if (!uri) throw new Error("MONGODB_URI is required");
  const client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise!;

import CredentialsProvider from "next-auth/providers/credentials";
import nodemailer from "nodemailer";

// SMTP Transporter for Magic Links
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// ─── Admin allowlist ─────────────────────────────────────────────────────────
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().replace(/^["'](.+)["']$/, '$1').toLowerCase())
  .filter(Boolean);

console.log("[AUTH] Configured Admin Emails:", ADMIN_EMAILS);

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),

  providers: [
    // Credentials provider for local development "Auto Login"
    CredentialsProvider({
      id: "credentials",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase();
        
        // If the email is in the admin whitelist, allow instant login regardless of environment
        if (email && ADMIN_EMAILS.includes(email)) {
          console.log(`[AUTH] Admin bypass login for: ${email}`);
          return {
            id: `admin-${email}`,
            name: "Admin",
            email: email,
          };
        }

        // Only allow non-whitelisted credentials in development
        if (process.env.NODE_ENV !== "production") {
          const devEmail = email || ADMIN_EMAILS[0] || "admin@example.com";
          console.log(`[AUTH] Dev mode auto-login: ${devEmail}`);
          return {
            id: "dev-admin",
            name: "Dev Admin",
            email: devEmail,
          };
        }
        
        return null;
      },
    }),
    EmailProvider({
      from: process.env.EMAIL_FROM || "noreply@eventflow.app",
      maxAge: 3 * 24 * 60 * 60, // 3 Days in seconds
      async sendVerificationRequest({ identifier: email, url }) {
        try {
          console.log(`[AUTH] Attempting to send magic link (Nodemailer) to: ${email}`);
          
          await transporter.sendMail({
            from: `"${process.env.NEXT_PUBLIC_APP_NAME || "EventFlow"}" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: `Sign in to ${process.env.NEXT_PUBLIC_APP_NAME || "EventFlow"}`,
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #eee; border-radius: 12px;">
                <h2 style="color: #111; margin-bottom: 8px;">Sign in to Admin Dashboard</h2>
                <p style="color: #555; margin-bottom: 24px;">
                   Hello! Click the button below to access your ${process.env.NEXT_PUBLIC_APP_NAME || "EventFlow"} account.
                </p>
                <div style="text-align: center;">
                  <a href="${url}" style="
                     display: inline-block; background: #000; color: #fff;
                     padding: 14px 28px; border-radius: 10px;
                     text-decoration: none; font-weight: 600;
                  ">Sign in Now →</a>
                </div>
                <p style="color: #999; margin-top: 24px; font-size: 12px;">
                   This link expires in 10 minutes. If you didn't request this, ignore this email.
                </p>
              </div>
            `,
          });

          console.log("[AUTH SUCCESS] Magic link sent via SMTP!");
        } catch (err) {
          console.error("[AUTH CRASH] Nodemailer failure in magic link:", err);
          throw new Error("Failed to send verification email.");
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user }) {
      const email = (user.email || "").toLowerCase();
      console.log(`[AUTH] Verifying sign-in for: ${email}`);
      
      if (ADMIN_EMAILS.length === 0) {
        console.log("[AUTH] No ADMIN_EMAILS defined, allowing all.");
        return true;
      }

      const isAllowed = ADMIN_EMAILS.includes(email);
      if (!isAllowed) {
        console.warn(`[AUTH] BLOCKED: "${email}" is not in the admin allowlist:`, ADMIN_EMAILS.map(e => `"${e}"`));
        return false;
      }
      
      console.log(`[AUTH] ALLOWED: ${email}`);
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
