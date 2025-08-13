import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import KakaoProvider from 'next-auth/providers/kakao';
import { JWT } from 'next-auth/jwt';
import { NextAuthOptions } from 'next-auth';
import { Account, Profile, Session, User } from 'next-auth';
import { cookies } from 'next/headers';

// NextAuth User 타입 확장
declare module 'next-auth' {
  interface User {
    id?: string;
    role?: string;
    accessToken?: string;
    provider?: string;
  }
  
  interface Session {
    accessToken?: string;
  }
}

/**
 * NextAuth 세션 설정
 * JWT 토큰에서 추출한 사용자 정보로 NextAuth 세션을 구성합니다
 */
const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        return null;
      }
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID as string,
      clientSecret: process.env.KAKAO_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 시간
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none', // 카카오톡 브라우저 호환성을 위해 none으로 변경
        path: '/',
        secure: true, // sameSite none일 때는 secure 필수
        maxAge: 24 * 60 * 60, // 24시간
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'none', // 카카오톡 브라우저 호환성
        path: '/',
        secure: true,
        maxAge: 24 * 60 * 60,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'none', // 카카오톡 브라우저 호환성
        path: '/',
        secure: true,
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }: {
      token: JWT;
      user?: User | undefined;
      account?: Account | null | undefined;
      profile?: Profile | undefined;
      trigger?: "signIn" | "signUp" | "update" | undefined;
      session?: Session | null | undefined;
    }) {
      // 초기 로그인 시 사용자 정보 통합
      if (user) {
        // 사용자 객체에서 안전하게 데이터 추출
        token.user = {
          id: (user as any).id || token.sub,
          email: user.email,
          name: user.name
        };
        token.id = (user as any).id || token.sub;
        
        // 관리자 권한 처리 - is_superuser가 true이면 role을 admin으로 설정
        if ((user as any).is_superuser === true) {
          token.role = 'admin';
        } else {
          token.role = (user as any).role || 'buyer';
        }
        
        token.accessToken = (user as any).accessToken || (user as any).token || '';
        
        // 카카오 로그인 정보 추가 처리
        if (account?.provider === 'kakao') {
          token.provider = 'kakao';
          token.providerId = account.providerAccountId;
        }
      }
      
      // 세션 업데이트 시 전달된 정보 적용
      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }
      
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // 토큰 정보를 세션에 복사
      session.user = {
        ...session.user,
        id: (token.id as string) || (token.sub as string) || '',
        role: (token.role as string) || 'buyer',
        accessToken: (token.accessToken as string) || '',
        provider: (token.provider as string) || undefined,
        image: (token.picture as string) || session.user?.image || ''
      };
      
      // accessToken 추가 (API 요청에 사용)
      session.accessToken = token.accessToken as string || '';
      
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/register',
  },
  secret: process.env.NEXTAUTH_SECRET || 'dungji-market-secret-key',
  debug: process.env.NODE_ENV === 'development',
};

// NextAuth 핸들러 생성
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
