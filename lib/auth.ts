import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// ─── Admin allowlist ─────────────────────────────────────────────────────────
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().replace(/^["'](.+)["']$/, "$1").toLowerCase())
  .filter(Boolean);

console.log("[AUTH] Configured Admin Emails:", ADMIN_EMAILS.length > 0 ? ADMIN_EMAILS : "All Allowed (No restriction)");

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    // Credentials provider for instant login & Admin access
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

        // 2. If no restriction is set, allow login
        return {
          id: `admin-${email}`,
          name: email.split("@")[0] || "Admin",
          email: email,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      const email = (user.email || "").trim().toLowerCase();
      if (ADMIN_EMAILS.length === 0) return true;
      return ADMIN_EMAILS.includes(email) || ADMIN_EMAILS.includes("*");
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
  },
};
