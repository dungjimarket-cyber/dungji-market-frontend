'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SellerTermsPage() {
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

      <h1 className="text-3xl font-bold mb-2 text-center">둥지마켓 판매회원 전용 약관</h1>
      <p className="text-center text-gray-500 mb-8">판매 회원용</p>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-500 italic mb-4">
              ※ 이 약관은 둥지마켓의 사업자회원(이하 "판매회원")에게만 적용됩니다. 일반회원 이용약관과는 별도로 운영됩니다.
            </p>
            
            <h2 className="text-xl font-semibold mb-3">제1조 (목적)</h2>
            <p className="mb-4">
              이 약관은 둥지마켓(이하 "회사")이 제공하는 공동구매 중개 플랫폼 서비스(이하 "서비스") 내에서 판매회원의 활동, 
              권리·의무 및 이용조건 등을 정함을 목적으로 합니다.
            </p>

            <h2 className="text-xl font-semibold mb-3">제2조 (판매회원 자격 및 가입 절차)</h2>
            <p className="mb-2">
              판매회원은 유효한 사업자등록번호를 보유한 개인사업자 또는 법인사업자에 한해 가입할 수 있습니다.
            </p>
            <p className="mb-4">
              가입을 위해 다음 정보를 제출하여야 하며, 회사의 심사 후 승인된 경우에 한해 활동이 가능합니다.
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>사업자등록증</li>
              <li>대표자 정보 및 연락처</li>
              <li>사업장 주소</li>
              <li>제품/서비스 제공 가능 지역</li>
              <li>기타 회사가 요청하는 서류</li>
            </ul>

            <h2 className="text-xl font-semibold mb-3">제3조 (플랫폼 이용 및 입찰 참여 방식)</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                회사는 판매회원에게 공동구매 입찰 참여 기회를 제공하며, 판매회원은 입찰 방식에 따라 자유롭게 참여할 수 있습니다.
              </li>
              <li>
                회사는 플랫폼의 기술적 중개 역할만 수행하며, 판매회원은 최종 판매책임을 전적으로 부담합니다.
              </li>
              <li>
                판매회원은 회사의 공구 등록, 입찰, 낙찰 시스템에 따라 공정하고 신의성실한 거래를 수행해야 합니다.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mb-3">제4조 (입찰권 제도)</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                판매회원은 공구에 입찰을 진행하기 위해 "입찰권"을 사용해야 하며, 1개의 입찰 당 1매의 입찰권이 차감됩니다.
              </li>
              <li>
                신규 가입 시 판매회원에게는 프로모션으로 무료 입찰권 5매가 제공됩니다.
              </li>
              <li>
                입찰권은 유료로 추가 구매할 수 있으며, 사용한 입찰권은 반환되지 않습니다.
              </li>
              <li>
                입찰 후 낙찰이 되지 않더라도 입찰권은 환불되지 않습니다.
              </li>
              <li>
                시스템 오류 또는 사전 고지된 유지보수 등의 이유로 입찰이 정상 처리되지 않은 경우, 회사는 입찰권을 복구 또는 재지급할 수 있습니다.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mb-3">제5조 (낙찰 및 판매 확정 의무)</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                입찰이 낙찰된 판매회원은 플랫폼 상 "판매 확정" 절차를 완료해야 하며, 이후 해당 공구 참여 고객에게 제품/서비스를 제공해야 합니다.
              </li>
              <li>
                낙찰 후 판매를 포기할 경우, 아래의 패널티 정책이 적용됩니다 (패널티 세부 사항은 별도 동의서 참조).
              </li>
              <li>
                낙찰 시 제공된 고객 정보는 판매 목적 외에 사용할 수 없으며, 외부 유출 시 민형사상의 책임을 부담합니다.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mb-3">제6조 (이용 제한 및 자격 정지)</h2>
            <p className="mb-2">
              회사는 아래의 사유가 발생할 경우 판매회원의 입찰 권한을 일시 정지하거나, 판매회원 자격을 박탈할 수 있습니다.
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>낙찰 확정 후 판매 거부</li>
              <li>반복적인 입찰 취소 또는 허위 입찰</li>
              <li>어뷰징 또는 플랫폼 질서 위반 행위</li>
              <li>고객정보 오·남용, 비공식 거래 유도</li>
              <li>기타 회사 정책 위반 행위</li>
            </ul>

            <h2 className="text-xl font-semibold mb-3">제7조 (기타)</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                회사는 중개자로서의 역할을 수행하며, 판매회원과 구매회원 간의 거래에서 발생하는 문제는 직접 관여하지 않습니다.
              </li>
              <li>
                판매회원은 본 약관 외에도 회사가 운영하는 가이드, 공지사항, 정책 등에 따라 성실히 이행할 의무가 있습니다.
              </li>
              <li>
                회사는 본 약관을 개정할 수 있으며, 사전 고지를 통해 동의를 구합니다.
              </li>
            </ul>

            <div className="border-t pt-4 mt-6">
              <h3 className="font-semibold mb-2">부칙</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  본 약관은 2025년 7월 15일부터 시행됩니다.
                </li>
                <li>
                  기존 판매회원은 본 약관 시행일 이후에도 서비스를 계속 이용할 경우 개정 약관에 동의한 것으로 간주합니다.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
