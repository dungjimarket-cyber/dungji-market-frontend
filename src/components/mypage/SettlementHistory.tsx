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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { getSettlements, SettlementData } from '@/lib/api/bidService';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';

// SettlementData 인터페이스를 API 서비스에서 가져와 사용합니다

/**
 * 판매자(사업자회원) 정산 내역 컴포넌트
 */
export default function SettlementHistory() {
  const { accessToken } = useAuth();
  const [settlements, setSettlements] = useState<SettlementData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 정산 내역 조회
  useEffect(() => {
    const fetchSettlements = async () => {
      if (!accessToken) return;
      
      try {
        const data = await getSettlements();
        setSettlements(data);
      } catch (error) {
        console.error('정산 내역 조회 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettlements();
  }, [accessToken]);

  // 정산 상태별 색상 및 아이콘
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-4 h-4 mr-1" /> 정산완료</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-4 h-4 mr-1" /> 정산실패</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">처리중</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center p-8">로딩 중...</div>;
  }

  // 정산 내역이 없는 경우 안내 메시지 표시
  if (settlements.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <p className="text-gray-500">정산 내역이 없습니다.</p>
        <p className="text-sm text-gray-400 mt-2">공구 판매가 완료되면 정산 내역이 여기에 표시됩니다.</p>
      </div>
    );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>정산 내역</CardTitle>
        <CardDescription>완료된 공구의 정산 내역을 확인할 수 있습니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>공구명</TableHead>
                <TableHead>상품</TableHead>
                <TableHead>참여인원</TableHead>
                <TableHead>총 금액</TableHead>
                <TableHead>수수료 (5%)</TableHead>
                <TableHead>실 정산액</TableHead>
                <TableHead>정산일자</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>영수증</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((settlement) => (
                <TableRow key={settlement.id}>
                  <TableCell className="font-medium">{settlement.groupbuy_title}</TableCell>
                  <TableCell>{settlement.product_name}</TableCell>
                  <TableCell>{settlement.participants_count}명</TableCell>
                  <TableCell>{settlement.total_amount.toLocaleString()}원</TableCell>
                  <TableCell>{settlement.fee_amount.toLocaleString()}원</TableCell>
                  <TableCell className="font-semibold">{settlement.net_amount.toLocaleString()}원</TableCell>
                  <TableCell>{settlement.settlement_date}</TableCell>
                  <TableCell>{getStatusBadge(settlement.payment_status)}</TableCell>
                  <TableCell>
                    {settlement.receipt_url ? (
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-1" /> 
                        보기
                      </Button>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="text-blue-700 font-semibold mb-2">정산 안내</h4>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• 정산은 공구 완료 후 3영업일 이내에 처리됩니다.</li>
              <li>• 수수료는 총 판매액의 5%로 계산됩니다.</li>
              <li>• 정산 내역 관련 문의는 고객센터로 연락해주세요.</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
