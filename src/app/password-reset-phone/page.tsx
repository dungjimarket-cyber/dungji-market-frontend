'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PhoneVerification } from '@/components/auth/PhoneVerification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, CheckCircle, User } from 'lucide-react';

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

  // Step 1: 아이디와 휴대폰 번호 확인
  const handleIdentifyUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 아이디와 휴대폰 번호로 사용자 확인
      console.log('사용자 확인 요청:', { username, phone_number: phoneNumber.replace(/-/g, '') });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-user-phone/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          phone_number: phoneNumber.replace(/-/g, ''), // 하이픈 제거
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
  const handlePhoneVerified = (verifiedPhone: string) => {
    // 인증된 번호가 입력한 번호와 일치하는지 확인
    if (verifiedPhone.replace(/-/g, '') === userPhoneNumber.replace(/-/g, '')) {
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
      // API 호출 - 휴대폰 번호로 비밀번호 재설정
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password-phone/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          phone_number: userPhoneNumber.replace(/-/g, ''),
          new_password: password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '비밀번호 재설정에 실패했습니다.');
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message || '비밀번호 재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 성공 화면
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>비밀번호가 재설정되었습니다</CardTitle>
            <CardDescription className="mt-2">
              새로운 비밀번호로 로그인할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button className="w-full">
                로그인하기
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