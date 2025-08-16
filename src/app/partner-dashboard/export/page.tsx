'use client';

import { useState, useEffect } from 'react';
import { usePartner } from '@/contexts/PartnerContext';
import { partnerService } from '@/lib/api/partnerService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Download, 
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  AlertCircle
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ExportParams {
  format: 'excel' | 'csv';
  start_date?: string;
  end_date?: string;
  status_filter?: string;
}

const statusOptions = [
  { value: '', label: '전체 상태' },
  { value: 'active', label: '활성' },
  { value: 'cancelled', label: '취소' },
  { value: 'paused', label: '일시정지' },
];

const formatOptions = [
  { value: 'excel', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
  { value: 'csv', label: 'CSV (.csv)', icon: FileText },
];

export default function ExportPage() {
  const { partner, isLoading: isPartnerLoading, error: partnerError } = usePartner();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exportParams, setExportParams] = useState<ExportParams>({
    format: 'excel',
    start_date: '',
    end_date: '',
    status_filter: '',
  });

  // Set error if partner context has error
  useEffect(() => {
    if (partnerError) {
      setError(partnerError);
    }
  }, [partnerError]);

  const handleExport = async () => {
    if (!partner) return;

    setIsExporting(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate date range
      if (exportParams.start_date && exportParams.end_date) {
        const startDate = new Date(exportParams.start_date);
        const endDate = new Date(exportParams.end_date);
        if (startDate > endDate) {
          setError('시작일이 종료일보다 늦을 수 없습니다.');
          return;
        }
      }

      const blob = await partnerService.exportData(exportParams);
      
      // Generate filename
      const now = new Date();
      const dateString = now.toISOString().split('T')[0];
      const extension = exportParams.format === 'excel' ? 'xlsx' : 'csv';
      const filename = `둥지마켓_파트너_데이터_${partner.partner_code}_${dateString}.${extension}`;
      
      // Download file
      partnerService.downloadFile(blob, filename);
      
      setSuccess(`데이터가 성공적으로 내보내졌습니다. (${filename})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 내보내기에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    setExportParams(prev => ({
      ...prev,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    }));
  };

  const clearDateRange = () => {
    setExportParams(prev => ({
      ...prev,
      start_date: '',
      end_date: '',
    }));
  };

  if (isPartnerLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            파트너 정보를 불러올 수 없습니다. 다시 로그인해주세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">데이터 내보내기</h1>
        <p className="text-muted-foreground">
          추천 회원 데이터를 Excel 또는 CSV 형태로 내보낼 수 있습니다
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="h-5 w-5 mr-2" />
              내보내기 옵션
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label>파일 형식</Label>
              <Select 
                value={exportParams.format} 
                onValueChange={(value: 'excel' | 'csv') => 
                  setExportParams(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>상태 필터</Label>
              <Select 
                value={exportParams.status_filter || ''} 
                onValueChange={(value) => 
                  setExportParams(prev => ({ ...prev, status_filter: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>기간 설정</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="start-date" className="text-xs text-muted-foreground">시작일</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={exportParams.start_date}
                    onChange={(e) => setExportParams(prev => ({ 
                      ...prev, 
                      start_date: e.target.value 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-xs text-muted-foreground">종료일</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={exportParams.end_date}
                    onChange={(e) => setExportParams(prev => ({ 
                      ...prev, 
                      end_date: e.target.value 
                    }))}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange(7)}
                >
                  최근 7일
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange(30)}
                >
                  최근 30일
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange(90)}
                >
                  최근 90일
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDateRange}
                >
                  전체 기간
                </Button>
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  내보내는 중...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  데이터 내보내기
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Export Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              내보낼 데이터
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">포함되는 정보</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 추천 회원 기본 정보 (이름, 연락처)</li>
                <li>• 가입일 및 구독 상태</li>
                <li>• 구독 금액 및 티켓 정보</li>
                <li>• 발생 수수료 및 정산 상태</li>
                <li>• 추천 코드 정보</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">개인정보 보호</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 민감한 개인정보는 마스킹 처리됩니다</li>
                <li>• 연락처는 뒷자리 일부가 가려집니다</li>
                <li>• 계좌번호 등은 마지막 4자리만 표시됩니다</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">파일 형식별 특징</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium">Excel (.xlsx)</div>
                    <div className="text-muted-foreground">차트 및 서식이 포함된 형태</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium">CSV (.csv)</div>
                    <div className="text-muted-foreground">텍스트 형태로 다른 프로그램에서 활용 가능</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>데이터 활용 가이드라인</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                    개인정보 보호법 준수
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    내보낸 데이터는 개인정보보호법에 따라 안전하게 관리해야 합니다. 
                    제3자에게 제공하거나 목적 외 사용을 금지합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">권장 활용 방법</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 월별 실적 분석 및 보고서 작성</li>
                  <li>• 회원 현황 파악 및 관리</li>
                  <li>• 수수료 정산 관련 자료 정리</li>
                  <li>• 마케팅 성과 분석</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">주의사항</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 안전한 장소에 파일 저장</li>
                  <li>• 불필요한 복제 및 공유 금지</li>
                  <li>• 사용 후 안전한 폐기 처리</li>
                  <li>• 비밀번호 설정 권장</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}