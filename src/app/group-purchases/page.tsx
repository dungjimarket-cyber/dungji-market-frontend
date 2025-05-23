'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { RoleButton } from '@/components/auth/RoleButton';
import { Clock, Filter, ChevronDown, Check, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface GroupBuy {
  id: number;
  status: string;
  title: string;
  current_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  product_details: {
    id: number;
    name: string;
    description: string;
    base_price: number;
    image_url: string;
    category_name: string;
    carrier?: string;
    registration_type?: string;
    plan_info?: string;
    contract_info?: string;
  };
}

export default function GroupPurchasesPage() {
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('recruiting');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 공구 목록 가져오기
  useEffect(() => {
    const fetchGroupBuys = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch group buys');
        }

        const data = await res.json();
        // 진행중 상태 우선 정렬
const ongoingStatuses = ['recruiting', 'bidding', 'voting'];
data.sort((a: GroupBuy, b: GroupBuy) => {
  const aOngoing = ongoingStatuses.includes(a.status);
  const bOngoing = ongoingStatuses.includes(b.status);
  if (aOngoing && !bOngoing) return -1;
  if (!aOngoing && bOngoing) return 1;
  return 0;
});
setGroupBuys(data);
      } catch (error) {
        console.error('Error fetching group buys:', error);
        setError('공동구매 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupBuys();
  }, []);

  // 필터링된 공구 목록
  const filteredGroupBuys = groupBuys.filter((groupBuy) => {
    // 상태 필터
    if (statusFilter !== 'all' && groupBuy.status !== statusFilter) {
      return false;
    }

    // 카테고리 필터
    if (categoryFilter !== 'all' && groupBuy.product_details?.category_name !== categoryFilter) {
      return false;
    }

    // 가격 필터
    if (priceFilter !== 'all') {
      const price = groupBuy.product_details?.base_price || 0;
      if (priceFilter === 'low' && price > 500000) return false;
      if (priceFilter === 'medium' && (price <= 500000 || price > 1000000)) return false;
      if (priceFilter === 'high' && price <= 1000000) return false;
    }

    // 검색어 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = groupBuy.title?.toLowerCase().includes(searchLower);
      const productNameMatch = groupBuy.product_details?.name.toLowerCase().includes(searchLower) || '';
      return titleMatch || productNameMatch;
    }

    return true;
  });

  // 카테고리 목록 추출
  const categories = Array.from(new Set(groupBuys.map(gb => gb.product_details?.category_name || '')));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">공동구매 둘러보기</h1>
        {/* 판매자 역할이 아닐 때만 공구 등록 버튼 표시 */}
        <RoleButton href="/group-purchases/create" disableForRoles={['seller']}>
          <Button>
            <span className="mr-2">+</span>
            공구 등록
          </Button>
        </RoleButton>
      </div>
      
      {/* 모바일 필터 버튼 */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter size={16} />
              필터
              {(statusFilter !== 'all' || categoryFilter !== 'all' || priceFilter !== 'all' || searchTerm) && (
                <Badge variant="secondary" className="ml-2">
                  {[statusFilter !== 'all', categoryFilter !== 'all', priceFilter !== 'all', !!searchTerm].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
            <SheetHeader className="text-left">
              <SheetTitle>필터 선택</SheetTitle>
              <SheetDescription>원하는 필터를 선택하세요</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-6">
              {/* 상태 필터 */}
              <div className="border-b pb-4">
                <h3 className="font-medium mb-3">상태</h3>
                <RadioGroup value={statusFilter} onValueChange={setStatusFilter} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="status-all" />
                    <Label htmlFor="status-all">전체</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="recruiting" id="status-recruiting" />
                    <Label htmlFor="status-recruiting">모집중</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="confirmed" id="status-confirmed" />
                    <Label htmlFor="status-confirmed">확정</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="completed" id="status-completed" />
                    <Label htmlFor="status-completed">종료</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* 카테고리 필터 */}
              <div className="border-b pb-4">
                <h3 className="font-medium mb-3">카테고리</h3>
                <RadioGroup value={categoryFilter} onValueChange={setCategoryFilter} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="category-all" />
                    <Label htmlFor="category-all">전체</Label>
                  </div>
                  {categories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <RadioGroupItem value={category} id={`category-${category}`} />
                      <Label htmlFor={`category-${category}`}>{category}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              {/* 가격대 필터 */}
              <div className="border-b pb-4">
                <h3 className="font-medium mb-3">가격대</h3>
                <RadioGroup value={priceFilter} onValueChange={setPriceFilter} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="price-all" />
                    <Label htmlFor="price-all">전체</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="price-low" />
                    <Label htmlFor="price-low">50만원 이하</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="price-medium" />
                    <Label htmlFor="price-medium">50만원~100만원</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="price-high" />
                    <Label htmlFor="price-high">100만원 이상</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* 검색 필터 */}
              <div>
                <h3 className="font-medium mb-3">검색</h3>
                <Input 
                  type="text" 
                  placeholder="제목 또는 상품명 검색" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full"
                />
              </div>
            </div>
            <SheetFooter className="flex-row justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setPriceFilter('all');
                  setSearchTerm('');
                }}
              >
                초기화
              </Button>
              <SheetClose asChild>
                <Button>적용하기</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2">
          <Input 
            type="text" 
            placeholder="제목 또는 상품명 검색" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full max-w-[200px]"
          />
        </div>
      </div>
      
      {/* 데스크톱 필터 영역 */}
      <div className="hidden md:block bg-white p-4 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-medium mb-4">필터</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="recruiting">모집중</SelectItem>
                <SelectItem value="confirmed">확정</SelectItem>
                <SelectItem value="completed">종료</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">가격대</label>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="가격대 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="low">50만원 이하</SelectItem>
                <SelectItem value="medium">50만원~100만원</SelectItem>
                <SelectItem value="high">100만원 이상</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <Input 
              type="text" 
              placeholder="제목 또는 상품명 검색" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>
      </div>
      
      {/* 탭 영역 */}
      <div className="overflow-x-auto mb-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 w-full justify-start">
            <TabsTrigger value="all" onClick={() => setStatusFilter('all')}>전체</TabsTrigger>
            <TabsTrigger value="recruiting" onClick={() => setStatusFilter('recruiting')}>모집중</TabsTrigger>
            <TabsTrigger value="confirmed" onClick={() => setStatusFilter('confirmed')}>확정</TabsTrigger>
            <TabsTrigger value="completed" onClick={() => setStatusFilter('completed')}>종료</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* 적용된 필터 표시 */}
      {(statusFilter !== 'all' || categoryFilter !== 'all' || priceFilter !== 'all') && (
        <div className="flex flex-wrap gap-2 mb-4">
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              상태: {statusFilter === 'recruiting' ? '모집중' : statusFilter === 'confirmed' ? '확정' : '종료'}
              <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-gray-500">
                <X size={14} />
              </button>
            </Badge>
          )}
          {categoryFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              카테고리: {categoryFilter}
              <button onClick={() => setCategoryFilter('all')} className="ml-1 hover:text-gray-500">
                <X size={14} />
              </button>
            </Badge>
          )}
          {priceFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              가격: {priceFilter === 'low' ? '50만원 이하' : priceFilter === 'medium' ? '50~100만원' : '100만원 이상'}
              <button onClick={() => setPriceFilter('all')} className="ml-1 hover:text-gray-500">
                <X size={14} />
              </button>
            </Badge>
          )}
          {(statusFilter !== 'all' || categoryFilter !== 'all' || priceFilter !== 'all') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setStatusFilter('all');
                setCategoryFilter('all');
                setPriceFilter('all');
              }}
              className="text-xs h-7"
            >
              초기화
            </Button>
          )}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>로딩중...</p>
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : filteredGroupBuys.length === 0 ? (
        <p className="text-gray-500">현재 조건에 맞는 공동구매가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroupBuys.map((groupBuy) => {
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
                        <p className="text-sm text-gray-500 mb-1">{groupBuy.product_details?.category_name || ''}</p>
                        <CardTitle className="text-xl">{groupBuy.title || groupBuy.product_details?.name}</CardTitle>
                      </div>
                      <span className={`px-2 py-1 text-sm rounded-full ${
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
                        alt={groupBuy.product_details?.name || ''}
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
                            <span className="font-medium text-red-500">통신사: {groupBuy.product_details?.carrier || 'SK텔레콤'}</span>
                            <span className="font-medium text-blue-500">유형: {groupBuy.product_details?.registration_type || '번호이동'}</span>
                          </div>
                          <p className="text-sm font-medium">요금제: {groupBuy.product_details?.plan_info || '5만원대'}</p>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div>
                            <p className="text-sm text-gray-500">출고가</p>
                            <p className="text-xl font-bold">{groupBuy.product_details?.base_price?.toLocaleString() || '0'}원</p>
                          </div>
                          <div className="text-sm text-gray-600">
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
      )}
    </div>
  );
}
