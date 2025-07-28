'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/terms" className="text-emerald-600 hover:text-emerald-800">
          ← 약관 선택으로 돌아가기
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2 text-center">개인정보처리방침</h1>
      <p className="text-center text-gray-500 mb-8">시행일: 2025년 1월 28일</p>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">제1조 (개인정보의 처리 목적)</h2>
            <p className="mb-4">
              둥지마켓(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 
              이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>회원 가입 및 관리</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>회원가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증</li>
                  <li>회원자격 유지·관리, 서비스 부정이용 방지</li>
                  <li>각종 고지·통지, 고충처리</li>
                </ul>
              </li>
              <li>
                <strong>재화 또는 서비스 제공</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>공동구매 서비스 제공, 계약서·청약철회 등 의사표시 통지</li>
                  <li>물품배송, 구매 및 요금 결제, 요금추심</li>
                </ul>
              </li>
              <li>
                <strong>마케팅 및 광고에의 활용</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>신규 서비스 개발 및 맞춤 서비스 제공</li>
                  <li>이벤트 및 광고성 정보 제공 및 참여기회 제공(동의한 회원에 한함)</li>
                  <li>인구통계학적 특성에 따른 서비스 제공 및 광고 게재</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제2조 (개인정보의 처리 및 보유 기간)</h2>
            <p className="mb-4">
              회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>회원 가입 및 관리</strong>: 회원 탈퇴 시까지
                <ul className="list-disc pl-6 mt-1 text-sm text-gray-600">
                  <li>다만, 다음의 사유에 해당하는 경우에는 해당 사유 종료 시까지</li>
                  <li>관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우: 해당 수사·조사 종료 시까지</li>
                  <li>서비스 이용에 따른 채권·채무관계 잔존 시: 해당 채권·채무관계 정산 시까지</li>
                </ul>
              </li>
              <li>
                <strong>재화 또는 서비스 제공</strong>: 재화·서비스 공급완료 및 요금결제·정산 완료 시까지
                <ul className="list-disc pl-6 mt-1 text-sm text-gray-600">
                  <li>다만, 다음의 사유에 해당하는 경우에는 해당 기간 종료 시까지</li>
                  <li>「전자상거래 등에서의 소비자 보호에 관한 법률」에 따른 표시·광고, 계약내용 및 이행 등 거래에 관한 기록</li>
                  <li>- 표시·광고에 관한 기록: 6개월</li>
                  <li>- 계약 또는 청약철회, 대금결제, 재화 등의 공급기록: 5년</li>
                  <li>- 소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제3조 (처리하는 개인정보의 항목)</h2>
            <p className="mb-4">회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>일반회원 (구매자)</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>필수항목: 아이디, 비밀번호, 닉네임, 휴대전화번호, 주소(지역)</li>
                  <li>선택항목: 이메일, 프로필 이미지</li>
                  <li>자동수집항목: IP주소, 쿠키, 서비스 이용기록, 방문기록</li>
                </ul>
              </li>
              <li>
                <strong>판매회원 (사업자)</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>필수항목: 아이디, 비밀번호, 사업자명, 사업자등록번호, 사업장 주소, 대표자명, 휴대전화번호</li>
                  <li>선택항목: 이메일, 사업자등록증 사본, 통신판매업 신고번호</li>
                  <li>자동수집항목: IP주소, 쿠키, 서비스 이용기록, 방문기록</li>
                </ul>
              </li>
              <li>
                <strong>소셜 로그인 이용 시</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>카카오: 카카오 계정(이메일), 프로필 정보(닉네임, 프로필 사진)</li>
                  <li>구글: 구글 계정(이메일), 프로필 정보(이름, 프로필 사진)</li>
                </ul>
              </li>
              <li>
                <strong>휴대폰 인증 시 (선택)</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>이름, 생년월일, 성별</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제4조 (개인정보의 제3자 제공)</h2>
            <p className="mb-4">
              회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 
              정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
            </p>
            <p className="mb-4">회사는 다음과 같이 개인정보를 제3자에게 제공하고 있습니다.</p>
            <div className="border rounded p-4 bg-gray-50">
              <ul className="space-y-2">
                <li><strong>제공받는 자:</strong> 공동구매 낙찰 판매자</li>
                <li><strong>제공 목적:</strong> 상품 배송, 고객 상담</li>
                <li><strong>제공 항목:</strong> 구매자명(닉네임), 연락처, 배송지 주소</li>
                <li><strong>보유 기간:</strong> 거래 종료 후 6개월</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제5조 (개인정보처리의 위탁)</h2>
            <p className="mb-4">회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
            <div className="space-y-4">
              <div className="border rounded p-4 bg-gray-50">
                <h3 className="font-semibold mb-2">1. SMS 발송</h3>
                <ul className="space-y-1 text-sm">
                  <li><strong>수탁업체:</strong> 알리고, Twilio, AWS SNS</li>
                  <li><strong>위탁업무:</strong> SMS 인증번호 발송, 서비스 알림 발송</li>
                  <li><strong>보유기간:</strong> 회원 탈퇴 시 또는 위탁계약 종료 시까지</li>
                </ul>
              </div>
              <div className="border rounded p-4 bg-gray-50">
                <h3 className="font-semibold mb-2">2. 클라우드 서비스</h3>
                <ul className="space-y-1 text-sm">
                  <li><strong>수탁업체:</strong> Amazon Web Services (AWS)</li>
                  <li><strong>위탁업무:</strong> 데이터 보관 및 처리</li>
                  <li><strong>보유기간:</strong> 회원 탈퇴 시 또는 위탁계약 종료 시까지</li>
                </ul>
              </div>
              <div className="border rounded p-4 bg-gray-50">
                <h3 className="font-semibold mb-2">3. 본인인증</h3>
                <ul className="space-y-1 text-sm">
                  <li><strong>수탁업체:</strong> 카카오, 구글</li>
                  <li><strong>위탁업무:</strong> 소셜 로그인 본인인증</li>
                  <li><strong>보유기간:</strong> 회원 탈퇴 시까지</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제6조 (개인정보의 파기)</h2>
            <p className="mb-4">
              회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>파기절차</strong>
                <p className="mt-1">불필요한 개인정보는 개인정보 보호책임자의 승인을 받아 파기합니다.</p>
              </li>
              <li>
                <strong>파기방법</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>전자적 파일 형태의 정보: 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
                  <li>종이에 출력된 개인정보: 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제7조 (정보주체와 법정대리인의 권리·의무 및 행사방법)</h2>
            <p className="mb-4">정보주체는 회사에 대해 언제든지 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>개인정보 열람요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제요구</li>
              <li>처리정지 요구</li>
            </ol>
            <p className="mt-4">
              권리 행사는 서면, 전자우편, 모사전송(FAX) 등을 통하여 할 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제8조 (개인정보의 안전성 확보조치)</h2>
            <p className="mb-4">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>관리적 조치</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>내부관리계획 수립·시행</li>
                  <li>정기적 직원 교육</li>
                </ul>
              </li>
              <li>
                <strong>기술적 조치</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>개인정보처리시스템 등의 접근권한 관리</li>
                  <li>접근통제시스템 설치</li>
                  <li>고유식별정보 등의 암호화</li>
                  <li>보안프로그램 설치</li>
                </ul>
              </li>
              <li>
                <strong>물리적 조치</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>전산실, 자료보관실 등의 접근통제</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제9조 (개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항)</h2>
            <p className="mb-4">
              회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>쿠키의 사용 목적</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>회원 로그인 유지</li>
                  <li>이용자의 사용 패턴 분석</li>
                  <li>개인 맞춤 서비스 제공</li>
                </ul>
              </li>
              <li>
                <strong>쿠키의 설치·운영 및 거부</strong>
                <p className="mt-1">
                  웹브라우저 상단의 도구 → 인터넷 옵션 → 개인정보 메뉴의 옵션 설정을 통해 쿠키 저장을 거부할 수 있습니다.
                  단, 쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수 있습니다.
                </p>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제10조 (개인정보 보호책임자)</h2>
            <p className="mb-4">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 
              피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div className="border rounded p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">개인정보 보호책임자</h3>
              <ul className="space-y-1">
                <li>성명: 홍길동</li>
                <li>직책: 개인정보보호팀장</li>
                <li>이메일: privacy@dungjimarket.com</li>
                <li>전화번호: 02-1234-5678</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제11조 (권익침해 구제방법)</h2>
            <p className="mb-4">
              정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 
              분쟁해결이나 상담 등을 신청할 수 있습니다.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)</li>
              <li>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
              <li>대검찰청: (국번없이) 1301 (www.spo.go.kr)</li>
              <li>경찰청: (국번없이) 182 (ecrm.cyber.go.kr)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제12조 (개인정보 처리방침 변경)</h2>
            <p className="mb-4">
              이 개인정보처리방침은 2025년 1월 28일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 
              변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}