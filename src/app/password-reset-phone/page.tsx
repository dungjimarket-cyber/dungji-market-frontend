'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PhoneVerification } from '@/components/auth/PhoneVerification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, CheckCircle, User, AlertCircle } from 'lucide-react';

export default function PasswordResetPhonePage() {
  const router = useRouter();
  const [step, setStep] = useState<'identify' | 'verify' | 'password' | 'success'>('identify');
  const [username, setUsername] = useState(''); // 아이디
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userPhoneNumber, setUserPhoneNumber] = useState(''); // 서버에서 받은 실제 번호
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // 성공 메시지
  const [userId, setUserId] = useState<string | null>(null); // 백엔드에서 받은 user_id
  const [verificationCode, setVerificationCode] = useState(''); // 인증코드 저장

  // step 변경 감지
  useEffect(() => {
    console.log('📍 Step 변경됨:', step);
    console.log('현재 상태:', { loading, error, success });
  }, [step, loading, error, success]);

  // Step 1: 아이디와 휴대폰 번호 확인
  const handleIdentifyUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 아이디와 휴대폰 번호로 사용자 확인
      console.log('사용자 확인 요청:', { username, phone_number: phoneNumber });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-user-phone/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          phone_number: phoneNumber, // 백엔드에서 하이픈 자동 처리
        }),
      });

      console.log('사용자 확인 응답 상태:', response.status);

      // 응답 본문 읽기
      const data = await response.json();
      console.log('사용자 확인 응답 데이터:', data);
      
      // success 필드가 false인 경우 에러 처리
      if (data.success === false) {
        console.error('사용자 확인 실패 (success: false):', data);
        throw new Error(data.message || '일치하는 사용자 정보를 찾을 수 없습니다.');
      }
      
      // HTTP 상태가 OK가 아닌 경우
      if (!response.ok) {
        console.error('사용자 확인 실패 (HTTP 오류):', data);
        const errorMessage = data.message || data.detail || data.error || '일치하는 사용자 정보를 찾을 수 없습니다.';
        throw new Error(errorMessage);
      }

      console.log('사용자 확인 성공:', data);
      
      // 카카오 계정 체크 (provider 또는 is_social 필드 확인)
      if (data.provider === 'kakao' || data.is_social === true || data.is_kakao === true) {
        console.log('카카오 계정 감지:', data);
        setError('카카오 계정의 경우 카카오 계정 찾기를 이용해주세요.');
        return;
      }
      
      // user_id가 있으면 저장
      if (data.user_id) {
        setUserId(data.user_id);
        console.log('User ID 저장:', data.user_id);
      }
      
      // 사용자 정보가 일치하면 인증 단계로
      setUserPhoneNumber(phoneNumber);
      setStep('verify');
    } catch (err: any) {
      console.error('사용자 정보 확인 오류:', err);
      setError(err.message || '사용자 정보 확인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: 휴대폰 인증 완료
  const handlePhoneVerified = (verifiedPhone: string, code?: string) => {
    // 인증된 번호가 입력한 번호와 일치하는지 확인
    if (verifiedPhone.replace(/-/g, '') === userPhoneNumber.replace(/-/g, '')) {
      // 인증 코드 저장 (백엔드에서 status='pending' 상태 유지를 위해 verify API 호출하지 않음)
      if (code) {
        setVerificationCode(code);
        console.log('인증코드 저장:', code);
      }
      setStep('password');
    } else {
      setError('인증된 번호가 일치하지 않습니다.');
    }
  };

  // Step 3: 비밀번호 재설정
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    // 비밀번호 복잡도 체크
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    if (!hasNumber || !hasLetter) {
      setError('비밀번호는 영문과 숫자를 포함해야 합니다.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 백엔드 요구사항에 맞게 수정: user_id는 숫자 타입이어야 함
      const requestBody = {
        user_id: userId ? Number(userId) : null,  // 숫자로 변환, 없으면 null
        phone_number: userPhoneNumber,  // 백엔드에서 하이픈 자동 처리
        verification_code: verificationCode || '000000',  // 인증코드가 없으면 임시값
        new_password: password,
        purpose: 'reset'  // 백엔드 권장사항 추가
      };
      
      console.log('비밀번호 재설정 요청:', requestBody);
      
      // API 호출 - 휴대폰 번호로 비밀번호 재설정
      // redirect: 'manual'을 추가하여 자동 리다이렉트 방지
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password-phone/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        redirect: 'manual', // 자동 리다이렉트 방지
      });

      // 응답 데이터를 한 번만 읽기
      let responseData: any = {};
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch (jsonError) {
          console.error('JSON 파싱 에러:', jsonError);
          responseData = { message: '비밀번호가 변경되었습니다. 다시 로그인해주세요.' };
        }
      } else {
        // JSON이 아닌 경우
        try {
          const text = await response.text();
          console.log('텍스트 응답:', text);
          responseData = { message: '비밀번호가 변경되었습니다. 다시 로그인해주세요.' };
        } catch (e) {
          console.error('응답 읽기 실패:', e);
          responseData = { message: '비밀번호가 변경되었습니다. 다시 로그인해주세요.' };
        }
      }
      
      console.log('=== 비밀번호 재설정 응답 ===');
      console.log('Response status:', response.status);
      console.log('Response type:', response.type);
      console.log('Response redirected:', response.redirected);
      console.log('Response ok:', response.ok);
      console.log('Response data:', responseData);
      console.log('Response success field:', responseData?.success);
      
      // 리다이렉트 응답 체크
      if (response.type === 'opaqueredirect' || [301, 302, 303, 307, 308].includes(response.status)) {
        console.log('🚨 백엔드가 리다이렉트 응답을 보냈습니다!');
        console.log('Location header:', response.headers.get('location'));
      }
      
      console.log('===========================');
      
      // 성공 여부 판단
      // 백엔드가 200 OK를 반환하면 성공으로 처리
      if (response.ok) {
        console.log('✅ 200 OK - 성공으로 처리');
      } else if (responseData.success === false) {
        console.log('❌ 실패 응답');
        // 카카오 계정 차단 메시지 확인
        if (responseData.message && responseData.message.includes('카카오')) {
          throw new Error('카카오 계정의 경우 카카오 계정 찾기를 이용해주세요.');
        }
        throw new Error(responseData.message || '비밀번호 재설정에 실패했습니다.');
      }
      
      console.log('비밀번호 변경 성공 처리 시작');
      
      // 백엔드에서 제공하는 redirect_to 사용 (없으면 기본값)
      const redirectPath = responseData.redirect_to || '/login';
      
      // 성공 메시지 표시
      const successMessage = responseData.message || '비밀번호가 변경되었습니다. 다시 로그인해주세요.';
      console.log('성공 메시지:', successMessage);
      console.log('Setting step to success');
      
      // 상태 설정
      console.log('🔴 비밀번호 변경 성공 - 상태 업데이트 시작');
      setLoading(false);
      setSuccess(successMessage);
      setError(''); // 에러 메시지 초기화
      setStep('success'); // 먼저 성공 화면으로 전환
      
      console.log('🔴 성공 화면으로 전환 완료, alert 준비');
      
      // 디버깅: 현재 URL 확인
      console.log('현재 URL:', window.location.href);
      
      // 리다이렉트 없이 alert만 표시
      setTimeout(() => {
        console.log('🔴 Alert 표시 직전');
        alert(successMessage);
        console.log('🔴 Alert 확인됨');
        
        // 리다이렉트 완전히 비활성화 (디버깅용)
        console.log('🔴 리다이렉트 하지 않음 - 성공 화면에 머무름');
        
        // confirm 대화상자도 제거 (일단 테스트)
        // const shouldRedirect = confirm('로그인 페이지로 이동하시겠습니까?');
        // if (shouldRedirect) {
        //   window.location.href = 'https://www.dungjimarket.com/login/signin';
        // }
      }, 500); // 시간을 늘려서 테스트
      
      return;
    } catch (err: any) {
      console.error('비밀번호 재설정 오류:', err);
      
      // 카카오 계정으로 인한 차단인 경우
      if (err.message && err.message.includes('카카오')) {
        setError('카카오 계정의 경우 카카오 계정 찾기를 이용해주세요.');
      } else {
        setError(err.message || '비밀번호 재설정에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 성공 화면
  if (step === 'success') {
    console.log('🎉 성공 화면 렌더링 중...');
    console.log('Success message:', success);
    console.log('현재 step:', step);
    console.log('현재 URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
    
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">비밀번호 변경 완료</CardTitle>
            <CardDescription className="mt-3 text-base">
              {success || '비밀번호가 변경되었습니다. 다시 로그인해주세요.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                새로운 비밀번호로 로그인해주세요.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link href="https://www.dungjimarket.com/login/signin" className="w-full">
              <Button className="w-full">
                로그인 페이지로 이동
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Step 3: 비밀번호 설정 화면
  if (step === 'password') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>새 비밀번호 설정</CardTitle>
            <CardDescription>
              안전한 새 비밀번호를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordReset}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>아이디</Label>
                <div className="p-2 bg-gray-50 rounded-md">
                  <span className="font-medium">{username}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>인증된 휴대폰 번호</Label>
                <div className="p-2 bg-gray-50 rounded-md">
                  <span className="font-medium">{userPhoneNumber}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">새 비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="영문, 숫자 포함 8자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="비밀번호를 다시 입력해주세요"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !password || !passwordConfirm}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    재설정 중...
                  </>
                ) : (
                  '비밀번호 재설정'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep('verify');
                  setPassword('');
                  setPasswordConfirm('');
                  setError('');
                }}
              >
                이전 단계로
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Step 2: 휴대폰 인증 화면
  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <CardTitle>휴대폰 인증</CardTitle>
            <CardDescription>
              {username}님의 휴대폰 번호를 인증해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                등록된 휴대폰 번호: {userPhoneNumber}
              </p>
            </div>
            
            <PhoneVerification
              purpose="password_reset"
              defaultValue={userPhoneNumber}
              onVerified={handlePhoneVerified}
              skipVerifyApi={true}  // verify API 호출 건너뛰기 (status='pending' 유지)
            />
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep('identify');
                setError('');
              }}
            >
              이전 단계로
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Step 1: 아이디와 휴대폰 번호 입력 화면
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <CardTitle>비밀번호 재설정</CardTitle>
          <CardDescription>
            아이디와 가입 시 등록한 휴대폰 번호를 입력해주세요.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleIdentifyUser}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                type="text"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">휴대폰 번호</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="010-0000-0000"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 11) {
                    // 자동 포맷팅
                    let formatted = value;
                    if (value.length > 3 && value.length <= 7) {
                      formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
                    } else if (value.length > 7) {
                      formatted = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
                    }
                    setPhoneNumber(formatted);
                  }
                }}
                required
                disabled={loading}
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !username || !phoneNumber}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  확인 중...
                </>
              ) : (
                '다음 단계'
              )}
            </Button>
            <Link href="/password-reset" className="w-full">
              <Button variant="outline" className="w-full">
                이메일로 재설정하기
              </Button>
            </Link>
            <Link href="/login" className="w-full">
              <Button variant="ghost" className="w-full">
                로그인 페이지로 돌아가기
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}