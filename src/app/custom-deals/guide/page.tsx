'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, Users, ShoppingCart, AlertCircle, CheckCircle2, XCircle, Info, Clock, FileSpreadsheet, MessageCircle, Gift } from 'lucide-react';

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
        <div className="space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold text-gray-900">커스텀 공구</span>는 온/오프라인 판매자라면 누구나 등록하고 판매하실 수 있도록 수수료없이 운영하는 둥지마켓만의 특별한 공동구매 서비스입니다.
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3.5 rounded-lg border-2 border-blue-200">
            <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              선착순 인원 모집 방식
            </h4>
            <div className="space-y-2">
              <div className="bg-white p-2.5 rounded-md">
                <p className="text-xs text-gray-800 font-medium mb-1">🎯 목표 인원이 모이면 할인 혜택 제공</p>
                <p className="text-xs text-gray-600">
                  예: 10명 모집 공구 → 10명이 모두 참여하면 → 전원 할인 혜택 받음
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-md">
                <p className="text-xs text-gray-800 font-medium mb-1">⚡ 선착순 마감</p>
                <p className="text-xs text-gray-600">
                  정해진 인원만 참여 가능하니 서둘러 참여하세요!
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-md">
                <p className="text-xs text-gray-800 font-medium mb-1">✅ 모집 기간 내 달성 시</p>
                <p className="text-xs text-gray-600">
                  판매자 확정 → 자동으로 할인코드/비공개 링크/QR 발급 → 즉시 사용 가능
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-600 bg-green-50 p-2.5 rounded-lg border border-green-200">
            💡 판매수수료 없이 직접 결제받기 때문에 누구나 부담없이 이용 가능합니다. (무료 서비스)
          </p>

          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">다양한 카테고리 제공</h4>
            <div className="relative w-full max-w-xs mx-auto">
              <Image
                src="/images/custom-category.jpg"
                alt="커스텀 공구 카테고리"
                width={100}
                height={33}
                className="rounded-lg w-full h-auto"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-1.5">온라인 공구</h4>
            <ul className="space-y-0.5 text-xs text-gray-700">
              <li>• 온라인 쇼핑몰 할인코드 또는 비공개 할인링크 제공</li>
              <li>• 공구 마감 시 자동으로 할인코드/링크 발급</li>
            </ul>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-1.5">오프라인 공구</h4>
            <ul className="space-y-0.5 text-xs text-gray-700">
              <li>• 실제 매장 방문하여 할인받는 방식</li>
              <li>• 특정 지역에서만 이용 가능</li>
              <li>• QR 코드를 매장에서 스캔하여 할인 제공 (할인코드 직접확인 가능)</li>
            </ul>
          </div>

          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-1.5">쿠폰전용</h4>
            <p className="text-xs text-gray-700">
              • 구매과정없이 이벤트나 할인혜택을 코드, 링크 또는 텍스트 형태로 자유롭게 배포할 수 있습니다
            </p>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3.5 rounded-lg border-2 border-orange-200">
            <h4 className="text-sm font-bold text-orange-900 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              기간행사 방식 (NEW)
            </h4>
            <div className="space-y-2">
              <div className="bg-white p-2.5 rounded-md">
                <p className="text-xs text-gray-800 font-medium mb-1">🎯 인원 제한 없이 기간 내 누구나 이용</p>
                <p className="text-xs text-gray-600">
                  정해진 기간동안 인원 제한 없이 모든 고객에게 동일한 할인 혜택 제공
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-md">
                <p className="text-xs text-gray-800 font-medium mb-1">⏰ 기간제 운영</p>
                <p className="text-xs text-gray-600">
                  타임 세일처럼 특정 기간에만 할인을 제공하고 싶을 때 활용
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-md">
                <p className="text-xs text-gray-800 font-medium mb-1">✅ 즉시 이용 가능</p>
                <p className="text-xs text-gray-600">
                  할인링크로 이동해서 즉시 구매 가능
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-md border-t border-orange-200 mt-2 pt-2">
                <p className="text-xs text-gray-800 font-medium mb-1">🎁 무료 이벤트 옵션</p>
                <p className="text-xs text-gray-600">
                  무료 체험권, 웰컴 쿠폰 등 구매 없이 무료로 제공하는 이벤트 진행 가능
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'buyer',
      title: '구매자 가이드',
      icon: <ShoppingCart className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
              공구 찾기
            </h4>
            <div className="ml-7 space-y-1 text-xs text-gray-700">
              <p>• <span className="font-medium">타입</span>: 온라인/오프라인 선택</p>
              <p>• <span className="font-medium">카테고리</span>: 원하는 카테고리 선택</p>
              <p>• <span className="font-medium">지역</span>: 내 지역 검색 (오프라인)</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
              공구 참여하기
            </h4>
            <div className="ml-7 space-y-2">
              <div className="space-y-1 text-xs text-gray-700">
                <p>• 할인 정보와 모집 현황 확인</p>
                <p>• 로그인 후 '참여하기' 버튼 클릭</p>
                <p>• 참여 즉시 확정 (할인 발급 전까지 취소 가능)</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                <p className="text-xs font-semibold text-amber-900 mb-1">⚡ 선착순 마감 주의!</p>
                <p className="text-xs text-amber-800">
                  정해진 인원이 다 차면 더 이상 참여할 수 없으니<br />
                  마음에 드는 공구는 빠르게 참여하세요!
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
              할인 받기
            </h4>
            <div className="ml-7 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
              <p className="text-xs font-medium text-gray-900 mb-1.5">온라인 공구</p>
              <p className="text-xs text-gray-700">SMS 또는 마이페이지에서 할인코드 확인 → 쇼핑몰에서 결제 시 입력</p>

              <p className="text-xs font-medium text-gray-900 mb-1.5 mt-3">오프라인 공구</p>
              <p className="text-xs text-gray-700">마이페이지에서 QR 코드 확인 → 매장 방문 → 판매자에게 제시</p>
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
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
              공구 등록하기
            </h4>
            <div className="ml-7 space-y-2">
              <div className="space-y-1 text-xs text-gray-700">
                <p>• 공구 타입 선택 (온라인/오프라인)</p>
                <p>• 상품명과 카테고리 입력</p>
                <p>• 가격 설정 (정가 → 공구 전용 할인가)</p>
                <p>• 목표 인원과 모집 기간 설정</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 mb-2">📌 온라인 공구 등록 시</p>
                <div className="space-y-1.5 text-xs text-blue-800">
                  <p>• <span className="font-semibold">공구 전용 비공개 링크</span> 준비 (쇼핑몰 할인 링크)</p>
                  <p>• 또는 <span className="font-semibold">할인코드</span> 미리 생성 (스마트스토어 등)</p>
                  <p className="text-[11px] text-blue-700 bg-blue-100 p-1.5 rounded mt-1">
                    💡 공구 마감 후 공개되므로 미리 비공개 처리해주세요
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <p className="text-xs font-semibold text-green-900 mb-2">🏪 오프라인 공구 등록 시</p>
                <div className="space-y-1.5 text-xs text-green-800">
                  <p>• 할인코드는 <span className="font-semibold">시스템이 자동 생성</span>합니다</p>
                  <p>• 직접 코드를 만들 필요 없이 목표 인원만 설정하면 OK</p>
                  <p>• 공구 마감 후 참여자에게 QR 코드 자동 발급</p>
                  <p className="text-[11px] text-green-700 bg-green-100 p-1.5 rounded mt-1">
                    💡 매장에서 QR 스캔 또는 코드 확인 후 할인 적용
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
              참여자 모집
            </h4>
            <div className="ml-7 space-y-2">
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                <p className="text-xs font-semibold text-slate-900 mb-1">⏰ 모집 기간 설정</p>
                <p className="text-xs text-slate-700">
                  공구 등록 시 자동 마감(1~7일) 또는 직접 마감 시간 설정 가능
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                <p className="text-xs font-semibold text-amber-900 mb-1">⚡ 조기 종료</p>
                <p className="text-xs text-amber-800">
                  1명 이상 모이면 언제든 조기 종료 가능
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 mb-1.5">⏱️ 24시간 판매 결정</p>
                <div className="space-y-1.5 text-xs text-blue-800">
                  <p>모집 마감 후 24시간 이내에 판매 확정/취소 결정</p>
                  <div className="bg-blue-100 p-2 rounded">
                    <p className="font-semibold mb-0.5">💡 부분 판매 허용 옵션</p>
                    <p>공구 등록 시 "부분 판매 허용"을 활성화하면,<br/>
                    목표 인원 미달 시에도 모인 인원만으로 판매 진행 가능</p>
                  </div>
                  <p className="text-[11px] text-blue-700 mt-1">
                    • 인원 달성 실패 시: 부분 판매 또는 전체 취소 선택<br/>
                    • 미결정 시: 자동으로 전체 취소 처리
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
              판매 확정 및 할인 제공
            </h4>
            <div className="ml-7 space-y-2">
              <div className="space-y-1 text-xs text-gray-700">
                <p>• 목표 인원 달성 시 판매 확정/취소 선택</p>
                <p>• 판매 확정 시 할인 정보 입력</p>
                <p>• 모든 참여자에게 자동으로 할인코드 발급</p>
              </div>
              <div className="bg-green-50 border border-green-300 p-2.5 rounded-lg">
                <p className="text-xs font-semibold text-green-900 mb-1">✅ 인원 달성 시 혜택 제공</p>
                <p className="text-xs text-green-800">
                  설정한 목표 인원이 모두 모이면<br />
                  판매 확정 후 참여자 전원에게 할인 혜택을 제공합니다
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
              참여자 관리
            </h4>
            <div className="ml-7 space-y-2">
              <div className="space-y-1 text-xs text-gray-700">
                <p>• 마이페이지에서 참여자 목록 실시간 확인</p>
                <p>• 할인코드 사용 여부 및 유효기간 관리</p>
                <p>• 참여자별 연락처 및 할인 정보 조회</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-lg">
                <p className="text-xs font-semibold text-indigo-900 mb-1.5 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  엑셀 다운로드 지원
                </p>
                <p className="text-xs text-indigo-800">
                  참여자 관리 페이지에서 참여자 목록을 엑셀 파일로<br/>
                  다운로드하여 오프라인에서도 쉽게 관리할 수 있습니다
                </p>
                <p className="text-[11px] text-indigo-700 bg-indigo-100 p-1.5 rounded mt-1.5">
                  💡 포함 정보: 닉네임, 연락처, 할인코드, 할인링크, 유효기간, 사용여부
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3.5 rounded-lg border-2 border-purple-200">
            <h4 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              등록이 어려우신가요?
            </h4>
            <div className="bg-white p-2.5 rounded-md">
              <p className="text-xs text-gray-800 leading-relaxed">
                <span className="font-semibold">등록 대행 서비스</span>를 이용해보세요!<br/>
                커스텀 공구 등록이 복잡하거나 도움이 필요하신 경우<br/>
                <span className="font-semibold text-purple-700">둥지마켓 카카오톡 채널</span>로 문의주시면<br/>
                담당자가 친절하게 등록을 도와드립니다 🙌
              </p>
            </div>
            <p className="text-[11px] text-purple-700 mt-2 text-center">
              📱 카카오톡 채널에서 "등록 대행 요청"을 남겨주세요
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'service-provision',
      title: '기간행사 서비스제공',
      icon: <Gift className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-3.5">
            <h4 className="text-sm font-semibold text-orange-900 mb-1.5 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              기간행사 서비스제공이란?
            </h4>
            <p className="text-xs text-orange-800 leading-relaxed">
              무료 서비스나 이벤트 혜택을 특정 기간 동안 인원 제한 없이 제공하는 방식입니다.<br/>
              구매 과정 없이 참여만으로 바로 혜택을 받을 수 있는 특별한 이벤트입니다.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 언제 사용하나요?</h4>
            <div className="space-y-2">
              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">무료 체험 서비스 제공</p>
                <p className="text-xs text-blue-800">
                  헬스장 무료 1일 이용권, 학원 무료 체험 수업 등
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-lg">
                <p className="text-xs font-medium text-purple-900 mb-1">오프라인 이벤트 참여</p>
                <p className="text-xs text-purple-800 mb-1.5">
                  카페 웰컴 쿠폰, 식당 오픈 기념 무료 음료 제공 등
                </p>
                <div className="bg-white p-2 rounded border border-purple-300">
                  <p className="text-xs font-semibold text-purple-900 mb-0.5">🍽️ 식당 활용 예시</p>
                  <p className="text-[11px] text-purple-700">
                    메인 메뉴 주문 시 무료 음료/반찬/사이드메뉴 서비스<br/>
                    예: "삼겹살 2인분 이상 주문 시 된장찌개 무료 제공"
                  </p>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 p-2.5 rounded-lg">
                <p className="text-xs font-medium text-green-900 mb-1">온라인 무료 혜택</p>
                <p className="text-xs text-green-800">
                  온라인 강의 무료 수강권, 무료 샘플 신청 등
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                <p className="text-xs font-medium text-amber-900 mb-1">시즌 프로모션</p>
                <p className="text-xs text-amber-800">
                  개업/오픈 기념 이벤트, 주년 기념 특별 혜택 등
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">📋 판매자 등록 가이드</h4>
            <div className="space-y-2">
              <div className="space-y-1 text-xs text-gray-700">
                <p className="font-semibold text-gray-900 mb-1.5">1. 기본 정보 입력</p>
                <div className="ml-3 space-y-0.5">
                  <p>• <span className="font-medium">공구 유형</span>: 온라인 또는 오프라인 선택</p>
                  <p>• <span className="font-medium">상품명</span>: 제공할 서비스/이벤트 이름</p>
                  <p>• <span className="font-medium">카테고리</span>: 해당하는 카테고리 선택</p>
                  <p>• <span className="font-medium">이미지</span>: 서비스/이벤트 설명 이미지 업로드</p>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                <p className="text-xs font-semibold text-orange-900 mb-1.5">2. 가격 설정 (중요!)</p>
                <div className="space-y-1 text-xs text-orange-800">
                  <p>• <span className="font-semibold">판매 유형</span>: "인원 모집 특가" 또는 <span className="font-bold">"기간행사"</span> 중 선택</p>
                  <p>• <span className="font-semibold">가격 유형</span>: <span className="font-bold">"서비스제공"</span> 선택</p>
                  <p className="text-[11px] text-orange-700 bg-orange-100 p-1.5 rounded mt-1">
                    💡 서비스제공은 구매 과정 없이 무료로 제공하는 이벤트입니다
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-gray-700">
                <p className="font-semibold text-gray-900 mb-1.5">3. 진행 기간 설정</p>
                <div className="ml-3 space-y-0.5">
                  <p>• <span className="font-medium">시작일</span>: 서비스 제공 시작 날짜</p>
                  <p>• <span className="font-medium">종료일</span>: 서비스 제공 종료 날짜</p>
                  <p className="text-[11px] text-gray-600 bg-gray-100 p-1.5 rounded mt-1">
                    ⏰ 기간 내 누구나 참여 가능하며, 인원 제한이 없습니다
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 mb-1.5">4. 혜택 제공 방법</p>
                <div className="space-y-1.5 text-xs text-blue-800">
                  <p className="font-medium">온라인 공구:</p>
                  <div className="ml-3 space-y-0.5">
                    <p>• 이벤트 참여 링크나 신청 페이지 URL 입력</p>
                    <p>• 참여자는 링크로 이동하여 즉시 혜택 신청</p>
                  </div>
                  <p className="font-medium mt-2">오프라인 공구:</p>
                  <div className="ml-3 space-y-0.5">
                    <p>• 매장 위치와 연락처 입력</p>
                    <p>• 방문 시 참여 인증으로 혜택 제공</p>
                    <p>• 필요시 할인코드/유효기간 설정 가능</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs text-gray-700">
                <p className="font-semibold text-gray-900 mb-1.5">5. 상세 설명 작성</p>
                <div className="ml-3 space-y-0.5">
                  <p>• 제공하는 서비스/이벤트의 상세 내용</p>
                  <p>• 이용 방법 및 주의사항</p>
                  <p>• 제외 사항이 있다면 명확히 기재</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">🎯 구매자 이용 가이드</h4>
            <div className="space-y-2">
              <div className="flex gap-2.5">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-xs font-medium text-gray-900">이벤트 찾기</p>
                  <p className="text-xs text-gray-600">기간행사 필터 또는 배지로 쉽게 찾을 수 있습니다</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-xs font-medium text-gray-900">참여하기 클릭</p>
                  <p className="text-xs text-gray-600">로그인 후 참여하기 버튼을 누르면 즉시 참여 완료</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-xs font-medium text-gray-900">혜택 받기</p>
                  <p className="text-xs text-gray-600">마이페이지에서 참여 링크 확인 또는 매장 방문하여 혜택 이용</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-green-900 mb-1.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              인원 모집 특가와의 차이점
            </h4>
            <div className="space-y-1.5 text-xs text-green-800">
              <div className="flex items-start gap-2">
                <span className="font-bold">✓</span>
                <p><span className="font-semibold">인원 제한 없음</span>: 정해진 기간 동안 누구나 참여 가능</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">✓</span>
                <p><span className="font-semibold">즉시 이용</span>: 참여와 동시에 혜택 제공, 대기 없음</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">✓</span>
                <p><span className="font-semibold">무료 서비스</span>: 구매 과정 없이 무료로 제공되는 이벤트</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">✓</span>
                <p><span className="font-semibold">기간 운영</span>: 특정 기간 동안만 진행되는 타임 세일 방식</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-purple-900 mb-1.5">💼 활용 팁</h4>
            <div className="space-y-1 text-xs text-purple-800">
              <p>• 신규 고객 유치를 위한 무료 체험 서비스로 활용</p>
              <p>• 오픈/주년 기념 이벤트로 브랜드 홍보</p>
              <p>• 비수기 시즌에 매장 방문 고객 늘리기</p>
              <p>• SNS 공유를 통한 바이럴 마케팅 효과</p>
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
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-red-900 mb-1.5 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              노쇼란?
            </h4>
            <p className="text-xs text-red-800">
              공구에 참여하고 할인코드를 발급받았으나 약속된 기간 내에 사용하지 않는 행위입니다.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">노쇼가 미치는 영향</h4>
            <div className="space-y-2">
              <div className="flex gap-2.5">
                <div className="mt-1">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">다른 구매자에게</p>
                  <p className="text-xs text-gray-600">다른 사용자의 할인 기회가 줄어듭니다</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <div className="mt-1">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">판매자에게</p>
                  <p className="text-xs text-gray-600">할인 혜택을 준비했지만 매출이 발생하지 않아 손해를 봅니다</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <div className="mt-1">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">커뮤니티 전체</p>
                  <p className="text-xs text-gray-600">신뢰도가 하락하고 건전한 거래 문화가 무너집니다</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">페널티 시스템</h4>
            <div className="space-y-1.5">
              <div className="bg-yellow-50 p-2.5 rounded-lg">
                <p className="text-xs font-medium text-gray-900">1차 노쇼 → 24시간 참여 제한</p>
              </div>
              <div className="bg-orange-50 p-2.5 rounded-lg">
                <p className="text-xs font-medium text-gray-900">2차 노쇼 → 48시간 참여 제한</p>
              </div>
              <div className="bg-red-50 p-2.5 rounded-lg">
                <p className="text-xs font-medium text-gray-900">3차 이상 → 72시간 참여 제한 + 계정 제재 가능</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-blue-900 mb-1.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              노쇼를 방지하려면
            </h4>
            <ul className="space-y-0.5 text-xs text-blue-800">
              <li>• 참여 전 신중히 고려하기</li>
              <li>• 유효기간 캘린더에 표시하기</li>
              <li>• 할인코드 발급 즉시 사용하기</li>
              <li>• 사용 불가 시 조기 취소하기</li>
            </ul>
          </div>

          <div className="bg-red-100 border-2 border-red-300 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-red-900 mb-1.5">⚠️ 허위 신고 시 제재</h4>
            <p className="text-xs text-red-800 mb-1.5">
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
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-200 py-6">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4">
          <h1 className="text-lg md:text-xl font-bold mb-1.5 text-gray-900">커공 특가 이용가이드</h1>
          <p className="text-gray-600 text-sm">특별한 공동구매 혜택, 함께 만들어가요!</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6 pb-24">
        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="text-blue-600">{section.icon}</div>
                  <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
                </div>
                {openSection === section.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
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
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-lg border border-indigo-200">
          <p className="text-center text-sm text-gray-700 font-medium">
            모두가 함께 지키면 더 좋은 할인 혜택을 누릴 수 있습니다! 🙌
          </p>
        </div>
      </div>
    </div>
  );
}
