import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const adminUsername = process.env.NEXTAUTH_ADMIN_USERNAME || "admin";
        const adminPassword = process.env.NEXTAUTH_ADMIN_PASSWORD || "admin123";

        if (
          credentials?.username === adminUsername &&
          credentials?.password === adminPassword
        ) {
          return { id: "admin", name: "Admin User", role: "admin" } as any;
        }

        return null;
      },
    }),

    // Mock SSO provider (one-click sign-in) for local demos.
    Credentials({
      id: "mock-sso",
      name: "Mock SSO",
      credentials: {},
      async authorize() {
        const enabled = (process.env.MOCK_SSO_ENABLED ?? "true").toLowerCase();
        if (enabled === "false" || enabled === "0") {
          return null;
        }

        return { id: "mock-sso-user", name: "SSO User", role: "user" } as any;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
