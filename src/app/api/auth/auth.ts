/**
 * Auth.js v5 Configuration
 * 
 * Official authentication solution for Next.js with proper middleware support
 * and server-side rendering compatibility via cookie-based sessions.
 */

import NextAuth from 'next-auth';
import type { Session, User } from 'next-auth';
import type { AuthJWT } from '@/types/auth';
import { prisma } from '@/lib/container/prisma';
import { verifyPassword } from '@/lib/auth/password';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Configure one or more authentication providers
  providers: [
    // GitHub Provider (example)
    // {
    //   id: 'github',
    //   name: 'GitHub',
    //   type: 'oauth',
    //   authorization: {
    //     params: { scope: 'read:user user:email' },
    //   },
    //   clientId: process.env.GITHUB_CLIENT_ID!,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    //   token: 'https://github.com/login/oauth/access_token',
    //   userinfo: 'https://api.github.com/user',
    //   profile(profile) {
    //     return {
    //       id: profile.id.toString(),
    //       name: profile.name || profile.login,
    //       email: profile.email,
    //       image: profile.avatar_url,
    //       role: profile.email === 'admin@example.com' ? 'admin' : 'user',
    //     };
    //   },
    // },
    
    // Google Provider (example)
    // {
    //   id: 'google',
    //   name: 'Google',
    //   type: 'oauth',
    //   authorization: {
    //     params: { 
    //       scope: 'openid email profile',
    //       access_type: 'offline',
    //       response_type: 'code',
    //     },
    //   },
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //   token: 'https://oauth2.googleapis.com/token',
    //   userinfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
    //   profile(profile) {
    //     return {
    //       id: profile.sub,
    //       name: profile.name,
    //       email: profile.email,
    //       image: profile.picture,
    //       role: profile.email === 'admin@example.com' ? 'admin' : 'user',
    //     };
    //   },
    // },

    // Credentials provider
    {
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: { email?: string; password?: string }) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const ok = await verifyPassword(credentials.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
        };
      },
    },
  ],

  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  // JWT configuration
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  // Pages
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  // Callbacks
  callbacks: {
    async jwt({ token, user }: { token: AuthJWT; user?: User }) {
      // Add role to JWT token
      if (user) {
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: AuthJWT }) {
      // Add role to session
      if (token && session.user) {
        if (token.sub) {
          session.user.id = token.sub;
        }
        if (token.role) {
          session.user.role = token.role;
        }
      }
      return session;
    },
  },

  // Security
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
});
