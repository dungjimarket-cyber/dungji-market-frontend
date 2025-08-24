'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Package, User, Phone, MapPin, Calendar, CreditCard } from 'lucide-react';
import { formatNumberWithCommas } from '@/lib/utils';
import { tokenUtils } from '@/lib/tokenUtils';
import { useToast } from '@/components/ui/use-toast';

interface BidDetail {
  id: number;
  groupbuy: number;
  groupbuy_title: string;
  product_name: string;
  amount: number;
  bid_type: 'price' | 'support';
  status: string;
  final_decision: string;
  message: string;
  created_at: string;
  buyer_info?: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
}

export default function SalesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bidId = params.id as string;
  const { toast } = useToast();
  
  const [bidDetail, setBidDetail] = useState<BidDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBidDetail = async () => {
      try {
        const token = await tokenUtils.getAccessToken();
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids/${bidId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch bid detail');
        }

        const data = await response.json();
        setBidDetail(data);
      } catch (error) {
        console.error('Failed to fetch bid detail:', error);
        toast({
          title: '오류',
          description: '판매 정보를 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBidDetail();
  }, [bidId, router, toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!bidDetail) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">판매 정보를 찾을 수 없습니다.</p>
          <Link href="/mypage/seller/bids">
            <Button className="mt-4">입찰 목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (bidDetail.final_decision === 'confirmed') {
      return <Badge className="bg-green-100 text-green-800">판매 확정</Badge>;
    } else if (bidDetail.final_decision === 'cancelled') {
      return <Badge className="bg-red-100 text-red-800">판매 취소</Badge>;
    } else if (bidDetail.status === 'selected') {
      return <Badge className="bg-orange-100 text-orange-800">최종선택 대기중</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">대기중</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <Link href="/mypage/seller/bids" className="mr-4">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">판매 상세 정보</h1>
      </div>

      <div className="space-y-6">
        {/* 입찰 정보 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>입찰 정보</CardTitle>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">공구명</p>
                <Link href={`/groupbuys/${bidDetail.groupbuy}`} className="text-blue-600 hover:underline">
                  {bidDetail.groupbuy_title || `공구 #${bidDetail.groupbuy}`}
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">상품명</p>
                  <p className="font-medium flex items-center">
                    <Package className="w-4 h-4 mr-2 text-gray-500" />
                    {bidDetail.product_name}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">입찰 유형</p>
                  <p className="font-medium">
                    {bidDetail.bid_type === 'support' ? '지원금 입찰' : '가격 입찰'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">견적 금액</p>
                  <p className="font-medium text-lg flex items-center">
                    <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
                    {formatNumberWithCommas(bidDetail.amount)}원
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">입찰 일시</p>
                  <p className="font-medium flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    {new Date(bidDetail.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>

              {bidDetail.message && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">입찰 메시지</p>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-gray-700">{bidDetail.message}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 구매자 정보 (판매 확정 시에만 표시) */}
        {bidDetail.final_decision === 'confirmed' && bidDetail.buyer_info && (
          <Card>
            <CardHeader>
              <CardTitle>구매자 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">구매자명</p>
                    <p className="font-medium flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-500" />
                      {bidDetail.buyer_info.name}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">연락처</p>
                    <p className="font-medium flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      {bidDetail.buyer_info.phone}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">이메일</p>
                  <p className="font-medium">
                    {bidDetail.buyer_info.email}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">배송지</p>
                  <p className="font-medium flex items-start">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                    {bidDetail.buyer_info.address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 액션 버튼 */}
        <div className="flex justify-between">
          <Link href="/mypage/seller/bids">
            <Button variant="outline">목록으로 돌아가기</Button>
          </Link>
          
          {bidDetail.status === 'selected' && bidDetail.final_decision === 'pending' && (
            <Link href={`/groupbuys/${bidDetail.groupbuy}`}>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                최종선택 페이지로 이동
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}