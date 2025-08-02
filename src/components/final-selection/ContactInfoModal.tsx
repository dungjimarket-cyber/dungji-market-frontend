'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { User, Phone, Building, MapPin, Loader2 } from 'lucide-react';
import { getContactInfo, type ContactInfo } from '@/lib/api/finalSelectionService';
import { toast } from 'sonner';

interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupBuyId: number;
  role: 'buyer' | 'seller';
}

export default function ContactInfoModal({ 
  isOpen, 
  onClose,
  groupBuyId,
  role
}: ContactInfoModalProps) {
  const [loading, setLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

  useEffect(() => {
    if (isOpen && groupBuyId) {
      fetchContactInfo();
    }
  }, [isOpen, groupBuyId]);

  const fetchContactInfo = async () => {
    setLoading(true);
    try {
      const data = await getContactInfo(groupBuyId);
      setContactInfo(data);
    } catch (error: any) {
      console.error('연락처 정보 조회 오류:', error);
      toast.error(error.message || '연락처 정보를 불러올 수 없습니다.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const renderSellerInfo = () => {
    if (!contactInfo || contactInfo.role !== 'seller') return null;

    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2 text-blue-600" />
            판매자 정보
          </h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-sm text-gray-500 w-24">상호/이름:</span>
              <span className="text-sm font-medium">{contactInfo.name}</span>
            </div>
            <div className="flex items-start">
              <span className="text-sm text-gray-500 w-24">연락처:</span>
              <span className="text-sm font-medium">{contactInfo.phone}</span>
            </div>
            {contactInfo.business_name && (
              <div className="flex items-start">
                <span className="text-sm text-gray-500 w-24">사업자명:</span>
                <span className="text-sm font-medium">{contactInfo.business_name}</span>
              </div>
            )}
            {contactInfo.business_number && (
              <div className="flex items-start">
                <span className="text-sm text-gray-500 w-24">사업자번호:</span>
                <span className="text-sm font-medium">{contactInfo.business_number}</span>
              </div>
            )}
            {contactInfo.address && (
              <div className="flex items-start">
                <span className="text-sm text-gray-500 w-24">주소:</span>
                <span className="text-sm font-medium">{contactInfo.address}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderBuyersInfo = () => {
    if (!contactInfo || contactInfo.role !== 'buyers' || !contactInfo.buyers) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            구매자 목록
          </h3>
          <span className="text-sm text-gray-500">
            총 {contactInfo.total_count}명
          </span>
        </div>
        {contactInfo.buyers.map((buyer, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm font-medium">{buyer.name}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm">{buyer.phone}</span>
                </div>
                {buyer.address && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm">{buyer.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {role === 'buyer' ? '판매자 정보' : '구매자 정보'}
          </DialogTitle>
          <DialogDescription>
            {role === 'buyer' 
              ? '구매확정하신 공구의 판매자 연락처입니다.'
              : '판매확정하신 공구의 구매자 목록입니다.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {contactInfo?.role === 'seller' && renderSellerInfo()}
              {contactInfo?.role === 'buyers' && renderBuyersInfo()}
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}