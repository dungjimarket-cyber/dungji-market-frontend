'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { regions } from '@/lib/regions';
import { POPULAR_CATEGORIES } from '@/types/ranking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, MapPin } from 'lucide-react';

export default function RankingsMainPage() {
  const router = useRouter();
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [cities, setCities] = useState<string[]>([]);

  // 시/도 선택 시 시/군/구 목록 업데이트
  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    const region = regions.find(r => r.name === province);
    setCities(region?.cities || []);
    setSelectedCity('');
  };

  // 카테고리 선택 시 랭킹 페이지로 이동
  const handleCategorySelect = (categoryId: string, placeType: string) => {
    if (!selectedCity) {
      alert('지역을 먼저 선택해주세요');
      return;
    }

    router.push(`/rankings/${encodeURIComponent(selectedCity)}/${categoryId}?placeType=${encodeURIComponent(placeType)}`);
  };

  // 직접 검색
  const handleSearch = () => {
    if (!selectedCity) {
      alert('지역을 먼저 선택해주세요');
      return;
    }

    if (!searchKeyword.trim()) {
      alert('검색어를 입력해주세요');
      return;
    }

    router.push(`/rankings/${encodeURIComponent(selectedCity)}/search?q=${encodeURIComponent(searchKeyword)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            지역별 업체 랭킹
          </h1>
          <p className="text-lg text-muted-foreground">
            Google 리뷰 기반 우리 동네 인기 업체를 확인하세요
          </p>
        </div>

        {/* 지역 선택 */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              지역 선택
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 시/도 선택 */}
              <div>
                <label className="text-sm font-medium mb-2 block">시/도</label>
                <Select value={selectedProvince} onValueChange={handleProvinceChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="시/도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.name} value={region.name}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 시/군/구 선택 */}
              <div>
                <label className="text-sm font-medium mb-2 block">시/군/구</label>
                <Select
                  value={selectedCity}
                  onValueChange={setSelectedCity}
                  disabled={!selectedProvince}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="시/군/구 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 인기 카테고리 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>인기 카테고리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {POPULAR_CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => handleCategorySelect(category.id, category.placeType)}
                  disabled={!selectedCity}
                >
                  <span className="text-3xl">{category.icon}</span>
                  <span className="text-sm font-medium">{category.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 직접 검색 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              직접 검색
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="예: 파스타 맛집, 네일샵, 동물병원..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                disabled={!selectedCity}
              />
              <Button onClick={handleSearch} disabled={!selectedCity}>
                <Search className="w-4 h-4 mr-2" />
                검색
              </Button>
            </div>
            {!selectedCity && (
              <p className="text-sm text-muted-foreground mt-2">
                먼저 지역을 선택해주세요
              </p>
            )}
          </CardContent>
        </Card>

        {/* 안내 메시지 */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Google 리뷰 평점과 리뷰 개수를 기반으로 랭킹이 산정됩니다.
            네이버 리뷰도 함께 확인하여 더 정확한 정보를 얻으세요!
          </p>
        </div>
      </div>
    </div>
  );
}
