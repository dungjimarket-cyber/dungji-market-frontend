'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Mail, MessageSquare, Shield, Smartphone, User, LogOut, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/api/fetch';

export default function SettingsTab() {
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    priceOffer: true,
    offerResponse: true,
    newMessage: true,
    priceChange: false,
    tradeStatus: true,
    push: true,
    email: false,
    sms: false,
  });

  // 실제 알림 설정 (백엔드 연동)
  const [pushNotificationSettings, setPushNotificationSettings] = useState({
    trade_notifications: true,
    marketing_notifications: false,
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // 알림 설정 불러오기
  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const response = await fetchWithAuth('/notifications/settings/');
        const data = await response.json();
        setPushNotificationSettings({
          trade_notifications: data.trade_notifications,
          marketing_notifications: data.marketing_notifications,
        });
      } catch (error) {
        console.error('알림 설정 불러오기 실패:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchNotificationSettings();
  }, []);

  // 알림 설정 변경
  const handlePushNotificationChange = async (key: 'trade_notifications' | 'marketing_notifications') => {
    const newValue = !pushNotificationSettings[key];

    try {
      await fetchWithAuth('/notifications/settings/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [key]: newValue,
        }),
      });

      setPushNotificationSettings(prev => ({
        ...prev,
        [key]: newValue,
      }));

      toast({
        title: '설정 변경 완료',
        description: '알림 설정이 업데이트되었습니다.',
      });
    } catch (error) {
      console.error('알림 설정 변경 실패:', error);
      toast({
        title: '설정 변경 실패',
        description: '알림 설정을 변경하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">계정 설정</h3>
        
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-2">
            <User className="w-4 h-4" />
            프로필 수정
          </Button>
          
          <Button variant="outline" className="w-full justify-start gap-2">
            <Shield className="w-4 h-4" />
            본인 인증
          </Button>
          
          <Button variant="outline" className="w-full justify-start gap-2">
            <Smartphone className="w-4 h-4" />
            휴대폰 번호 변경
          </Button>
          
          <Button variant="outline" className="w-full justify-start gap-2">
            <Mail className="w-4 h-4" />
            이메일 변경
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">알림 설정</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-3">알림 유형</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="price-offer" className="text-sm">
                  가격 제안 알림
                </Label>
                <Switch
                  id="price-offer"
                  checked={notifications.priceOffer}
                  onCheckedChange={() => handleNotificationChange('priceOffer')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="offer-response" className="text-sm">
                  제안 응답 알림
                </Label>
                <Switch
                  id="offer-response"
                  checked={notifications.offerResponse}
                  onCheckedChange={() => handleNotificationChange('offerResponse')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="new-message" className="text-sm">
                  새 메시지 알림
                </Label>
                <Switch
                  id="new-message"
                  checked={notifications.newMessage}
                  onCheckedChange={() => handleNotificationChange('newMessage')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="price-change" className="text-sm">
                  찜한 상품 가격 변동
                </Label>
                <Switch
                  id="price-change"
                  checked={notifications.priceChange}
                  onCheckedChange={() => handleNotificationChange('priceChange')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="trade-status" className="text-sm">
                  거래 상태 변경
                </Label>
                <Switch
                  id="trade-status"
                  checked={notifications.tradeStatus}
                  onCheckedChange={() => handleNotificationChange('tradeStatus')}
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="text-sm font-medium mb-3">수신 방법</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="push" className="text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  푸시 알림
                </Label>
                <Switch
                  id="push"
                  checked={notifications.push}
                  onCheckedChange={() => handleNotificationChange('push')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="email" className="text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  이메일
                </Label>
                <Switch
                  id="email"
                  checked={notifications.email}
                  onCheckedChange={() => handleNotificationChange('email')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sms" className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </Label>
                <Switch
                  id="sms"
                  checked={notifications.sms}
                  onCheckedChange={() => handleNotificationChange('sms')}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">활동 내역</h3>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => router.push('/mypage/used-reports')}
          >
            <AlertTriangle className="w-4 h-4" />
            신고 내역
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">기타</h3>

        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            이용약관
          </Button>

          <Button variant="outline" className="w-full justify-start">
            개인정보 처리방침
          </Button>

          <Button variant="outline" className="w-full justify-start">
            고객센터
          </Button>

          <Separator />

          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-gray-500 hover:text-gray-600"
          >
            회원 탈퇴
          </Button>
        </div>
      </Card>

      {/* 푸시 알림 설정 */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          푸시 알림 설정
        </h3>

        {isLoadingSettings ? (
          <div className="text-center py-4 text-gray-500">설정을 불러오는 중...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="trade-notifications" className="text-sm font-medium">
                  거래 알림
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  공구, 중고거래 관련 알림 (가격제안, 거래확정 등)
                </p>
              </div>
              <Switch
                id="trade-notifications"
                checked={pushNotificationSettings.trade_notifications}
                onCheckedChange={() => handlePushNotificationChange('trade_notifications')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing-notifications" className="text-sm font-medium">
                  마케팅 알림
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  이벤트, 프로모션 등의 광고성 알림
                </p>
              </div>
              <Switch
                id="marketing-notifications"
                checked={pushNotificationSettings.marketing_notifications}
                onCheckedChange={() => handlePushNotificationChange('marketing_notifications')}
              />
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600">
                💡 푸시 알림은 브라우저 설정에서도 별도로 허용되어야 합니다.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}