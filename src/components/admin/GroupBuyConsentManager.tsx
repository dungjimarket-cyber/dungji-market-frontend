'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api/fetch';
import { startConsentProcess } from '@/lib/api/consent';
import { tokenUtils } from '@/lib/tokenUtils';
import { GroupBuy } from '@/types/groupbuy';
import { BidData } from '@/lib/api/bidService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, PlayCircle, Users, Clock, AlertCircle } from 'lucide-react';

interface GroupBuyWithBids extends GroupBuy {
  bids?: BidData[];
}

/**
 * 관리자용 공구 동의 프로세스 관리 컴포넌트
 */
export const GroupBuyConsentManager: React.FC = () => {
  const [groupBuys, setGroupBuys] = useState<GroupBuyWithBids[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupBuy, setSelectedGroupBuy] = useState<GroupBuyWithBids | null>(null);
  const [selectedBid, setSelectedBid] = useState<BidData | null>(null);
  const [consentHours, setConsentHours] = useState(24);
  const [isStarting, setIsStarting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // 공구 목록 가져오기
  const fetchGroupBuys = async () => {
    try {
      setLoading(true);
      // final_selection과 bidding 상태의 공구만 가져오기
      const response = await fetchWithAuth('/groupbuys/?status=final_selection,bidding');
      if (response.ok) {
        const data = await response.json();
        setGroupBuys(Array.isArray(data) ? data : (data.results || []));
      } else {
        throw new Error('공구 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('공구 목록 로딩 오류:', error);
      toast({
        title: '오류',
        description: '공구 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 특정 공구의 입찰 내역 가져오기
  const fetchBidsForGroupBuy = async (groupBuyId: number) => {
    try {
      const response = await fetchWithAuth(`/groupbuys/${groupBuyId}/bids/`);
      if (response.ok) {
        const bids = await response.json();
        setGroupBuys(prev =>
          prev.map(gb =>
            gb.id === groupBuyId ? { ...gb, bids } : gb
          )
        );
      }
    } catch (error) {
      console.error('입찰 내역 로딩 오류:', error);
      toast({
        title: '오류',
        description: '입찰 내역을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 동의 프로세스 시작
  const handleStartConsentProcess = async () => {
    if (!selectedGroupBuy || !selectedBid) return;

    try {
      setIsStarting(true);
      const token = await tokenUtils.getAccessToken();
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      await startConsentProcess(
        token,
        selectedGroupBuy.id,
        selectedBid.id,
        consentHours
      );

      toast({
        title: '성공',
        description: '동의 프로세스가 시작되었습니다.',
      });

      // 다이얼로그 닫기 및 상태 초기화
      setShowConfirmDialog(false);
      setSelectedGroupBuy(null);
      setSelectedBid(null);
      
      // 목록 새로고침
      fetchGroupBuys();
    } catch (error) {
      console.error('동의 프로세스 시작 오류:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '동의 프로세스 시작에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchGroupBuys();
  }, []);

  // 공구 선택 시 입찰 내역 로드
  useEffect(() => {
    if (selectedGroupBuy && !selectedGroupBuy.bids) {
      fetchBidsForGroupBuy(selectedGroupBuy.id);
    }
  }, [selectedGroupBuy]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'final_selection':
        return <Badge className="bg-purple-500">최종선택중</Badge>;
      case 'bidding':
        return <Badge className="bg-blue-500">입찰중</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getBidTypeBadge = (bidType: string) => {
    return bidType === 'price' ? (
      <Badge className="bg-green-500">가격입찰</Badge>
    ) : (
      <Badge className="bg-orange-500">지원금입찰</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>공구 동의 프로세스 관리</CardTitle>
          <CardDescription>
            입찰중 또는 최종선택중인 공구에서 입찰을 선택하여 참여자 동의 프로세스를 시작할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {groupBuys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>동의 프로세스를 시작할 수 있는 공구가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupBuys.map((groupBuy) => (
                <Card key={groupBuy.id} className="border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{groupBuy.title}</CardTitle>
                        <CardDescription className="mt-1">
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            참여자: {groupBuy.current_participants}/{groupBuy.max_participants}명
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(groupBuy.status)}
                        <Button
                          size="sm"
                          variant={selectedGroupBuy?.id === groupBuy.id ? 'secondary' : 'outline'}
                          onClick={() => setSelectedGroupBuy(
                            selectedGroupBuy?.id === groupBuy.id ? null : groupBuy
                          )}
                        >
                          {selectedGroupBuy?.id === groupBuy.id ? '닫기' : '입찰 보기'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {selectedGroupBuy?.id === groupBuy.id && (
                    <CardContent>
                      {!selectedGroupBuy.bids ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : selectedGroupBuy.bids.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">
                          아직 입찰이 없습니다.
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>판매자</TableHead>
                              <TableHead>입찰 유형</TableHead>
                              <TableHead>금액</TableHead>
                              <TableHead>메시지</TableHead>
                              <TableHead>입찰일</TableHead>
                              <TableHead>작업</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedGroupBuy.bids.map((bid) => (
                              <TableRow key={bid.id}>
                                <TableCell>{bid.seller_name || '알 수 없음'}</TableCell>
                                <TableCell>{getBidTypeBadge(bid.bid_type)}</TableCell>
                                <TableCell>₩{bid.amount.toLocaleString()}</TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {bid.message || '-'}
                                </TableCell>
                                <TableCell>
                                  {new Date(bid.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedBid(bid);
                                      setShowConfirmDialog(true);
                                    }}
                                    disabled={bid.status !== 'pending'}
                                  >
                                    <PlayCircle className="h-4 w-4 mr-1" />
                                    동의 시작
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 동의 프로세스 시작 확인 다이얼로그 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>동의 프로세스 시작</DialogTitle>
            <DialogDescription>
              선택한 입찰로 참여자 동의 프로세스를 시작하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          
          {selectedGroupBuy && selectedBid && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>공구:</strong> {selectedGroupBuy.title}</p>
                <p><strong>판매자:</strong> {selectedBid.seller_name}</p>
                <p><strong>입찰 유형:</strong> {selectedBid.bid_type === 'price' ? '가격입찰' : '지원금입찰'}</p>
                <p><strong>금액:</strong> ₩{selectedBid.amount.toLocaleString()}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="consent-hours">
                  동의 마감 시간 (시간)
                </Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <Input
                    id="consent-hours"
                    type="number"
                    min="1"
                    max="168"
                    value={consentHours}
                    onChange={(e) => setConsentHours(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500">시간</span>
                </div>
                <p className="text-xs text-gray-500">
                  참여자들이 동의/거부를 결정할 수 있는 시간입니다. (기본: 24시간)
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isStarting}
            >
              취소
            </Button>
            <Button
              onClick={handleStartConsentProcess}
              disabled={isStarting}
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  시작 중...
                </>
              ) : (
                '동의 프로세스 시작'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};