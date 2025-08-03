'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "둥지마켓은 어떤 서비스인가요?",
    answer: "둥지마켓은 공동구매를 통해 더 나은 가격으로 상품을 구매할 수 있는 플랫폼입니다. 구매자들이 모여 대량 구매를 진행하고, 판매자들이 경쟁 입찰을 통해 최적의 가격을 제공합니다."
  },
  {
    question: "공구에 어떻게 참여하나요?",
    answer: "회원가입 후 원하는 공구를 찾아 '참여하기' 버튼을 클릭하면 됩니다. 공구 모집이 완료되면 판매자 입찰이 진행되고, 최종 선택된 판매자와 거래를 진행하게 됩니다."
  },
  {
    question: "판매자는 어떻게 입찰하나요?",
    answer: "판매회원으로 가입 후 사업자 인증을 완료하면 입찰이 가능합니다. 진행 중인 공구에서 입찰 버튼을 클릭하고 제공 가격과 조건을 입력하면 됩니다."
  },
  {
    question: "결제는 어떻게 진행되나요?",
    answer: "최종 선택된 판매자와 구매자가 직접 거래를 진행합니다. 둥지마켓은 안전한 거래를 위한 가이드라인을 제공하며, 문제 발생 시 분쟁 조정을 지원합니다."
  },
  {
    question: "환불이나 교환은 가능한가요?",
    answer: "상품의 환불 및 교환은 판매자의 정책에 따릅니다. 구매 전 판매자의 환불/교환 정책을 반드시 확인해주세요. 상품 하자나 오배송의 경우 판매자가 책임지고 처리합니다."
  },
  {
    question: "수수료는 얼마인가요?",
    answer: "구매자는 별도의 수수료가 없습니다. 판매자의 경우 거래 성사 시 일정 비율의 수수료가 부과됩니다. 자세한 내용은 판매자 가이드를 참고해주세요."
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
      
      <h1 className="text-3xl font-bold mb-8">자주 묻는 질문</h1>
      
      <Accordion type="single" collapsible className="w-full">
        {faqData.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">
              {item.question}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-gray-600">{item.answer}</p>
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
            <strong>이메일:</strong> support@dungjimarket.com
          </p>
          <p className="text-sm">
            <strong>전화:</strong> 1234-5678 (평일 10:00-18:00)
          </p>
        </div>
      </div>
    </div>
  );
}