'use client';

import { useEffect, useState } from 'react';
import { usePartner } from '@/contexts/PartnerContext';
import { partnerService } from '@/lib/api/partnerService';
import { ReferralLink } from '@/types/partner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Link2, 
  Copy,
  Check,
  QrCode,
  Share2,
  ExternalLink,
  Download
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ReferralLinkPage() {
  const { partner } = usePartner();
  const [referralLink, setReferralLink] = useState<ReferralLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const loadReferralLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const link = await partnerService.getReferralLink();
      setReferralLink(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : '추천 링크를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (partner) {
      loadReferralLink();
    }
  }, [partner]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(type);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  const shareLink = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '둥지마켓 - 함께 절약하는 공동구매',
          text: '둥지마켓에서 함께 공동구매하고 더 저렴하게 구매하세요!',
          url: url,
        });
      } catch (err) {
        console.error('공유 실패:', err);
        copyToClipboard(url, 'full_url');
      }
    } else {
      copyToClipboard(url, 'full_url');
    }
  };

  const downloadQRCode = () => {
    if (!referralLink?.qr_code_url) return;

    const qrCodeUrl = referralLink.qr_code_url.startsWith('http') 
      ? referralLink.qr_code_url 
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${referralLink.qr_code_url}`;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `둥지마켓_추천링크_QR_${referralLink.partner_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">추천링크 관리</h1>
        <p className="text-muted-foreground">
          추천 링크를 공유하여 새로운 회원을 유치하고 수수료를 받으세요
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Link Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Link2 className="h-5 w-5 mr-2" />
              추천 링크
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partner-code">파트너 코드</Label>
              <div className="flex gap-2">
                <Input
                  id="partner-code"
                  value={referralLink?.partner_code || ''}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(referralLink?.partner_code || '', 'partner_code')}
                >
                  {copiedItem === 'partner_code' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full-url">전체 추천 링크</Label>
              <div className="flex gap-2">
                <Input
                  id="full-url"
                  value={referralLink?.full_url || ''}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(referralLink?.full_url || '', 'full_url')}
                >
                  {copiedItem === 'full_url' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short-url">단축 링크</Label>
              <div className="flex gap-2">
                <Input
                  id="short-url"
                  value={referralLink?.short_url || ''}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(referralLink?.short_url || '', 'short_url')}
                >
                  {copiedItem === 'short_url' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => shareLink(referralLink?.full_url || '')}
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                공유하기
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(referralLink?.full_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="h-5 w-5 mr-2" />
              QR 코드
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              {referralLink?.qr_code_url ? (
                <div className="p-4 bg-white rounded-lg border">
                  <img
                    src={referralLink.qr_code_url.startsWith('http') 
                      ? referralLink.qr_code_url 
                      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${referralLink.qr_code_url}`
                    }
                    alt="추천 링크 QR 코드"
                    className="w-48 h-48"
                    onError={(e) => {
                      console.error('QR 코드 로딩 실패');
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={downloadQRCode}
                disabled={!referralLink?.qr_code_url}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                QR 코드 다운로드
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              QR 코드를 스캔하여 바로 추천 링크로 이동할 수 있습니다.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>추천 링크 사용법</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="social" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="social">소셜미디어</TabsTrigger>
              <TabsTrigger value="blog">블로그</TabsTrigger>
              <TabsTrigger value="qr">QR 코드</TabsTrigger>
              <TabsTrigger value="tips">활용 팁</TabsTrigger>
            </TabsList>
            
            <TabsContent value="social" className="mt-4">
              <div className="space-y-3">
                <h4 className="font-medium">소셜미디어에서 활용하기</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• 인스타그램 스토리나 피드에 단축 링크 공유</li>
                  <li>• 페이스북 그룹에서 공동구매 정보와 함께 링크 공유</li>
                  <li>• 카카오톡 오픈채팅방에서 추천 링크 공유</li>
                  <li>• 유튜브 동영상 설명란에 링크 추가</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="blog" className="mt-4">
              <div className="space-y-3">
                <h4 className="font-medium">블로그에서 활용하기</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• 공동구매 후기 글에 추천 링크 포함</li>
                  <li>• 절약 팁 포스팅에 둥지마켓 소개와 함께 링크 추가</li>
                  <li>• 티스토리, 네이버 블로그에서 배너 형태로 활용</li>
                  <li>• 쇼핑 정보 공유 시 추천 링크 함께 공유</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="qr" className="mt-4">
              <div className="space-y-3">
                <h4 className="font-medium">QR 코드 활용하기</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• 오프라인 미팅이나 모임에서 QR 코드 공유</li>
                  <li>• 명함이나 전단지에 QR 코드 인쇄</li>
                  <li>• 카페나 상점에 QR 코드 포스터 부착</li>
                  <li>• 온라인 강의나 세미나 자료에 QR 코드 포함</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="tips" className="mt-4">
              <div className="space-y-3">
                <h4 className="font-medium">효과적인 활용 팁</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• 공동구매의 장점과 절약 효과를 구체적으로 설명</li>
                  <li>• 본인의 공동구매 경험담과 후기 공유</li>
                  <li>• 계절이나 이벤트에 맞는 공동구매 상품 추천</li>
                  <li>• 지역별 공동구매 그룹 만들어 꾸준히 관리</li>
                  <li>• 정기적으로 공동구매 현황과 절약 금액 공유</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}