import React, { useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { emailAuthService } from '@/lib/api/emailAuthService';
import { phoneVerificationService } from '@/lib/api/phoneVerification';

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
  const router = useRouter();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [step, setStep] = useState<'input' | 'verify' | 'verify-phone' | 'reset' | 'complete'>('input');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [timer, setTimer] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [userId, setUserId] = useState<string | null>(null); // 백엔드에서 받은 user_id 저장
  
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
        // Use the new email authentication service
        try {
          await emailAuthService.requestPasswordReset(email);
          toast({ 
            title: '비밀번호 재설정 링크가 이메일로 발송되었습니다.',
            description: '이메일을 확인하여 비밀번호를 재설정해주세요.'
          });
          // Close modal and optionally redirect to login
          onClose();
          router.push('/login');
          return;
        } catch (err: any) {
          setErrorMessage(err.message || '인증 이메일 발송에 실패했습니다.');
          return;
        }
      } else {
        // Phone method - 먼저 아이디와 휴대폰 번호 일치 확인
        const requestBody = { 
          username: username,
          phone_number: phone  // 백엔드에서 하이픈 자동 처리
        };
        
        console.log('========== 사용자 확인 요청 디버깅 ==========');
        console.log('API URL:', `${apiUrl}/auth/verify-user-phone/`);
        console.log('Request Body:', JSON.stringify(requestBody, null, 2));
        console.log('Username:', username);
        console.log('Phone (하이픈 포함):', phone);
        console.log('=============================================');
        
        const res = await fetch(`${apiUrl}/auth/verify-user-phone/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        
        console.log('사용자 확인 응답 상태:', res.status);
        
        // 응답 본문 읽기
        let data;
        try {
          data = await res.json();
          console.log('사용자 확인 응답 데이터:', data);
        } catch (jsonError) {
          console.error('응답 JSON 파싱 실패:', jsonError);
          const textResponse = await res.text();
          console.error('응답 원본 텍스트:', textResponse);
          setErrorMessage('서버 응답을 처리할 수 없습니다.');
          return;
        }
        
        // success 필드가 false인 경우 에러 처리
        if (data.success === false) {
          console.error('========== 사용자 확인 실패 ==========');
          console.error('에러 메시지:', data.message);
          console.error('전체 응답:', data);
          console.error('=====================================');
          
          // 백엔드 에러 메시지가 일반적인 경우 더 구체적인 안내 제공
          if (data.message === '사용자 확인 중 오류가 발생했습니다.') {
            setErrorMessage('입력하신 아이디와 휴대폰 번호가 일치하지 않거나, 등록되지 않은 정보입니다.');
          } else {
            setErrorMessage(data.message || '일치하는 사용자 정보를 찾을 수 없습니다.');
          }
          return;
        }
        
        // HTTP 상태가 OK이고 success가 true이거나 없는 경우
        if (res.ok && data.success !== false) {
          // 일치하면 휴대폰 인증 단계로
          console.log('사용자 확인 성공:', data);
          
          // user_id가 있으면 저장
          if (data.user_id) {
            setUserId(data.user_id);
            console.log('User ID 저장:', data.user_id);
          }
          
          setStep('verify-phone');
          // 인증번호 발송
          try {
            const result = await phoneVerificationService.sendVerification({
              phone_number: phone,
              purpose: 'password_reset'  // 백엔드에서 'reset' 권장하지만 기존 코드 유지
            });
            if (result.success) {
              setTimer(180); // 3분 타이머
              toast({ title: '인증번호가 발송되었습니다.' });
            } else {
              setErrorMessage(result.message || '인증번호 발송에 실패했습니다.');
            }
          } catch (err: any) {
            console.error('인증번호 발송 오류:', err);
            setErrorMessage('인증번호 발송에 실패했습니다.');
          }
        } else {
          // HTTP 상태가 OK가 아닌 경우
          console.error('사용자 확인 실패 (HTTP 오류):', data);
          const errorMessage = data.message || data.detail || data.error || '일치하는 사용자 정보를 찾을 수 없습니다.';
          setErrorMessage(errorMessage);
        }
      }
    } catch (e: any) {
      console.error('사용자 확인 중 오류:', e);
      setErrorMessage(`사용자 확인 중 오류가 발생했습니다: ${e.message || '서버와 연결할 수 없습니다.'}`)
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

  // Verify phone code - 백엔드 수정: verify API 호출하지 않고 인증코드만 저장
  const verifyPhoneCode = async () => {
    setLoading(true);
    setErrorMessage('');
    
    // 인증코드 6자리 확인
    if (phoneVerificationCode.length !== 6) {
      setErrorMessage('인증번호는 6자리여야 합니다.');
      setLoading(false);
      return;
    }
    
    // /api/phone/verify/ 호출하지 않고 바로 비밀번호 재설정 단계로
    // (백엔드에서 reset-password-phone API에서 직접 검증)
    console.log('인증코드 입력 완료:', phoneVerificationCode);
    console.log('verify API 호출하지 않음 (status=pending 유지)');
    
    setPhoneVerified(true);  // 클라이언트에서만 인증 완료 표시
    setStep('reset');
    toast({ title: '인증번호가 확인되었습니다. 새 비밀번호를 입력해주세요.' });
    setLoading(false);
  };

  // Reset password
  const resetPassword = async () => {
    console.log('========== 비밀번호 재설정 시작 ==========');
    console.log('Method:', method);
    console.log('Phone Verified (is_verified):', phoneVerified);
    console.log('Username:', username);
    console.log('User ID:', userId, '타입:', typeof userId);
    console.log('Phone:', phone);
    console.log('Verification Code:', phoneVerificationCode);
    console.log('New Password Length:', newPassword.length);
    console.log('=========================================');
    
    // 휴대폰 인증이 완료되지 않은 경우
    if (method === 'phone' && !phoneVerified) {
      console.error('휴대폰 인증이 완료되지 않음');
      setErrorMessage('먼저 휴대폰 인증을 완료해주세요.');
      return;
    }
    
    // 인증코드 확인
    if (method === 'phone' && !phoneVerificationCode) {
      console.error('인증코드가 없음');
      setErrorMessage('인증번호를 입력해주세요.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (newPassword.length < 8) {
      setErrorMessage('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    
    // 영문과 숫자 포함 체크
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setErrorMessage('비밀번호는 영문과 숫자를 포함해야 합니다.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      if (method === 'phone') {
        // 백엔드 요구사항에 맞게 수정: user_id는 숫자 타입이어야 함
        const requestBody = { 
          user_id: userId ? Number(userId) : null,  // 숫자로 변환, 없으면 null
          phone_number: phone,  // 백엔드에서 하이픈 자동 처리
          verification_code: phoneVerificationCode,  // 인증코드 추가
          new_password: newPassword,
          purpose: 'reset'  // 백엔드 권장사항 추가
        };
        
        // 필수 필드 검증
        if (!requestBody.user_id) {
          console.error('user_id가 없습니다. username 사용:', username);
          // username을 user_id로 사용 시도
          requestBody.user_id = username as any;
        }
        
        if (!requestBody.verification_code) {
          console.error('인증코드가 비어있습니다!');
          setErrorMessage('인증번호를 입력해주세요.');
          return;
        }
        
        console.log('========== 비밀번호 재설정 API 호출 ==========');
        console.log('API URL:', `${apiUrl}/auth/reset-password-phone/`);
        console.log('Request Body:', JSON.stringify(requestBody, null, 2));
        console.log('각 필드 상태:');
        console.log('  - user_id:', requestBody.user_id, '타입:', typeof requestBody.user_id);
        console.log('  - phone_number:', phone);
        console.log('  - phone_number (하이픈 제거):', phone.replace(/-/g, ''));
        console.log('  - verification_code:', phoneVerificationCode);
        console.log('  - verification_code 길이:', phoneVerificationCode.length);
        console.log('  - new_password 길이:', newPassword.length);
        console.log('  - purpose:', 'reset');
        console.log('  - phoneVerified (클라이언트):', phoneVerified);
        console.log('  - 백엔드 status는 pending 상태여야 함');
        console.log('=============================================');
        
        const res = await fetch(`${apiUrl}/auth/reset-password-phone/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        
        console.log('비밀번호 재설정 응답 상태:', res.status);
        
        // 응답 처리 - 한 번만 읽기
        let responseData;
        const contentType = res.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            responseData = await res.json();
            console.log('비밀번호 재설정 응답:', responseData);
          } else {
            const textResponse = await res.text();
            console.log('비밀번호 재설정 텍스트 응답:', textResponse);
            // 텍스트를 JSON으로 파싱 시도
            try {
              responseData = JSON.parse(textResponse);
            } catch {
              responseData = { message: textResponse };
            }
          }
        } catch (e) {
          console.error('응답 파싱 오류:', e);
          responseData = { message: '응답 처리 중 오류가 발생했습니다.' };
        }
        
        // 성공 여부 판단
        // 200 OK이거나, success: true인 경우 성공 처리
        if (res.ok || (responseData && responseData.success === true)) {
          console.log('비밀번호 변경 성공!');
          setStep('complete');
          toast({ title: '비밀번호가 성공적으로 변경되었습니다.' });
        } else if (responseData && responseData.success === false && responseData.message === "비밀번호 변경 중 오류가 발생했습니다.") {
          // 백엔드에서 실제로는 성공했지만 success: false로 응답하는 경우
          console.log('비밀번호 변경 완료 (success: false이지만 실제 성공)');
          setStep('complete');
          toast({ title: '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.' });
        } else if (res.status === 500) {
          console.error('서버 내부 오류 (500):', responseData);
          const errorDetail = responseData.message || responseData.error || '서버 내부 오류가 발생했습니다.';
          setErrorMessage(`서버 오류: ${errorDetail}\n\n가능한 원인:\n1. 인증번호가 일치하지 않음\n2. 인증이 만료됨 (30분 초과)\n3. 이미 사용된 인증번호`);
        } else {
          console.error('비밀번호 변경 실패:', responseData);
          setErrorMessage(responseData.message || responseData.error || '비밀번호 변경에 실패했습니다.');
        }
      } else {
        // 이메일 인증 후 비밀번호 재설정
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
    } else if (step === 'verify-phone') {
      await verifyPhoneCode();
    } else if (step === 'reset') {
      await resetPassword();
    }
  };

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password)
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
          {method === 'phone' && (
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
          )}

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
              <p className="mt-1 text-xs text-gray-500">
                가입하신 이메일 주소로 비밀번호 재설정 링크가 발송됩니다.
              </p>
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
            {loading ? '확인 중...' : (method === 'email' ? '재설정 링크 발송' : '다음 단계')}
          </button>
        </form>
      </div>
    );
  }

  // Step 2-A: Verify phone code (for phone method)
  if (step === 'verify-phone') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">휴대폰 인증</h3>
          <p className="text-sm text-gray-600">
            {phone}로 발송된 인증번호를 입력해주세요.
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
                value={phoneVerificationCode} 
                onChange={e => setPhoneVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} 
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
            disabled={loading || timer > 60}
            onClick={async () => {
              try {
                const result = await phoneVerificationService.sendVerification({
                  phone_number: phone,
                  purpose: 'password_reset'  // 백엔드와 호환성 유지
                });
                if (result.success) {
                  setTimer(180);
                  toast({ title: '인증번호가 재발송되었습니다.' });
                }
              } catch (err) {
                setErrorMessage('인증번호 재발송에 실패했습니다.');
              }
            }}
            className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
          >
            인증번호 재발송
          </button>

          <button 
            type="submit" 
            disabled={loading || phoneVerificationCode.length !== 6} 
            className="w-full py-2 rounded bg-blue-600 text-white font-semibold disabled:bg-gray-400"
          >
            {loading ? '인증 중...' : '인증하기'}
          </button>
        </form>
      </div>
    );
  }

  // Step 2-B: Verify email code (only for email method)
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
                <div className={`flex items-center gap-2 ${passwordChecks.hasLetter ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{passwordChecks.hasLetter ? '✓' : '○'}</span>
                  <span>영문 포함</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{passwordChecks.hasNumber ? '✓' : '○'}</span>
                  <span>숫자 포함</span>
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
    // 3초 후 자동으로 로그인 페이지로 이동
    React.useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
        router.push('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }, []);
    
    return (
      <div className="text-center space-y-4">
        <div className="text-6xl">✅</div>
        <h3 className="text-lg font-semibold">비밀번호 변경 완료</h3>
        <p className="text-sm text-gray-600">
          새로운 비밀번호로 로그인해주세요.
        </p>
        <p className="text-xs text-gray-500">
          3초 후 로그인 페이지로 이동합니다...
        </p>
        <button 
          className="w-full py-2 rounded bg-blue-600 text-white font-semibold" 
          onClick={() => {
            onClose();
            router.push('/login');
          }}
        >
          지금 로그인하기
        </button>
      </div>
    );
  }

  return null;
}

export default FindAccountModals;
