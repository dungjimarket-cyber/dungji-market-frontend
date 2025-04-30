'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';

interface JoinGroupBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupBuy: {
    id: number;
    title: string;
    product_details: {
      name: string;
      image_url?: string;
      carrier?: string;
      registration_type?: string;
      base_price: number;
    };
  };
}

export default function JoinGroupBuyModal({ isOpen, onClose, groupBuy }: JoinGroupBuyModalProps) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [step, setStep] = useState<'confirm' | 'success' | 'final'>('confirm');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * 공구 참여 처리를 수행하는 함수
   * 로그인 상태를 확인하고 로컬 스토리지 또는 세션에서 토큰을 가져와 API 호출
   */
  const handleJoin = async () => {
    // 로그인 상태 확인
    if (!session) {
      toast({
        title: '로그인 필요',
        description: '공구에 참여하려면 로그인이 필요합니다.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // 토큰 가져오기 (로컬 스토리지 우선, 없으면 세션에서 가져오기)
      let accessToken = null;
      
      // 1. 로컬 스토리지에서 토큰 확인
      if (typeof window !== 'undefined') {
        accessToken = localStorage.getItem('dungji_auth_token');
      }
      
      // 2. 로컬 스토리지에 없으면 세션에서 확인
      if (!accessToken) {
        accessToken = session?.jwt?.access || session?.user?.jwt?.access;
      }
      
      // 토큰이 없는 경우 오류 처리
      if (!accessToken) {
        throw new Error('인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.');
      }
      
      console.log('인증 토큰 확인:', accessToken.substring(0, 10) + '...');
      
      // API 요청
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuy.id}/join/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
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
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.detail || '공구 참여에 실패했습니다.');
        } catch (parseError) {
          throw new Error(`공구 참여 실패: HTTP ${response.status}`);
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
      
      // 성공 시 다음 단계로 이동
      setStep('success');
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
    // 최종 확인 단계
    setStep('final');
    
    // 페이지 리로드
    window.location.reload();
  };

  const handleClose = () => {
    // 성공 단계에서 닫을 때는 페이지 리로드
    if (step === 'success') {
      window.location.reload();
    }
    
    setStep('confirm'); // 모달 닫을 때 초기 상태로 리셋
    onClose();
  };

  if (status === "loading") return null;
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle>공구 참여하기</DialogTitle>
              <DialogDescription>
                공구에 참여하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center p-4">
              <Image 
                src={groupBuy.product_details.image_url || '/placeholder.png'} 
                alt={groupBuy.product_details.name} 
                width={200} 
                height={200} 
                className="rounded-md mb-4"
              />
              <h3 className="text-lg font-bold">{groupBuy.title || groupBuy.product_details.name}</h3>
              <p className="text-gray-600 mb-2">
                통신사: {groupBuy.product_details.carrier || 'SK텔레콤'}
              </p>
              <p className="text-gray-600 mb-2">
                유형: {groupBuy.product_details.registration_type || '번호이동'}
              </p>
              <p className="text-xl font-bold mt-2">
                {groupBuy.product_details.base_price.toLocaleString()}원
              </p>
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

        {step === 'final' && (
          <>
            <DialogHeader>
              <DialogTitle>최종 선택</DialogTitle>
              <DialogDescription>
                참여 유형을 선택해주세요
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 p-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col">
                <span className="text-lg font-bold">확정</span>
                <span className="text-sm text-gray-500">2명</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col">
                <span className="text-lg font-bold">포기</span>
                <span className="text-sm text-gray-500">1명</span>
              </Button>
            </div>
            <div className="p-4">
              <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                그룹 확정은 누르시면, 판매자 정보를 확인하실 수 있습니다.
              </p>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button onClick={handleClose}>
                확정
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
