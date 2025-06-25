/**
 * 입찰권 구매 페이지
 * 판매회원이 입찰에 참여하기 위한 입찰권을 구매하는 페이지입니다.
 */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import BidTicketPurchaseModal from '@/components/bid/BidTicketPurchaseModal';

/**
 * 입찰권 구매 페이지 컴포넌트
 * 판매회원이 입찰에 참여하기 위한 입찰권을 구매할 수 있는 페이지입니다.
 * 
 * @returns {JSX.Element} 입찰권 구매 페이지 컴포넌트
 */
export default function BidTicketsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<{
    id: number;
    name: string;
    price: number;
    count: number;
    description: string;
  } | null>(null);

  // 입찰권 상품 목록 (실제로는 API에서 가져와야 함)
  const ticketProducts = [
    {
      id: 1,
      name: '기본 입찰권',
      price: 5000,
      count: 1,
      description: '단일 공구에 1회 입찰 가능한 기본 입찰권입니다.'
    },
    {
      id: 2,
      name: '프리미엄 입찰권',
      price: 12000,
      count: 3,
      description: '3회 입찰 가능한 할인 패키지 입찰권입니다.'
    },
    {
      id: 3,
      name: '프로 입찰권',
      price: 30000,
      count: 10,
      description: '10회 입찰 가능한 프로 판매자용 입찰권입니다.'
    }
  ];

  // 로딩 중이면 로딩 표시
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      router.push('/login');
      return null;
    }
    return null;
  }

  // 판매회원이 아닌 경우 안내 메시지 표시
  if (user?.user_type !== '판매') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>입찰권 구매</CardTitle>
            <CardDescription>판매회원 전용 서비스입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center p-6 text-center">
              <p className="mb-4">
                입찰권은 판매회원만 구매할 수 있습니다.
                마이페이지에서 회원구분을 판매회원으로 변경해주세요.
              </p>
              <Button onClick={() => router.push('/mypage')}>
                마이페이지로 이동
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 입찰권 구매 모달 열기
  const handleOpenPurchaseModal = (ticket: typeof ticketProducts[0]) => {
    setSelectedTicket(ticket);
    setShowPurchaseModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">입찰권 구매</h1>
      
      <Tabs defaultValue="tickets" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tickets">입찰권 구매</TabsTrigger>
          <TabsTrigger value="history">구매 내역</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tickets" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ticketProducts.map((ticket) => (
              <Card key={ticket.id} className="overflow-hidden">
                <CardHeader className="bg-blue-50">
                  <CardTitle>{ticket.name}</CardTitle>
                  <CardDescription>{ticket.count}회 입찰 가능</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <span className="text-2xl font-bold">{ticket.price.toLocaleString()}원</span>
                  </div>
                  <p className="text-sm text-gray-600">{ticket.description}</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleOpenPurchaseModal(ticket)}
                  >
                    구매하기
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>구매 내역</CardTitle>
              <CardDescription>최근 입찰권 구매 내역입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>구매 내역이 없습니다.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 입찰권 구매 모달 */}
      {selectedTicket && (
        <BidTicketPurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          ticket={selectedTicket}
        />
      )}
    </div>
  );
}
