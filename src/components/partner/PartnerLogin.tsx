'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePartner } from '@/contexts/PartnerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function PartnerLogin() {
  const [partnerId, setPartnerId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = usePartner();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!partnerId || !password) {
      setError('파트너 ID와 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await login(partnerId, password);
      if (success) {
        router.push('/partner-dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">둥지마켓</h1>
          <p className="text-lg text-gray-600 mt-2">파트너 센터</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">파트너 로그인</CardTitle>
            <CardDescription>
              파트너 ID와 비밀번호를 입력하여 로그인하세요.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="partnerId">파트너 ID</Label>
                <Input
                  id="partnerId"
                  type="text"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  placeholder="파트너 ID를 입력하세요"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    로그인 중...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    로그인
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">또는</span>
              </div>
            </div>

            {/* Kakao Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full bg-yellow-300 hover:bg-yellow-400 border-yellow-300 text-yellow-900"
              disabled={isLoading}
              onClick={() => {
                // Kakao OAuth URL with partner role
                const kakaoClientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
                const redirectUri = `${window.location.origin}/api/auth/callback/kakao`;
                const state = encodeURIComponent(JSON.stringify({ 
                  role: 'partner', 
                  callbackUrl: '/partner-dashboard' 
                }));
                
                const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`;
                window.location.href = kakaoAuthUrl;
              }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c5.799 0 10.5 3.664 10.5 8.199 0 4.535-4.701 8.199-10.5 8.199a13.124 13.124 0 01-3.188-.396l-3.637 2.351c-.239.154-.543.047-.543-.239V18.33c-1.988-1.499-3.132-3.662-3.132-6.131C1.5 6.664 6.201 3 12 3z"/>
              </svg>
              카카오로 로그인
            </Button>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>파트너 계정이 필요하신가요?</p>
              <p className="mt-1">
                파트너십 문의: <a href="mailto:partner@dungjimarket.com" className="text-blue-600 hover:underline">partner@dungjimarket.com</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}