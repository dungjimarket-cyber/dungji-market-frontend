'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ApiTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 실제 랭킹 페이지와 동일한 파라미터 구조
  const [city, setCity] = useState('강남구');
  const [category, setCategory] = useState('카페');
  const [placeType, setPlaceType] = useState('cafe');

  const testApi = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

      console.log('========================================');
      console.log('🧪 API 테스트 시작');
      console.log('========================================');
      console.log('파라미터:', { city, category, placeType });
      console.log('API Key:', apiKey?.substring(0, 20) + '...');

      // 실제 코드와 동일한 검색 쿼리 생성
      const searchQuery = `${city} ${category}`;
      console.log('🔎 검색 쿼리:', searchQuery);

      const requestBody = {
        textQuery: searchQuery,
        languageCode: 'ko',
        locationBias: {
          circle: {
            center: {
              latitude: 37.5172,
              longitude: 127.0473
            },
            radius: 5000.0
          }
        },
        minRating: 4.0,
        maxResultCount: 5
      };

      console.log('📤 Request Body:', requestBody);

      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey!,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Success:', data);

      setResult({
        status: response.status,
        count: data.places?.length || 0,
        places: data.places?.slice(0, 3).map((p: any) => ({
          name: p.displayName?.text,
          address: p.formattedAddress,
          rating: p.rating,
          reviews: p.userRatingCount
        }))
      });

    } catch (err: any) {
      console.error('💥 Test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Google Places API 디버깅 콘솔</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 파라미터 입력 */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="city">City (지역)</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="강남구"
              />
            </div>
            <div>
              <Label htmlFor="category">Category (카테고리 - 한글)</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="카페"
              />
            </div>
            <div>
              <Label htmlFor="placeType">Place Type (영어)</Label>
              <Input
                id="placeType"
                value={placeType}
                onChange={(e) => setPlaceType(e.target.value)}
                placeholder="cafe"
              />
            </div>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <strong>검색 쿼리:</strong> <code>{city} {category}</code>
          </div>

          <Button onClick={testApi} disabled={loading} className="w-full">
            {loading ? '테스트 중...' : 'API 테스트 실행'}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-bold text-red-800 mb-2">❌ 에러 발생</h3>
              <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-bold text-green-800 mb-2">✅ 성공</h3>
              <div className="space-y-2 text-sm">
                <div><strong>상태 코드:</strong> {result.status}</div>
                <div><strong>결과 개수:</strong> {result.count}개</div>
                {result.places && (
                  <div>
                    <strong>상위 3개:</strong>
                    <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.places, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p><strong>API Key 확인:</strong></p>
            <p className="mt-1">
              {process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
                ? `✅ 존재함 (${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY.substring(0, 20)}...)`
                : '❌ 없음'}
            </p>
          </div>

          <div className="text-xs text-muted-foreground">
            ⚠️ 브라우저 콘솔(F12)에서 더 자세한 로그를 확인하세요.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
