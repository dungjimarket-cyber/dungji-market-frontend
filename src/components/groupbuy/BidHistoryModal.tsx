'use client';

import { useState, useEffect } from 'react';
import { getGroupBuyBids, BidData } from '@/lib/api/bidService';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { formatNumberWithCommas } from '@/lib/utils';

// 입찰 금액 익명화 처리 함수
const anonymizeAmount = (amount: number, rank: number): string => {
  // 1~5위까지만 익명화 처리
  if (rank <= 5) {
    const amountStr = amount.toString();
    if (amountStr.length <= 4) { // 1000원 이하일 경우
      return "XX" + amountStr.slice(-2) + "원";
    } else {
      // 앞자리 제외한 후배 자리만 표시 (1자리 이상 제외)
      const maskedDigits = amountStr.length > 5 ? 2 : 1;
      return "X".repeat(maskedDigits) + amountStr.slice(maskedDigits) + "원";
    }
  }
  // 5위 이후는 일반 형식으로 표시
  return formatNumberWithCommas(amount) + "원";
};

// 여기서는 BidData 인터페이스를 API 서비스에서 가져와 사용합니다

interface BidHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupBuyId: number;
}

/**
 * 공구 입찰 내역 확인 모달 컴포넌트
 */
export default function BidHistoryModal({
  isOpen,
  onClose,
  groupBuyId
}: BidHistoryModalProps) {
  const [bids, setBids] = useState<BidData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 입찰 기록 조회
    const fetchBidHistory = async () => {
      if (!groupBuyId || !isOpen) return;
      
      setIsLoading(true);
      
      try {
        const data = await getGroupBuyBids(groupBuyId);
        // 금액 순으로 정렬 (겹치는 경우 날짜 순)
        const sortedData = [...data].sort((a, b) => {
          if (a.bid_type === b.bid_type) {
            // 같은 입찰 유형인 경우 금액 비교 (가격 입찰은 낮은 순, 지원금 입찰은 높은 순)
            if (a.bid_type === 'price') {
              return a.amount - b.amount; // 가격 입찰은 낮은 순으로
            } else {
              return b.amount - a.amount; // 지원금 입찰은 높은 순으로
            }
          }
          // 입찰 유형이 다르면 가격 입찰을 우선
          return a.bid_type === 'price' ? -1 : 1;
        });
        
        setBids(sortedData);
      } catch (error) {
        console.error('입찰 기록 조회 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBidHistory();
  }, [groupBuyId, isOpen]);

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

  // 입찰 유형에 따른 표시 문구
  const getBidTypeText = (bidType: string) => {
    return bidType === 'support' ? '지원금 입찰' : '가격 입찰';
  };

  // 날짜 형식 변환
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">공구 입찰 내역</DialogTitle>
          <DialogDescription>
            이 공구에 등록된 모든 입찰 내역을 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">입찰 기록을 불러오는 중...</span>
          </div>
        ) : bids.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <p className="text-gray-500">등록된 입찰 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>판매자</TableHead>
                  <TableHead>입찰 유형</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>메시지</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map((bid, index) => (
                  <TableRow key={bid.id}>
                    <TableCell className="font-medium">{bid.seller_name}</TableCell>
                    <TableCell>{getBidTypeText(bid.bid_type)}</TableCell>
                    <TableCell>
                      {/* 순위에 따른 익명화된 금액 표시 */}
                      {anonymizeAmount(bid.amount, index + 1)}
                      {index < 5 && (
                        <Badge variant="outline" className="ml-2 text-xs bg-gray-50">
                          {index + 1}위
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(bid.created_at)}</TableCell>
                    <TableCell>{getStatusBadge(bid.status)}</TableCell>
                    <TableCell>
                      {bid.message ? (
                        <span className="text-sm line-clamp-2">{bid.message}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
