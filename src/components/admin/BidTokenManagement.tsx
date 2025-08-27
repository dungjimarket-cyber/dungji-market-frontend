'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Search, Settings, Plus, Minus, Clock, History, User, CreditCard } from 'lucide-react';

interface Seller {
  id: number;
  username: string;
  nickname: string;
  email: string;
  active_tokens_count: number;
  has_unlimited_subscription: boolean;
  unlimited_expires_at?: string;
}

interface TokenHistory {
  id: number;
  action: string; // 'add' | 'subtract' | 'purchase' | 'use'
  amount: number;
  reason: string;
  admin_user?: string;
  created_at: string;
}

interface BidTokenManagementProps {
  accessToken?: string;
}

export default function BidTokenManagement({ accessToken }: BidTokenManagementProps) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<Seller[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [tokenHistory, setTokenHistory] = useState<TokenHistory[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Token adjustment states
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [adjustmentAmount, setAdjustmentAmount] = useState(1);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [subscriptionDays, setSubscriptionDays] = useState(30);

  // Fetch sellers list
  useEffect(() => {
    fetchSellers();
  }, []);

  // Filter sellers based on search
  useEffect(() => {
    const filtered = sellers.filter(seller =>
      seller.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.id.toString().includes(searchTerm)
    );
    setFilteredSellers(filtered);
  }, [searchTerm, sellers]);

  const fetchSellers = async () => {
    try {
      console.log('판매자 목록 조회 시작...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/sellers/`, {
        headers: {
          'Authorization': `Bearer ${accessToken || localStorage.getItem('dungji_auth_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('판매자 목록 조회 성공:', data.length, '명');
        setSellers(data);
      } else {
        const errorData = await response.json();
        console.error('판매자 목록 조회 실패:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch sellers:', error);
      toast({
        title: '오류',
        description: '판매회원 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const fetchTokenHistory = async (sellerId: number) => {
    try {
      console.log(`토큰 히스토리 조회 시작 (sellerId: ${sellerId})...`);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bid-tokens/history/${sellerId}/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || localStorage.getItem('dungji_auth_token')}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log('토큰 히스토리 조회 성공:', data.length, '건');
        setTokenHistory(data);
      } else {
        const errorData = await response.json();
        console.error('토큰 히스토리 조회 실패:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch token history:', error);
    }
  };

  const handleSellerClick = async (seller: Seller) => {
    setSelectedSeller(seller);
    setShowDetailModal(true);
    await fetchTokenHistory(seller.id);
  };

  const handleAdjustTokens = async () => {
    if (!selectedSeller) return;
    
    if (!adjustmentReason.trim()) {
      toast({
        title: '오류',
        description: '조정 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        seller_id: selectedSeller.id,
        action: adjustmentType,
        amount: adjustmentAmount,
        reason: adjustmentReason,
      };
      console.log('견적티켓 조정 요청:', requestData);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bid-tokens/adjust/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('dungji_auth_token')}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log('견적티켓 조정 응답:', responseData);
        
        toast({
          title: '성공',
          description: `견적티켓이 ${adjustmentType === 'add' ? '추가' : '차감'}되었습니다.`,
        });
        
        // Refresh seller data with delay to ensure DB update
        setTimeout(async () => {
          await fetchSellers();
          await fetchTokenHistory(selectedSeller.id);
        }, 500);
        
        // Reset form
        setAdjustmentAmount(1);
        setAdjustmentReason('');
      } else {
        const errorData = await response.json();
        console.error('견적티켓 조정 실패:', errorData);
        throw new Error(errorData.detail || 'Failed to adjust tokens');
      }
    } catch (error: any) {
      console.error('견적티켓 조정 오류:', error);
      toast({
        title: '오류',
        description: error.message || '견적티켓 조정에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGrantSubscription = async () => {
    if (!selectedSeller) return;
    
    if (!adjustmentReason.trim()) {
      toast({
        title: '오류',
        description: '부여 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        seller_id: selectedSeller.id,
        days: subscriptionDays,
        reason: adjustmentReason,
      };
      console.log('구독권 부여 요청:', requestData);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bid-tokens/grant-subscription/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || localStorage.getItem('dungji_auth_token')}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log('구독권 부여 응답:', responseData);
        
        toast({
          title: '성공',
          description: `${subscriptionDays}일 구독권이 부여되었습니다.`,
        });
        
        // Refresh data with delay to ensure DB update
        setTimeout(async () => {
          await fetchSellers();
          await fetchTokenHistory(selectedSeller.id);
        }, 500);
        
        // Reset form
        setSubscriptionDays(30);
        setAdjustmentReason('');
      } else {
        const errorData = await response.json();
        console.error('구독권 부여 실패:', errorData);
        throw new Error(errorData.detail || 'Failed to grant subscription');
      }
    } catch (error: any) {
      console.error('구독권 부여 오류:', error);
      toast({
        title: '오류',
        description: error.message || '구독권 부여에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with search */}
      <Card>
        <CardHeader>
          <CardTitle>이용권 현황 시스템</CardTitle>
          <CardDescription>판매회원의 견적이용권과 구독권을 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="회원ID, 닉네임, 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sellers Table */}
      <Card>
        <CardHeader>
          <CardTitle>판매회원 목록</CardTitle>
          <CardDescription>총 {filteredSellers.length}명의 판매회원</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>회원ID</TableHead>
                <TableHead>닉네임</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>견적이용권 보유</TableHead>
                <TableHead>구독권 상태</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSellers.map((seller) => (
                <TableRow key={seller.id}>
                  <TableCell>{seller.id}</TableCell>
                  <TableCell>{seller.nickname || seller.username}</TableCell>
                  <TableCell>{seller.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {seller.active_tokens_count}개
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {seller.has_unlimited_subscription ? (
                      <Badge className="bg-green-100 text-green-700">
                        구독중 (~{new Date(seller.unlimited_expires_at!).toLocaleDateString()})
                      </Badge>
                    ) : (
                      <Badge variant="secondary">미구독</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSellerClick(seller)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      관리
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Management Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSeller?.nickname || selectedSeller?.username} 이용권 현황
            </DialogTitle>
            <DialogDescription>
              회원 ID: {selectedSeller?.id} | 이메일: {selectedSeller?.email}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="adjust" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="adjust">견적이용권 조정</TabsTrigger>
              <TabsTrigger value="subscription">구독권 부여</TabsTrigger>
              <TabsTrigger value="history">이용 내역</TabsTrigger>
            </TabsList>

            <TabsContent value="adjust" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>조정 유형</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={adjustmentType === 'add' ? 'default' : 'outline'}
                      onClick={() => setAdjustmentType('add')}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      추가
                    </Button>
                    <Button
                      variant={adjustmentType === 'subtract' ? 'default' : 'outline'}
                      onClick={() => setAdjustmentType('subtract')}
                      className="flex-1"
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      차감
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>수량</Label>
                  <Input
                    type="number"
                    min="1"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 1)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>조정 사유 (필수)</Label>
                  <Textarea
                    placeholder="예: 이벤트 보상, CS 보상, 오류 수정 등"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleAdjustTokens}
                  disabled={loading || !adjustmentReason.trim()}
                  className="w-full"
                >
                  {loading ? '처리중...' : '견적이용권 조정'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>구독 기간</Label>
                  <Select
                    value={subscriptionDays.toString()}
                    onValueChange={(value) => setSubscriptionDays(parseInt(value))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7일</SelectItem>
                      <SelectItem value="15">15일</SelectItem>
                      <SelectItem value="30">30일</SelectItem>
                      <SelectItem value="60">60일</SelectItem>
                      <SelectItem value="90">90일</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>부여 사유 (필수)</Label>
                  <Textarea
                    placeholder="예: 프로모션, CS 보상, 테스트 등"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleGrantSubscription}
                  disabled={loading || !adjustmentReason.trim()}
                  className="w-full"
                >
                  {loading ? '처리중...' : '구독권 부여'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-2">
                {tokenHistory.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>일시</TableHead>
                          <TableHead>구분</TableHead>
                          <TableHead>수량</TableHead>
                          <TableHead>사유</TableHead>
                          <TableHead>처리자</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tokenHistory.map((history) => (
                          <TableRow key={history.id}>
                            <TableCell className="text-sm">
                              {new Date(history.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                history.action === 'add' ? 'default' :
                                history.action === 'subtract' ? 'destructive' :
                                history.action === 'purchase' ? 'outline' :
                                'secondary'
                              }>
                                {history.action === 'add' ? '추가' :
                                 history.action === 'subtract' ? '차감' :
                                 history.action === 'purchase' ? '구매' :
                                 history.action === 'use' ? '사용' : history.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {history.action === 'add' ? '+' : '-'}{history.amount}
                            </TableCell>
                            <TableCell className="text-sm">{history.reason}</TableCell>
                            <TableCell className="text-sm">
                              {history.admin_user || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>아직 이용 내역이 없습니다.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}