'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Trophy, Users, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Bid {
  id: number;
  seller: {
    id: number;
    username: string;
  };
  amount: number;
  bid_type: string;
  created_at: string;
  is_selected: boolean;
  status: string;
}

interface GroupBuy {
  id: number;
  title: string;
  status: string;
  current_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
}

export default function WinnerSelection() {
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [selectedGroupBuy, setSelectedGroupBuy] = useState<GroupBuy | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    bid: Bid | null;
  }>({ open: false, bid: null });

  // 입찰 진행중인 공구 목록 가져오기
  useEffect(() => {
    fetchGroupBuys();
  }, []);

  const fetchGroupBuys = async () => {
    try {
      const token = localStorage.getItem('dungji_auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/?status=bidding`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGroupBuys(data.results || data);
      }
    } catch (error) {
      console.error('공구 목록 조회 오류:', error);
      toast.error('공구 목록을 불러오는데 실패했습니다.');
    }
  };

  // 선택된 공구의 입찰 목록 가져오기
  const fetchBids = async (groupBuyId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('dungji_auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/bids/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // 금액순으로 정렬 (높은 금액부터)
        const sortedBids = data.sort((a: Bid, b: Bid) => b.amount - a.amount);
        setBids(sortedBids);
      }
    } catch (error) {
      console.error('입찰 목록 조회 오류:', error);
      toast.error('입찰 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 낙찰자 선정
  const selectWinner = async (bid: Bid) => {
    if (!selectedGroupBuy) return;
    
    setSelecting(true);
    try {
      const token = localStorage.getItem('dungji_auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${selectedGroupBuy.id}/select_winner/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ bid_id: bid.id })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        
        // 입찰 목록 새로고침
        await fetchBids(selectedGroupBuy.id);
        
        // 공구 목록 새로고침
        await fetchGroupBuys();
        
        setConfirmDialog({ open: false, bid: null });
      } else {
        const error = await response.json();
        toast.error(error.error || '낙찰자 선정에 실패했습니다.');
      }
    } catch (error) {
      console.error('낙찰자 선정 오류:', error);
      toast.error('낙찰자 선정 중 오류가 발생했습니다.');
    } finally {
      setSelecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            낙찰자 선정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 공구 선택 */}
          <div>
            <label className="text-sm font-medium mb-2 block">공구 선택</label>
            <Select
              value={selectedGroupBuy?.id.toString()}
              onValueChange={(value) => {
                const gb = groupBuys.find(g => g.id.toString() === value);
                setSelectedGroupBuy(gb || null);
                if (gb) {
                  fetchBids(gb.id);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="공구를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {groupBuys.map((gb) => (
                  <SelectItem key={gb.id} value={gb.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{gb.title}</span>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {gb.current_participants}/{gb.max_participants}
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 선택된 공구 정보 */}
          {selectedGroupBuy && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{selectedGroupBuy.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  참여자 {selectedGroupBuy.current_participants}/{selectedGroupBuy.max_participants}명
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  마감: {new Date(selectedGroupBuy.end_time).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* 입찰 목록 */}
          {selectedGroupBuy && (
            <div>
              <h3 className="font-medium mb-3">입찰 목록</h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : bids.length > 0 ? (
                <div className="space-y-2">
                  {bids.map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`p-4 border rounded-lg ${
                        bid.is_selected ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            {index === 0 && !bid.is_selected && (
                              <Badge className="bg-yellow-500">최고입찰</Badge>
                            )}
                            {bid.is_selected && (
                              <Badge className="bg-green-500">낙찰</Badge>
                            )}
                            <span className="font-medium">{bid.seller.username}</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            입찰금액: <span className="font-semibold text-lg">
                              {bid.amount.toLocaleString()}원
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            입찰시간: {new Date(bid.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          {!bid.is_selected && (
                            <Button
                              size="sm"
                              onClick={() => setConfirmDialog({ open: true, bid })}
                            >
                              낙찰 선정
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  아직 입찰이 없습니다.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 확인 다이얼로그 */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog({ open, bid: confirmDialog.bid })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>낙찰자 선정 확인</DialogTitle>
            <DialogDescription>
              {confirmDialog.bid && (
                <>
                  <strong>{confirmDialog.bid.seller.username}</strong>님을 낙찰자로 선정하시겠습니까?
                  <br />
                  입찰금액: {confirmDialog.bid.amount.toLocaleString()}원
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, bid: null })}
              disabled={selecting}
            >
              취소
            </Button>
            <Button
              onClick={() => confirmDialog.bid && selectWinner(confirmDialog.bid)}
              disabled={selecting}
            >
              {selecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  처리중...
                </>
              ) : (
                '낙찰 선정'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}