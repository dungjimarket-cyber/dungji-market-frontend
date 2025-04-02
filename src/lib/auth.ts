import { AuthOptions, Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';

interface CustomUser extends User {
  accessToken?: string;
  role?: string;
  sns_id?: string;
  sns_type?: string;
}

interface SnsLoginResponse {
  user_id: number;
  username: string;
  email: string;
  jwt: {
    refresh: string;
    access: string;
  };
}



export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'user',
        };
      },
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'profile_nickname profile_image'
        }
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.properties?.nickname,
          email: profile.kakao_account?.email,
          image: profile.properties?.profile_image,
          role: 'user',
        };
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
            const response = await fetch('/auth/login/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: credentials.email,
              password: credentials.password
            })
            });
            
            if (!response.ok) {
            throw new Error('Login failed');
            }
            
            const data = await response.json();
            
            return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            accessToken: data.access,
            };
        } catch (error) {
          console.error('Login error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/api/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'kakao') {
        try {
          const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/auth/sns-login/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': process.env.BACKEND_API_KEY!
            },
            body: JSON.stringify({
              sns_id: user.id,
              sns_type: account.provider,
              email: user.email || `${user.id}@${account.provider}.user`,
              profile_image: user.image,
              name: user.name,
            })
          });

          if (!response.ok) {
            throw new Error('SNS login failed');
          }

          const data: SnsLoginResponse = await response.json();
          if (data) {
            user.accessToken = data.jwt.access;
            return true;
          }
        } catch (error) {
          console.error('SNS login error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account) {
        token.accessToken = (user as CustomUser).accessToken;
        token.role = (user as CustomUser).role || 'user';
        token.sns_id = (user as CustomUser).sns_id;
        token.sns_type = (user as CustomUser).sns_type;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        (session.user as CustomUser).accessToken = token.accessToken as string;
        (session.user as CustomUser).role = token.role as string;
        (session.user as CustomUser).sns_id = token.sns_id as string;
        (session.user as CustomUser).sns_type = token.sns_type as string;
        (session.user as any).provider = token.sns_type as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export const getSessionServer = async () => {
  return await getServerSession(authOptions);
};