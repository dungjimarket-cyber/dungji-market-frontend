'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Eye, Heart, MessageCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';

interface SalesItem {
  id: number;
  title: string;
  price: number;
  image: string;
  status: 'active' | 'reserved' | 'sold';
  views: number;
  favorites: number;
  offers: number;
  createdAt: string;
}

export default function SalesTab() {
  const [filter, setFilter] = useState<'all' | 'active' | 'reserved' | 'sold'>('all');
  
  // 임시 데이터
  const [salesItems] = useState<SalesItem[]>([
    {
      id: 1,
      title: 'iPhone 14 Pro 256GB 딥퍼플',
      price: 850000,
      image: '/placeholder.png',
      status: 'active',
      views: 125,
      favorites: 8,
      offers: 3,
      createdAt: '2024-12-20',
    },
    {
      id: 2,
      title: 'Galaxy S23 Ultra 512GB',
      price: 950000,
      image: '/placeholder.png',
      status: 'reserved',
      views: 89,
      favorites: 5,
      offers: 2,
      createdAt: '2024-12-18',
    },
    {
      id: 3,
      title: 'iPhone 13 128GB 블루',
      price: 650000,
      image: '/placeholder.png',
      status: 'sold',
      views: 203,
      favorites: 12,
      offers: 5,
      createdAt: '2024-12-10',
    },
  ]);

  const filteredItems = filter === 'all' 
    ? salesItems 
    : salesItems.filter(item => item.status === filter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-500 text-white">판매중</Badge>;
      case 'reserved':
        return <Badge className="bg-orange-500 text-white">예약중</Badge>;
      case 'sold':
        return <Badge variant="secondary">판매완료</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4">
        <h3 className="font-semibold mb-3">판매 관리</h3>
        
        <div className="flex gap-2 mb-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            전체 ({salesItems.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            판매중 ({salesItems.filter(i => i.status === 'active').length})
          </Button>
          <Button
            variant={filter === 'reserved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('reserved')}
          >
            예약중 ({salesItems.filter(i => i.status === 'reserved').length})
          </Button>
          <Button
            variant={filter === 'sold' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('sold')}
          >
            완료 ({salesItems.filter(i => i.status === 'sold').length})
          </Button>
        </div>

        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              판매 중인 상품이 없습니다
            </div>
          ) : (
            filteredItems.map((item) => (
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
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
                        <p className="text-lg font-semibold">
                          {item.price.toLocaleString()}원
                        </p>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {item.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        {item.favorites}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        제안 {item.offers}
                      </span>
                      <span className="ml-auto">{item.createdAt}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      {item.status === 'active' && (
                        <>
                          <Button size="sm" variant="outline">
                            제안 확인
                          </Button>
                          <Button size="sm" variant="outline">
                            상태 변경
                          </Button>
                        </>
                      )}
                      {item.status === 'reserved' && (
                        <Button size="sm" variant="outline">
                          거래 완료
                        </Button>
                      )}
                      {item.status === 'sold' && (
                        <Button size="sm" variant="outline">
                          후기 확인
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="ml-auto">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}