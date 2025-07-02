'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function GeneralTermsPage() {
  const [agreed, setAgreed] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });

  const handleCheckboxChange = (field: keyof typeof agreed) => {
    setAgreed((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/terms" className="text-emerald-600 hover:text-emerald-800">
          ← 약관 선택으로 돌아가기
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2 text-center">둥지마켓 회원가입 약관</h1>
      <p className="text-center text-gray-500 mb-8">일반 회원용</p>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-500 italic mb-4">
              ※ 본 약관은 예시이며, 정식 운영 시 법률 자문을 거치는 것이 권장됩니다.
            </p>
            
            <h2 className="text-xl font-semibold mb-3">제1조 (목적)</h2>
            <p className="mb-4">
              이 약관은 둥지마켓(이하 "회사")이 운영하는 플랫폼 서비스(웹 및 모바일 포함, 이하 "서비스")의 이용과 관련하여 
              회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>

            <h2 className="text-xl font-semibold mb-3">제2조 (용어의 정의)</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                "회원"이란 본 약관에 동의하고 회사가 제공하는 서비스에 가입한 자로, 일반회원(구매자) 및 판매회원(입점 사업자)을 포함합니다.
              </li>
              <li>
                "서비스"란 회사가 운영하는 플랫폼에서 공동구매, 입찰, 중개 등의 기능을 통해 제품 또는 서비스를 거래할 수 있도록 제공하는 
                온라인 기반의 중개 시스템을 의미합니다.
              </li>
              <li>
                "공구"란 회원이 제품 또는 서비스를 공동으로 구매하고자 개설하거나 참여하는 공동구매 활동을 말합니다.
              </li>
              <li>
                "입찰"이란 판매회원이 공구에 가격 제안을 하는 행위를 의미합니다.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mb-3">제3조 (약관의 게시 및 개정)</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기화면 또는 연결화면에 게시합니다.
              </li>
              <li>
                회사는 필요한 경우 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」 등 관련 법령을 
                위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
              </li>
              <li>
                개정 약관은 적용일자와 개정 사유를 명시하여 현행 약관과 함께 서비스 화면에 최소 7일 이전부터 적용일자까지 공지합니다.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mb-3">제4조 (회원가입)</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                이용자는 회사가 정한 가입 양식에 따라 정보를 기입한 후 본 약관에 동의함으로써 회원가입을 신청합니다.
              </li>
              <li>
                회사는 신청자에게 회원가입을 승인함으로써 회원 자격이 부여됩니다.
              </li>
              <li>
                회사는 다음 각 호의 경우 회원가입을 거절하거나, 사후에 자격을 제한 또는 박탈할 수 있습니다.
                <ul className="list-disc pl-6 mt-2">
                  <li>실명이 아닌 명의로 가입한 경우</li>
                  <li>허위 정보를 제공한 경우</li>
                  <li>타인의 명의를 도용한 경우</li>
                  <li>기타 사회질서 및 서비스 운영을 현저히 해할 우려가 있는 경우</li>
                </ul>
              </li>
            </ul>

            <h2 className="text-xl font-semibold mb-3">제5조 (서비스의 제공 및 중개책임의 제한)</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                회사는 회원 간 제품 또는 서비스 거래를 위한 온라인 중개 플랫폼만을 제공하며, 거래 당사자는 판매회원과 일반회원입니다.
              </li>
              <li>
                회사는 거래의 성사, 상품의 품질, 하자, 교환/환불, 배송, 계약이행 등과 관련하여 어떠한 책임도 부담하지 않습니다.
              </li>
              <li>
                회사는 플랫폼 운영자로서 거래의 안전성을 위하여 관련 정보를 제공하고 모니터링 및 제재 조치를 시행할 수 있습니다.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mb-3">제6조 (회원의 의무)</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                회원은 관련 법령 및 본 약관의 규정, 서비스 이용 안내, 회사가 공지하는 사항 등을 준수하여야 하며, 
                기타 회사 업무에 방해되는 행위를 하여서는 안됩니다.
              </li>
              <li>
                회원은 자신의 계정 정보(아이디, 비밀번호 등)를 철저히 관리해야 하며, 이를 타인에게 제공하거나 공유해서는 안 됩니다.
              </li>
              <li>
                회원은 서비스 이용 과정에서 알게 된 타 회원의 정보 및 거래 관련 사항을 무단으로 활용하거나 외부에 공개해서는 안 됩니다.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mb-3">제7조 (회원 탈퇴 및 자격 상실)</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                회원은 언제든지 고객센터 또는 마이페이지를 통해 탈퇴를 요청할 수 있으며, 회사는 즉시 처리합니다.
              </li>
              <li>
                다음 각 호의 경우 회사는 사전 통보 후 회원 자격을 제한 또는 박탈할 수 있습니다.
                <ul className="list-disc pl-6 mt-2">
                  <li>허위 내용으로 가입한 경우</li>
                  <li>서비스 운영을 방해하거나 다른 회원에게 피해를 끼친 경우</li>
                  <li>반복적인 공구 참여 철회, 낙찰 후 포기 등 서비스 질서 훼손</li>
                  <li>기타 회사의 합리적 판단에 따라 서비스 제공이 부적절하다고 판단되는 경우</li>
                </ul>
              </li>
            </ul>

            <h2 className="text-xl font-semibold mb-3">제8조 (개인정보 보호)</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                회사는 회원의 개인정보를 보호하며, 「개인정보 보호법」 및 관련 법령에 따라 수집, 저장, 이용, 파기 등의 처리를 진행합니다.
              </li>
              <li>
                회원은 언제든지 자신의 개인정보에 대해 열람, 수정, 삭제를 요청할 수 있습니다.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mb-3">제9조 (기타 조항)</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                본 약관에 명시되지 않은 사항은 관련 법령 및 회사의 개별 정책에 따릅니다.
              </li>
              <li>
                회사와 회원 간 분쟁 발생 시 관할 법원은 회사의 본사 소재지를 관할하는 법원으로 합니다.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
