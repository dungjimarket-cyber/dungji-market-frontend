'use client';

import Link from 'next/link';
import { ArrowLeft, Package, MapPin, AlertTriangle, CheckCircle, Phone, MessageCircle, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UsedTradingGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/used">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                돌아가기
              </Button>
            </Link>
            <h1 className="text-lg font-bold text-gray-900">중고거래 이용가이드</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 text-sm">
        {/* 상품 등록 규칙 */}
        <section className="mb-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            상품 등록 규칙
          </h2>
          <div className="bg-white rounded-lg p-4 border space-y-3">
            <div>
              <h3 className="font-medium mb-2">등록 제한</h3>
              <ul className="space-y-1 text-gray-600 text-xs">
                <li>• 최대 5개까지 동시 등록 가능</li>
                <li>• 사진은 최대 10장까지 업로드</li>
                <li>• 등록 개수 초과시 기존 상품 삭제 후 등록</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 가격 시스템 */}
        <section className="mb-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <span className="text-blue-600 font-bold">￦</span>
            가격 설정 방식
          </h2>
          <div className="bg-white rounded-lg p-4 border space-y-3">
            <div>
              <h3 className="font-medium mb-2">즉시구매 vs 최소제안가</h3>
              <ul className="space-y-1 text-gray-600 text-xs">
                <li>• <strong>즉시구매 가격:</strong> 설정한 가격에 바로 구매 가능</li>
                <li>• <strong>최소제안가:</strong> 가격 협상 가능, 최소 금액 설정</li>
                <li>• 구매자가 가격 제안 → 판매자 수락/거절 선택</li>
                <li>• 제안 수락시 연락처가 자동으로 공개됩니다</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 거래 상태 관리 */}
        <section className="mb-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-purple-600" />
            거래 상태 관리
          </h2>
          <div className="bg-white rounded-lg p-4 border space-y-3">
            <div>
              <h3 className="font-medium mb-2">거래 진행 단계</h3>
              <ul className="space-y-1 text-gray-600 text-xs">
                <li>• <strong>판매중:</strong> 가격 제안 받는 중</li>
                <li>• <strong>거래중:</strong> 제안 수락, 연락처 공개됨</li>
                <li>• <strong>거래완료:</strong> 실제 거래 완료 후 처리</li>
                <li>• <strong>거래 취소시:</strong> 재등록 여부를 선택할 수 있습니다</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 지역별 거래 */}
        <section className="mb-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            지역별 거래
          </h2>
          <div className="bg-white rounded-lg p-4 border space-y-3">
            <div>
              <h3 className="font-medium mb-2">지역 설정</h3>
              <ul className="space-y-1 text-gray-600 text-xs">
                <li>• 시/군/구 단위로 거래 지역 설정</li>
                <li>• 거래 가능한 지역을 3곳까지 선택하실 수 있어요</li>
                <li>• 가까운 지역의 거래자와 우선 매칭</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 신고 시스템 */}
        <section className="mb-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            신고 시스템
          </h2>
          <div className="bg-white rounded-lg p-4 border space-y-3">
            <div>
              <h3 className="font-medium mb-2">신고 방법</h3>
              <ul className="space-y-1 text-gray-600 text-xs">
                <li>• 연락처 또는 닉네임으로 신고 가능</li>
                <li>• 신고 사유: 허위매물, 사기, 욕설/비방, 부적절한 행동, 스팸</li>
                <li>• 관리자 검토 후 1-3일 내 조치</li>
                <li>• 24시간 내 동일 사용자 중복 신고 불가</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 찜하기 & 필터 */}
        <section className="mb-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-600" />
            찜하기 & 필터 기능
          </h2>
          <div className="bg-white rounded-lg p-4 border space-y-3">
            <div>
              <h3 className="font-medium mb-2">편리한 기능들</h3>
              <ul className="space-y-1 text-gray-600 text-xs">
                <li>• <strong>찜하기:</strong> 관심 상품 찜해두고 마이페이지에서 확인</li>
                <li>• <strong>브랜드 필터:</strong> 삼성, 애플, LG 등 제조사별 검색</li>
                <li>• <strong>상태 필터:</strong> S급, A급, B급, C급별 검색</li>
                <li>• <strong>가격 정렬:</strong> 낮은가격/높은가격 순 정렬</li>
                <li>• <strong>거래완료 포함/제외:</strong> 옵션 선택 가능</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 안전거래 수칙 */}
        <section className="mb-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            안전거래 수칙
          </h2>
          <div className="bg-white rounded-lg p-4 border space-y-3">
            <div>
              <h3 className="font-medium mb-2 text-green-800">반드시 지켜주세요</h3>
              <ul className="space-y-1 text-gray-600 text-xs">
                <li>• 공공장소에서 만남 (카페, 지하철역, 쇼핑몰)</li>
                <li>• 현금으로 직접 거래 (선입금 금지)</li>
                <li>• 상품 상태 직접 확인 후 거래</li>
                <li>• IMEI 번호, 배터리 상태, 기능 작동 확인</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2 text-red-800">절대 금지</h3>
              <ul className="space-y-1 text-gray-600 text-xs">
                <li>• 택배거래 (직접 만나지 않는 거래)</li>
                <li>• 개인 공간에서 만남 (집, 사무실 등)</li>
                <li>• 밤늦은 시간대 거래</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="text-center mt-8">
          <div className="bg-emerald-50 rounded-lg p-6">
            <h2 className="text-base font-bold text-emerald-800 mb-3">
              중고거래 시작하기
            </h2>
            <p className="text-emerald-700 mb-4 text-xs">
              가이드를 숙지하셨다면 이제 안전하고 재밌는 중고거래를 시작해보세요!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/used">
                <Button size="sm" className="gap-2">
                  <Package className="w-4 h-4" />
                  중고거래 둘러보기
                </Button>
              </Link>
              <Link href="/used/create">
                <Button variant="outline" size="sm" className="gap-2">
                  <Phone className="w-4 h-4" />
                  내 폰 판매하기
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}