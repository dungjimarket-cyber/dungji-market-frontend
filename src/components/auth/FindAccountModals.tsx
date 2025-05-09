import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
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
function FindUsernameForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/find-username/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.username);
      } else {
        const err = await res.json();
        // 백엔드에서 email 필드에 대한 오류 배열로 반환할 경우 처리
        const errorMessage = Array.isArray(err.email) ? err.email[0] : err.email || '아이디 찾기에 실패했습니다.';
        toast({ title: '알림', description: errorMessage, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: '오류', description: '서버와 연결할 수 없습니다.', variant: 'destructive' });
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
      <label className="block text-sm font-medium text-gray-700">가입 이메일</label>
      <input type="email" required className="w-full px-3 py-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@email.com" />
      <button type="submit" disabled={loading} className="w-full py-2 rounded bg-blue-600 text-white font-semibold">{loading ? '확인 중...' : '아이디 찾기'}</button>
    </form>
  );
}

/**
 * 비밀번호 찾기 폼
 */
function ResetPasswordForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSent(false);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password/` : 'http://localhost:8000/api/auth/reset-password/'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const err = await res.json();
        // 백엔드에서 반환하는 오류 메시지 처리
        let errorMessage = '비밀번호 재설정에 실패했습니다.';
        
        if (err.non_field_errors && Array.isArray(err.non_field_errors)) {
          errorMessage = err.non_field_errors[0];
        } else if (err.non_field_errors) {
          errorMessage = err.non_field_errors;
        } else if (err.email && Array.isArray(err.email)) {
          errorMessage = err.email[0];
        } else if (err.email) {
          errorMessage = err.email;
        } else if (err.username && Array.isArray(err.username)) {
          errorMessage = err.username[0];
        } else if (err.username) {
          errorMessage = err.username;
        }
        
        toast({ title: '알림', description: errorMessage, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: '오류', description: '서버와 연결할 수 없습니다.', variant: 'destructive' });
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
      <label className="block text-sm font-medium text-gray-700">가입 이메일</label>
      <input type="email" required className="w-full px-3 py-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@email.com" />
      <label className="block text-sm font-medium text-gray-700">아이디(유저명)</label>
      <input type="text" required className="w-full px-3 py-2 border rounded" value={username} onChange={e=>setUsername(e.target.value)} placeholder="아이디" />
      <button type="submit" disabled={loading} className="w-full py-2 rounded bg-blue-600 text-white font-semibold">{loading ? '발송 중...' : '임시 비밀번호 발송'}</button>
    </form>
  );
}

export default FindAccountModals;
