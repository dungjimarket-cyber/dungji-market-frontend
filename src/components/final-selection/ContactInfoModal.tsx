'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
// Avatar component not available, using div instead
import { Phone, Mail, Building, User, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContactInfo {
  role: 'seller' | 'buyers';
  // 판매자 정보 (구매자가 볼 때)
  name?: string;
  business_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  business_number?: string;
  // 구매자 목록 (판매자가 볼 때)
  buyers?: Array<{
    name: string;
    phone: string;
    address?: string;
  }>;
  total_count?: number;
}

interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupBuyId: number;
  accessToken: string | null;
  isSeller?: boolean;
}

export function ContactInfoModal({ 
  isOpen, 
  onClose, 
  groupBuyId,
  accessToken,
  isSeller = false
}: ContactInfoModalProps) {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchContactInfo();
    }
  }, [isOpen, groupBuyId, accessToken]);

  const fetchContactInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/contact-info/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setContactInfo(data);
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: '오류',
          description: error.error || '연락처 정보를 가져올 수 없습니다.'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '연락처 정보 조회 중 문제가 발생했습니다.'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: '복사됨',
      description: `${field}이(가) 클립보드에 복사되었습니다.`
    });
    
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!contactInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contactInfo.role === 'seller' ? '판매자 정보' : '구매자 정보'}
          </DialogTitle>
          <DialogDescription>
            {contactInfo.role === 'seller' 
              ? '판매자와 연락하여 거래를 진행하세요.'
              : '구매 확정한 고객 목록입니다. 연락하여 거래를 진행하세요.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : (
          <div className="space-y-4">
            {contactInfo.role === 'seller' ? (
              // 구매자가 보는 판매자 정보
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-500" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{contactInfo.name}</h3>
                      {contactInfo.business_name && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Building className="h-4 w-4" />
                          {contactInfo.business_name}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {contactInfo.phone && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{contactInfo.phone}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(contactInfo.phone!, '전화번호')}
                          >
                            {copiedField === '전화번호' ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {contactInfo.email && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{contactInfo.email}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(contactInfo.email!, '이메일')}
                          >
                            {copiedField === '이메일' ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {contactInfo.business_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span>사업자번호: {contactInfo.business_number}</span>
                        </div>
                      )}
                      
                      {contactInfo.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span>{contactInfo.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              // 판매자가 보는 구매자 목록
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-2">
                  총 {contactInfo.total_count}명의 구매자가 확정했습니다.
                </p>
                {contactInfo.buyers && contactInfo.buyers.map((buyer, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{buyer.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {buyer.phone}
                          </span>
                        </div>
                        {buyer.address && (
                          <p className="text-xs text-gray-500">
                            주소: {buyer.address}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(buyer.phone, `${buyer.name} 전화번호`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>닫기</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}