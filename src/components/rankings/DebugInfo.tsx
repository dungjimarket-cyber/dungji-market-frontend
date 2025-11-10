'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface DebugInfoProps {
  city: string;
  category: string;
  placeType: string;
}

export default function DebugInfo({ city, category, placeType }: DebugInfoProps) {
  const [debugData, setDebugData] = useState<any>(null);

  useEffect(() => {
    // 클라이언트에서 API 키 확인
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    setDebugData({
      apiKeyExists: !!apiKey,
      apiKeyPrefix: apiKey?.substring(0, 20) + '...',
      parameters: { city, category, placeType },
      timestamp: new Date().toLocaleString('ko-KR')
    });

    console.log('========================================');
    console.log('🔍 [Client Debug] 클라이언트 환경 확인');
    console.log('========================================');
    console.log('API Key 존재:', !!apiKey);
    console.log('API Key Prefix:', apiKey?.substring(0, 20) + '...');
    console.log('파라미터:', { city, category, placeType });
    console.log('========================================');
  }, [city, category, placeType]);

  // 프로덕션에서는 숨김
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="border-yellow-300 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          디버그 정보 (개발 모드에서만 표시)
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>API 키 존재:</strong> {debugData?.apiKeyExists ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          <strong>API 키 Prefix:</strong> {debugData?.apiKeyPrefix || 'N/A'}
        </div>
        <div>
          <strong>검색 파라미터:</strong>
          <pre className="mt-1 bg-white p-2 rounded text-[10px] overflow-x-auto">
            {JSON.stringify(debugData?.parameters, null, 2)}
          </pre>
        </div>
        <div className="text-muted-foreground">
          마지막 확인: {debugData?.timestamp}
        </div>
      </CardContent>
    </Card>
  );
}
