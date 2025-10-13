'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Users, ShoppingCart, AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: React.ReactElement;
  content: React.ReactElement;
}

export default function CustomDealsGuidePage() {
  const [openSection, setOpenSection] = useState<string | null>('what');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const sections: Section[] = [
    {
      id: 'what',
      title: '커스텀 공구란?',
      icon: <Info className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            <span className="font-semibold text-gray-900">커스텀 공구</span>는 판매자가 일정 인원 이상 모이면 특별 할인을 제공하는 공동구매 시스템입니다.
          </p>

          <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
            💡 판매수수료 없이 직접 결제받기 때문에 누구나 부담없이 이용 가능합니다. (무료 서비스)
          </p>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">온라인 공구</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• 온라인 쇼핑몰 할인코드 또는 할인 링크 제공</li>
              <li>• 전국 어디서나 참여 가능</li>
              <li>• 공구 마감 시 자동으로 할인코드/링크 발급</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">오프라인 공구</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• 실제 매장 방문하여 할인받는 방식</li>
              <li>• 특정 지역에서만 이용 가능</li>
              <li>• QR 코드를 매장에서 스캔하여 할인 제공 (할인코드 직접확인 가능)</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'buyer',
      title: '구매자 가이드',
      icon: <ShoppingCart className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
              공구 찾기
            </h4>
            <div className="ml-8 space-y-2 text-gray-700">
              <p>• <span className="font-medium">타입</span>: 온라인/오프라인 선택</p>
              <p>• <span className="font-medium">카테고리</span>: 원하는 카테고리 선택</p>
              <p>• <span className="font-medium">지역</span>: 내 지역 검색 (오프라인)</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
              공구 참여하기
            </h4>
            <div className="ml-8 space-y-2 text-gray-700">
              <p>• 할인 정보와 모집 현황 확인</p>
              <p>• 로그인 후 '참여하기' 버튼 클릭</p>
              <p>• 참여 즉시 확정 (할인 발급 전까지 취소 가능)</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
              할인 받기
            </h4>
            <div className="ml-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <p className="font-medium text-gray-900 mb-2">온라인 공구</p>
              <p className="text-sm text-gray-700">SMS 또는 마이페이지에서 할인코드 확인 → 쇼핑몰에서 결제 시 입력</p>

              <p className="font-medium text-gray-900 mb-2 mt-4">오프라인 공구</p>
              <p className="text-sm text-gray-700">마이페이지에서 QR 코드 확인 → 매장 방문 → 판매자에게 제시</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'seller',
      title: '판매자 가이드',
      icon: <Users className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
              공구 등록하기
            </h4>
            <div className="ml-8 space-y-2 text-gray-700">
              <p>• 공구 타입 선택 (온라인/오프라인)</p>
              <p>• 상품명과 카테고리 입력</p>
              <p>• 가격 설정 (정가 → 할인가)</p>
              <p>• 목표 인원과 모집 기간 설정</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
              참여자 모집
            </h4>
            <div className="ml-8 bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">조기 종료:</span> 1명 이상 모이면 언제든 조기 종료 가능
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
              판매 확정
            </h4>
            <div className="ml-8 space-y-2 text-gray-700">
              <p>• 목표 인원 달성 시 판매 확정/취소 선택</p>
              <p>• 판매 확정 시 할인 정보 입력</p>
              <p>• 모든 참여자에게 자동으로 할인코드 발급</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'noshow',
      title: '노쇼 및 페널티',
      icon: <AlertCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              노쇼란?
            </h4>
            <p className="text-red-800 text-sm">
              공구에 참여하고 할인코드를 발급받았으나 약속된 기간 내에 사용하지 않는 행위입니다.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">노쇼가 미치는 영향</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="mt-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">다른 구매자에게</p>
                  <p className="text-sm text-gray-600">다른 사용자의 할인 기회가 줄어듭니다</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">판매자에게</p>
                  <p className="text-sm text-gray-600">할인 혜택을 준비했지만 매출이 발생하지 않아 손해를 봅니다</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">커뮤니티 전체</p>
                  <p className="text-sm text-gray-600">신뢰도가 하락하고 건전한 거래 문화가 무너집니다</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">페널티 시스템</h4>
            <div className="space-y-2">
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="font-medium text-gray-900">1차 노쇼 → 24시간 참여 제한</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="font-medium text-gray-900">2차 노쇼 → 48시간 참여 제한</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-gray-900">3차 이상 → 72시간 참여 제한 + 계정 제재 가능</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              노쇼를 방지하려면
            </h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• 참여 전 신중히 고려하기</li>
              <li>• 유효기간 캘린더에 표시하기</li>
              <li>• 할인코드 발급 즉시 사용하기</li>
              <li>• 사용 불가 시 조기 취소하기</li>
            </ul>
          </div>

          <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">⚠️ 허위 신고 시 제재</h4>
            <p className="text-sm text-red-800 mb-2">
              의도적인 허위 신고는 <span className="font-bold">즉시 계정 정지</span> 처리되며, 반복 시 <span className="font-bold">영구 이용 제한</span>됩니다.
            </p>
            <p className="text-xs text-red-700">
              충분한 증거 자료를 준비하고 정확한 사실만 신고해주세요.
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">커스텀 공구 이용가이드</h1>
          <p className="text-blue-100 text-base">특별한 공동구매 혜택, 함께 만들어가요!</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-blue-600">{section.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                </div>
                {openSection === section.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {openSection === section.id && (
                <div className="p-4 pt-0 bg-gray-50">
                  <div className="bg-white p-4 rounded-lg">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Message */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
          <p className="text-center text-gray-700 font-medium">
            모두가 함께 지키면 더 좋은 할인 혜택을 누릴 수 있습니다! 🙌
          </p>
        </div>
      </div>
    </div>
  );
}
