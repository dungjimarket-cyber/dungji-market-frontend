'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  // 🏠 둥지마켓 이용 안내
  {
    question: "Q1. 둥지마켓은 어떤 서비스인가요?",
    answer: "둥지마켓은 \"내가 원하는 상품/서비스의 견적을 판매자들이 서로 경쟁하여 최고의 조건으로 제안하는\" 공동구매 경매 서비스입니다.\n예를 들어, 아이폰을 사고 싶다고 공구를 올리면 여러 판매자들이 \"저는 더 싸게 드릴게요!\" 하며 경쟁하는 방식이에요."
  },
  {
    question: "Q2. 일반 쇼핑몰과 뭐가 다른가요?",
    answer: "- 역경매 방식: 판매자들이 서로 경쟁하여 견적을 제시합니다.\n- 유연한 이용 방식: 여러명이 모이면 좋고, 혼자서도 충분히 이용 가능한 공동구매 경매 플랫폼입니다.\n- 지역 기반 거래: 내 지역 판매자와 직접 거래를 지향합니다.\n- 최종 선택기회 제공: 낙찰 결과에 따라 구매확정/포기 선택, 판매자는 구매자 확정률에 따라 판매확정/포기 선택이 가능합니다."
  },
  
  // 👥 회원 가입 및 유형
  {
    question: "Q3. 일반회원과 판매회원의 차이는 무엇인가요?",
    answer: "- 🐦 일반회원: 공구에 참여하여 상품을 구매하는 회원\n  - 공구 등록 및 참여 가능\n  - 최저가 혜택 받기\n  - 카카오톡 간편가입 가능\n\n- 🦅 판매회원: 공구에 입찰하여 상품을 판매하는 회원\n  - 공구 입찰 참여\n  - 상품 판매 가능\n  - 사업자 정보 등록 필요"
  },
  {
    question: "Q4. 카카오톡으로 가입했는데 아이디/비밀번호가 없어요",
    answer: "카카오톡 간편가입 회원은 별도의 아이디/비밀번호가 없습니다. 로그인 시 \"카카오톡으로 로그인\" 버튼을 이용해주세요."
  },
  
  // 🛍️ 공구 진행 프로세스
  {
    question: "Q5. 공구는 어떤 순서로 진행되나요?",
    answer: "1. 공구 등록 → 구매자가 원하는 상품 공구 등록\n2. 모집 기간 → 구매 희망자들이 모임 (혼자서도 진행 가능)\n3. 입찰 진행 → 판매자들이 가격 제시 및 경쟁\n4. 낙찰자 선정 → 최저가 또는 최고 지원금을 입찰한 판매자 선정\n5. 구매 확정/포기 → 구매자가 12시간 내 최종 선택\n6. 판매 확정/포기 → 판매자가 6시간 내 최종 선택\n7. 거래 진행 → 연락처 공개 및 직거래 진행"
  },
  {
    question: "Q6. 구매확정/포기 선택 시간이 정해져 있나요?",
    answer: "- 구매자: 모집기간 종료 후(낙찰자 확정) 12시간 이내\n- 판매자: 공구 참여자의 구매 확정 선택 후 6시간 이내\n- 시간 내 미선택 시 자동으로 \"구매포기\" 또는 \"판매포기\"로 처리됩니다\n- 마이페이지의 공구 진행 상태와 알림 메시지를 꼭 확인해주세요!"
  },
  {
    question: "Q7. 혼자서도 공구를 진행할 수 있나요?",
    answer: "네, 가능합니다! 둥지마켓은 1명만 참여해도 공구가 진행됩니다.\n여러 명이 모이면 더 좋은 조건을 받을 수 있지만,\n혼자서도 판매자들의 경쟁 입찰을 통해 최저가 혜택을 받을 수 있어요."
  },
  {
    question: "Q8. 50% 규칙이 뭔가요?",
    answer: "구매자의 구매확정률이 50%이하 일 경우, 판매자가 판매를 포기해도 패널티가 없습니다. 이는 대량 구매 취소로부터 판매자를 보호하기 위한 제도입니다."
  },
  
  // 💳 거래 및 결제
  {
    question: "Q9. 결제는 어떻게 하나요?",
    answer: "둥지마켓은 중개 플랫폼으로, 직접 결제 기능은 제공하지 않습니다. 거래 확정 후 구매자와 판매자의 연락처가 공개되면 직접 만나서 거래하시면 됩니다."
  },
  {
    question: "Q10. 거래 시 주의사항이 있나요?",
    answer: "- 가급적 내 지역 판매자와의 직접 거래를 권장합니다.\n- 비대면 거래는 결제 진행이나 택배 관련 문제가 발생할 수 있습니다.\n- 거래 내역은 문자나 카톡으로 보관\n- 이상 발생 시 둥지마켓 고객센터 문의"
  },
  
  // 🎫 견적티켓 시스템
  {
    question: "Q11. 견적티켓은 무엇인가요?",
    answer: "판매회원이 공구에 입찰하기 위해 필요한 이용권입니다.\n- 개별 견적티켓: 건당 결제\n- 무제한 구독권: 월 정액제로 무제한 입찰"
  },
  
  // 🔐 계정 관리
  {
    question: "Q12. 아이디/비밀번호를 잊어버렸어요",
    answer: "- 카카오 회원: 카카오톡 로그인 이용\n- 일반 회원: 로그인 페이지 > \"아이디/비밀번호 찾기\" 이용\n- 가입 시 등록한 이메일 또는 휴대폰 번호로 찾기 가능"
  },
  
  // ⚠️ 문제 해결
  {
    question: "Q13. 구매자가 나타나지 않아요",
    answer: "1. 판매 확정 시간 확인\n2. 문자or통화 내역 자료 보관\n3. 마이페이지 거래중 카테고리→ 노쇼 신고하기 접수\n4. 관리자 검토 후 패널티 부과"
  },
  {
    question: "Q14. 판매자가 약속을 지키지 않아요",
    answer: "1. 거래 내역 증빙 자료 보관\n2. 마이페이지 거래중 카테고리→ 노쇼 신고하기 접수\n3. 관리자 검토 후 패널티 부과"
  },
  
  // 📞 고객 지원
  {
    question: "Q15. 고객센터 운영 시간은 어떻게 되나요?",
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
      <p className="text-gray-600 mb-8">둥지마켓 이용 방법과 자주 묻는 질문들을 모았습니다.</p>
      
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