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
import { formatBidAmount } from '@/lib/utils/maskAmount';

// 구성표에 따른 입찰 금액 표시 규칙 적용
// 1위부터 10위까지 정상 금액 표기, 본인 입찰은 항상 정상 표기

// 여기서는 BidData 인터페이스를 API 서비스에서 가져와 사용합니다

interface BidHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupBuyId: number;
  currentUserId?: number;
  isSeller?: boolean;
  isParticipant?: boolean;  // 공구 참여 여부 추가
  hasBid?: boolean;          // 입찰 여부 추가
  groupBuyStatus?: string;   // 공구 상태 추가
  isAuthenticated?: boolean; // 로그인 여부 추가
}

/**
 * 공구 입찰 내역 확인 모달 컴포넌트
 */
export default function BidHistoryModal({
  isOpen,
  onClose,
  groupBuyId,
  currentUserId,
  isSeller = false,
  isParticipant = false,
  hasBid = false,
  groupBuyStatus,
  isAuthenticated = false
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
            const aAmount = typeof a.amount === 'string' ? 0 : a.amount;
            const bAmount = typeof b.amount === 'string' ? 0 : b.amount;
            
            if (a.bid_type === 'price') {
              return aAmount - bAmount; // 가격 입찰은 낮은 순으로
            } else {
              return bAmount - aAmount; // 지원금 입찰은 높은 순으로
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
            이 공구에 등록된 입찰 내역 상위 10개를 확인할 수 있습니다.
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
                  <TableHead className="w-20 text-center">순위</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  {isSeller && <TableHead className="text-center">상태</TableHead>}
                  <TableHead className="text-center">등록일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.slice(0, 10).map((bid, index) => {
                  const isMyBid = isSeller && currentUserId && bid.seller_id === currentUserId;
                  const isWinner = index === 0;
                  
                  // 금액 표시 로직
                  // 모집중(recruiting) 상태일 때는 본인 입찰만 정상 표시, 나머지는 마스킹
                  // 모집 종료 후에는 참여자/입찰자는 정상 표시
                  const isRecruiting = groupBuyStatus === 'recruiting';
                  
                  const shouldShowAmount = 
                    isMyBid ||           // 본인 입찰은 항상 표시
                    (!isRecruiting && (isParticipant || hasBid));  // 모집 종료 후 참여자/입찰자는 정상 표시
                  
                  // 마스킹 조건: 모집중이거나, 비로그인이거나, 미참여/미입찰자
                  const shouldMask = !shouldShowAmount;
                  
                  return (
                    <TableRow 
                      key={bid.id} 
                      className={isMyBid ? "bg-blue-50" : isWinner ? "bg-yellow-50" : ""}
                    >
                      <TableCell className="text-center font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <Badge 
                            variant={index < 3 ? "default" : "outline"} 
                            className={
                              index === 0 ? "bg-yellow-500" : 
                              index === 1 ? "bg-gray-400" : 
                              index === 2 ? "bg-amber-600" : ""
                            }
                          >
                            {index + 1}위
                          </Badge>
                          {isMyBid && (
                            <Badge variant="secondary" className="text-xs">
                              내 입찰
                            </Badge>
                          )}
                          {isWinner && (
                            <Badge className="bg-green-500 text-xs">
                              낙찰
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {typeof bid.amount === 'string' 
                          ? bid.amount 
                          : shouldMask
                            ? `${formatBidAmount(bid.amount, false, 999)}원`  // 마스킹
                            : `${bid.amount.toLocaleString()}원`  // 정상 표기
                        }
                      </TableCell>
                      {isSeller && (
                        <TableCell className="text-center">
                          {getStatusBadge(bid.status || 'pending')}
                        </TableCell>
                      )}
                      <TableCell className="text-center">{formatDate(bid.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
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
