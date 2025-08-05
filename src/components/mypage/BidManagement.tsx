'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getSellerBids, confirmBid, rejectBid, BidData } from '@/lib/api/bidService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

// BidData 인터페이스를 API 서비스에서 가져와 사용합니다

/**
 * 판매자(사업자회원) 입찰 관리 컴포넌트
 */
export default function BidManagement() {
  const { user, accessToken } = useAuth();
  const [bids, setBids] = useState<BidData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 입찰 내역 조회
  useEffect(() => {
    const fetchBids = async () => {
      if (!accessToken) return;
      
      try {
        const data = await getSellerBids();
        setBids(data);
      } catch (error) {
        console.error('입찰 내역 조회 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBids();
  }, [accessToken]);

  // 판매 확정 처리
  const handleConfirmBid = async (bidId: number) => {
    if (!accessToken) return;
    
    try {
      await confirmBid(bidId);
      
      // 입찰 목록 갱신
      setBids(prevBids => 
        prevBids.map(bid => 
          bid.id === bidId ? { ...bid, status: 'selected' } : bid
        )
      );
    } catch (error) {
      console.error('판매 확정 처리 중 오류 발생:', error);
    }
  };

  // 판매 포기 처리
  const handleRejectBid = async (bidId: number) => {
    if (!accessToken) return;
    
    try {
      await rejectBid(bidId);
      
      // 입찰 목록 갱신
      setBids(prevBids => 
        prevBids.map(bid => 
          bid.id === bidId ? { ...bid, status: 'rejected' } : bid
        )
      );
    } catch (error) {
      console.error('판매 포기 처리 중 오류 발생:', error);
    }
  };

  // 입찰 상태별 색상 및 아이콘
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'selected':
        return <Badge className="bg-green-500"><CheckCircle className="w-4 h-4 mr-1" /> 확정</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertTriangle className="w-4 h-4 mr-1" /> 포기</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100"><Clock className="w-4 h-4 mr-1" /> 대기중</Badge>;
    }
  };

  // 날짜 형식 변환
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 입찰 시간 형식 변환 (YYYY-MM-DD HH:mm:ss)
  const formatBidTime = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 입찰 타입에 따른 표시 문구
  const getBidTypeText = (bidType: string) => {
    return bidType === 'support' ? '지원금 입찰' : '가격 입찰';
  };

  // 입찰 목록 필터링
  const pendingBids = bids.filter(bid => bid.status === 'pending');
  const confirmedBids = bids.filter(bid => bid.status === 'selected');
  const rejectedBids = bids.filter(bid => bid.status === 'rejected');

  if (isLoading) {
    return <div className="flex justify-center items-center p-8">로딩 중...</div>;
  }

  if (bids.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <p className="text-gray-500">입찰 내역이 없습니다.</p>
        <p className="text-sm text-gray-400 mt-2">공구에 입찰하면 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>입찰 관리</CardTitle>
        <CardDescription>공구별 입찰 현황을 확인하고 판매 여부를 결정할 수 있습니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">대기 중 ({pendingBids.length})</TabsTrigger>
            <TabsTrigger value="confirmed">확정 ({confirmedBids.length})</TabsTrigger>
            <TabsTrigger value="rejected">포기 ({rejectedBids.length})</TabsTrigger>
          </TabsList>
          
          {/* 대기 중인 입찰 */}
          <TabsContent value="pending">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>상품명</TableHead>
                    <TableHead>입찰 유형</TableHead>
                    <TableHead>입찰 금액</TableHead>
                    <TableHead>입찰시간</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingBids.length > 0 ? pendingBids.map((bid) => (
                    <TableRow key={bid.id}>
                      <TableCell>
                        <Link 
                          href={`/groupbuys/${bid.groupbuy}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {bid.product_name}
                        </Link>
                        <div className="text-xs text-gray-500">{bid.groupbuy_title}</div>
                      </TableCell>
                      <TableCell>{getBidTypeText(bid.bid_type)}</TableCell>
                      <TableCell className="font-medium">
                        {typeof bid.amount === 'string' 
                          ? bid.amount 
                          : `${bid.amount.toLocaleString()}원`
                        }
                      </TableCell>
                      <TableCell className="text-sm">{formatBidTime(bid.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(bid.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleConfirmBid(bid.id)}
                          >
                            확정
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleRejectBid(bid.id)}
                          >
                            포기
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        대기 중인 입찰이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          {/* 확정된 입찰 */}
          <TabsContent value="confirmed">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>상품명</TableHead>
                    <TableHead>입찰 유형</TableHead>
                    <TableHead>입찰 금액</TableHead>
                    <TableHead>입찰시간</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmedBids.length > 0 ? confirmedBids.map((bid) => (
                    <TableRow key={bid.id}>
                      <TableCell>
                        <Link 
                          href={`/groupbuys/${bid.groupbuy}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {bid.product_name}
                        </Link>
                        <div className="text-xs text-gray-500">{bid.groupbuy_title}</div>
                      </TableCell>
                      <TableCell>{getBidTypeText(bid.bid_type)}</TableCell>
                      <TableCell className="font-medium">
                        {typeof bid.amount === 'string' 
                          ? bid.amount 
                          : `${bid.amount.toLocaleString()}원`
                        }
                      </TableCell>
                      <TableCell className="text-sm">{formatBidTime(bid.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(bid.status)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        확정된 입찰이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          {/* 포기한 입찰 */}
          <TabsContent value="rejected">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>상품명</TableHead>
                    <TableHead>입찰 유형</TableHead>
                    <TableHead>입찰 금액</TableHead>
                    <TableHead>입찰시간</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedBids.length > 0 ? rejectedBids.map((bid) => (
                    <TableRow key={bid.id}>
                      <TableCell>
                        <Link 
                          href={`/groupbuys/${bid.groupbuy}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {bid.product_name}
                        </Link>
                        <div className="text-xs text-gray-500">{bid.groupbuy_title}</div>
                      </TableCell>
                      <TableCell>{getBidTypeText(bid.bid_type)}</TableCell>
                      <TableCell className="font-medium">
                        {typeof bid.amount === 'string' 
                          ? bid.amount 
                          : `${bid.amount.toLocaleString()}원`
                        }
                      </TableCell>
                      <TableCell className="text-sm">{formatBidTime(bid.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(bid.status)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        포기한 입찰이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
