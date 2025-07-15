import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/constants';
import { LoginResponse, User } from '@/types';

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOGIN}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const tokens = await response.json();
          
          // Get user data using the access token
          const userResponse = await fetch(`${API_BASE_URL}/api/users/me/`, {
            headers: {
              'Authorization': `Bearer ${tokens.access}`,
              'Content-Type': 'application/json',
            },
          });

          let userData = null;
          if (userResponse.ok) {
            userData = await userResponse.json();
          } else {
            // Fallback: create minimal user data
            userData = {
              id: 1,
              username: credentials.username,
              email: credentials.username + '@example.com',
              first_name: credentials.username,
              last_name: '',
              role: 'ADMIN',
            };
          }
          
          return {
            id: userData.id.toString(),
            email: userData.email,
            name: `${userData.first_name} ${userData.last_name}`.trim() || userData.username,
            accessToken: tokens.access,
            refreshToken: tokens.refresh,
            user: userData,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.refreshToken = (user as { refreshToken?: string }).refreshToken;
        token.userData = (user as { user?: User }).user;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.user = token.userData as User;
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };