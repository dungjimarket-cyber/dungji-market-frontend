'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronLeft, MessageSquare, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  // 🏠 둥지마켓 이용 안내
  {
    question: "Q1. 둥지마켓은 어떤 서비스인가요?",
    answer: "둥지마켓은 우리동네 검증된 전문가와 지역 공동구매를 연결하는 플랫폼입니다.\n\n주요 서비스:\n- 전문가 상담: 세무사, 회계사, 변호사, 법무사, 공인중개사, 인테리어, 이사, 청소 등 전문가 무료 상담\n- 커스텀 공구: 우리동네 맛집, 카페, 헬스장 등 단체할인 공동구매\n- 중고거래: 지역 기반 안전한 중고폰, 전자제품 직거래"
  },
  {
    question: "Q2. 전문가 상담은 어떻게 이용하나요?",
    answer: "1. 원하는 분야의 전문가 선택 (세무·회계, 법률, 부동산, 인테리어, 이사, 청소 등)\n2. 간단한 상담 내용 작성\n3. 내 지역 전문가에게 상담 요청 전달\n4. 전문가가 직접 연락하여 상담 진행\n\n상담 신청은 무료이며, 실제 서비스 이용 시 비용이 발생할 수 있습니다."
  },

  // 👥 회원 가입 및 유형
  {
    question: "Q3. 회원 유형에는 어떤 것이 있나요?",
    answer: "- 🐦 일반회원: 전문가 상담 신청, 공구 참여, 중고거래 이용\n  - 카카오톡 간편가입 가능\n  - 모든 서비스 무료 이용\n\n- 🦅 전문가회원: 세무사, 회계사, 변호사 등 전문 서비스 제공자\n  - 일반회원의 상담 요청 수신\n  - 프로필 노출 및 지역 고객 확보\n\n- 🏪 판매회원: 커스텀 공구 및 중고거래 판매자\n  - 공구 개설 및 판매\n  - 거래 수수료 0원"
  },
  {
    question: "Q4. 카카오톡으로 가입했는데 아이디/비밀번호가 없어요",
    answer: "카카오톡 간편가입 회원은 별도의 아이디/비밀번호가 없습니다. 로그인 시 \"카카오톡으로 로그인\" 버튼을 이용해주세요."
  },

  // 🛍️ 커스텀 공구
  {
    question: "Q5. 커스텀 공구란 무엇인가요?",
    answer: "우리동네 맛집, 카페, 헬스장 등에서 N명이 모이면 할인받는 단체할인 공동구매입니다.\n\n- 지역 업체 단체할인 쿠폰\n- 참여 인원이 많을수록 더 큰 할인\n- 수수료 무료"
  },
  {
    question: "Q6. 공구는 어떻게 참여하나요?",
    answer: "1. 커스텀 공구 메뉴에서 참여하고 싶은 공구 선택\n2. '참여하기' 버튼 클릭\n3. 목표 인원 달성 시 할인 혜택 적용\n4. 업체에서 쿠폰/서비스 제공"
  },

  // 💳 거래 및 결제
  {
    question: "Q7. 중고거래는 어떻게 하나요?",
    answer: "1. 중고거래 메뉴에서 판매할 상품 등록 또는 구매할 상품 검색\n2. 판매자/구매자와 채팅으로 거래 조율\n3. 직접 만나서 안전하게 거래\n\n지역 기반으로 가까운 이웃과 거래할 수 있어 안전합니다."
  },
  {
    question: "Q8. 거래 시 주의사항이 있나요?",
    answer: "- 가급적 직접 만나서 거래하세요\n- 거래 장소는 사람이 많은 공공장소 추천\n- 거래 내역은 문자나 카톡으로 보관\n- 이상 발생 시 둥지마켓 고객센터 문의"
  },

  // 🔐 계정 관리
  {
    question: "Q9. 아이디/비밀번호를 잊어버렸어요",
    answer: "- 카카오 회원: 카카오톡 로그인 이용\n- 일반 회원: 로그인 페이지 > \"아이디/비밀번호 찾기\" 이용\n- 가입 시 등록한 이메일 또는 휴대폰 번호로 찾기 가능"
  },

  // ⚠️ 문제 해결
  {
    question: "Q10. 거래 상대방이 약속을 지키지 않아요",
    answer: "1. 거래 내역 증빙 자료 보관\n2. 마이페이지 > 거래내역에서 신고하기 접수\n3. 관리자 검토 후 조치"
  },

  // 📞 고객 지원
  {
    question: "Q11. 고객센터 운영 시간은 어떻게 되나요?",
    answer: "- 운영 시간: 평일 09:00 ~ 18:00\n- 문의 방법:\n  - 카카오톡 채팅: @둥지마켓 (http://pf.kakao.com/_Jyavn/chat)\n  - 이메일: dungjimarket@gmail.com\n  - 마이페이지 > 1:1 문의"
  }
];

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ChevronLeft className="w-4 h-4 mr-1" />
          뒤로가기
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">📚 둥지마켓 자주묻는 질문 (FAQ)</h1>
      <p className="text-gray-600 mb-4">둥지마켓 이용 방법과 자주 묻는 질문들을 모았습니다.</p>
      
      {/* 빠른 링크 버튼들 */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link href="/notices">
          <Button variant="outline" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            공지사항
          </Button>
        </Link>
        <Link href="/inquiries">
          <Button variant="outline" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            1:1 문의
          </Button>
        </Link>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {faqData.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-base font-medium">
              {item.question}
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                {item.answer}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">추가 문의사항이 있으신가요?</h2>
        <p className="text-gray-600 mb-4">
          고객센터로 문의해주시면 친절히 답변드리겠습니다.
        </p>
        <div className="space-y-2">
          <p className="text-sm">
            <strong>운영 시간:</strong> 평일 09:00 ~ 18:00
          </p>
          <p className="text-sm">
            <strong>문의 방법:</strong>
          </p>
          <div className="ml-4 space-y-1">
            <p className="text-sm">
              - 카카오톡 채팅: <a href="http://pf.kakao.com/_Jyavn/chat" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">@둥지마켓</a>
            </p>
            <p className="text-sm">
              - 이메일: <a href="mailto:dungjimarket@gmail.com" className="text-blue-600 hover:text-blue-800">dungjimarket@gmail.com</a>
            </p>
            <p className="text-sm">
              - 마이페이지 &gt; 1:1 문의
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}