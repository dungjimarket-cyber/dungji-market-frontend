'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')}`;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { Clock, Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GroupBuy } from '@/types/groupbuy';

interface Product {
  id: number;
  name: string;
  description?: string;
  base_price: number;
  image_url?: string;
  category_name?: string;
  carrier?: string;
  registration_type?: string;
  plan_info?: string;
  contract_info?: string;
}

/**
 * 가입유형을 표시하는 유틸리티 함수
 * @param groupBuy 공구 정보
 * @returns 가입유형 텍스트
 */
function getSubscriptionTypeText(groupBuy: GroupBuy): string {
  // product_details.registration_type을 통해 가입유형 표시
  if (groupBuy.product_details?.registration_type) {
    if (groupBuy.product_details.registration_type === 'MNP') return '번호이동';
    if (groupBuy.product_details.registration_type === 'NEW') return '신규가입';
    if (groupBuy.product_details.registration_type === 'CHANGE') return '기기변경';
    return groupBuy.product_details.registration_type;
  }
  
  return '';
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<GroupBuy[]>([]);
  const [allGroupBuys, setAllGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 모든 공구 목록 가져오기
  useEffect(() => {
    const fetchAllGroupBuys = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/groupbuys/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error('공구 목록을 불러오는데 실패했습니다');
        }

        const data = await res.json();
        setAllGroupBuys(data);
      } catch (error) {
        console.error('Error fetching group buys:', error);
        setError('공구 목록을 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchAllGroupBuys();
  }, []);

  // 검색 실행
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results = allGroupBuys.filter(groupBuy => {
      const titleMatch = groupBuy.title?.toLowerCase().includes(term);
      const productNameMatch = groupBuy.product_details?.name.toLowerCase().includes(term);
      return titleMatch || productNameMatch;
    });

    setSearchResults(results);
  };

  // 엔터 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">공구 검색</h1>
      
      <div className="flex gap-2 mb-8">
        <Input
          type="text"
          placeholder="공구 제목 또는 상품명 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button onClick={handleSearch}>
          <SearchIcon className="w-4 h-4 mr-2" />
          검색
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>로딩중...</p>
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : searchTerm && searchResults.length === 0 ? (
        <p className="text-gray-500">검색 결과가 없습니다.</p>
      ) : searchResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchResults.map((groupBuy) => {
            const progress = (groupBuy.current_participants / groupBuy.max_participants) * 100;
            const remainingSpots = groupBuy.max_participants - groupBuy.current_participants;
            
            // 남은 시간 계산
            const now = new Date();
            const endTime = new Date(groupBuy.end_time);
            const timeDiff = endTime.getTime() - now.getTime();
            
            // 남은 시간 포맷팅
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
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
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">{groupBuy.product_details?.category_name || '휴대폰'}</p>
                        <CardTitle className="text-base sm:text-lg md:text-xl">
                          {`${groupBuy.product_details?.name || '상품명 없음'} ${groupBuy.product_details?.carrier || ''} ${groupBuy.product_details?.registration_type || ''} ${groupBuy.product_details?.plan_info ? ('요금제 ' + groupBuy.product_details.plan_info) : ''}`}
                        </CardTitle>
                      </div>
                      <span className={`px-2 py-1 text-xs sm:text-sm rounded-full ${
                        groupBuy.status === 'recruiting'
                          ? 'bg-blue-100 text-blue-800'
                          : groupBuy.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {groupBuy.status === 'recruiting' ? '모집중' :
                         groupBuy.status === 'confirmed' ? '확정' : '종료'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Image
                      src={groupBuy.product_details?.image_url || '/placeholder.png'}
                      alt={groupBuy.product_details?.name || groupBuy.title}
                      width={200}
                      height={200}
                      className="object-cover rounded-lg"
                    />
                    <div className="space-y-4 mt-4">
                      <div>
                        <Progress value={progress} className="h-2" />
                        <div className="mt-2 flex justify-between text-xs sm:text-sm text-gray-600">
                          <span>{groupBuy.current_participants}명 참여중</span>
                          <span>{remainingSpots}자리 남음</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center text-red-500">
                            <Clock size={12} className="mr-1" />
                            <span>
                              {timeDiff > 0 ? `${days}일 ${hours}시간` : '종료됨'}
                            </span>
                          </div>
                          <span className="text-gray-500">{formattedEndDate}</span>
                        </div>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div className="flex flex-col">
                          <div className="flex space-x-2 text-xs sm:text-sm">
                            <span className="font-medium text-red-500">통신사: {groupBuy.product_details?.carrier || 'SK텔레콤'}</span>
                            <span className="font-medium text-blue-500">유형: {groupBuy.product_details?.registration_type || '번호이동'}</span>
                          </div>
                          <p className="text-xs sm:text-sm font-medium">요금제: {groupBuy.product_details?.plan_info || '5만원대'}</p>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500">출고가</p>
                            <p className="text-lg sm:text-xl font-bold">{groupBuy.product_details?.base_price?.toLocaleString() || '1,200,000'}원</p>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {groupBuy.product_details?.contract_info || '2년 약정'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
          <SearchIcon className="w-12 h-12 mb-4 opacity-50" />
          <p>검색어를 입력하세요</p>
        </div>
      )}
    </div>
  );
}
