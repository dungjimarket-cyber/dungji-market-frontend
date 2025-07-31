'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import RequireAuth from '@/components/auth/RequireAuth';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function WithdrawPage() {
  const router = useRouter();
  const { accessToken, logout, user } = useAuth();
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [confirmCheck, setConfirmCheck] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const withdrawReasons = [
    '서비스 이용 빈도가 낮아서',
    '원하는 상품이 없어서',
    '다른 서비스를 이용하게 되어서',
    '개인정보 보호를 위해서',
    '서비스가 만족스럽지 않아서',
    '기타'
  ];

  // 소셜 로그인 사용자인지 확인
  const isSocialLogin = user?.sns_type && user.sns_type !== 'email';

  const handleWithdraw = async () => {
    if (!confirmCheck) {
      setError('탈퇴 동의에 체크해주세요.');
      return;
    }

    // 이메일 로그인 사용자만 비밀번호 검증
    if (!isSocialLogin && !password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/withdraw/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          password,
          reason: withdrawReason === '기타' ? otherReason : withdrawReason
        })
      });

      if (response.ok) {
        // 카카오 사용자인 경우 추가 안내
        if (user?.sns_type === 'kakao') {
          alert('회원 탈퇴가 완료되었습니다.\n\n카카오톡 연결도 함께 해제되었습니다.\n그동안 이용해주셔서 감사합니다.');
        } else {
          alert('회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.');
        }
        logout();
        router.push('/');
      } else {
        const data = await response.json();
        setError(data.error || '회원 탈퇴 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      setError('회원 탈퇴 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RequireAuth>
      <div className="max-w-2xl mx-auto p-6">
        <button
          onClick={() => router.push('/mypage')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          마이페이지로 돌아가기
        </button>

        <h1 className="text-2xl font-bold mb-6">회원 탈퇴</h1>

        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-red-900">탈퇴 전 꼭 확인해주세요!</h2>
                  <ul className="space-y-2 text-sm text-red-800">
                    <li>• 탈퇴 시 회원님의 모든 개인정보는 즉시 삭제되며, 복구할 수 없습니다.</li>
                    <li>• 진행 중인 공구가 있는 경우, 탈퇴가 제한될 수 있습니다.</li>
                    <li>• 탈퇴 후 동일한 이메일로 재가입이 가능하나, 이전 활동 내역은 복구되지 않습니다.</li>
                    <li>• 작성하신 리뷰나 문의사항은 탈퇴 후에도 남아있을 수 있습니다.</li>
                    {user?.sns_type === 'kakao' && (
                      <li className="font-semibold">• 카카오톡 계정 연결도 함께 해제됩니다.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">탈퇴 사유를 알려주세요</h3>
              <div className="space-y-2">
                {withdrawReasons.map((reason) => (
                  <label key={reason} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="withdrawReason"
                      value={reason}
                      checked={withdrawReason === reason}
                      onChange={(e) => setWithdrawReason(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{reason}</span>
                  </label>
                ))}
              </div>
              {withdrawReason === '기타' && (
                <textarea
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="탈퇴 사유를 입력해주세요"
                  className="mt-3 w-full p-3 border rounded-lg resize-none h-24"
                />
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => router.push('/mypage')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!withdrawReason || (withdrawReason === '기타' && !otherReason)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold mb-4">본인 확인</h3>
              {isSocialLogin ? (
                <p className="text-sm text-gray-600">
                  소셜 로그인으로 가입하신 회원님은 비밀번호 확인 없이 탈퇴 처리됩니다.
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    회원 탈퇴를 진행하시려면 비밀번호를 입력해주세요.
                  </p>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="w-full p-3 border rounded-lg"
                  />
                </>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmCheck}
                  onChange={(e) => setConfirmCheck(e.target.checked)}
                  className="w-4 h-4 text-red-600 mt-0.5"
                />
                <span className="text-sm">
                  위 내용을 모두 확인했으며, 회원 탈퇴에 동의합니다.
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isLoading || (!isSocialLogin && !password) || !confirmCheck}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리 중...' : '회원 탈퇴'}
              </button>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}