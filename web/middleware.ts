import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) => {
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/welcome/:path*",
    "/dashboard/:path*",
    "/analytics/:path*",
    "/contacts/:path*",
    "/pipeline/:path*",
    "/inbox/:path*",
    "/broadcast/:path*",
    "/automation-builder/:path*",
    "/support/:path*",
    "/billing-portal/:path*",
    "/design/:path*",
    "/agency-wizard/:path*",
    "/settings/:path*",
  ],
};