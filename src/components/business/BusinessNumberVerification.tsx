'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle, Building } from 'lucide-react';
import {
  verifyBusinessNumber,
  checkBusinessNumberFormat,
  formatBusinessNumber,
  cleanBusinessNumber,
  validateBusinessNumberChecksum,
  type BusinessVerificationResult
} from '@/lib/api/businessVerification';

interface BusinessNumberVerificationProps {
  onVerificationSuccess?: (result: BusinessVerificationResult) => void;
  onVerificationError?: (error: string) => void;
  initialBusinessNumber?: string;
  initialBusinessName?: string;
  showHistory?: boolean;
}

export function BusinessNumberVerification({
  onVerificationSuccess,
  onVerificationError,
  initialBusinessNumber = '',
  initialBusinessName = '',
  showHistory = false
}: BusinessNumberVerificationProps) {
  const [businessNumber, setBusinessNumber] = useState(initialBusinessNumber);
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<BusinessVerificationResult | null>(null);
  const [formatError, setFormatError] = useState<string>('');

  // 사업자번호 입력 처리 (자동 형식화)
  const handleBusinessNumberChange = (value: string) => {
    const cleanValue = cleanBusinessNumber(value);
    
    // 10자리 초과 입력 방지
    if (cleanValue.length > 10) {
      return;
    }

    // 형식화된 값으로 설정
    const formattedValue = formatBusinessNumber(cleanValue);
    setBusinessNumber(formattedValue);
    
    // 형식 오류 초기화
    setFormatError('');
    setVerificationResult(null);

    // 실시간 형식 검증 (10자리 입력 완료 시)
    if (cleanValue.length === 10) {
      const isValidChecksum = validateBusinessNumberChecksum(cleanValue);
      if (!isValidChecksum) {
        setFormatError('올바르지 않은 사업자번호입니다. (체크섬 오류)');
      }
    }
  };

  // 형식 검사
  const handleFormatCheck = async () => {
    if (!businessNumber.trim()) {
      setFormatError('사업자번호를 입력해주세요.');
      return;
    }

    try {
      const result = await checkBusinessNumberFormat(businessNumber);
      if (result.valid) {
        setFormatError('');
        setBusinessNumber(result.formatted_number || businessNumber);
      } else {
        setFormatError(result.message);
      }
    } catch (error) {
      setFormatError('형식 검사 중 오류가 발생했습니다.');
    }
  };

  // 실제 검증
  const handleVerification = async () => {
    if (!businessNumber.trim()) {
      setFormatError('사업자번호를 입력해주세요.');
      return;
    }

    // 형식 사전 검증
    const cleanNum = cleanBusinessNumber(businessNumber);
    if (cleanNum.length !== 10 || !validateBusinessNumberChecksum(cleanNum)) {
      setFormatError('올바르지 않은 사업자번호 형식입니다.');
      return;
    }

    setIsLoading(true);
    setFormatError('');

    try {
      const result = await verifyBusinessNumber(businessNumber, businessName || undefined);
      setVerificationResult(result);

      if (result.status === 'valid') {
        onVerificationSuccess?.(result);
      } else {
        onVerificationError?.(result.error_message || result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '검증 중 오류가 발생했습니다.';
      setFormatError(errorMessage);
      onVerificationError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 엔터 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleVerification();
    }
  };

  // 상태별 아이콘 및 색상
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'invalid':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'invalid':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'error':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          사업자번호 검증
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 사업자번호 입력 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            사업자등록번호 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="123-45-67890"
              value={businessNumber}
              onChange={(e) => handleBusinessNumberChange(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={12} // 하이픈 포함
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              variant="outline"
              onClick={handleFormatCheck}
              disabled={isLoading || !businessNumber.trim()}
            >
              형식확인
            </Button>
          </div>
          {formatError && (
            <p className="text-sm text-red-600">{formatError}</p>
          )}
        </div>

        {/* 상호명 입력 (선택사항) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            상호명 (선택사항)
          </label>
          <Input
            type="text"
            placeholder="회사명 또는 상호를 입력하세요"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500">
            상호명을 입력하면 더 정확한 검증이 가능합니다.
          </p>
        </div>

        {/* 검증 버튼 */}
        <Button
          onClick={handleVerification}
          disabled={isLoading || !businessNumber.trim() || !!formatError}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              검증 중...
            </>
          ) : (
            '사업자번호 검증'
          )}
        </Button>

        {/* 검증 결과 */}
        {verificationResult && (
          <Alert className={`border ${getStatusColor(verificationResult.status)}`}>
            <div className="flex items-start gap-3">
              {getStatusIcon(verificationResult.status)}
              <div className="flex-1">
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <strong>{verificationResult.message}</strong>
                      <Badge variant={verificationResult.status === 'valid' ? 'default' : 'destructive'}>
                        {verificationResult.status === 'valid' ? '유효' : 
                         verificationResult.status === 'invalid' ? '무효' : '오류'}
                      </Badge>
                    </div>
                    
                    {verificationResult.business_info && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <h4 className="font-medium text-gray-900 mb-2">사업자 정보</h4>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          {verificationResult.business_info.business_name && (
                            <>
                              <dt className="text-gray-600">상호명:</dt>
                              <dd className="text-gray-900">{verificationResult.business_info.business_name}</dd>
                            </>
                          )}
                          {verificationResult.business_info.representative_name && (
                            <>
                              <dt className="text-gray-600">대표자:</dt>
                              <dd className="text-gray-900">{verificationResult.business_info.representative_name}</dd>
                            </>
                          )}
                          {verificationResult.business_info.business_status && (
                            <>
                              <dt className="text-gray-600">사업상태:</dt>
                              <dd className="text-gray-900">{verificationResult.business_info.business_status}</dd>
                            </>
                          )}
                          {verificationResult.business_info.establishment_date && (
                            <>
                              <dt className="text-gray-600">개업일:</dt>
                              <dd className="text-gray-900">{verificationResult.business_info.establishment_date}</dd>
                            </>
                          )}
                        </dl>
                      </div>
                    )}
                    
                    {verificationResult.error_message && (
                      <p className="text-sm text-red-600 mt-2">
                        {verificationResult.error_message}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* 안내 메시지 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• 국세청 사업자등록정보 진위확인 서비스를 통해 검증됩니다.</p>
          <p>• 검증된 사업자번호는 판매회원 인증에 사용됩니다.</p>
          <p>• 개인정보는 검증 목적으로만 사용되며, 안전하게 보호됩니다.</p>
        </div>
      </CardContent>
    </Card>
  );
}