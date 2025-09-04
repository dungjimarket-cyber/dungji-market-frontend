'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import PenaltyModal from '@/components/penalty/PenaltyModal';

/**
 * 가입유형을 표시하는 유틸리티 함수
 * @param groupBuy 공구 정보
 * @returns 가입유형 텍스트
 */
function getSubscriptionTypeText(groupBuy: any): string {
  // product_details.registration_type을 통해 가입유형 표시
  if (groupBuy.product_details?.registration_type) {
    if (groupBuy.product_details.registration_type === 'MNP') return '번호이동';
    if (groupBuy.product_details.registration_type === 'NEW') return '신규가입';
    if (groupBuy.product_details.registration_type === 'CHANGE') return '기기변경';
    return groupBuy.product_details.registration_type;
  }
  
  return '';
}

interface JoinGroupBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // 참여 성공 후 호출될 콜백 함수
  groupBuy: {
    id: number;
    title: string;
    product_details: {
      name: string;
      image_url?: string;
      carrier?: string;
      registration_type?: string;
      base_price: number;
      telecom_carrier?: string;
      subscription_type_korean?: string;
      category_name?: string;
    };
    telecom_detail?: {
      telecom_carrier?: string;
      subscription_type_korean?: string;
    };
  };
}

/**
 * 공구 참여 모달 컴포넌트
 * 사용자가 공구에 참여하기 전 확인 및 참여 처리를 담당합니다.
 */
