'use client';

import Link from 'next/link';

export default function SellerTermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/terms" className="text-emerald-600 hover:text-emerald-800">
          ← 약관 선택으로 돌아가기
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-center">둥지마켓 판매회원 약관</h1>

      {/* 판매회원 전용 약관 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="bg-purple-600 text-white p-4">
          <h2 className="text-xl font-semibold">📄 [둥지마켓] 판매회원 전용 약관 (필수)</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded mb-4">
            ※ 이 약관은 둥지마켓의 사업자회원(이하 "판매회원")에게만 적용됩니다. 일반회원 이용약관과는 별도로 운영됩니다.
          </p>
          
          <h2 className="text-xl font-semibold mb-3">제1조 (목적)</h2>
          <p className="mb-4">
            이 약관은 둥지마켓(이하 "회사")이 제공하는 공동구매 중개 플랫폼 서비스(이하 "서비스") 내에서 판매회원의 활동, 권리·의무 및 이용조건 등을 정함을 목적으로 합니다.
          </p>

          <h2 className="text-xl font-semibold mb-3">제2조 (판매회원 자격 및 가입 절차)</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>판매회원은 유효한 사업자등록번호를 보유한 개인사업자 또는 법인사업자에 한해 가입할 수 있습니다.</li>
            <li>가입을 위해 다음 정보를 제출하여야 하며, 회사의 심사 후 승인된 경우에 한해 활동이 가능합니다.
              <ul className="list-disc pl-6 mt-2">
                <li>사업자등록증</li>
                <li>대표자 정보 및 연락처</li>
                <li>사업장 주소</li>
                <li>제품/서비스 제공 가능 지역</li>
                <li>기타 회사가 요청하는 서류</li>
              </ul>
            </li>
          </ul>

          <h2 className="text-xl font-semibold mb-3">제3조 (플랫폼 이용 및 견적제안 참여 방식)</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>회사는 판매회원에게 공동구매 견적 제안 참여 기회를 제공하며, 판매회원은 제안 방식에 따라 자유롭게 참여할 수 있습니다.</li>
            <li>회사는 플랫폼의 기술적 중개 역할만 수행하며, 판매회원은 최종 판매책임을 전적으로 부담합니다.</li>
            <li>판매회원은 회사의 공구 등록, 견적제안, 최종선정 시스템에 따라 공정하고 신의성실한 거래를 수행해야 합니다.</li>
          </ul>

          <h2 className="text-xl font-semibold mb-3">제4조 (견적티켓 제도)</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>판매회원은 공구에 견적제안을 진행하기 위해 "견적티켓"을 사용해야 하며, 1개의 제안 당 1매의 견적티켓이 차감됩니다.</li>
            <li>견적티켓은 유료로 구매할 수 있으며, 사용한 티켓은 반환되지 않습니다.</li>
            <li>견적제안 후 최종선정이 되지 않더라도 티켓은 환불되지 않습니다.</li>
            <li>시스템 오류 또는 사전 고지된 유지보수 등의 이유로 견적제안이 정상 처리되지 않은 경우, 회사는 견적티켓을 복구 또는 재지급할 수 있습니다.</li>
          </ul>

          <h2 className="text-xl font-semibold mb-3">제5조 (최종선정 및 판매 확정 의무)</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>공구에 최종선정된 판매회원은 플랫폼 상 "판매 확정" 절차를 완료해야 하며, 이후 해당 공구 참여 고객에게 제품/서비스를 제공해야 합니다.</li>
            <li>최종선정 후 판매를 포기할 경우, 아래의 패널티 정책이 적용됩니다 (패널티 세부 사항은 별도 동의서 참조).</li>
            <li>최종선정 시 제공된 고객 정보는 판매 목적 외에 사용할 수 없으며, 외부 유출 시 민형사상의 책임을 부담합니다.</li>
          </ul>

          <h2 className="text-xl font-semibold mb-3">제6조 (이용 제한 및 자격 정지)</h2>
          <p className="mb-2">회사는 아래의 사유가 발생할 경우 판매회원의 견적제안 권한을 일시 정지하거나, 판매회원 자격을 박탈할 수 있습니다.</p>
          
          <h3 className="text-lg font-semibold mb-2 mt-4">1. 자격 요건 관련</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>사업자등록 상태 이상 발생 (휴업, 폐업, 말소 등)</li>
            <li>정기 검증 시 사업자 정보 불일치 또는 허위 확인</li>
            <li>사업자 자격 검증 요청에 대한 미협조 또는 거부</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2 mt-4">2. 서비스 이용 관련</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>판매 확정 후 판매 거부</li>
            <li>반복적인 견적철회 기능 사용 또는 허위 금액 입력</li>
            <li>어뷰징 또는 플랫폼 질서 위반 행위</li>
            <li>고객정보 오·남용, 비공식 거래 유도</li>
            <li>기타 회사 정책 위반 행위</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2 mt-4">3. 정기 검증 절차</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>회사는 6개월 주기로 판매회원의 사업자등록 상태를 자동 검증할 수 있습니다.</li>
            <li>검증 결과 이상이 발견될 경우, 회원에게 7일간의 소명 기회를 부여합니다.</li>
            <li>소명 기간 내 정상화되지 않을 경우, 판매회원 자격이 자동 정지됩니다.</li>
            <li>정지된 계정은 사업자 상태 정상화 후 재활성화 신청이 가능합니다.</li>
          </ul>

          <h2 className="text-xl font-semibold mb-3">제7조 (개인정보의 수집 및 이용)</h2>
          <p className="mb-2">회사는 판매회원의 개인정보를 「개인정보 보호법」 및 관련 법령에 따라 적법하게 수집·이용하며, 다음과 같은 항목을 목적 범위 내에서 수집할 수 있습니다.</p>
          
          <h3 className="text-lg font-semibold mb-2 mt-4">수집 항목 및 목적</h3>
          <p className="mb-2">회사는 판매회원 가입, 본인 확인, 서비스 이용, 정산 및 고객 응대를 위해 아래와 같은 정보를 수집·이용할 수 있습니다.</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>필수 수집 항목:</strong> 이름, 생년월일, 성별, 휴대폰번호, 이메일, 사업자등록번호, 사업장 주소, 대표자명</li>
            <li><strong>선택 수집 항목:</strong> 사업자등록증 사본, 비대면 판매 가능 여부, 택배거래 기록 등</li>
            <li><strong>수집 목적:</strong> 본인확인, 사업자 인증, 입찰 자격 부여, 낙찰 및 정산 안내, 고객 민원 대응, 법령상 고지</li>
          </ul>
          
          <h3 className="text-lg font-semibold mb-2 mt-4">보관 및 이용기간</h3>
          <p className="mb-4">회사는 판매회원 탈퇴 시까지 개인정보를 보관하며, 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관련 법령에 따라 일정 기간 동안 보관이 필요한 정보는 해당 기간 동안 보관합니다.</p>
          
          <h3 className="text-lg font-semibold mb-2 mt-4">개인정보 처리방침 연계</h3>
          <p className="mb-4">기타 개인정보 처리에 관한 상세한 내용은 회사의 "개인정보처리방침"을 따릅니다.</p>

          <h2 className="text-xl font-semibold mb-3">제8조 (기타)</h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>회사는 중개자로서의 역할을 수행하며, 판매회원과 구매회원 간의 거래에서 발생하는 문제는 직접 관여하지 않습니다.</li>
            <li>판매회원은 본 약관 외에도 회사가 운영하는 가이드, 공지사항, 정책 등에 따라 성실히 이행할 의무가 있습니다.</li>
            <li>회사는 본 약관을 개정할 수 있으며, 사전 고지를 통해 동의를 구합니다.</li>
          </ul>

          <div className="border-t pt-4 mt-6">
            <h3 className="font-semibold mb-2">부칙</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>본 약관은 2025년 7월 15일부터 시행됩니다.</li>
              <li>기존 판매회원은 본 약관 시행일 이후에도 서비스를 계속 이용할 경우 개정 약관에 동의한 것으로 간주합니다.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 판매회원 개인정보 수집 및 이용 동의서 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="bg-indigo-600 text-white p-4">
          <h2 className="text-xl font-semibold">📄 [둥지마켓] 판매회원 개인정보 수집 및 이용 동의서 (필수)</h2>
        </div>
        <div className="p-6">
          <p className="mb-4">둥지마켓(이하 "회사")는 판매회원의 입점 및 거래 관련 서비스 제공을 위해 다음과 같이 개인정보를 수집·이용합니다.</p>
          
          <h3 className="text-lg font-semibold mb-3">1. 수집 항목</h3>
          <div className="mb-4 space-y-2">
            <p><strong>필수 항목:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>이름, 생년월일, 성별</li>
              <li>휴대폰 번호, 이메일</li>
              <li>닉네임 또는 상호명</li>
              <li>사업자등록번호, 사업장 주소</li>
              <li>로그인 비밀번호</li>
            </ul>
            <p className="mt-2"><strong>선택 항목:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>사업자등록증 사본</li>
              <li>전국 비대면 거래 인증 여부</li>
              <li>택배 기록, 브랜드 로고 등</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold mb-3">2. 수집 및 이용 목적</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>판매회원 자격 확인 및 입점 심사</li>
            <li>공동구매 입찰 참여 및 낙찰 결과 안내</li>
            <li>고객 응대 및 민원 처리</li>
            <li>세금계산서 발행 등 정산 업무</li>
            <li>비대면 판매 인증 절차</li>
            <li>서비스 운영 관련 공지사항 전달 및 불법 행위 방지</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3">3. 보유 및 이용 기간</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>판매회원 탈퇴 시 또는 수집 목적 달성 시까지 보관</li>
            <li>단, 관련 법령에 따라 일정 기간 동안 보존해야 하는 정보는 해당 법령 기준에 따라 보관
              <ul className="list-disc pl-6 mt-2">
                <li>예: 「전자상거래 등에서의 소비자 보호에 관한 법률」에 따른 보존(최대 5년)</li>
              </ul>
            </li>
          </ul>

          <h3 className="text-lg font-semibold mb-3">4. 동의를 거부할 권리 및 불이익 고지</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>귀하는 위 개인정보 수집 및 이용에 동의하지 않을 수 있습니다.</li>
            <li>단, 필수 항목에 대한 동의가 없을 경우 판매회원 가입 및 서비스 이용이 제한될 수 있습니다.</li>
          </ul>

          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm font-medium">✅ 위 내용을 충분히 이해하였으며, 개인정보 수집 및 이용에 동의합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}