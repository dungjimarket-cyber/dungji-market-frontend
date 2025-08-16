'use client';

import { useEffect, useState } from 'react';
import { usePartner } from '@/contexts/PartnerContext';
import { partnerService } from '@/lib/api/partnerService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Settings, 
  Building,
  CreditCard,
  User,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface AccountInfo {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

export default function SettingsPage() {
  const { partner, refreshData } = usePartner();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    bank_name: '',
    account_number: '',
    account_holder: '',
  });

  useEffect(() => {
    if (partner) {
      setAccountInfo({
        bank_name: partner.bank_name || '',
        account_number: partner.account_number || '',
        account_holder: partner.account_holder || '',
      });
    }
  }, [partner]);

  const handleSaveAccount = async () => {
    if (!accountInfo.bank_name || !accountInfo.account_number || !accountInfo.account_holder) {
      setError('모든 계좌 정보를 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await partnerService.updateAccount(accountInfo);
      setSuccess('계좌 정보가 성공적으로 업데이트되었습니다.');
      await refreshData();
      
      // 3초 후 성공 메시지 제거
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '계좌 정보 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!partner) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">설정</h1>
        <p className="text-muted-foreground">
          파트너 계정 설정을 관리하세요
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Partner Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              파트너 정보
            </CardTitle>
            <CardDescription>
              파트너 기본 정보입니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partner-name">파트너사명</Label>
              <Input
                id="partner-name"
                value={partner.partner_name}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="partner-code">파트너 코드</Label>
              <Input
                id="partner-code"
                value={partner.partner_code}
                disabled
                className="bg-gray-50 font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="commission-rate">수수료율</Label>
              <Input
                id="commission-rate"
                value={`${partner.commission_rate}%`}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">상태</Label>
              <Input
                id="status"
                value={partner.is_active ? '활성' : '비활성'}
                disabled
                className="bg-gray-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              정산 계좌 정보
            </CardTitle>
            <CardDescription>
              정산금을 받을 계좌 정보를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank-name">은행명</Label>
              <Input
                id="bank-name"
                value={accountInfo.bank_name}
                onChange={(e) => setAccountInfo(prev => ({ ...prev, bank_name: e.target.value }))}
                placeholder="예: 신한은행"
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account-number">계좌번호</Label>
              <Input
                id="account-number"
                value={accountInfo.account_number}
                onChange={(e) => setAccountInfo(prev => ({ ...prev, account_number: e.target.value }))}
                placeholder="예: 110-123-456789"
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account-holder">예금주</Label>
              <Input
                id="account-holder"
                value={accountInfo.account_holder}
                onChange={(e) => setAccountInfo(prev => ({ ...prev, account_holder: e.target.value }))}
                placeholder="예: 홍길동"
                disabled={isSaving}
              />
            </div>
            
            <Button 
              onClick={handleSaveAccount}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  계좌 정보 저장
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            활동 요약
          </CardTitle>
          <CardDescription>
            파트너 활동 통계입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">총 추천 회원</p>
              <p className="text-2xl font-bold">{partner.total_referrals || 0}명</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">활성 구독자</p>
              <p className="text-2xl font-bold">{partner.active_subscribers || 0}명</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">정산가능금액</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('ko-KR', {
                  style: 'currency',
                  currency: 'KRW',
                }).format(partner.available_settlement_amount || 0)}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">가입일</p>
              <p className="text-xl font-medium">
                {new Date(partner.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Settings Info */}
      <Card>
        <CardHeader>
          <CardTitle>안내사항</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">계좌 정보 변경</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 정산 계좌는 언제든지 변경 가능합니다</li>
              <li>• 변경된 계좌는 다음 정산부터 적용됩니다</li>
              <li>• 진행 중인 정산은 기존 계좌로 입금됩니다</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">파트너 코드</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 파트너 코드는 변경할 수 없습니다</li>
              <li>• 추천 링크에 포함되는 고유 식별자입니다</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">수수료율</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 현재 수수료율: {partner.commission_rate}%</li>
              <li>• 수수료율 변경은 관리자에게 문의하세요</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}