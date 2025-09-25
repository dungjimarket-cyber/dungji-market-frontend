'use client';

import { useState, useEffect } from 'react';
import { Star, User, Calendar, ChevronRight, ChevronLeft, Smartphone, Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import axios from 'axios';
import ReviewModal from './ReviewModal';

interface MyTradeReviewsProps {
  userId?: number;
}

export default function MyTradeReviews({ userId }: MyTradeReviewsProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [myWrittenReviews, setMyWrittenReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('received');
  const [receivedPage, setReceivedPage] = useState(1);
  const [writtenPage, setWrittenPage] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('=== 후기 데이터 fetch 시작 ===');

      // 현재 사용자 ID 가져오기
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id || userId);
        console.log('현재 사용자 ID:', user.id || userId);
      } else if (userId) {
        setCurrentUserId(userId);
        console.log('props에서 받은 사용자 ID:', userId);
      }

      // 통합 데이터 병렬 호출
      const [statsResponse, receivedResponse, writtenResponse, phoneTransactionsResponse, electronicsTransactionsResponse] = await Promise.all([
        // 통합 평가 통계 (휴대폰 + 전자제품)
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/used/reviews/user-stats/`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        ).catch(() => ({ data: null })),
        // 통합 받은 리뷰
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/used/reviews/received/`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        ).catch(() => ({ data: { results: [] } })),
        // 통합 작성한 리뷰
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/used/reviews/written/`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        ).catch(() => ({ data: { results: [] } })),
        // 휴대폰 거래 내역
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/used/transactions/my-transactions/`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        ).catch(() => ({ data: { results: [] } })),
        // 전자제품 거래 내역 (my-trading 엔드포인트 사용)
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/used/electronics/my-trading/`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        ).catch(() => ({ data: [] }))
      ]);

      // 통계 데이터 설정 (이미 통합됨)
      const statsData = statsResponse.data || {};
      console.log('통합 평가 통계:', statsData);
      setStats(statsData);

      // 받은 리뷰 설정
      const receivedReviews = receivedResponse.data?.results || receivedResponse.data || [];
      console.log('통합 받은 리뷰:', receivedReviews.length, '개');
      setReviews(receivedReviews);

      // 작성한 리뷰 설정
      const writtenReviews = writtenResponse.data?.results || writtenResponse.data || [];
      console.log('통합 작성한 리뷰:', writtenReviews.length, '개');
      setMyWrittenReviews(writtenReviews);

      // 거래 내역 설정 및 평가 대기 필터링
      const phoneTransactions = phoneTransactionsResponse.data?.results || phoneTransactionsResponse.data || [];
      const electronicsTransactions = electronicsTransactionsResponse.data || [];

      // 휴대폰 거래 중 평가대기 필터링
      const phonePending = phoneTransactions.filter((t: any) =>
        t.status === 'completed' && !writtenReviews.some((r: any) => r.transaction === t.id)
      ).map((t: any) => ({ ...t, itemType: 'phone' }));

      // 전자제품 거래 중 평가대기 필터링
      const electronicsPending = electronicsTransactions.filter((t: any) => {
        // 전자제품의 경우 electronics 객체 내부의 status 확인
        const status = t.electronics?.status || t.status;
        return status === 'sold' && !t.has_review; // transactionId 체크 제거
      }).map((t: any) => ({
        ...t,
        itemType: 'electronics',
        // 필요한 필드 정규화
        id: t.transaction_id || t.offer_id || t.id, // transaction_id 우선, 없으면 offer_id 사용
        phone: t.electronics, // 전자제품 정보를 phone 필드에 매핑 (호환성을 위해)
        buyer: t.electronics?.seller,
        price: t.offered_price || t.electronics?.price
      }));

      // 전체 평가대기 목록 합치기
      const allPending = [...phonePending, ...electronicsPending];
      console.log('평가대기 - 휴대폰:', phonePending.length, '개, 전자제품:', electronicsPending.length, '개');
      setPendingReviews(allPending);

    } catch (error) {
      console.error('=== 후기 데이터 fetch 에러 ===');
      console.error('Error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        console.error('Request URL:', error.config?.url);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowReviewModal(true);
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-100 rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      {/* 평점 요약 */}
      {stats && stats.total_reviews > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">거래 평가</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-0.5 justify-center">
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold">
                    {stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : '0.0'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {stats.total_reviews}개 평가
                </p>
              </div>

              <div className="flex-1">
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const starFieldMap: { [key: number]: string } = {
                      5: 'five_star',
                      4: 'four_star',
                      3: 'three_star',
                      2: 'two_star',
                      1: 'one_star'
                    };
                    const count = stats[starFieldMap[rating]] || 0;
                    const percentage = stats.total_reviews > 0
                      ? (count / stats.total_reviews) * 100
                      : 0;

                    return (
                      <div key={rating} className="flex items-center gap-1">
                        <span className="text-xs w-2">{rating}</span>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-6">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 평가 항목 - 개선된 명칭 */}
            {stats.total_reviews > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="grid grid-cols-2 gap-2">
                  {stats.is_punctual_count > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-gray-600">약속을지켜요</span>
                      <span className="font-medium">{stats.is_punctual_count}</span>
                    </div>
                  )}
                  {stats.is_friendly_count > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-gray-600">친절해요</span>
                      <span className="font-medium">{stats.is_friendly_count}</span>
                    </div>
                  )}
                  {stats.is_honest_count > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-gray-600">믿을만해요</span>
                      <span className="font-medium">{stats.is_honest_count}</span>
                    </div>
                  )}
                  {stats.is_fast_response_count > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-gray-600">응답이빨라요</span>
                      <span className="font-medium">{stats.is_fast_response_count}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 평가 대기 */}
      {pendingReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">평가 대기중</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {pendingReviews.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    {transaction.itemType === 'electronics' ? (
                      <Monitor className="w-3 h-3 text-gray-400" />
                    ) : (
                      <Smartphone className="w-3 h-3 text-gray-400" />
                    )}
                    <p className="text-sm font-medium">
                      {transaction.itemType === 'electronics'
                        ? (transaction.electronics?.model_name || transaction.phone?.model_name || '전자제품')
                        : (transaction.phone_model || transaction.phone?.model || '휴대폰')}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {transaction.itemType === 'electronics'
                      ? `${transaction.electronics?.brand || '브랜드'} • ${transaction.electronics?.seller?.nickname || '판매자'}님과 거래`
                      : `${transaction.seller === currentUserId
                          ? transaction.buyer_username
                          : transaction.seller_username || '판매자'}님과 거래`}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleReviewClick(transaction)}
                >
                  평가
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 평가 탭 */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received">받은 후기</TabsTrigger>
              <TabsTrigger value="written">작성한 후기</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            {/* 받은 후기 탭 */}
            <TabsContent value="received" className="mt-0">
            {reviews.length > 0 ? (
              <div className="space-y-2">
                {reviews
                  .slice((receivedPage - 1) * itemsPerPage, receivedPage * itemsPerPage)
                  .map((review) => (
                  <div key={review.id} className="border-b last:border-b-0 pb-2 last:pb-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-medium">
                            {review.reviewer_nickname || review.reviewer_username}
                          </span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-2.5 w-2.5 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {/* 상품 정보 표시 */}
                        <div className="flex items-center gap-1 mb-1">
                          {review.itemType === 'electronics' ? (
                            <Monitor className="w-3 h-3 text-gray-400" />
                          ) : (
                            <Smartphone className="w-3 h-3 text-gray-400" />
                          )}
                          <p className="text-xs text-gray-500">
                            {review.itemType === 'electronics'
                              ? (review.product_name || '전자제품')
                              : `${review.phone_brand || ''} ${review.phone_model || '휴대폰'}`.trim()}
                          </p>
                        </div>
                        {/* 후기 내용 표시 (있을 경우만) */}
                        {review.comment && (
                          <p className="text-xs text-gray-600 mt-1 mb-1 whitespace-pre-wrap break-words">
                            {review.comment}
                          </p>
                        )}
                        {/* 평가 항목 표시 */}
                        <div className="flex flex-wrap items-center gap-1">
                          {review.is_punctual && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                              약속시간
                            </Badge>
                          )}
                          {review.is_friendly && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                              친절
                            </Badge>
                          )}
                          {review.is_honest && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                              신뢰
                            </Badge>
                          )}
                          {review.is_fast_response && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                              빠른응답
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(review.created_at), {
                            addSuffix: true,
                            locale: ko
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                아직 받은 후기가 없습니다
              </p>
            )}
            {/* 받은 후기 페이징 */}
            {reviews.length > itemsPerPage && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  onClick={() => setReceivedPage(prev => Math.max(1, prev - 1))}
                  disabled={receivedPage === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm">
                  {receivedPage} / {Math.ceil(reviews.length / itemsPerPage)}
                </span>
                <button
                  onClick={() => setReceivedPage(prev => Math.min(Math.ceil(reviews.length / itemsPerPage), prev + 1))}
                  disabled={receivedPage === Math.ceil(reviews.length / itemsPerPage)}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </TabsContent>

          {/* 작성한 후기 탭 */}
          <TabsContent value="written" className="mt-0">
            {myWrittenReviews.length > 0 ? (
              <div className="space-y-2">
                {myWrittenReviews
                  .slice((writtenPage - 1) * itemsPerPage, writtenPage * itemsPerPage)
                  .map((review) => (
                  <div key={review.id} className="border-b last:border-b-0 pb-2 last:pb-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-medium">
                            {review.reviewee_nickname || review.reviewee_username}님에게
                          </span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-2.5 w-2.5 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {/* 상품 정보 표시 */}
                        <div className="flex items-center gap-1 mb-1">
                          {review.itemType === 'electronics' ? (
                            <Monitor className="w-3 h-3 text-gray-400" />
                          ) : (
                            <Smartphone className="w-3 h-3 text-gray-400" />
                          )}
                          <p className="text-xs text-gray-500">
                            {review.itemType === 'electronics'
                              ? (review.product_name || '전자제품')
                              : `${review.phone_brand || ''} ${review.phone_model || '휴대폰'}`.trim()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {review.is_punctual && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                              약속시간
                            </Badge>
                          )}
                          {review.is_friendly && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                              친절
                            </Badge>
                          )}
                          {review.is_honest && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                              신뢰
                            </Badge>
                          )}
                          {review.is_fast_response && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                              빠른응답
                            </Badge>
                          )}
                        </div>
                        {review.comment && (
                          <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap break-words">
                            {review.comment}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(review.created_at), {
                            addSuffix: true,
                            locale: ko
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                아직 작성한 후기가 없습니다
              </p>
            )}
            {/* 작성한 후기 페이징 */}
            {myWrittenReviews.length > itemsPerPage && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  onClick={() => setWrittenPage(prev => Math.max(1, prev - 1))}
                  disabled={writtenPage === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm">
                  {writtenPage} / {Math.ceil(myWrittenReviews.length / itemsPerPage)}
                </span>
                <button
                  onClick={() => setWrittenPage(prev => Math.min(Math.ceil(myWrittenReviews.length / itemsPerPage), prev + 1))}
                  disabled={writtenPage === Math.ceil(myWrittenReviews.length / itemsPerPage)}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>

      {/* 리뷰 작성 모달 */}
      {showReviewModal && selectedTransaction && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedTransaction(null);
          }}
          transactionId={selectedTransaction.id}
          offerId={selectedTransaction.offer_id}
          itemType={selectedTransaction.itemType}
          revieweeName={
            selectedTransaction.itemType === 'electronics'
              ? (selectedTransaction.electronics?.seller?.nickname || '판매자')
              : (selectedTransaction.seller === currentUserId
                  ? selectedTransaction.buyer_username
                  : selectedTransaction.seller_username)
          }
          productInfo={{
            brand: selectedTransaction.itemType === 'electronics'
              ? (selectedTransaction.electronics?.brand || selectedTransaction.phone?.brand || '')
              : (selectedTransaction.phone_brand || ''),
            model: selectedTransaction.itemType === 'electronics'
              ? (selectedTransaction.electronics?.model_name || selectedTransaction.phone?.model_name || '')
              : (selectedTransaction.phone_model || selectedTransaction.phone?.model || ''),
            price: selectedTransaction.price || selectedTransaction.offered_price || selectedTransaction.electronics?.price || 0
          }}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
}