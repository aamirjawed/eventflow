export { default } from "next-auth/middleware";

/**
 * Protect all /dashboard routes — unauthenticated users get redirected to /login.
 * All other routes (/, /register, /api/registrations POST, etc.) remain public.
 */
export const config = {
  matcher: ["/dashboard/:path*"],
};
