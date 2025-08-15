'use client';

import { useEffect, useState } from 'react';
import { usePartner } from '@/contexts/PartnerContext';
import { partnerService } from '@/lib/api/partnerService';
import { PartnerSettlement, PaginatedResponse } from '@/types/partner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  CreditCard, 
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'processing':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'failed':
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'processing':
      return 'secondary';
    case 'pending':
      return 'outline';
    case 'failed':
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

interface SettlementRequestData {
  amount: number;
  tax_invoice: boolean;
  memo?: string;
}

export default function SettlementsPage() {
  const { partner, summary } = usePartner();
  const [settlements, setSettlements] = useState<PartnerSettlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestData, setRequestData] = useState<SettlementRequestData>({
    amount: 0,
    tax_invoice: false,
    memo: '',
  });

  const minSettlementAmount = 50000;
  const availableAmount = summary?.available_settlement || 0;

  const loadSettlements = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response: PaginatedResponse<PartnerSettlement> = await partnerService.getSettlements();
      setSettlements(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : '정산 내역을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (partner) {
      loadSettlements();
    }
  }, [partner]);

  const handleRequestSubmit = async () => {
    if (requestData.amount < minSettlementAmount) {
      setError(`최소 정산 금액은 ${formatCurrency(minSettlementAmount)}입니다.`);
      return;
    }

    if (requestData.amount > availableAmount) {
      setError('정산가능금액을 초과했습니다.');
      return;
    }

    setIsRequesting(true);
    setError(null);

    try {
      await partnerService.requestSettlement({
        amount: requestData.amount,
        tax_invoice: requestData.tax_invoice,
        memo: requestData.memo || undefined,
      });
      
      setIsRequestDialogOpen(false);
      setRequestData({ amount: 0, tax_invoice: false, memo: '' });
      loadSettlements();
    } catch (err) {
      setError(err instanceof Error ? err.message : '정산 요청에 실패했습니다.');
    } finally {
      setIsRequesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">정산 관리</h1>
          <p className="text-muted-foreground">
            파트너 수수료 정산을 요청하고 관리하세요
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Settlement Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">정산가능금액</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(availableAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              최소 정산 금액: {formatCurrency(minSettlementAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">정산 요청</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  disabled={availableAmount < minSettlementAmount}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  정산 요청하기
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>정산 요청</DialogTitle>
                  <DialogDescription>
                    정산을 요청할 금액과 세금계산서 발행 여부를 선택하세요.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">정산 금액</Label>
                    <Input
                      id="amount"
                      type="number"
                      min={minSettlementAmount}
                      max={availableAmount}
                      value={requestData.amount || ''}
                      onChange={(e) => setRequestData(prev => ({ 
                        ...prev, 
                        amount: parseInt(e.target.value) || 0 
                      }))}
                      placeholder={`최소 ${formatCurrency(minSettlementAmount)}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      정산가능금액: {formatCurrency(availableAmount)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tax_invoice"
                      checked={requestData.tax_invoice}
                      onCheckedChange={(checked) => setRequestData(prev => ({
                        ...prev,
                        tax_invoice: checked as boolean
                      }))}
                    />
                    <Label htmlFor="tax_invoice" className="text-sm">
                      세금계산서 발행 요청
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memo">메모 (선택사항)</Label>
                    <Input
                      id="memo"
                      value={requestData.memo}
                      onChange={(e) => setRequestData(prev => ({ 
                        ...prev, 
                        memo: e.target.value 
                      }))}
                      placeholder="정산 요청 관련 메모를 입력하세요"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsRequestDialogOpen(false)}
                    disabled={isRequesting}
                  >
                    취소
                  </Button>
                  <Button 
                    onClick={handleRequestSubmit}
                    disabled={isRequesting || requestData.amount < minSettlementAmount}
                  >
                    {isRequesting ? '요청 중...' : '정산 요청'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {availableAmount < minSettlementAmount && (
              <p className="text-xs text-muted-foreground mt-2">
                최소 정산 금액에 도달하지 않았습니다.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Settlement History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            정산 내역
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                정산 내역이 없습니다
              </h3>
              <p className="text-sm text-muted-foreground">
                첫 번째 정산을 요청해보세요.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>상태</TableHead>
                    <TableHead>정산금액</TableHead>
                    <TableHead>계좌정보</TableHead>
                    <TableHead>세금계산서</TableHead>
                    <TableHead>요청일</TableHead>
                    <TableHead>처리일</TableHead>
                    <TableHead>메모</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(settlement.status)}
                          <Badge variant={getStatusBadgeVariant(settlement.status)}>
                            {settlement.status_display}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(settlement.settlement_amount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{settlement.bank_name}</div>
                          <div className="text-muted-foreground">
                            {settlement.account_number}
                          </div>
                          <div className="text-muted-foreground">
                            {settlement.account_holder}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {settlement.tax_invoice_requested ? (
                          <Badge variant="outline">발행요청</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(settlement.requested_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {settlement.processed_at ? 
                            formatDate(settlement.processed_at) : 
                            <span className="text-muted-foreground">-</span>
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-32 truncate">
                          {settlement.memo || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}