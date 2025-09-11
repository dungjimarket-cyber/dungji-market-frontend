'use client';

import { useState } from 'react';
import { Bell, Mail, MessageSquare, Shield, Smartphone, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function SettingsTab() {
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
    </div>
  );
}