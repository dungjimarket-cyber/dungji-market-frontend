'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OfferItem {
  id: number;
  phoneId: number;
  title: string;
  image: string;
  originalPrice: number;
  offeredPrice: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface FavoriteItem {
  id: number;
  title: string;
  price: number;
  image: string;
  sellerNickname: string;
  createdAt: string;
}

export default function PurchasesTab() {
  // 임시 데이터
  const [offers] = useState<OfferItem[]>([
    {
      id: 1,
      phoneId: 10,
      title: 'iPhone 15 Pro Max 256GB',
      image: '/placeholder.png',
      originalPrice: 1200000,
      offeredPrice: 1100000,
      status: 'pending',
      createdAt: '2024-12-25',
    },
    {
      id: 2,
      phoneId: 11,
      title: 'Galaxy Z Flip5 256GB',
      image: '/placeholder.png',
      originalPrice: 900000,
      offeredPrice: 850000,
      status: 'accepted',
      createdAt: '2024-12-24',
    },
  ]);

  const [favorites] = useState<FavoriteItem[]>([
    {
      id: 1,
      title: 'AirPods Pro 2세대',
      price: 280000,
      image: '/placeholder.png',
      sellerNickname: '애플매니아',
      createdAt: '2024-12-23',
    },
    {
      id: 2,
      title: 'iPad Air 5세대 64GB',
      price: 750000,
      image: '/placeholder.png',
      sellerNickname: '디지털프로',
      createdAt: '2024-12-22',
    },
  ]);

  const getOfferStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            대기중
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-green-500 text-white gap-1">
            <CheckCircle className="w-3 h-3" />
            수락됨
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            거절됨
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <h3 className="font-semibold mb-3">구매 관리</h3>
      
      <Tabs defaultValue="offers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="offers">
            내 제안 ({offers.length})
          </TabsTrigger>
          <TabsTrigger value="favorites">
            찜 목록 ({favorites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="space-y-3">
          {offers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              제안한 상품이 없습니다
            </div>
          ) : (
            offers.map((offer) => (
              <Card key={offer.id} className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={offer.image}
                      alt={offer.title}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm line-clamp-1">
                          {offer.title}
                        </h4>
                        <div className="mt-1">
                          <p className="text-xs text-gray-500">
                            판매가: {offer.originalPrice.toLocaleString()}원
                          </p>
                          <p className="text-sm font-semibold text-blue-600">
                            제안가: {offer.offeredPrice.toLocaleString()}원
                          </p>
                        </div>
                      </div>
                      {getOfferStatusBadge(offer.status)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {offer.createdAt}
                      </span>
                      <div className="flex gap-2">
                        {offer.status === 'pending' && (
                          <Button size="sm" variant="outline">
                            제안 취소
                          </Button>
                        )}
                        {offer.status === 'accepted' && (
                          <Button size="sm">
                            메시지 보내기
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          상품 보기
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-3">
          {favorites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              찜한 상품이 없습니다
            </div>
          ) : (
            favorites.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-lg font-semibold mt-1">
                      {item.price.toLocaleString()}원
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      판매자: {item.sellerNickname}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {item.createdAt}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm">
                          가격 제안
                        </Button>
                        <Button size="sm" variant="outline">
                          <Heart className="w-4 h-4 mr-1" />
                          찜 해제
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}