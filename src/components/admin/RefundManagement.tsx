'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle, CreditCard, Calendar } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { refundService } from '@/lib/api/refundService';

interface RefundRequest {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
    nickname?: string;
  };
  payment: {
    order_id: string;
    tid: string;
    amount: number;
    pay_method: string;
    created_at: string;
    product_name: string;
  };
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  request_date: string;
  processed_date?: string;
  processed_by?: {
    username: string;
  };
  admin_notes?: string;
  refund_amount?: number;
  can_refund: boolean;
  refund_deadline?: string;
  usage_count?: number;
}

// API 호출 함수
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('dungji_auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || '요청 처리 중 오류가 발생했습니다.');
  }

  return response.json();
};

// 상태별 배지 컴포넌트
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    pending: { label: '승인대기', className: 'bg-yellow-100 text-yellow-800' },
    approved: { label: '승인됨', className: 'bg-green-100 text-green-800' },
    rejected: { label: '거절됨', className: 'bg-red-100 text-red-800' },
    completed: { label: '완료됨', className: 'bg-blue-100 text-blue-800' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};

// 결제 수단별 아이콘
const PaymentMethodIcon = ({ method }: { method: string }) => {
  if (method === 'CARD') return <CreditCard className="h-4 w-4" />;
  if (method === 'VBANK') return <span className="font-bold text-sm">￦</span>;
  return <Calendar className="h-4 w-4" />;
};

