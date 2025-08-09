'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, User, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ContactInfo {
  nickname: string;
  phone: string;
  address?: string;
  business_number?: string;
}

interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupbuyId: number;
  userRole?: 'buyer' | 'seller';
}

export default function ContactInfoModal({ 
  isOpen, 
  onClose, 
  groupbuyId,
  userRole 
}: ContactInfoModalProps) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contactRole, setContactRole] = useState<'buyer' | 'seller' | 'buyers' | null>(null);
  const [sellerInfo, setSellerInfo] = useState<ContactInfo | null>(null);
  const [buyersInfo, setBuyersInfo] = useState<ContactInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && groupbuyId) {
      fetchContactInfo();
    }
  }, [isOpen, groupbuyId]);

  const fetchContactInfo = async () => {
    if (!accessToken) {
      setError('로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupbuyId}/contact-info/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || '연락처 정보를 가져올 수 없습니다.');
        return;
      }

      const data = await response.json();
      
      if (data.role === 'seller') {
        setContactRole('seller');
        // 백엔드가 seller 객체가 아닌 직접 정보를 반환하므로 data 자체를 사용
        setSellerInfo({
          nickname: data.nickname || data.name,
          phone: data.phone,
          address: data.address,
          business_number: data.business_number
        });
      } else if (data.role === 'buyers') {
        setContactRole('buyers');
        setBuyersInfo(data.buyers || []);
      }
    } catch (err) {
      console.error('연락처 정보 조회 오류:', err);
      setError('연락처 정보를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '정보 없음';
    // 010-1234-5678 형식으로 변환
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {contactRole === 'seller' ? '판매자' : '구매자'} 연락처 정보
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : contactRole === 'seller' && sellerInfo ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">닉네임</p>
                      <p className="font-medium">{sellerInfo.nickname}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">연락처</p>
                      <p className="font-medium">{formatPhoneNumber(sellerInfo.phone)}</p>
                    </div>
                  </div>
                  
                  {sellerInfo.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">사업자 주요활동지역</p>
                        <p className="font-medium">{sellerInfo.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {sellerInfo.business_number && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">사업자등록번호</p>
                        <p className="font-medium">{sellerInfo.business_number}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  💡 연락 전 거래 일정과 장소를 명확히 확인해주세요.
                </p>
              </div>
            </div>
          ) : contactRole === 'buyers' && buyersInfo.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-2">
                총 {buyersInfo.length}명의 구매자가 확정했습니다.
              </p>
              
              <div className="max-h-96 overflow-y-auto space-y-3">
                {buyersInfo.map((buyer, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm">{buyer.nickname}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{formatPhoneNumber(buyer.phone)}</span>
                    </div>
                    
                    {buyer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{buyer.address}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  💡 모든 구매자와 거래 일정을 조율해주세요.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              표시할 연락처 정보가 없습니다.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}