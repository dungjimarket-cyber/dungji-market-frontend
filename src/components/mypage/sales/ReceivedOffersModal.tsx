'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, User, MessageSquare, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ReceivedOffer {
  id: number;
  buyer: {
    id: number;
    nickname: string;
    profile_image?: string;
  };
  offered_price: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface Phone {
  id: number;
  title: string;
  brand: string;
  model: string;
  price: number;
  images: { image_url: string; is_main: boolean }[];
}

interface ReceivedOffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: Phone;
  offers: ReceivedOffer[];
  onRespond: (offerId: number, action: 'accept' | 'reject') => void;
  onProceedTrade?: (offerId: number) => void;
}

export default function ReceivedOffersModal({
  isOpen,
  onClose,
  phone,
  offers,
  onRespond,
  onProceedTrade,
}: ReceivedOffersModalProps) {
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            수락됨
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            거절됨
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            대기중
          </Badge>
        );
    }
  };

  const calculateDiscount = (originalPrice: number, offeredPrice: number) => {
    const discount = ((originalPrice - offeredPrice) / originalPrice) * 100;
    return discount.toFixed(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>받은 제안</DialogTitle>
        </DialogHeader>

        {/* 상품 정보 */}
        <div className="flex gap-3 p-3 bg-gray-50 rounded-lg mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={phone.images[0]?.image_url || '/placeholder.png'}
              alt={phone.title}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <h4 className="font-medium text-sm">
              {phone.brand} {phone.model}
            </h4>
            <p className="text-lg font-semibold">
              {phone.price.toLocaleString()}원
            </p>
          </div>
        </div>

        {/* 제안 목록 */}
        <div className="space-y-3">
          {offers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              아직 받은 제안이 없습니다
            </div>
          ) : (
            offers.map((offer) => (
              <div
                key={offer.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={offer.buyer.profile_image} />
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {offer.buyer.nickname}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(offer.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(offer.status)}
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">제안 금액</span>
                    <div className="text-right">
                      <p className="font-semibold text-lg text-dungji-primary">
                        {offer.offered_price.toLocaleString()}원
                      </p>
                      <p className="text-xs text-gray-500">
                        {calculateDiscount(phone.price, offer.offered_price)}% 할인
                      </p>
                    </div>
                  </div>

                  {offer.message && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedMessage(
                          expandedMessage === offer.id ? null : offer.id
                        )}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                      >
                        <MessageSquare className="w-4 h-4" />
                        메시지 {expandedMessage === offer.id ? '접기' : '보기'}
                      </button>
                      {expandedMessage === offer.id && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            {offer.message}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {offer.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => onRespond(offer.id, 'accept')}
                    >
                      수락
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => onRespond(offer.id, 'reject')}
                    >
                      거절
                    </Button>
                  </div>
                )}
                
                {offer.status === 'accepted' && (
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">
                        ✅ 제안을 수락했습니다. 연락처가 공개되었습니다.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (onProceedTrade) {
                            onProceedTrade(offer.id);
                          }
                        }}
                      >
                        거래 진행
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          // TODO: 수락 취소 API 호출
                          console.log('수락 취소', offer.id);
                        }}
                      >
                        수락 취소
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}