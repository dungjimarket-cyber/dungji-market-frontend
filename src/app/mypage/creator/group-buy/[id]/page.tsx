'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, 
  Users,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Gavel,
  RefreshCw
} from 'lucide-react';
import { formatNumberWithCommas } from '@/lib/utils';
import { calculateGroupBuyStatus, getStatusText, getStatusClass } from '@/lib/groupbuy-utils';

interface Participant {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  joined_at: string;
  consent_status?: string;
  is_leader?: boolean;
}

interface Bid {
  id: number;
  seller: {
    id: number;
    username: string;
    business_name?: string;
  };
  bid_type: string;
  amount: number;
  message?: string;
  status: string;
  is_selected: boolean;
  created_at: string;
}

interface GroupBuyDetail {
  id: number;
  title: string;
  description: string;
  status: string;
  start_time: string;
  end_time: string;
  current_participants: number;
  min_participants: number;
  max_participants: number;
  region_name?: string;
  product_details: {
    name: string;
    base_price: number;
    category_name: string;
    image_url?: string;
  };
  participants: Participant[];
  bids: Bid[];
}

export default function CreatorGroupBuyManagementPage() {
  const [groupBuy, setGroupBuy] = useState<GroupBuyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const id = params.id as string;

  useEffect(() => {
    fetchGroupBuyDetail();
  }, [id, accessToken]);

  const fetchGroupBuyDetail = async (showRefreshToast = false) => {
    if (!accessToken) return;

    try {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // 1. 공구 기본 정보 조회
      const groupBuyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${id}/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!groupBuyResponse.ok) {
        throw new Error('공구 정보를 불러오는데 실패했습니다.');
      }

      const groupBuyData = await groupBuyResponse.json();
      
      // 생성자 권한 확인
      if (groupBuyData.creator !== user?.id) {
        toast({
          title: '접근 권한 없음',
          description: '본인이 생성한 공구만 관리할 수 있습니다.',
          variant: 'destructive',
        });
        router.push('/mypage');
        return;
      }

      // 2. 참여자 정보 조회 - groupbuys API의 participants_detail 엔드포인트 사용
      const participantsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${id}/participants_detail/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      let participants: Participant[] = [];
      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        participants = participantsData.participants || [];
      } else {
        // 대체 방법: 전체 참여 목록에서 필터링
        try {
          const allParticipationsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/participations/`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );
          
          if (allParticipationsResponse.ok) {
            const allParticipations = await allParticipationsResponse.json();
            // groupbuy id로 필터링
            const filteredParticipations = allParticipations.filter(
              (p: any) => p.groupbuy === Number(id)
            );
            participants = filteredParticipations.map((p: any) => ({
              id: p.id,
              user: p.user || { id: 0, username: '알 수 없음', email: '' },
              joined_at: p.joined_at,
              consent_status: p.consent_status,
              is_leader: p.is_leader,
            }));
          }
        } catch (error) {
          console.error('참여자 정보 조회 실패:', error);
        }
      }

      // 3. 입찰 정보 조회
      const bidsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${id}/bids/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      let bids: Bid[] = [];
      if (bidsResponse.ok) {
        const bidsData = await bidsResponse.json();
        bids = bidsData.map((b: any) => ({
          id: b.id,
          seller: {
            id: b.seller,
            username: b.seller_name || b.seller_username || '익명',
            business_name: b.seller_business_name,
          },
          bid_type: b.bid_type,
          amount: b.amount,
          message: b.message,
          status: b.status,
          is_selected: b.is_selected,
          created_at: b.created_at,
        }));
      }

      // 실제 참여자 수로 current_participants 업데이트
      const updatedGroupBuyData = {
        ...groupBuyData,
        current_participants: participants.length, // 실제 참여자 배열의 길이로 설정
        participants,
        bids,
      };
      
      setGroupBuy(updatedGroupBuyData);
      
      if (showRefreshToast) {
        toast({
          title: '새로고침 완료',
          description: '최신 정보로 업데이트되었습니다.',
        });
      }
    } catch (error) {
      console.error('공구 상세 조회 오류:', error);
      toast({
        title: '오류',
        description: '공구 정보를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 입찰 선택은 관리자가 동의 프로세스를 통해 진행합니다
  const handleSelectBidInfo = () => {
    toast({
      title: '안내',
      description: '입찰 선택은 공구 종료 후 관리자 검토를 거쳐 진행됩니다.',
    });
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!groupBuy) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">공구를 찾을 수 없습니다</h2>
          <Button onClick={() => router.push('/mypage')}>
            마이페이지로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const calculatedStatus = calculateGroupBuyStatus(
    groupBuy.status,
    groupBuy.start_time,
    groupBuy.end_time
  );

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/mypage" className="mr-4">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{groupBuy.title}</h1>
          <p className="text-gray-500">공구 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchGroupBuyDetail(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            새로고침
          </Button>
          <Badge className={getStatusClass(calculatedStatus)}>
            {getStatusText(calculatedStatus)}
          </Badge>
        </div>
      </div>

      {/* 공구 정보 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">참여자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groupBuy.current_participants}/{groupBuy.max_participants}
            </div>
            <p className="text-xs text-gray-500">
              최소 {groupBuy.min_participants}명
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">입찰 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupBuy.bids.length}</div>
            <p className="text-xs text-gray-500">개 입찰</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">종료일</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(groupBuy.end_time).toLocaleDateString('ko-KR')}
            </div>
            <p className="text-xs text-gray-500">
              {new Date(groupBuy.end_time).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">지역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-gray-500" />
              <span className="text-sm font-medium">
                {groupBuy.region_name || '전국'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 콘텐츠 */}
      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="participants">참여자 목록</TabsTrigger>
          <TabsTrigger value="bids">입찰 현황</TabsTrigger>
          <TabsTrigger value="details">상품 정보</TabsTrigger>
        </TabsList>

        {/* 참여자 목록 탭 */}
        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>참여자 목록</CardTitle>
              <CardDescription>
                공구에 참여한 사용자들의 목록입니다. (총 {groupBuy.participants.length}명)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groupBuy.participants.length > 0 ? (
                <div className="space-y-2">
                  {groupBuy.participants.map((participant, index) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          {participant.is_leader || participant.user.id === groupBuy.creator ? (
                            <span className="text-xs font-bold text-blue-600">방장</span>
                          ) : (
                            <Users className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {participant.user.username}
                            {(participant.is_leader || participant.user.id === groupBuy.creator) && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                공구 생성자
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(participant.joined_at).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })} 참여
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {participant.consent_status && (
                          <Badge
                            variant={
                              participant.consent_status === 'agreed'
                                ? 'default'
                                : participant.consent_status === 'disagreed'
                                ? 'destructive'
                                : participant.consent_status === 'pending'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {participant.consent_status === 'agreed' && '동의'}
                            {participant.consent_status === 'disagreed' && '거부'}
                            {participant.consent_status === 'pending' && '대기중'}
                            {participant.consent_status === 'expired' && '만료'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  아직 참여자가 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 입찰 현황 탭 */}
        <TabsContent value="bids">
          <Card>
            <CardHeader>
              <CardTitle>입찰 현황</CardTitle>
              <CardDescription>
                판매자들의 입찰 내역입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groupBuy.bids.length > 0 ? (
                <div className="space-y-3">
                  {groupBuy.bids.map((bid) => (
                    <div
                      key={bid.id}
                      className={`p-4 border rounded-lg ${
                        bid.is_selected ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium">
                              {bid.seller.business_name || bid.seller.username}
                            </p>
                            {bid.is_selected && (
                              <Badge className="bg-blue-600">선택됨</Badge>
                            )}
                            <Badge variant="outline">
                              {bid.bid_type === 'percentage' ? '정률' : '정액'}
                            </Badge>
                          </div>
                          <p className="text-lg font-semibold text-blue-600">
                            {formatNumberWithCommas(bid.amount)}
                            {bid.bid_type === 'percentage' ? '%' : '원'}
                          </p>
                          {bid.message && (
                            <p className="text-sm text-gray-600 mt-2">{bid.message}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(bid.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        {!bid.is_selected && calculatedStatus === 'bidding' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSelectBidInfo}
                          >
                            선택 안내
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  아직 입찰이 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 상품 정보 탭 */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>상품 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groupBuy.product_details.image_url && (
                  <div>
                    <img
                      src={groupBuy.product_details.image_url}
                      alt={groupBuy.product_details.name}
                      className="w-full rounded-lg"
                    />
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {groupBuy.product_details.name}
                    </h3>
                    <Badge variant="secondary">
                      {groupBuy.product_details.category_name}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">기본가</p>
                    <p className="text-xl font-semibold">
                      {formatNumberWithCommas(groupBuy.product_details.base_price)}원
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">공구 설명</p>
                    <p className="text-gray-700">{groupBuy.description}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}