'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

function NoShowReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, accessToken, user } = useAuth();
  const groupbuyId = searchParams.get('groupbuyId') || searchParams.get('groupbuy_id');
  
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'buyer_noshow' | 'seller_noshow'>('seller_noshow');
  const [content, setContent] = useState('');
  const [groupbuyInfo, setGroupbuyInfo] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    if (groupbuyId) {
      fetchGroupbuyInfo();
    }
  }, [groupbuyId, isAuthenticated]);

  const fetchGroupbuyInfo = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupbuyId}/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGroupbuyInfo(data);
        
        // 판매자인 경우 참여자 목록도 가져오기
        if (user?.role === 'seller') {
          fetchParticipants();
        }
      }
    } catch (error) {
      console.error('공구 정보 조회 실패:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupbuyId}/participants/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
      }
    } catch (error) {
      console.error('참여자 목록 조회 실패:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('신고 내용을 입력해주세요.');
      return;
    }

    if (content.trim().length < 20) {
      toast.error('신고 내용은 20자 이상 작성해주세요.');
      return;
    }

    setLoading(true);

    try {
      // 신고 대상 결정
      let reportedUserId;
      if (reportType === 'seller_noshow') {
        // 판매자 노쇼: 선택된 입찰의 판매자 찾기
        const bidResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupbuyId}/winning-bid/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (bidResponse.ok) {
          const bidData = await bidResponse.json();
          reportedUserId = bidData.seller.id;
        } else {
          toast.error('선택된 판매자를 찾을 수 없습니다.');
          return;
        }
      } else {
        // 구매자 노쇼: 선택된 구매자 ID 사용
        if (!selectedBuyerId) {
          toast.error('신고할 구매자를 선택해주세요.');
          return;
        }
        reportedUserId = parseInt(selectedBuyerId);
      }

      // 노쇼 신고 제출
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reported_user: reportedUserId,
          groupbuy: groupbuyId,
          report_type: reportType,
          content: content.trim()
        })
      });

      if (response.ok) {
        toast.success('노쇼 신고가 접수되었습니다. 신고된 공구는 취소 처리됩니다.');
        // 판매자인 경우 판매자 마이페이지로, 구매자인 경우 일반 마이페이지로
        if (user?.role === 'seller') {
          router.push('/mypage/seller');
        } else {
          router.push('/mypage');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || errorData.detail || '신고 접수에 실패했습니다.');
      }
    } catch (error) {
      console.error('노쇼 신고 오류:', error);
      toast.error('신고 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!groupbuyId || !groupbuyInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">공구 정보가 없습니다.</p>
            <div className="text-center mt-4">
              <Link href="/mypage">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  마이페이지로 돌아가기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/mypage">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            마이페이지로 돌아가기
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>노쇼 신고하기</CardTitle>
          {groupbuyInfo && (
            <p className="text-sm text-gray-600 mt-2">
              공구: {groupbuyInfo.title}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 신고 유형 선택 */}
            <div className="space-y-3">
              <Label>신고 유형</Label>
              <RadioGroup 
                value={reportType} 
                onValueChange={(value) => setReportType(value as 'buyer_noshow' | 'seller_noshow')}
              >
                {user?.role === 'buyer' && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="seller_noshow" id="seller_noshow" />
                    <Label htmlFor="seller_noshow">
                      판매자가 약속된 시간에 나타나지 않았어요 (판매자 노쇼)
                    </Label>
                  </div>
                )}
                {user?.role === 'seller' && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="buyer_noshow" id="buyer_noshow" />
                    <Label htmlFor="buyer_noshow">
                      구매자가 약속된 시간에 나타나지 않았어요 (구매자 노쇼)
                    </Label>
                  </div>
                )}
              </RadioGroup>
            </div>

            {/* 구매자 선택 (판매자가 구매자 노쇼 신고 시) */}
            {user?.role === 'seller' && reportType === 'buyer_noshow' && participants.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="buyer-select">신고할 구매자 선택</Label>
                <Select value={selectedBuyerId} onValueChange={setSelectedBuyerId}>
                  <SelectTrigger id="buyer-select">
                    <SelectValue placeholder="구매자를 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((participant) => (
                      <SelectItem key={participant.id} value={participant.id.toString()}>
                        {participant.username || participant.nickname || `참여자 ${participant.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  공구에 참여한 구매자 중에서 신고할 대상을 선택해주세요.
                </p>
              </div>
            )}

            {/* 신고 내용 */}
            <div className="space-y-2">
              <Label htmlFor="content">신고 내용</Label>
              <Textarea
                id="content"
                placeholder="노쇼 상황을 자세히 설명해주세요. (최소 20자 이상)
예: 약속 시간, 장소, 연락 시도 내용 등"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-none"
                required
              />
              <p className="text-xs text-gray-500 text-right">
                {content.length}/500자
              </p>
            </div>

            {/* 주의 사항 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">신고 전 확인사항</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>허위 신고 시 불이익이 있을 수 있습니다.</li>
                    <li>가능한 증빙 자료(메시지 캡처 등)를 준비해주세요.</li>
                    <li>신고 내용은 관리자가 검토 후 처리됩니다.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-2">
              <Link href="/mypage">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={
                  loading || 
                  !content.trim() || 
                  content.trim().length < 20 ||
                  (user?.role === 'seller' && reportType === 'buyer_noshow' && !selectedBuyerId)
                }
                className="bg-orange-600 hover:bg-orange-700"
              >
                {loading ? '신고 접수 중...' : '노쇼 신고하기'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NoShowReportPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">로딩 중...</p>
      </div>
    }>
      <NoShowReportContent />
    </Suspense>
  );
}