export default function JoinGroupBuyModal({ isOpen, onClose, onSuccess, groupBuy }: JoinGroupBuyModalProps) {
  const { isAuthenticated, accessToken, user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'confirm' | 'success' | 'error'>('confirm');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);

  /**
   * 공구 참여 처리를 수행하는 함수
   * 로그인 상태와 JWT 토큰을 확인하고 API 호출
   */
  const handleJoin = async () => {
    // 패널티 체크
    console.log('🔴 JoinModal - User:', user);
    console.log('🔴 JoinModal - Penalty info:', user?.penalty_info);
    console.log('🔴 JoinModal - Is active:', user?.penalty_info?.is_active);
    
    if (user?.penalty_info?.is_active || user?.penaltyInfo?.isActive) {
      console.log('🔴 패널티 활성 상태 감지! 모달 표시');
      setShowPenaltyModal(true);
      return;
    }
    
    // 로그인 상태 확인
    if (!isAuthenticated || !accessToken) {
      toast({
        title: '로그인 필요',
        description: '공구에 참여하려면 로그인이 필요합니다.',
        variant: 'destructive'
      });
      
      // 로그인 페이지로 리다이렉트 (현재 URL을 callbackUrl로 설정)
      const currentPath = window.location.pathname;
      window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
      return;
    }
    
    // 로딩 상태 설정
    setLoading(true);
    
    try {
      setLoading(true);
      setError('');
      
      // 토큰이 없는 경우 오류 처리 (이미 위에서 확인했지만 중복 체크)
      if (!accessToken) {
        throw new Error('인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.');
      }
      
      console.log('인증 토큰 확인:', accessToken.substring(0, 10) + '...');
      
      // 사용자 닉네임 정보 추출
      let username = '';
      if (user) {
        username = user.username || user.nickname || (user.email ? user.email.split('@')[0] : '');
        console.log('공구 참여 시 닉네임 정보:', { username, user });
      }
      
      // API 요청 - 닉네임 정보 포함
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/join/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ username }) // 닉네임 정보 포함
      });
      
      // 오류 처리
      if (!response.ok) {
        // 401 인증 오류
        if (response.status === 401) {
          // 로컬 스토리지에서 만료된 토큰 삭제
          if (typeof window !== 'undefined') {
            localStorage.removeItem('dungji_auth_token');
          }
          
          throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
        }
        
        // 기타 오류 응답 처리
        let responseText = '';
        try {
          // 먼저 텍스트로 읽기
          responseText = await response.text();
          console.error('Raw response body:', responseText);
          
          // JSON으로 파싱 시도
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            // JSON 파싱 실패 시 텍스트 그대로 사용
            throw new Error(`공구 참여 실패: ${responseText || `HTTP ${response.status}`}`);
          }
          
          // 중복 참여 오류 특별 처리
          if (errorData.error && (
            errorData.error.includes('이미 참여') || 
            errorData.error.includes('duplicate') || 
            errorData.error.includes('이미 해당 상품으로 진행 중인 공동구매가 있습니다') ||
            errorData.error.includes('이미 동일한 상품의 다른 공구에 참여중입니다') ||
            errorData.error.includes('중복 참여')
          )) {
            setError('동일한 상품은 중복참여가 제한됩니다.');
            setStep('error');
            return; // 오류 상태로 전환하고 예외를 발생시키지 않음
          }
          
          // 공구 마감/종료 오류 특별 처리
          if (errorData.error && (
            errorData.error.includes('참여할 수 없는 공구입니다') ||
            errorData.error.includes('모집이 종료되었거나') ||
            errorData.error.includes('마감되었습니다')
          )) {
            setError('공구 모집이 종료되었거나 마감되었습니다.');
            setStep('error');
            return; // 오류 상태로 전환하고 예외를 발생시키지 않음
          }
          
          throw new Error(errorData.error || errorData.detail || '공구 참여에 실패했습니다.');
        } catch (error) {
          if (error instanceof Error && (
            error.message.includes('이미 동일한 상품의 공구에 참여 중') ||
            error.message.includes('이미 해당 상품으로 진행 중인 공동구매가 있습니다') ||
            error.message.includes('이미 동일한 상품의 다른 공구에 참여중입니다') ||
            error.message.includes('중복 참여')
          )) {
            setError('동일한 상품은 중복참여가 제한됩니다.');
            setStep('error');
            return;
          }
          throw error;
        }
      }
      
      // 성공 처리
      const data = await response.json();
      console.log('공구 참여 성공:', data);
      
      toast({
        title: '공구 참여 성공',
        description: '성공적으로 공구에 참여했습니다!',
        variant: 'default'
      });
      
      // 성공 시 성공 상태로 변경
      setStep('success');
      setLoading(false);
      
      // 성공 콜백 함수가 있으면 호출
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('공구 참여 오류:', err);
      setError(err instanceof Error ? err.message : '공구 참여에 실패했습니다.');
      toast({
        title: '공구 참여 오류',
        description: err instanceof Error ? err.message : '공구 참여에 실패했습니다.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalConfirm = () => {
    // 모달 닫기
    onClose();
    // 성공 콜백은 이미 handleJoin에서 호출되었으므로 여기서는 호출하지 않음
  };
  
  // 참여 성공 후 자동으로 모달 닫기
  useEffect(() => {
    if (step === 'success') {
      // 1초 후 모달 닫기 (onSuccess는 이미 handleJoin에서 호출됨)
      const timer = setTimeout(() => {
        onClose();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [step, onClose]);

  const handleClose = () => {
    if (loading) {
      return;
    }
    
    setStep('confirm'); // 모달 닫을 때 초기 상태로 리셋
    setError(''); // 에러 메시지 초기화
    onClose();
  };

  if (loading) return null;
  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">공구 참여하기</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                공구에 참여하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <div className="bg-orange-50 border border-orange-200 rounded-md p-2 mb-3">
              <div className="text-orange-800">
                <p className="text-sm font-semibold mb-1 text-orange-900">❗ 중요 안내</p>
                <p className="text-xs leading-relaxed mb-1">
                  • 견적 제안이 시작되면 공구를 나갈 수 없습니다.
                </p>
                <p className="text-xs leading-relaxed mb-1">
                  • 동일한 상품에는 중복 참여가 불가합니다.
                </p>
                <p className="text-sm font-medium text-orange-900">
                  참여하시겠습니까?
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center py-2 px-4">
              <Image 
                src={groupBuy.product_details.image_url || '/placeholder.png'} 
                alt={groupBuy.product_details.name} 
                width={120} 
                height={120} 
                className="rounded-md mb-2"
              />
              <h3 className="text-base font-bold text-center break-words max-w-full px-2">
                {`${groupBuy.product_details?.name || '상품명 없음'} ${groupBuy.product_details?.carrier || ''} ${getSubscriptionTypeText(groupBuy)}`}
              </h3>
              <p className="text-sm text-gray-600 mb-1 text-center">
                통신사: {groupBuy.product_details.telecom_carrier || groupBuy.telecom_detail?.telecom_carrier || groupBuy.product_details.carrier || 'SK텔래콤'}
              </p>
              <p className="text-sm text-gray-600 mb-1 text-center">
                유형: {
                  groupBuy.product_details.subscription_type_korean || 
                  groupBuy.telecom_detail?.subscription_type_korean ||
                  groupBuy.product_details.registration_type ||
                  '정보 없음'
                }
              </p>
              {/* 인터넷/인터넷+TV 카테고리가 아닌 경우에만 가격 표시 */}
              {groupBuy.product_details.category_name !== '인터넷' && 
               groupBuy.product_details.category_name !== '인터넷+TV' && (
                <p className="text-lg font-bold mt-1 text-center">
                  {groupBuy.product_details.base_price.toLocaleString()}원
                </p>
              )}
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                고민해볼게요
              </Button>
              <Button onClick={handleJoin} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리중...
                  </>
                ) : (
                  '네, 참여할게요'
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">공구에 참여되었습니다.</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center p-6">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-center text-gray-600 mb-4">
                참여하신 공구는 마이페이지에서 확인하실 수 있습니다.
              </p>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button onClick={handleFinalConfirm}>
                확인
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'error' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-red-600">참여 제한 안내</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center p-6">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
              <p className="text-center text-gray-700 mb-2 font-medium">
                {error || '공구에 참여할 수 없습니다.'}
              </p>
              <p className="text-center text-gray-600 mb-4">
                {error.includes('중복참여') 
                  ? '하나의 상품에 대해 여러 공구에 동시에 참여할 수 없습니다.'
                  : error.includes('모집이 종료')
                  ? '공구 모집 기간이 마감되었거나 정원이 초과되었습니다.'
                  : '자세한 내용은 고객센터에 문의해주세요.'
                }
              </p>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button variant="outline" onClick={handleClose}>
                확인
              </Button>
            </DialogFooter>
          </>
        )}


      </DialogContent>
    </Dialog>
    
    {/* 패널티 모달 */}
    <PenaltyModal
      isOpen={showPenaltyModal}
      onClose={() => setShowPenaltyModal(false)}
      penaltyInfo={user?.penalty_info || user?.penaltyInfo}
      userRole="buyer"
    />
    </>
  );
}
