'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ApiTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testApi = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

      console.log('========================================');
      console.log('🧪 API 테스트 시작');
      console.log('========================================');
      console.log('API Key:', apiKey?.substring(0, 20) + '...');

      const requestBody = {
        textQuery: '강남구 맛집',
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

      console.log('Request:', requestBody);

      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey!,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Success:', data);

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
      console.error('Test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Google Places API 테스트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testApi} disabled={loading}>
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
