import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * 카카오 로그인 콜백 처리 API 라우트
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  // 로그 추가
  console.log('카카오 로그인 콜백 수신:', { code, state });
  
  if (!code) {
    console.error('카카오 인증 코드가 없습니다.');
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }
  
  try {
    // 먼저 카카오 토큰을 얻기 위해 카카오 API 호출
    const kakaoTokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: '48a8af8c364ef5e225460c2086473554', // process.env.KAKAO_CLIENT_ID
        redirect_uri: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/kakao',
        code: code as string,
      }),
    });
    
    if (!kakaoTokenResponse.ok) {
      const tokenError = await kakaoTokenResponse.json();
      console.error('카카오 토큰 요청 실패:', tokenError);
      return NextResponse.redirect(new URL(`/?error=auth_error&message=${encodeURIComponent('카카오 인증 토큰 획득 실패')}`, request.url));
    }
    
    const tokenData = await kakaoTokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // 카카오 사용자 정보 가져오기
    const userInfoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      const userInfoError = await userInfoResponse.json();
      console.error('카카오 사용자 정보 요청 실패:', userInfoError);
      return NextResponse.redirect(new URL(`/?error=auth_error&message=${encodeURIComponent('사용자 정보 획득 실패')}`, request.url));
    }
    
    const userInfo = await userInfoResponse.json();
    console.log('카카오 사용자 정보:', userInfo);
    
    // 필요한 정보 추출
    const kakaoId = userInfo.id;
    const kakaoAccount = userInfo.kakao_account || {};
    const profile = kakaoAccount.profile || {};
    
    // 카카오 이메일 처리 - PC/모바일에서 다르게 올 수 있음
    const email = kakaoAccount.email || `${kakaoId}@kakao.user`;
    const name = profile.nickname || '';
    const profileImage = profile.profile_image_url || '';
    
    console.log('카카오 정보 처리:', {
      kakaoId,
      email,
      emailProvided: kakaoAccount.email ? '제공됨' : '자동생성',
      name,
      profileImage: profileImage ? '있음' : '없음'
    });
    
    // 백엔드에 필요한 형식으로 데이터 전송
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/sns-login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sns_id: String(kakaoId),
        sns_type: 'kakao',
        email: email,
        name: name,
        profile_image: profileImage,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('토큰 요청 실패:', errorData);
      const errorMessage = errorData.error || errorData.detail || '인증 오류';
      
      // 카카오 계정 중복 에러인 경우 더 친근한 메시지로 변경
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('이미') && errorMessage.includes('계정으로 가입')) {
        userFriendlyMessage = '이미 가입된 계정입니다. 기존에 가입한 방법으로 로그인해주세요.';
      }
      
      return NextResponse.redirect(new URL(`/?error=auth_error&message=${encodeURIComponent(userFriendlyMessage)}`, request.url));
    }
    
    const data = await response.json();
    console.log('토큰 요청 성공:', data);
    
    // JWT 토큰 저장 (localStorage는 클라이언트에서만 가능하므로 쿠키로 전달)
    if (data.jwt?.access) {
      try {
        console.log('✅ JWT 토큰 추출 성공:', { 
          tokenLength: data.jwt.access.length,
          preview: data.jwt.access.substring(0, 15) + '...'
        });

        // Next.js 14부터는 cookies()를 사용할 때도 await 필요
        const cookieStore = await cookies();
        
        // 접근 토큰 저장
        cookieStore.set('accessToken', data.jwt.access, { 
          maxAge: 60 * 60 * 24, // 1일
          path: '/',
          sameSite: 'lax',
        });
        
        // 추가 호환성을 위한 토큰 저장
        cookieStore.set('dungji_auth_token', data.jwt.access, {
          maxAge: 60 * 60 * 24,
          path: '/',
          sameSite: 'lax',
        });
        
        if (data.jwt.refresh) {
          cookieStore.set('refreshToken', data.jwt.refresh, {
            maxAge: 60 * 60 * 24 * 7, // 7일
            path: '/',
            sameSite: 'lax',
          });
        }
      } catch (cookieError) {
        console.error('❌ 쿠키 설정 오류:', cookieError);
        // 쿠키 설정 오류가 있어도 계속 진행
      }
    }
    
    // 상태 파라미터로부터 리다이렉트 URL 결정
    // 기본값은 홈페이지
    let redirectUrl = '/';
    
    if (state) {
      try {
        // state는 원래 요청된 콜백 URL
        const decodedState = decodeURIComponent(state);
        // 여기서는 /auth/social-callback?callbackUrl=/XXX 형식으로 온다고 가정
        const callbackUrl = new URL(decodedState);
        const finalCallbackUrl = callbackUrl.searchParams.get('callbackUrl');
        if (finalCallbackUrl) {
          redirectUrl = finalCallbackUrl;
        }
      } catch (e) {
        console.error('리다이렉트 URL 파싱 오류:', e);
      }
    }
    
    console.log('최종 리다이렉트 URL:', redirectUrl);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
    
  } catch (error) {
    console.error('카카오 로그인 처리 중 오류:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
