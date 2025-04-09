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
  profile_image?: string;
  phone_number?: string;
  sns_type?: string;
  sns_id?: string;
  access: string;
  refresh: string;
  jwt: {
    refresh: string;
    access: string;
  };
}



export const authOptions: AuthOptions = {
  // 쿠키 설정 개선
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900, // 15분
      },
    },
  },
  
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
          response_type: 'code'
        }
      },
      token: {
        url: 'https://kauth.kakao.com/oauth/token',
        params: {
          grant_type: 'authorization_code'
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
          console.log(`[SNS 로그인] 시도: ${account.provider}, ID: ${user.id}`);
          console.log('[SNS 로그인] 프로필 데이터:', profile);
          console.log('[SNS 로그인] 사용자 데이터:', user);
          
          // 카카오 프로필 정보 처리
          if (account.provider === 'kakao' && profile) {
            // @ts-ignore - 카카오 프로필 구조에 맞게 처리
            const kakaoAccount = profile.kakao_account;
            if (kakaoAccount?.profile) {
              user.name = kakaoAccount.profile.nickname || user.name;
              user.image = kakaoAccount.profile.profile_image_url || user.image;
              console.log('[SNS 로그인] 카카오 프로필 처리 완료:', user.name, user.image);
            }
          }
          
          // 백엔드에 SNS 로그인 요청 - 정확한 API 경로 사용
          console.log('[SNS 로그인] 백엔드로 전송할 데이터:', {
            sns_id: user.id,
            sns_type: account.provider,
            email: user.email || `${user.id}@${account.provider}.user`,
            profile_image: user.image,
            name: user.name,
          });
          
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
              name: user.name, // 카카오에서 가져온 닉네임 전송
            })
          });

          if (!response.ok) {
            // 응답 상태에 따른 처리
            if (response.status === 404) {
              // 사용자가 존재하지 않는 경우 - 회원가입 페이지로 이동
              console.log(`[SNS 로그인] 새 사용자 감지: ${user.id}`);
              // 새 사용자의 경우 회원가입 페이지로 이동하거나 추가 정보를 요청하는 로직 추가 가능
              return '/register?sns_type=' + account.provider + '&sns_id=' + user.id;
            } else {
              throw new Error(`SNS login failed: ${response.status}`);
            }
          }

          // 성공적으로 응답을 받은 경우
          const data: SnsLoginResponse = await response.json();
          console.log(`[SNS 로그인] 성공: 사용자 ID ${data.user_id}`);
          
          if (data) {
            // 사용자 정보와 토큰 저장
            user.accessToken = data.jwt.access;
            (user as CustomUser).sns_id = user.id;
            (user as CustomUser).sns_type = account.provider;
            (user as CustomUser).role = 'user';
            
            // 백엔드에서 받은 프로필 이미지 정보 저장
            if (data.profile_image) {
              console.log('[SNS 로그인] 백엔드에서 받은 프로필 이미지:', data.profile_image);
              user.image = data.profile_image;
            }
            
            // 백엔드에서 받은 사용자 이름 정보 저장
            if (data.username) {
              console.log('[SNS 로그인] 백엔드에서 받은 사용자 이름:', data.username);
              user.name = data.username;
            }
            
            return true;
          }
        } catch (error) {
          console.error('[SNS 로그인] 오류:', error);
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
        // 프로필 이미지 정보 추가
        token.profile_image = user.image;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        (session.user as CustomUser).accessToken = token.accessToken as string;
        (session.user as CustomUser).role = token.role as string;
        (session.user as CustomUser).sns_id = token.sns_id as string;
        // 프로필 이미지 정보 추가
        session.user.image = token.profile_image as string;
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