import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) {
          // Perform a dummy bcrypt comparison to prevent timing-based
          // user enumeration (existing users trigger ~50-100ms bcrypt cost).
          await compare(password, "$2a$12$000000000000000000000uGBOtpNMTFGG65IYVVBTFnRaWWkyBOi");
          return null;
        }

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60,   // Refresh token every hour
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Guard against missing email from OAuth provider
        if (!user.email) {
          return false;
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          // Block OAuth sign-in if this email belongs to a credentials-only account.
          // Without this check, anyone who controls a Google account with the same
          // email could gain access to the existing user's data.
          const linkedAccount = await prisma.account.findFirst({
            where: { userId: existingUser.id, provider: "google" },
          });
          if (!linkedAccount) {
            return false;
          }
        }

        if (!existingUser) {
          // Google already verified the email, so mark it as verified
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              emailVerified: new Date(),
            },
          });

          await prisma.account.create({
            data: {
              userId: newUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in: populate token from DB
        if (!user.email) {
          return token;
        }
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.subscriptionTier = dbUser.subscriptionTier;
        }
      } else if (token.userId) {
        // Token refresh: re-fetch subscriptionTier so upgrades/downgrades
        // take effect without requiring the user to sign out and back in.
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: { subscriptionTier: true },
        });
        if (dbUser) {
          token.subscriptionTier = dbUser.subscriptionTier;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        (session as unknown as Record<string, unknown>).subscriptionTier = token.subscriptionTier;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
