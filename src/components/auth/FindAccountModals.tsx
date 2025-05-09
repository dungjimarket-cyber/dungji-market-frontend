import { useState, ReactNode } from 'react';
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
            {tab === 'username' ? '가입한 이메일로 아이디를 찾을 수 있습니다.' : '가입한 이메일과 아이디로 비밀번호를 재설정할 수 있습니다.'}
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
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setErrorMessage('');
    try {
      // API 호출 경로 - 환경변수가 이미 /api로 끝나는지 확인
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${apiUrl}/auth/find-username/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
          if (err.email) {
            errorMessage = Array.isArray(err.email) ? err.email[0] : err.email;
            console.log('이메일 오류 추출:', errorMessage);
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
      <label className="block text-sm font-medium text-gray-700">가입 이메일</label>
      <input type="email" required className="w-full px-3 py-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@email.com" />
      <button type="submit" disabled={loading} className="w-full py-2 rounded bg-blue-600 text-white font-semibold">{loading ? '확인 중...' : '아이디 찾기'}</button>
    </form>
  );
}

/**
 * 비밀번호 찾기 폼
 */
function ResetPasswordForm({ onClose }: { onClose: () => void }): ReactNode {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSent(false);
    setErrorMessage('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${apiUrl}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username }),
      });
      if (res.ok) {
        setSent(true);
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
            setErrorMessage(errText || '비밀번호 재설정에 실패했습니다.');
            return;
          }
          
          console.log('바뀐 오류 응답:', err);
          
          // 오류 메시지 추출
          let errorMessage = '';
          
          // 가장 흔한 필드 먼저 처리
          if (err.non_field_errors && Array.isArray(err.non_field_errors)) {
            errorMessage = err.non_field_errors[0];
          } else if (err.non_field_errors) {
            errorMessage = err.non_field_errors;
          } else if (err.email && Array.isArray(err.email)) {
            errorMessage = err.email[0];
            console.log('이메일 오류 추출:', errorMessage);
          } else if (err.email) {
            errorMessage = err.email;
            console.log('이메일 오류 추출:', errorMessage);
          } else if (err.username && Array.isArray(err.username)) {
            errorMessage = err.username[0];
            console.log('유저명 오류 추출:', errorMessage);
          } else if (err.username) {
            errorMessage = err.username;
            console.log('유저명 오류 추출:', errorMessage);
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
            
            errorMessage = allErrors.length > 0 ? allErrors[0] : '비밀번호 재설정에 실패했습니다.';
          }
          
          // 오류 메시지 직접 표시
          setErrorMessage(errorMessage);
          console.warn('비밀번호 찾기 오류:', errorMessage);
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
  
  return sent ? (
    <div className="text-center">
      <p className="mb-4 text-blue-600 font-bold">임시 비밀번호가 이메일로 전송되었습니다.</p>
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
      <label className="block text-sm font-medium text-gray-700">가입 이메일</label>
      <input type="email" required className="w-full px-3 py-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@email.com" />
      <label className="block text-sm font-medium text-gray-700">아이디(유저명)</label>
      <input type="text" required className="w-full px-3 py-2 border rounded" value={username} onChange={e=>setUsername(e.target.value)} placeholder="아이디" />
      <button type="submit" disabled={loading} className="w-full py-2 rounded bg-blue-600 text-white font-semibold">{loading ? '발송 중...' : '임시 비밀번호 발송'}</button>
    </form>
  );
}

export default FindAccountModals;
