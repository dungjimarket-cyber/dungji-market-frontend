import React, { useState, ReactNode } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

/**
 * 아이디/비밀번호 찾기 모달 통합 컴포넌트
 * @example
 * <FindAccountModals open={open} onOpenChange={setOpen} />
 */
export function FindAccountModals({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [tab, setTab] = useState<'username'|'password'>('username');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xs p-6 bg-white rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold">
            {tab === 'username' ? '아이디 찾기' : '비밀번호 찾기'}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-500">
            {tab === 'username' ? '가입한 휴대폰 번호로 아이디를 찾을 수 있습니다.' : '가입한 휴대폰 번호로 비밀번호를 재설정할 수 있습니다.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex mb-4 border-b">
          <button className={`flex-1 py-2 text-sm font-semibold ${tab==='username' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`} onClick={()=>setTab('username')}>아이디 찾기</button>
          <button className={`flex-1 py-2 text-sm font-semibold ${tab==='password' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`} onClick={()=>setTab('password')}>비밀번호 찾기</button>
        </div>
        {tab==='username' ? <FindUsernameForm onClose={()=>onOpenChange(false)} /> : <ResetPasswordForm onClose={()=>onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

/**
 * 아이디 찾기 폼
 */
function FindUsernameForm({ onClose }: { onClose: () => void }): ReactNode {
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setErrorMessage('');
    try {
      // API 호출 경로 - 환경변수가 이미 /api로 끝나는지 확인
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${apiUrl}/auth/find-username-by-phone/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone.replace(/-/g, '') }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.username);
      } else {
        try {
          const errText = await res.text();
          console.log('서버 오류 응답 원본:', errText);
          
          // JSON 형식인지 확인
          let err;
          try {
            err = JSON.parse(errText);
          } catch {
            // JSON이 아니면 원본 텍스트 표시
            setErrorMessage(errText || '아이디 찾기에 실패했습니다.');
            return;
          }
          
          console.log('바뀐 오류 응답:', err);
          
          // 오류 메시지 추출
          let errorMessage = '';
          
          // 검증 오류 가장 먼저 처리
          if (err.phone_number) {
            errorMessage = Array.isArray(err.phone_number) ? err.phone_number[0] : err.phone_number;
            console.log('휴대폰 번호 오류 추출:', errorMessage);
          } else if (err.detail) {
            errorMessage = err.detail;
          } else if (typeof err === 'string') {
            errorMessage = err;
          } else {
            // 오류 객체에서 처리할 수 있는 모든 값 처리
            const allErrors: string[] = [];
            Object.keys(err).forEach(key => {
              const value = err[key];
              if (Array.isArray(value) && value.length > 0) {
                allErrors.push(value[0]);
              } else if (typeof value === 'string') {
                allErrors.push(value);
              }
            });
            
            errorMessage = allErrors.length > 0 ? allErrors[0] : '아이디 찾기에 실패했습니다.';
          }
          
          // 오류 메시지 직접 표시
          setErrorMessage(errorMessage);
          console.warn('아이디 찾기 오류:', errorMessage);
        } catch (parseError) {
          console.error('오류 응답 파싱 중 문제 발생:', parseError);
          setErrorMessage('서버 응답을 처리하는 중 문제가 발생했습니다.');
        }
      }
    } catch (e) {
      setErrorMessage('서버와 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  return result ? (
    <div className="text-center">
      <p className="mb-2 text-gray-700">가입된 아이디(유저명):</p>
      <div className="mb-4 text-lg font-bold text-blue-600">{result}</div>
      <button className="w-full py-2 rounded bg-blue-600 text-white font-semibold" onClick={onClose}>닫기</button>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 오류 메시지 표시 영역 */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm font-medium">{errorMessage}</p>
        </div>
      )}
      
      <label className="block text-sm font-medium text-gray-700">휴대폰 번호</label>
      <input 
        type="tel" 
        required 
        className="w-full px-3 py-2 border rounded" 
        value={phone} 
        onChange={handlePhoneChange}
        placeholder="010-0000-0000"
        maxLength={13}
      />
      <button type="submit" disabled={loading} className="w-full py-2 rounded bg-blue-600 text-white font-semibold">
        {loading ? '확인 중...' : '아이디 찾기'}
      </button>
    </form>
  );
}

/**
 * 비밀번호 찾기 폼
 */
function ResetPasswordForm({ onClose }: { onClose: () => void }): ReactNode {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [step, setStep] = useState<'input' | 'verify' | 'reset' | 'complete'>('input');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [timer, setTimer] = useState(0);
  
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  // Timer for verification code expiry
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Send verification code (email or phone)
  const sendVerificationCode = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      if (method === 'email') {
        const res = await fetch(`${apiUrl}/auth/password-reset/send-email/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email }),
        });
        
        if (res.ok) {
          const data = await res.json();
          setStep('verify');
          setTimer(300); // 5 minutes
          toast({ title: '인증번호가 이메일로 발송되었습니다.' });
        } else {
          const err = await res.json();
          setErrorMessage(err.error || '인증번호 발송에 실패했습니다.');
        }
      } else {
        // Phone method (existing logic)
        const res = await fetch(`${apiUrl}/auth/reset-password-by-phone/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phone.replace(/-/g, ''), username }),
        });
        
        if (res.ok) {
          setStep('complete');
          toast({ title: '임시 비밀번호가 SMS로 전송되었습니다.' });
        } else {
          const err = await res.json();
          setErrorMessage(err.error || '비밀번호 재설정에 실패했습니다.');
        }
      }
    } catch (e) {
      setErrorMessage('서버와 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Verify email code
  const verifyEmailCode = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${apiUrl}/auth/password-reset/verify-email/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, verification_code: verificationCode }),
      });
      
      if (res.ok) {
        setStep('reset');
        toast({ title: '인증이 완료되었습니다.' });
      } else {
        const err = await res.json();
        setErrorMessage(err.error || '인증에 실패했습니다.');
      }
    } catch (e) {
      setErrorMessage('서버와 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (newPassword.length < 8) {
      setErrorMessage('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${apiUrl}/auth/password-reset/reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
        credentials: 'include', // Include session cookies
      });
      
      if (res.ok) {
        setStep('complete');
        toast({ title: '비밀번호가 성공적으로 변경되었습니다.' });
      } else {
        const err = await res.json();
        setErrorMessage(err.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch (e) {
      setErrorMessage('서버와 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'input') {
      await sendVerificationCode();
    } else if (step === 'verify') {
      await verifyEmailCode();
    } else if (step === 'reset') {
      await resetPassword();
    }
  };

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return checks;
  };

  const passwordChecks = validatePassword(newPassword);

  // Step 1: Input username and email/phone
  if (step === 'input') {
    return (
      <div className="space-y-4">
        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Method selection tabs */}
        <div className="flex mb-4 border-b">
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-semibold ${method === 'email' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`} 
            onClick={() => setMethod('email')}
          >
            이메일 인증
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-semibold ${method === 'phone' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`} 
            onClick={() => setMethod('phone')}
          >
            휴대폰 인증
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">아이디</label>
            <input 
              type="text" 
              required 
              className="w-full px-3 py-2 border rounded" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="아이디를 입력하세요" 
            />
          </div>

          {method === 'email' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">이메일</label>
              <input 
                type="email" 
                required 
                className="w-full px-3 py-2 border rounded" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="example@email.com" 
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">휴대폰 번호</label>
              <input 
                type="tel" 
                required 
                className="w-full px-3 py-2 border rounded" 
                value={phone} 
                onChange={handlePhoneChange}
                placeholder="010-0000-0000"
                maxLength={13}
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-2 rounded bg-blue-600 text-white font-semibold disabled:bg-gray-400"
          >
            {loading ? '발송 중...' : (method === 'email' ? '인증번호 발송' : '임시 비밀번호 발송')}
          </button>
        </form>
      </div>
    );
  }

  // Step 2: Verify email code (only for email method)
  if (step === 'verify') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">인증번호 입력</h3>
          <p className="text-sm text-gray-600">
            {email}로 발송된 인증번호를 입력해주세요.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">인증번호</label>
            <div className="relative">
              <input 
                type="text" 
                required 
                maxLength={6}
                className="w-full px-3 py-2 border rounded" 
                value={verificationCode} 
                onChange={e => setVerificationCode(e.target.value)} 
                placeholder="인증번호 6자리" 
              />
              {timer > 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 text-sm">
                  {formatTimer(timer)}
                </div>
              )}
            </div>
          </div>

          <button 
            type="button"
            disabled={loading || timer > 0}
            onClick={() => sendVerificationCode()}
            className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
          >
            인증번호 재발송
          </button>

          <button 
            type="submit" 
            disabled={loading || verificationCode.length !== 6} 
            className="w-full py-2 rounded bg-blue-600 text-white font-semibold disabled:bg-gray-400"
          >
            {loading ? '인증 중...' : '인증하기'}
          </button>
        </form>
      </div>
    );
  }

  // Step 3: Set new password (only for email method)
  if (step === 'reset') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">새 비밀번호 설정</h3>
          <p className="text-sm text-gray-600">안전한 비밀번호를 설정해주세요.</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">새 비밀번호</label>
            <input 
              type="password" 
              required 
              className="w-full px-3 py-2 border rounded" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              placeholder="새 비밀번호 입력" 
            />
            
            {/* Password strength indicators */}
            {newPassword && (
              <div className="mt-2 space-y-1 text-xs">
                <div className={`flex items-center gap-2 ${passwordChecks.length ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{passwordChecks.length ? '✓' : '○'}</span>
                  <span>8자 이상</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.upper ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{passwordChecks.upper ? '✓' : '○'}</span>
                  <span>영문 대문자 포함</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.lower ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{passwordChecks.lower ? '✓' : '○'}</span>
                  <span>영문 소문자 포함</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.number ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{passwordChecks.number ? '✓' : '○'}</span>
                  <span>숫자 포함</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.special ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{passwordChecks.special ? '✓' : '○'}</span>
                  <span>특수문자 포함</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
            <input 
              type="password" 
              required 
              className="w-full px-3 py-2 border rounded" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              placeholder="새 비밀번호 확인" 
            />
            
            {confirmPassword && (
              <div className={`mt-1 text-xs flex items-center gap-2 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                <span>{newPassword === confirmPassword ? '✓' : '○'}</span>
                <span>{newPassword === confirmPassword ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}</span>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || !Object.values(passwordChecks).every(Boolean) || newPassword !== confirmPassword} 
            className="w-full py-2 rounded bg-blue-600 text-white font-semibold disabled:bg-gray-400"
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    );
  }

  // Step 4: Completion
  if (step === 'complete') {
    return (
      <div className="text-center space-y-4">
        <div className="text-6xl">✅</div>
        <h3 className="text-lg font-semibold">
          {method === 'email' ? '비밀번호 변경 완료' : '임시 비밀번호 발송 완료'}
        </h3>
        <p className="text-sm text-gray-600">
          {method === 'email' ? '새로운 비밀번호로 로그인해주세요.' : '임시 비밀번호가 SMS로 전송되었습니다.'}
        </p>
        <button 
          className="w-full py-2 rounded bg-blue-600 text-white font-semibold" 
          onClick={onClose}
        >
          확인
        </button>
      </div>
    );
  }

  return null;
}

export default FindAccountModals;
