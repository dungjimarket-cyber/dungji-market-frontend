'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, Shield, CheckCircle } from 'lucide-react';
import { phoneVerificationService } from '@/lib/api/phoneVerification';

interface PhoneVerificationProps {
  purpose?: 'signup' | 'profile' | 'password_reset';
  onVerified?: (phoneNumber: string) => void;
  className?: string;
  defaultValue?: string;
  currentUserToken?: string; // 현재 사용자 토큰 (프로필 수정 시)
}

export function PhoneVerification({
  purpose = 'signup',
  onVerified,
  className = '',
  defaultValue = '',
  currentUserToken
}: PhoneVerificationProps) {
  // 전화번호 포맷팅 함수 (컴포넌트 외부로 이동하여 초기값에도 사용)
  const formatPhoneNumber = (value: string): string => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    
    // 11자리 초과 방지
    const limitedNumbers = numbers.slice(0, 11);
    
    // 포맷팅 적용
    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 7) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
    } else if (limitedNumbers.length <= 11) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 7)}-${limitedNumbers.slice(7)}`;
    }
    
    return value;
  };

  const [phoneNumber, setPhoneNumber] = useState(defaultValue ? formatPhoneNumber(defaultValue) : '');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);

  // 타이머 효과
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && codeSent && !isVerified) {
      setError('인증번호가 만료되었습니다. 다시 요청해주세요.');
      setCodeSent(false);
    }
  }, [timer, codeSent, isVerified]);

  // 전화번호 입력 핸들러
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError('');
    setIsDuplicate(false); // 번호 변경 시 중복 상태 초기화
  };

  // 인증번호 전송
  const handleSendCode = async () => {
    if (!phoneNumber) {
      setError('휴대폰 번호를 입력해주세요.');
      return;
    }

    if (!phoneVerificationService.validatePhoneNumber(phoneNumber)) {
      setError('올바른 휴대폰 번호 형식이 아닙니다.');
      return;
    }

    setIsSending(true);
    setError('');
    setSuccess('');

    // 모든 경우에 중복 체크 수행
    // 프로필 수정 시에는 자신의 번호는 제외하기 위해 토큰 전달
    try {
      const duplicateCheck = await phoneVerificationService.checkPhoneDuplicate(
        phoneNumber,
        purpose === 'profile' ? currentUserToken : undefined
      );
      if (!duplicateCheck.available) {
        setError('이미 등록된 번호입니다.');
        setIsDuplicate(true);
        setIsSending(false);
        return;
      }
    } catch (err) {
      console.error('중복 확인 오류:', err);
      // 중복 확인 실패해도 계속 진행
    }

    try {
      const result = await phoneVerificationService.sendVerification({
        phone_number: phoneNumber,
        purpose
      });

      if (result.success) {
        setSuccess('인증번호가 발송되었습니다.');
        setCodeSent(true);
        setTimer(180); // 3분 타이머
        setVerificationCode('');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || '인증번호 발송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('인증번호를 입력해주세요.');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('인증번호는 6자리입니다.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await phoneVerificationService.verifyPhone({
        phone_number: phoneNumber,
        verification_code: verificationCode,
        purpose
      });

      if (result.success) {
        setIsVerified(true);
        setCodeSent(false); // 인증 완료 시 코드 전송 상태 false로 변경
        setSuccess('휴대폰 인증이 완료되었습니다.');
        setTimer(0);
        setError(''); // 에러 메시지 초기화
        
        // 인증 완료 콜백 호출 (포맷된 번호 전달)
        if (onVerified) {
          onVerified(phoneNumber);
        }
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || '인증에 실패했습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  // 타이머 포맷팅
  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="phone">
          휴대폰 번호
          {isVerified && (
            <span className="ml-2 text-green-600 text-sm">
              <CheckCircle className="inline w-4 h-4 mr-1" />
              인증완료
            </span>
          )}
        </Label>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="phone"
              type="tel"
              placeholder="휴대폰 번호를 입력하세요"
              value={phoneNumber}
              onChange={handlePhoneChange}
              disabled={isVerified}
              className={isVerified ? 'bg-gray-50' : ''}
            />
            {isDuplicate && (
              <p className="text-sm text-red-500 mt-1">이미 등록된 번호입니다.</p>
            )}
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleSendCode}
            disabled={isSending || isVerified || (codeSent && timer > 0)}
            className="min-w-[100px]"
          >
            {isSending ? (
              '발송 중...'
            ) : codeSent && timer > 0 ? (
              `재발송 ${formatTimer()}`
            ) : (
              '인증번호 발송'
            )}
          </Button>
        </div>
      </div>

      {codeSent && !isVerified && (
        <div className="space-y-2">
          <Label htmlFor="code">인증번호</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="code"
                type="text"
                placeholder="6자리 숫자 입력"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                maxLength={6}
              />
            </div>
            
            <Button
              type="button"
              onClick={handleVerifyCode}
              disabled={isVerifying || timer === 0}
              className="min-w-[100px]"
            >
              {isVerifying ? '확인 중...' : '인증 확인'}
            </Button>
          </div>
          
          {timer > 0 && (
            <p className="text-sm text-gray-600">
              남은 시간: {formatTimer()}
            </p>
          )}
        </div>
      )}

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

      {purpose === 'signup' && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <Shield className="inline w-4 h-4 mr-1" />
          휴대폰 인증은 안전한 거래를 위해 필요합니다.
          인증된 번호는 거래 알림 등에 사용됩니다.
        </div>
      )}
    </div>
  );
}