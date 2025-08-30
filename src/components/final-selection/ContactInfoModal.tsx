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
import { Phone, Mail, Building, User, Copy, Check, CheckCircle, XCircle, Clock, Calendar, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BuyerInfo {
  id?: number;
  user?: {
    id: number;
    email: string;
    nickname: string;
    phone?: string;
  };
  // 기존 형식 호환성 유지
  name?: string;
  nickname?: string;
  phone?: string;
  address?: string;
  email?: string;
  final_decision?: 'pending' | 'confirmed' | 'cancelled';
  final_decision_at?: string;
  is_purchase_completed?: boolean;
  purchase_completed_at?: string;
}

interface ContactInfo {
  role: 'seller' | 'buyers';
  // 판매자 정보 (구매자가 볼 때)
  name?: string;
  nickname?: string;
  business_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  business_number?: string;
  address_region?: string;
  // 구매자 목록 (판매자가 볼 때)
  buyers?: BuyerInfo[];
  total_count?: number;
  // 공구 정보 추가
  groupbuy?: {
    id: number;
    title: string;
    status: string;
    product_name?: string;
    confirmed_buyers_count?: number;
    total_participants?: number;
  };
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
      // 판매자인 경우 buyers API 사용, 구매자인 경우 contact-info API 사용
      const endpoint = isSeller 
        ? `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/buyers/`
        : `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/contact-info/`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // buyers API 응답 형식을 contact-info 형식으로 변환
        if (isSeller && data.buyers) {
          const transformedData = {
            role: 'buyers' as const,
            buyers: data.buyers,
            total_count: data.buyers.length,
            groupbuy: data.groupbuy
          };
          setContactInfo(transformedData);
        } else {
          setContactInfo(data);
        }
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: '오류',
          description: error.error || '정보를 가져올 수 없습니다.'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '정보 조회 중 문제가 발생했습니다.'
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
              : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                  <div className="text-blue-700 font-medium">
                    <div>구매를 확정한 회원 목록입니다.</div>
                    <div className="mt-1">제안하신 견적으로 친절한 거래 부탁드립니다.</div>
                  </div>
                </div>
              )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : (
          <div className="space-y-4">
            {contactInfo.role === 'seller' ? (
              // 구매자가 보는 판매자 정보
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{contactInfo.nickname || contactInfo.name}</h3>
                  </div>
                  
                  <div className="space-y-3">
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
                    
                    {contactInfo.business_number && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span>사업자번호: {contactInfo.business_number}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(contactInfo.business_number!, '사업자번호')}
                        >
                          {copiedField === '사업자번호' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {contactInfo.address_region && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span>사업자주소: {contactInfo.address_region}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              // 판매자가 보는 구매자 목록
              <div className="space-y-3">
                {/* 공구 정보 */}
                {contactInfo.groupbuy && (
                  <Card className="p-4 bg-gray-50 mb-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{contactInfo.groupbuy.title}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                        {contactInfo.groupbuy.product_name && (
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{contactInfo.groupbuy.product_name}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="inline-flex">
                            구매확정: {contactInfo.groupbuy.confirmed_buyers_count || 0}명 / 전체: {contactInfo.groupbuy.total_participants || 0}명
                          </span>
                        </span>
                      </div>
                    </div>
                  </Card>
                )}

                <h3 className="text-sm font-semibold text-gray-700">구매 확정자 목록</h3>
                
                {contactInfo.buyers && contactInfo.buyers.map((buyer, index) => {
                  // 구매자 정보 추출 (새 형식과 기존 형식 모두 지원)
                  const displayName = buyer.user 
                    ? (buyer.user.nickname || buyer.user.email)
                    : (buyer.nickname || buyer.name || buyer.email || '');
                  const phoneNumber = buyer.user ? buyer.user.phone : buyer.phone;
                  const email = buyer.user ? buyer.user.email : buyer.email;
                  
                  // final_decision 상태에 따른 배지
                  const getFinalDecisionBadge = (decision?: string) => {
                    switch (decision) {
                      case 'confirmed':
                        return (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            구매확정
                          </span>
                        );
                      case 'cancelled':
                        return (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            구매포기
                          </span>
                        );
                      default:
                        return (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Clock className="w-3 h-3 mr-1" />
                            대기중
                          </span>
                        );
                    }
                  };
                  
                  return (
                    <Card 
                      key={buyer.id || index} 
                      className={`p-4 ${
                        buyer.final_decision === 'confirmed' 
                          ? 'border-green-200' 
                          : buyer.final_decision === 'cancelled' 
                          ? 'border-red-200' 
                          : ''
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                              <h4 className="font-medium">{displayName}</h4>
                              {email && <p className="text-sm text-gray-500">{email}</p>}
                            </div>
                          </div>
                          {buyer.final_decision && getFinalDecisionBadge(buyer.final_decision)}
                        </div>
                        
                        {buyer.final_decision === 'confirmed' && (
                          <>
                            {phoneNumber && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">{phoneNumber}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(phoneNumber, `${displayName} 전화번호`)}
                                >
                                  {copiedField === `${displayName} 전화번호` ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            )}
                            
                            {buyer.final_decision_at && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  확정일시: {new Date(buyer.final_decision_at).toLocaleString('ko-KR')}
                                </span>
                              </div>
                            )}
                            
                            {buyer.address && (
                              <p className="text-xs text-gray-500">
                                주소: {buyer.address}
                              </p>
                            )}
                            
                            {buyer.is_purchase_completed && buyer.purchase_completed_at && (
                              <div className="mt-2 pt-2 border-t">
                                <span className="text-xs text-green-600">
                                  구매완료: {new Date(buyer.purchase_completed_at).toLocaleString('ko-KR')}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </Card>
                  );
                })}
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