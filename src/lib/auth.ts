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
  // 개발 환경에서는 보안 쿠키 사용 안함
  useSecureCookies: false,
  
  // 세션 전략 설정
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
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
      // 상태 검사 방식 변경 - 쿠키 대신 pkce 사용
      checks: ['pkce'],
      authorization: {
        url: 'https://kauth.kakao.com/oauth/authorize',
        params: {
          scope: 'profile_nickname profile_image',
          redirect_uri: 'http://localhost:3000/api/auth/callback/kakao',
          response_type: 'code'
        }
      },
      token: {
        url: 'https://kauth.kakao.com/oauth/token',
        params: {
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost:3000/api/auth/callback/kakao'
        }
      },
      userinfo: {
        url: 'https://kapi.kakao.com/v2/user/me',
        params: {
          property_keys: '["kakao_account.profile", "kakao_account.email"]'
        }
      },
      client: {
        token_endpoint_auth_method: 'client_secret_post'
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.properties?.nickname,
          email: profile.kakao_account?.email || `${profile.id}@kakao.user`,
          image: profile.properties?.profile_image,
          role: 'user',
          sns_id: profile.id.toString(),
          sns_type: 'kakao',
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
  // 디버그 모드 활성화
  debug: process.env.NODE_ENV === 'development',
};

export const getSessionServer = async () => {
  return await getServerSession(authOptions);
};