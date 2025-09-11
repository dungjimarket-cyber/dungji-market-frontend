'use client';

import { useState } from 'react';
import { Star, ThumbsUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Review {
  id: number;
  reviewerName: string;
  reviewerImage?: string;
  rating: number;
  comment: string;
  responseSpeed: number;
  manner: number;
  promiseKeeping: number;
  tradeType: 'sell' | 'buy';
  productTitle: string;
  createdAt: string;
}

export default function ReviewsTab() {
  const [reviews] = useState<Review[]>([
    {
      id: 1,
      reviewerName: '행복한구매자',
      rating: 5,
      comment: '상태가 정말 깨끗하고 친절하게 거래해주셨어요! 감사합니다.',
      responseSpeed: 5,
      manner: 5,
      promiseKeeping: 5,
      tradeType: 'sell',
      productTitle: 'iPhone 14 Pro 256GB',
      createdAt: '2024-12-20',
    },
    {
      id: 2,
      reviewerName: '스마트유저',
      reviewerImage: '/images/default-profile.jpg',
      rating: 4,
      comment: '약속 시간도 잘 지키시고 물건 상태도 설명과 같았습니다.',
      responseSpeed: 4,
      manner: 5,
      promiseKeeping: 4,
      tradeType: 'buy',
      productTitle: 'Galaxy S23 Ultra',
      createdAt: '2024-12-18',
    },
  ]);

  const [pendingReviews] = useState([
    {
      id: 1,
      tradeId: 100,
      productTitle: 'AirPods Pro 2세대',
      traderName: '애플팬',
      tradeType: 'buy',
      tradeDate: '2024-12-25',
    },
  ]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <h3 className="font-semibold mb-3">거래 후기</h3>
      
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="received">
            받은 후기 ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            작성 대기 ({pendingReviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              아직 받은 후기가 없습니다
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">응답 속도</div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold">4.5</span>
                    {renderStars(4.5)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">매너</div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold">5.0</span>
                    {renderStars(5)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">약속 이행</div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold">4.5</span>
                    {renderStars(4.5)}
                  </div>
                </div>
              </div>

              {reviews.map((review) => (
                <Card key={review.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={review.reviewerImage} />
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {review.reviewerName}
                          </span>
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-xs text-gray-500">
                          {review.createdAt}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">
                        {review.comment}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {review.tradeType === 'sell' ? '판매' : '구매'}: {review.productTitle}
                        </span>
                      </div>
                      
                      <div className="flex gap-3 mt-3 pt-3 border-t text-xs">
                        <span className="flex items-center gap-1">
                          응답속도 {renderStars(review.responseSpeed)}
                        </span>
                        <span className="flex items-center gap-1">
                          매너 {renderStars(review.manner)}
                        </span>
                        <span className="flex items-center gap-1">
                          약속 {renderStars(review.promiseKeeping)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3">
          {pendingReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              작성 대기 중인 후기가 없습니다
            </div>
          ) : (
            pendingReviews.map((pending) => (
              <Card key={pending.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{pending.productTitle}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      거래 상대: {pending.traderName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      거래일: {pending.tradeDate}
                    </p>
                  </div>
                  <Button size="sm">
                    후기 작성
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}