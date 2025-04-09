import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function GuidelinesPage() {
  return (
    <div className="bg-gray-100 min-h-screen pb-8">
      {/* 헤더 */}
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center">
          <Link href="/" className="mr-2">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-lg font-medium">공동 구매 가이드라인</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">공구 참여 전 꼭 읽어보세요</p>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-lg mx-auto">
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>공동 구매란?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              공동 구매는 여러 사람이 함께 모여 상품을 구매하는 방식으로, 개인이 구매할 때보다 더 좋은 조건으로 상품을 구매할 수 있습니다. 
              특히 휴대폰의 경우 통신사의 지원금을 최대한 활용하여 더 저렴하게 구매할 수 있습니다.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>공동 구매 참여 방법</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. 공구 선택</h3>
              <p className="text-sm text-gray-700">
                원하는 상품의 공구를 찾아 상세 정보를 확인합니다. 통신사, 요금제, 약정 기간 등을 꼼꼼히 확인하세요.
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">2. 공구 참여</h3>
              <p className="text-sm text-gray-700">
                공구 참여하기 버튼을 눌러 참여 신청을 합니다. 이때 필요한 개인 정보와 요금제 선택 등의 정보를 입력해야 합니다.
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">3. 입금 확인</h3>
              <p className="text-sm text-gray-700">
                공구 참여 후 안내된 계좌로 입금을 완료합니다. 입금 확인이 되면 공구 참여가 확정됩니다.
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">4. 공구 확정</h3>
              <p className="text-sm text-gray-700">
                최소 인원이 모이면 공구가 확정되고, 상품 배송이 시작됩니다. 공구가 확정되지 않을 경우 입금된 금액은 환불됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>휴대폰 공동 구매 주의사항</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. 통신사 약정</h3>
              <p className="text-sm text-gray-700">
                휴대폰 공구는 대부분 2년 약정을 기본으로 합니다. 약정 기간 내 해지 시 위약금이 발생할 수 있으니 주의하세요.
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">2. 요금제 변경</h3>
              <p className="text-sm text-gray-700">
                약정 기간 내 요금제를 하향 변경할 경우 지원금이 감소하거나 위약금이 발생할 수 있습니다.
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">3. 번호이동/신규가입/기기변경</h3>
              <p className="text-sm text-gray-700">
                번호이동, 신규가입, 기기변경에 따라 지원금이 달라질 수 있으니 공구 참여 전 확인하세요.
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">4. 지원금 정보</h3>
              <p className="text-sm text-gray-700">
                총 지원금은 공시지원금과 추가지원금을 합한 금액입니다. 유심서비스나 카드결제 할인은 포함되지 않습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 mb-4">
          <CardHeader>
            <CardTitle>환불 정책</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. 공구 미확정 시</h3>
              <p className="text-sm text-gray-700">
                최소 인원이 모이지 않아 공구가 확정되지 않을 경우, 입금된 금액은 전액 환불됩니다.
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">2. 공구 확정 후 취소</h3>
              <p className="text-sm text-gray-700">
                공구가 확정된 후에는 원칙적으로 취소가 불가능합니다. 단, 불가피한 사유가 있을 경우 관리자에게 문의하세요.
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">3. 상품 하자</h3>
              <p className="text-sm text-gray-700">
                수령한 상품에 하자가 있을 경우, 수령일로부터 7일 이내에 관리자에게 문의하시면 교환 또는 환불 처리가 가능합니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
