'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, User, Building, Hash, MapPin, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupBuyId: number;
  groupBuyTitle: string;
}

interface BuyerInfo {
  name: string;
  phone: string;
  address: string;
}

interface ContactInfo {
  role: 'seller' | 'buyers';
  // 판매자 정보 (구매자가 볼 때)
  name?: string;
  phone?: string;
  business_name?: string;
  business_number?: string;
  // 구매자들 정보 (판매자가 볼 때)
  buyers?: BuyerInfo[];
  total_count?: number;
}

export function ContactInfoModal({
  isOpen,
  onClose,
  groupBuyId,
  groupBuyTitle
}: ContactInfoModalProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchContactInfo();
    }
  }, [isOpen, accessToken]);

  const fetchContactInfo = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/contact-info/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setContactInfo(data);
      } else {
        setError(data.error || '연락처 정보를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('연락처 조회 실패:', error);
      setError('연락처 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label}이(가) 복사되었습니다.`);
    }).catch(() => {
      toast.error('복사에 실패했습니다.');
    });
  };

  const formatPhoneNumber = (phone: string) => {
    // 전화번호 포맷팅 (예: 010-1234-5678)
    if (phone.length === 11) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
    }
    return phone;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">연락처 정보</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">로딩중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : contactInfo ? (
            <>
              {/* 판매자 정보 (구매자가 볼 때) */}
              {contactInfo.role === 'seller' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-medium text-lg mb-3">판매자 정보</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">담당자</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{contactInfo.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">연락처</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatPhoneNumber(contactInfo.phone || '')}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(contactInfo.phone || '', '연락처')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {contactInfo.business_name && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">업체명</span>
                        </div>
                        <span className="font-medium">{contactInfo.business_name}</span>
                      </div>
                    )}

                    {contactInfo.business_number && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">사업자번호</span>
                        </div>
                        <span className="font-medium">{contactInfo.business_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 구매자들 정보 (판매자가 볼 때) */}
              {contactInfo.role === 'buyers' && contactInfo.buyers && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-lg">구매확정 고객 목록</h3>
                    <span className="text-sm text-gray-600">
                      총 {contactInfo.total_count}명
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {contactInfo.buyers.map((buyer, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="font-medium">{buyer.name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(buyer.phone, '연락처')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-600" />
                          <span>{formatPhoneNumber(buyer.phone)}</span>
                        </div>
                        
                        {buyer.address && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            <span>{buyer.address}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 안내 메시지 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  연락처 정보는 거래 목적으로만 사용해주세요.
                  무단으로 타인에게 공유하거나 마케팅 목적으로 사용할 수 없습니다.
                </p>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}