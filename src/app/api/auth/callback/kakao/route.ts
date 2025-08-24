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
        client_id: process.env.KAKAO_CLIENT_ID || 'a197177aee0ddaf6b827a6225aa48653',
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
    
    // state로부터 role과 referral_code 정보 추출
    let userRole = 'buyer'; // 기본값
    let callbackUrl = '/'; // 기본값
    let referralCode = ''; // 추천인 코드
    
    console.log('🔍 [카카오 콜백] 받은 state 원본:', state);
    
    if (state) {
      try {
        // state가 JSON 문자열인지 확인
        if (state.startsWith('{')) {
          // JSON 형식인 경우
          const stateData = JSON.parse(decodeURIComponent(state));
          console.log('📦 [카카오 콜백] 파싱된 state 데이터:', stateData);
          
          if (stateData.role) {
            userRole = stateData.role;
            console.log('👤 [카카오 콜백] 사용자 역할:', userRole);
          }
          if (stateData.referral_code) {
            referralCode = stateData.referral_code;
            console.log('🎟️ [카카오 콜백] 추천인 코드:', referralCode);
          }
          if (stateData.redirectUrl) {
            callbackUrl = stateData.redirectUrl;
          } else if (stateData.callbackUrl) {
            callbackUrl = stateData.callbackUrl;
          }
        } else {
          // 이전 버전 호환성 - state가 단순 URL인 경우
          console.log('⚠️ [카카오 콜백] state가 JSON이 아님, URL로 처리');
          callbackUrl = decodeURIComponent(state);
        }
      } catch (e) {
        console.error('❌ [카카오 콜백] state 파싱 오류:', e, 'state:', state);
        // 파싱 실패 시 state를 그대로 callbackUrl로 사용
        callbackUrl = decodeURIComponent(state);
      }
    } else {
      console.log('⚠️ [카카오 콜백] state가 없음');
    }
    
    console.log('카카오 정보 처리:', {
      kakaoId,
      email,
      emailProvided: kakaoAccount.email ? '제공됨' : '자동생성',
      name,
      profileImage: profileImage ? '있음' : '없음',
      userRole, // role 정보 추가
      referralCode, // 추천인 코드 추가
      callbackUrl
    });
    
    // 백엔드에 필요한 형식으로 데이터 전송 (role과 referral_code 포함)
    const requestBody = {
      sns_id: String(kakaoId),
      sns_type: 'kakao',
      email: email,
      name: name,
      profile_image: profileImage,
      role: userRole, // role 정보 추가
      referral_code: referralCode, // 추천인 코드 추가
    };
    
    console.log('📤 [카카오 콜백] 백엔드로 전송할 데이터:', {
      ...requestBody,
      referral_code_exists: !!referralCode,
      referral_code_length: referralCode?.length || 0
    });
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/sns-login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
    
    // 신규 사용자이면서 회원가입이 필요한 경우
    if (data.requires_registration) {
      console.log('신규 사용자 - 회원가입 페이지로 리다이렉트');
      
      // 카카오 정보를 세션 스토리지에 저장 (회원가입 페이지에서 사용)
      const kakaoInfo = {
        sns_id: data.sns_id,
        sns_type: data.sns_type,
        email: data.email,
        name: data.name,
        profile_image: data.profile_image
      };
      
      // 쿠키에 임시로 저장 (클라이언트에서 읽을 수 있도록)
      const cookieStore = await cookies();
      cookieStore.set('kakao_temp_info', JSON.stringify(kakaoInfo), {
        maxAge: 60 * 10, // 10분
        path: '/',
        sameSite: 'lax',
      });
      
      // 회원가입 페이지로 리다이렉트 (memberType 포함)
      return NextResponse.redirect(new URL(`/register?from=kakao&memberType=${userRole}`, request.url));
    }
    
    // JWT 토큰 저장 (기존 회원인 경우)
    if (data.jwt?.access) {
      try {
        console.log('✅ JWT 토큰 추출 성공:', { 
          tokenLength: data.jwt.access.length,
          preview: data.jwt.access.substring(0, 15) + '...'
        });

        // Next.js 14부터는 cookies()를 사용할 때도 await 필요
        const cookieStore = await cookies();
        
        // 파트너 로그인인 경우 파트너 토큰으로 저장
        if (userRole === 'partner') {
          cookieStore.set('partner_token', data.jwt.access, { 
            maxAge: 60 * 60 * 24, // 1일
            path: '/',
            sameSite: 'lax',
          });
          
          if (data.jwt.refresh) {
            cookieStore.set('partner_refresh_token', data.jwt.refresh, {
              maxAge: 60 * 60 * 24 * 7, // 7일
              path: '/',
              sameSite: 'lax',
            });
          }
        } else {
          // 일반 사용자 토큰 저장
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
        }
      } catch (cookieError) {
        console.error('❌ 쿠키 설정 오류:', cookieError);
        // 쿠키 설정 오류가 있어도 계속 진행
      }
    }
    
    // 리다이렉트 URL은 이미 state에서 추출됨
    let redirectUrl = callbackUrl;
    
    console.log('최종 리다이렉트 URL:', redirectUrl);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
    
  } catch (error) {
    console.error('카카오 로그인 처리 중 오류:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
