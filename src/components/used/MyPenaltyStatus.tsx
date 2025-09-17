'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Clock, Eye, FileText, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { checkActivePenalty, getMyPenalties, getMyReports, Penalty, Report } from '@/lib/api/used/reportApi';

export default function MyPenaltyStatus() {
  const [activePenalty, setActivePenalty] = useState<Penalty | null>(null);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllPenalties, setShowAllPenalties] = useState(false);
  const [showMyReports, setShowMyReports] = useState(false);

  useEffect(() => {
    fetchPenaltyData();
  }, []);

  const fetchPenaltyData = async () => {
    try {
      setIsLoading(true);
      const [activeData, penaltiesData, reportsData] = await Promise.all([
        checkActivePenalty(),
        getMyPenalties(),
        getMyReports(),
      ]);

      setActivePenalty(activeData.has_active_penalty && activeData.penalty ? activeData.penalty : null);
      setPenalties(penaltiesData);
      setReports(reportsData);
    } catch (error) {
      console.error('패널티 정보 조회 실패:', error);
      toast.error('패널티 정보를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'expired': return 'secondary';
      case 'revoked': return 'outline';
      default: return 'secondary';
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'resolved': return 'outline';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 현재 활성 패널티 */}
      {activePenalty ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              현재 제재 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={getStatusColor(activePenalty.status)}>
                  {activePenalty.penalty_type_display}
                </Badge>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-700">
                    {getDaysRemaining(activePenalty.end_date)}일 남음
                  </p>
                  <p className="text-xs text-red-600">
                    {formatDate(activePenalty.end_date)} 까지
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-sm"><strong>사유:</strong> {activePenalty.reason}</p>
                <p className="text-xs text-gray-600 mt-1">
                  시작일: {formatDate(activePenalty.start_date)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Shield className="h-5 w-5" />
              제재 없음
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">현재 활성화된 제재가 없습니다.</p>
          </CardContent>
        </Card>
      )}

      {/* 제재 이력 */}
      {penalties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              제재 이력
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {penalties.slice(0, showAllPenalties ? undefined : 3).map((penalty) => (
                <div key={penalty.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(penalty.status)}>
                        {penalty.penalty_type_display}
                      </Badge>
                      <Badge variant="outline">{penalty.status_display}</Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(penalty.created_at)}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{penalty.reason}</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-4">
                      <span>기간: {penalty.duration_days}일</span>
                      <span>
                        {formatDate(penalty.start_date)} ~ {formatDate(penalty.end_date)}
                      </span>
                    </div>
                    {penalty.related_reports_count > 0 && (
                      <p>관련 신고: {penalty.related_reports_count}건</p>
                    )}
                    {penalty.issued_by_username && (
                      <p>발령자: {penalty.issued_by_username}</p>
                    )}
                    {penalty.revoked_by_username && (
                      <p>해제자: {penalty.revoked_by_username} ({formatDate(penalty.revoked_at!)})</p>
                    )}
                  </div>
                </div>
              ))}

              {penalties.length > 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllPenalties(!showAllPenalties)}
                  className="w-full"
                >
                  {showAllPenalties ? '접기' : `더 보기 (${penalties.length - 3}개)`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 내가 제출한 신고 */}
      <Collapsible open={showMyReports} onOpenChange={setShowMyReports}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  내가 제출한 신고 ({reports.length})
                </div>
                <Button variant="ghost" size="sm">
                  {showMyReports ? '접기' : '보기'}
                </Button>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{report.report_type_display}</Badge>
                          <Badge variant={getReportStatusColor(report.status)}>
                            {report.status_display}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(report.created_at)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4" />
                          <span>신고 대상: {report.reported_user_username}</span>
                          {report.reported_phone_model && (
                            <span className="text-gray-500">({report.reported_phone_model})</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{report.description}</p>
                        {report.admin_note && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-sm font-medium text-blue-800">관리자 답변:</p>
                            <p className="text-sm text-blue-700">{report.admin_note}</p>
                            {report.processed_by_username && (
                              <p className="text-xs text-blue-600 mt-1">
                                처리자: {report.processed_by_username}
                                ({formatDateTime(report.processed_at!)})
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">제출한 신고가 없습니다.</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}