/**
 * 견적이용권 구매 모달 컴포넌트
 * 사용자가 견적이용권을 구매할 때 사용하는 모달 컴포넌트입니다.
 */
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// 결제 방법 타입
type PaymentMethod = 'card' | 'bank' | 'phone';

// 견적이용권 타입
interface TicketProps {
  id: number;
  name: string;
  price: number;
  count: number;
  description: string;
}

// 컴포넌트 props 타입
interface BidTicketPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TicketProps;
}

/**
 * 견적이용권 구매 모달 컴포넌트
 * 
 * @param {BidTicketPurchaseModalProps} props - 컴포넌트 props
 * @returns {JSX.Element} 견적이용권 구매 모달 컴포넌트
 */
export default function BidTicketPurchaseModal({ isOpen, onClose, ticket }: BidTicketPurchaseModalProps) {
  const { toast } = useToast();
  const { accessToken } = useAuth();
  const [step, setStep] = useState<'payment' | 'processing' | 'success'>('payment');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 결제 처리 함수
   * 실제로는 백엔드 API를 호출하여 결제를 처리합니다.
   */
  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    setStep('processing');

    try {
      // 실제 구현에서는 백엔드 API 호출
      // 현재는 시뮬레이션을 위해 setTimeout 사용
      await new Promise(resolve => setTimeout(resolve, 2000));

      // API 호출 시뮬레이션
      /*
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bid-tickets/purchase/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          ticket_id: ticket.id,
          payment_method: paymentMethod
        })
      });

      if (!response.ok) {
        throw new Error('결제 처리 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      */

      // 성공 처리
      setStep('success');
      toast({
        title: '견적이용권 구매 성공',
        description: `${ticket.name} ${ticket.count}회 견적이용권을 성공적으로 구매했습니다.`,
        variant: 'default'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.');
      setStep('payment');
      toast({
        title: '견적이용권 구매 실패',
        description: err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 모달 닫기 함수
   */
  const handleClose = () => {
    if (loading) return;
    setStep('payment');
    setError(null);
    onClose();
  };

  /**
   * 구매 완료 후 확인 버튼 클릭 시 처리 함수
   */
  const handleComplete = () => {
    handleClose();
    // 필요한 경우 페이지 리로드 또는 상태 업데이트
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'payment' && (
          <>
            <DialogHeader>
              <DialogTitle>견적이용권 구매</DialogTitle>
              <DialogDescription>
                구매할 견적이용권 정보와 결제 방법을 확인해주세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center p-4">
              <div className="w-full p-4 bg-blue-50 rounded-md mb-4">
                <h3 className="text-lg font-bold text-center mb-2">{ticket.name}</h3>
                <p className="text-center text-gray-600 mb-2">{ticket.count}회 견적 가능</p>
                <p className="text-center text-gray-600 mb-4">{ticket.description}</p>
                <p className="text-xl font-bold text-center">{ticket.price.toLocaleString()}원</p>
              </div>
              
              <div className="w-full mb-4">
                <h4 className="font-medium mb-2">결제 방법 선택</h4>
                <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card">신용/체크카드</Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank">계좌이체</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="phone" id="phone" />
                    <Label htmlFor="phone">휴대폰 결제</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {error && (
                <div className="w-full p-2 mb-4 bg-red-50 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}
            </div>
            
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                취소
              </Button>
              <Button onClick={handlePayment} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리중...
                  </>
                ) : (
                  '결제하기'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
        
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <p className="text-center">결제를 처리 중입니다. 잠시만 기다려주세요...</p>
          </div>
        )}
        
        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">구매가 완료되었습니다</DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col items-center p-6">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-bold mb-2">{ticket.name}</h3>
              <p className="text-center text-gray-600 mb-4">
                {ticket.count}회 견적 가능한 견적이용권을 구매했습니다.
              </p>
              <p className="text-center text-gray-600 mb-4">
                마이페이지에서 보유 중인 견적이용권을 확인할 수 있습니다.
              </p>
            </div>
            
            <DialogFooter className="sm:justify-center">
              <Button onClick={handleComplete}>
                확인
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