export default function RefundManagement() {
  const { toast } = useToast();
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // 다이얼로그 상태
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');

  // 환불 요청 목록 로드
  const loadRefundRequests = async () => {
    setLoading(true);
    try {
      const data = await refundService.getAdminRefundRequests();
      // API 응답 형태에 맞게 데이터 변환
      const transformedData = data.map(request => ({
        id: request.id,
        user: request.user_info,
        payment: request.payment_info,
        reason: request.reason,
        status: request.status,
        request_date: request.created_at,
        processed_date: request.processed_at,
        admin_notes: request.admin_note,
        refund_amount: request.refund_amount,
        can_refund: request.can_refund_info?.can_refund || true,
        refund_deadline: request.payment_info.created_at, // Calculate 7 days from payment
      }));
      setRefundRequests(transformedData);
    } catch (error: any) {
      toast({
        title: '로드 실패',
        description: error.message || '환불 요청 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefundRequests();
  }, []);

  // 환불 승인 처리
  const handleApproveRefund = async (request: RefundRequest) => {
    setProcessing(request.id);
    try {
      await refundService.approveRefundRequest(
        request.id,
        adminNotes.trim() || '환불 승인'
      );

      toast({
        title: '환불 승인 완료',
        description: `${request.payment.order_id} 주문의 환불이 승인되어 처리가 시작됩니다.`,
      });

      // 목록 갱신
      await loadRefundRequests();
      
      // 다이얼로그 닫기
      setActionDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error: any) {
      toast({
        title: '환불 승인 실패',
        description: error.message || '환불 승인 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  // 환불 거절 처리
  const handleRejectRefund = async (request: RefundRequest) => {
    setProcessing(request.id);
    try {
      await refundService.rejectRefundRequest(
        request.id,
        '환불 조건 미충족',
        adminNotes.trim()
      );

      toast({
        title: '환불 거절 완료',
        description: `${request.payment.order_id} 주문의 환불 요청이 거절되었습니다.`,
      });

      // 목록 갱신
      await loadRefundRequests();
      
      // 다이얼로그 닫기
      setActionDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error: any) {
      toast({
        title: '환불 거절 실패',
        description: error.message || '환불 거절 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  // 액션 다이얼로그 열기
  const openActionDialog = (request: RefundRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setActionDialogOpen(true);
    setAdminNotes('');
  };

  // 액션 실행
  const executeAction = () => {
    if (!selectedRequest) return;
    
    if (actionType === 'approve') {
      handleApproveRefund(selectedRequest);
    } else {
      handleRejectRefund(selectedRequest);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">환불 요청 목록을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>환불 승인 요청 관리</CardTitle>
          <CardDescription>
            사용자들의 환불 요청을 검토하고 승인/거절을 처리합니다. 
            둥지마켓 환불 정책에 따라 구매 후 7일 이내, 미사용시에만 환불이 가능합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {refundRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              처리할 환불 요청이 없습니다.
            </div>
          ) : (
            <div className="space-y-6">
              {refundRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-6 space-y-4">
                  {/* 요청 헤더 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={request.status} />
                      <div className="flex items-center gap-1">
                        <PaymentMethodIcon method={request.payment.pay_method} />
                        <span className="font-medium">{request.payment.order_id}</span>
                      </div>
                      {!request.can_refund && (
                        <Badge variant="destructive" className="text-xs">
                          환불 불가
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      요청일: {new Date(request.request_date).toLocaleString()}
                    </div>
                  </div>

                  {/* 사용자 및 결제 정보 */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">요청자 정보</h4>
                      <div className="space-y-1">
                        <p>
                          <span className="font-medium">
                            {request.user.username}
                          </span>
                          {request.user.nickname && (
                            <span className="text-muted-foreground ml-2">({request.user.nickname})</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{request.user.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">결제 정보</h4>
                      <div className="space-y-1">
                        <p><span className="text-muted-foreground">상품:</span> {request.payment.product_name}</p>
                        <p><span className="text-muted-foreground">결제금액:</span> {request.payment.amount.toLocaleString()}원</p>
                        <p><span className="text-muted-foreground">결제일:</span> {new Date(request.payment.created_at).toLocaleString()}</p>
                        <p><span className="text-muted-foreground">결제수단:</span> {
                          request.payment.pay_method === 'CARD' ? '카드결제' :
                          request.payment.pay_method === 'VBANK' ? '무통장입금' : 
                          request.payment.pay_method
                        }</p>
                        {request.usage_count !== undefined && (
                          <p><span className="text-muted-foreground">사용횟수:</span> {request.usage_count}회</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 환불 요청 사유 */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">환불 요청 사유</h4>
                    <p className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                      {request.reason || '사유 없음'}
                    </p>
                  </div>

                  {/* 관리자 처리 정보 */}
                  {(request.processed_date || request.admin_notes) && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">처리 정보</h4>
                      <div className="space-y-1 text-sm">
                        {request.processed_date && (
                          <p><span className="text-muted-foreground">처리일:</span> {new Date(request.processed_date).toLocaleString()}</p>
                        )}
                        {request.processed_by && (
                          <p><span className="text-muted-foreground">처리자:</span> {request.processed_by.username}</p>
                        )}
                        {request.admin_notes && (
                          <div>
                            <span className="text-muted-foreground">관리자 메모:</span>
                            <p className="p-2 bg-muted rounded text-xs whitespace-pre-wrap mt-1">
                              {request.admin_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 환불 기한 표시 */}
                  {request.refund_deadline && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-md">
                      <Calendar className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        환불 가능 기한: {new Date(request.refund_deadline).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  {request.status === 'pending' && request.can_refund && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => openActionDialog(request, 'approve')}
                        disabled={!!processing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processing === request.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            처리중...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            승인
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openActionDialog(request, 'reject')}
                        disabled={!!processing}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        거절
                      </Button>
                    </div>
                  )}

                  {request.status === 'pending' && !request.can_refund && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        환불 조건을 만족하지 않아 자동 거절 예정입니다. 
                        (7일 초과 또는 이미 사용된 이용권)
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 승인/거절 확인 다이얼로그 */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              환불 {actionType === 'approve' ? '승인' : '거절'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRequest && (
                <>
                  주문번호 {selectedRequest.payment.order_id} 
                  ({selectedRequest.payment.amount.toLocaleString()}원)의 
                  환불 요청을 {actionType === 'approve' ? '승인' : '거절'}하시겠습니까?
                  {actionType === 'approve' && (
                    <span className="block mt-2 text-sm text-muted-foreground">
                      승인 시 이니시스를 통해 자동으로 환불 처리가 진행됩니다.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="admin-notes">관리자 메모</Label>
            <Textarea
              id="admin-notes"
              placeholder={
                actionType === 'approve' 
                  ? '승인 사유를 입력해주세요 (선택사항)' 
                  : '거절 사유를 입력해주세요'
              }
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSelectedRequest(null);
              setAdminNotes('');
            }}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              disabled={!!processing}
              className={actionType === 'approve' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-destructive hover:bg-destructive/90'
              }
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  처리중...
                </>
              ) : (
                actionType === 'approve' ? '승인' : '거절'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}