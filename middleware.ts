export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/app/:path*",
    "/api/chat/:path*",
    "/api/session/:path*",
    "/api/journal/:path*",
  ],
};
