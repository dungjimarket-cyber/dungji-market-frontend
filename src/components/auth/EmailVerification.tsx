'use client';

import { useState, useEffect } from 'react';
import { emailAuthService } from '@/lib/api/emailAuthService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, Mail } from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  name?: string;
  onVerified?: () => void;
  onResend?: () => void;
  purpose?: 'registration' | 'email-change';
}

export default function EmailVerification({
  email,
  name,
  onVerified,
  onResend,
  purpose = 'registration'
}: EmailVerificationProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendCode = async () => {
    setSending(true);
    setError('');
    setSuccess('');

    try {
      if (purpose === 'email-change') {
        await emailAuthService.sendEmailChangeCode(email);
      } else {
        await emailAuthService.sendVerificationEmail(email, name);
      }
      setSuccess('인증 코드가 발송되었습니다. 이메일을 확인해주세요.');
      setResendTimer(60); // 60초 재발송 제한
      if (onResend) onResend();
    } catch (err: any) {
      setError(err.message || '인증 코드 발송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('인증 코드는 6자리입니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await emailAuthService.verifyEmailCode(email, code);
      if (result.valid) {
        setVerified(true);
        setSuccess('이메일 인증이 완료되었습니다.');
        if (onVerified) onVerified();
      } else {
        setError(result.message || '잘못된 인증 코드입니다.');
      }
    } catch (err: any) {
      setError(err.message || '인증 코드 확인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 자동으로 인증 코드 발송
  useEffect(() => {
    handleSendCode();
  }, []);

  if (verified) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            이메일 인증이 완료되었습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Mail className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              이메일 인증이 필요합니다
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {email}로 인증 코드를 발송했습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">인증 코드</Label>
        <div className="flex space-x-2">
          <Input
            id="code"
            type="text"
            placeholder="6자리 숫자"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            disabled={loading || sending}
            className="font-mono text-lg tracking-wider text-center"
          />
          <Button
            onClick={handleVerifyCode}
            disabled={loading || !code || code.length !== 6}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              '확인'
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          이메일을 받지 못하셨나요?
        </span>
        <Button
          variant="link"
          onClick={handleSendCode}
          disabled={sending || resendTimer > 0}
          className="p-0 h-auto"
        >
          {sending ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              발송 중...
            </>
          ) : resendTimer > 0 ? (
            `${resendTimer}초 후 재발송`
          ) : (
            '인증 코드 재발송'
          )}
        </Button>
      </div>
    </div>
  );
}