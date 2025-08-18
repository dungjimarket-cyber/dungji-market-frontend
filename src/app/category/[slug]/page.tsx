// src/pages/category/[slug].tsx
'use client';

import { useState, useEffect } from 'react';
import { getPlanDisplay } from '@/lib/telecom-utils';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { CategoryMenuFilters } from '@/components/filters/CategoryMenuFilters';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: number;
  category_name: string;
  product_type: 'device' | 'service';
  base_price: number;
  image_url: string;
  is_available: boolean;
  status: string;
  current_participants: number;
  max_participants: number;
  end_time: string;
  active_groupbuy?: {
    id: number;
    status: string;
    current_participants: number;
    max_participants: number;
    end_time: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
  parent: string | null;
  parent_name: string | null;
  subcategories: Category[];
  product_count: number;
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 카테고리 정보 가져오기
 */
async function getCategory(slug: string): Promise<Category | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${slug}/`, {
    next: { revalidate: 60 }
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * 상품 목록 가져오기
 */
async function getProducts(slug: string): Promise<Product[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/?category=${slug}`, {
    next: { revalidate: 60 }
  });
  if (!res.ok) return [];
  return res.json();
}

/**
 * 카테고리별 공동구매 목록 가져오기 (필터 포함)
 */
async function getGroupBuysByCategory(slug: string, filters?: Record<string, string>): Promise<any[]> {
  const params = new URLSearchParams({ category: slug });
  
  // 필터 파라미터 추가
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });
  }
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/?${params.toString()}`, {
    next: { revalidate: 60 }
  });
  if (!res.ok) return [];
  return res.json();
}

/**
 * 카테고리 페이지 컴포넌트
 */
export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [groupBuys, setGroupBuys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * 데이터 로딩
   */
  const loadData = async (filters?: Record<string, string>) => {
    if (!slug) return;
    
    setLoading(true);
    try {
      const [categoryData, productsData, groupBuysData] = await Promise.all([
        getCategory(slug),
        getProducts(slug),
        getGroupBuysByCategory(slug, filters)
      ]);
      
      setCategory(categoryData);
      setProducts(productsData);
      setGroupBuys(groupBuysData);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 필터 변경 처리
   */
  const handleFiltersChange = (filters: Record<string, string>) => {
    loadData(filters);
  };

  /**
   * 초기 데이터 로딩
   */
  useEffect(() => {
    if (slug) {
      // URL 쿼리 파라미터에서 필터 추출
      const filters: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        if (['manufacturer', 'carrier', 'purchaseType', 'priceRange'].includes(key)) {
          filters[key] = value;
        }
      });
      
      loadData(filters);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{category?.name} 카테고리</h1>
        <Link href="/group-purchases/create">
          <Button>
            <span className="mr-2">+</span>
            공구 등록
          </Button>
        </Link>
      </div>
      
      {/* 필터 컴포넌트 */}
      <CategoryMenuFilters onFiltersChange={handleFiltersChange} />
      
      {groupBuys.length === 0 ? (
        <p className="text-gray-500">이 카테고리에 진행중인 공동구매가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupBuys.map((groupBuy: any) => {
            const progress = (groupBuy.current_participants / groupBuy.max_participants) * 100;
            const remainingSpots = groupBuy.max_participants - groupBuy.current_participants;
            
            // 남은 시간 계산
            const now = new Date();
            const endTime = new Date(groupBuy.end_time);
            const timeDiff = endTime.getTime() - now.getTime();
            
            // 남은 시간 포맷팅
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            
            // 종료 날짜 포맷팅
            const year = endTime.getFullYear();
            const month = endTime.getMonth() + 1;
            const date = endTime.getDate();
            const formattedEndDate = `${year}년 ${month}월 ${date}일`;
            
            return (
              <Link key={groupBuy.id} href={`/groupbuys/${groupBuy.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{groupBuy.product_details?.category_name || '카테고리 없음'}</p>
                        <CardTitle className="text-xl">{groupBuy.product_details?.name || '상품명 없음'}</CardTitle>
                        <p className="text-base font-medium mt-1 text-blue-600">{groupBuy.title}</p>
                      </div>
                      
                    </div>
                  </CardHeader>
                  <CardContent>
                      <Image
                        src={groupBuy.product_details?.image_url || '/placeholder.png'}
                        alt={groupBuy.product_details?.name || '상품 이미지'}
                        width={800}
                        height={450}
                        className="object-cover rounded-lg"
                      />                  
                    <div className="space-y-4">
                      <div>
                        <Progress value={progress} className="h-2" />
                        <div className="mt-2 flex justify-between text-sm text-gray-600">
                          <span>{groupBuy.current_participants}명 참여중</span>
                          <span>{remainingSpots}자리 남음</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <div className="flex items-center text-red-500">
                            <Clock size={14} className="mr-1" />
                            <span>
                              {timeDiff > 0 ? `${days}일 ${hours}시간 ${minutes}분` : '종료됨'}
                            </span>
                          </div>
                          <span className="text-gray-500">{formattedEndDate} 마감</span>
                        </div>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div className="flex flex-col">
                          <div className="flex space-x-2 text-sm">
                            <span className="font-medium text-red-500">통신사: {groupBuy.product_details?.telecom_carrier || groupBuy.telecom_detail?.telecom_carrier || groupBuy.product_details?.carrier || 'SK텔레콤'}</span>
                            <span className="font-medium text-blue-500">유형: {
                              groupBuy.product_details?.subscription_type_korean || 
                              groupBuy.telecom_detail?.subscription_type_korean ||
                              groupBuy.product_details?.registration_type ||
                              '정보 없음'
                            }</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          {(groupBuy.product_details?.category_name === '인터넷' || groupBuy.product_details?.category_name === '인터넷+TV') ? (
                            <div className="flex-1">
                              <a
                                href="https://www.bworld.co.kr/product/internet/charge.do?menu_id=P02010000"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 hover:bg-blue-100 transition-colors"
                              >
                                <span>통신사 요금제 확인</span>
                                <span className="ml-1">→</span>
                              </a>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-gray-500">출고가</p>
                              <p className="text-xl font-bold">{groupBuy.product_details?.base_price?.toLocaleString() || '0'}원</p>
                              <p className="text-xs text-gray-600 mt-1">
                              {groupBuy.product_details?.contract_info || '2년 약정'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
