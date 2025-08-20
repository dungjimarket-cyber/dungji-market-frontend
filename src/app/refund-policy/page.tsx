import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '환불정책 | 둥지마켓',
  description: '둥지마켓 견적티켓 및 구독권 환불정책'
};

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">둥지마켓 견적티켓/구독권 환불 정책</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
        <p className="text-sm font-medium">📅 시행일: 2025년 9월 1일</p>
      </div>

      <div className="space-y-8">
        {/* 제1조 목적 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">제1조 (목적)</h2>
          <p className="text-gray-700">
            본 환불 정책은 둥지마켓(이하 "회사")이 제공하는 견적티켓 및 구독권 서비스의 청약철회, 
            환불 기준과 절차를 명확히 하여 회원의 권익을 보호하고 분쟁을 예방하는 것을 목적으로 합니다.
          </p>
        </section>

        {/* 제2조 적용 법령 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">제2조 (적용 법령)</h2>
          <p className="text-gray-700">
            본 환불 정책은 「전자상거래 등에서의 소비자보호에 관한 법률」 및 「콘텐츠산업진흥법」 등 
            관련 법령에 따라 수립되었습니다.
          </p>
        </section>

        {/* 제3조 견적티켓 환불 정책 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">제3조 (견적티켓 환불 정책)</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">3.1 일반 견적티켓 (단건 구매)</h3>
              
              <h4 className="font-medium mb-2">환불 가능 조건</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left">구분</th>
                      <th className="border border-gray-200 px-4 py-2 text-center">환불 가능 여부</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">환불 금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">구매 후 7일 이내 + 미사용</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">✅ 가능</td>
                      <td className="border border-gray-200 px-4 py-2">100% 전액 환불</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2">구매 후 7일 경과 + 미사용</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">✅ 가능</td>
                      <td className="border border-gray-200 px-4 py-2">90% 환불 (10% 수수료 공제)</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">구매 후 30일 경과 + 미사용</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">❌ 불가</td>
                      <td className="border border-gray-200 px-4 py-2">환불 불가</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2">견적 참여 후 (사용)</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">❌ 불가</td>
                      <td className="border border-gray-200 px-4 py-2">환불 불가</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h4 className="font-medium mt-4 mb-2">견적티켓 사용 기준</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>공구 견적에 1회라도 참여한 경우 "사용"으로 간주</li>
                <li>견적 후 취소하더라도 이미 사용한 것으로 처리</li>
                <li>견적 실패로 반환된 견적티켓은 미사용으로 처리</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">3.2 견적티켓 패키지 (묶음 상품)</h3>
              
              <h4 className="font-medium mb-2">환불 정책</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>전체 미사용</strong>: 일반 견적티켓과 동일한 정책 적용</li>
                <li><strong>부분 사용</strong>: 사용하지 않은 견적티켓에 한해 부분 환불
                  <div className="mt-1 ml-6 text-sm">
                    계산식: (전체 구매금액 ÷ 총 견적티켓 수) × 미사용 견적티켓 수 × 환불률
                  </div>
                </li>
              </ul>

              <h4 className="font-medium mt-4 mb-2">예시</h4>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                10개 패키지 10,000원 구매 → 3개 사용 후 환불 신청<br/>
                - 미사용: 7개<br/>
                - 환불액: (10,000원 ÷ 10개) × 7개 × 90% = 6,300원
              </div>
            </div>
          </div>
        </section>

        {/* 제4조 구독권 환불 정책 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">제4조 (구독권 환불 정책)</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">4.1 구독권 환불 기준</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left">구분</th>
                      <th className="border border-gray-200 px-4 py-2 text-center">환불 가능 여부</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">환불 금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">결제 후 7일 이내 + 미사용</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">✅ 가능</td>
                      <td className="border border-gray-200 px-4 py-2">100% 전액 환불</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2">결제 후 7일 이내 + 1회 이상 사용</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">✅ 가능</td>
                      <td className="border border-gray-200 px-4 py-2">일할 계산 후 부분 환불</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">결제 후 7일 경과 OR 다수 사용</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">❌ 불가</td>
                      <td className="border border-gray-200 px-4 py-2">환불 불가</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">4.2 환불 불가 조건</h3>
              <p className="text-gray-700 mb-3">다음의 경우 환불이 불가합니다:</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">구매 후 7일 경과</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>구독권 구매일로부터 7일이 경과한 경우</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">이용약관 위반</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>회원이 이용약관을 위반하여 서비스 이용이 제한된 경우</li>
                    <li>부정한 방법으로 서비스를 이용한 경우</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">혜택 악용</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>환불을 목적으로 반복적으로 구매/환불을 시도하는 경우</li>
                    <li>프로모션 혜택을 받은 후 즉시 환불을 요청하는 경우</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">4.3 구독 기간 만료</h3>
              
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>구독권은 구매한 기간(30일) 만료 시 자동으로 종료됩니다</li>
                <li>재구매를 원하시는 경우 새로 구매하셔야 합니다</li>
                <li>별도의 해지 절차는 필요하지 않습니다</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 제5조 환불 불가 사항 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">제5조 (환불 불가 사항)</h2>
          
          <h3 className="text-xl font-medium mb-3">다음의 경우 환불이 제한됩니다:</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. 견적티켓</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>견적에 1회 이상 참여한 경우</li>
                <li>구매 후 30일 경과</li>
                <li>이벤트/프로모션으로 무료 지급된 견적티켓</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. 구독권</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>정기결제 갱신 후 24시간 경과</li>
                <li>해당 결제 기간 중 견적 참여 이력이 있는 경우</li>
                <li>부정한 방법으로 취득한 구독권</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. 공통</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>회원의 귀책사유로 서비스 이용이 제한된 경우</li>
                <li>환불 정책을 악용한 반복적 구매/환불 패턴</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 제6조 환불 절차 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">제6조 (환불 절차)</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">6.1 환불 신청 방법</h3>
              
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>
                  <strong>온라인 신청</strong> (권장)
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>마이페이지 &gt; 결제내역 &gt; 환불신청</li>
                    <li>24시간 접수 가능</li>
                  </ul>
                </li>
                <li>
                  <strong>고객센터 신청</strong>
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>평일 09:00~18:00</li>
                    <li>전화: 070-4507-4492</li>
                    <li>이메일: dungjimarket@gmail.com</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">6.2 환불 처리 기간</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left">결제 수단</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">처리 기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">신용카드</td>
                      <td className="border border-gray-200 px-4 py-2">3~5 영업일 (카드사 취소)</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2">계좌이체</td>
                      <td className="border border-gray-200 px-4 py-2">3 영업일 이내</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">간편결제</td>
                      <td className="border border-gray-200 px-4 py-2">3~5 영업일</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2">휴대폰 결제</td>
                      <td className="border border-gray-200 px-4 py-2">익월 통신요금 차감</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">6.3 필요 정보</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>주문번호 또는 결제번호</li>
                <li>환불 사유</li>
                <li>본인 확인 정보</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 제7조 특별 환불 정책 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">제7조 (특별 환불 정책)</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">7.1 회사 귀책사유</h3>
              <p className="text-gray-700 mb-2">다음의 경우 사용 여부와 관계없이 전액 환불:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>시스템 오류로 인한 서비스 이용 불가</li>
                <li>상품 설명과 실제 서비스의 현저한 차이</li>
                <li>회사의 서비스 중단 또는 종료</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">7.2 예외적 환불 케이스</h3>
              
              <h4 className="font-medium mb-2">특별 환불 가능 상황 (구독권)</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>결제 오류로 인한 중복 결제</li>
                <li>미성년자의 법정대리인 동의 없는 결제</li>
                <li>서비스 전면 장애로 3일 이상 이용 불가 시</li>
              </ul>

              <h4 className="font-medium mt-4 mb-2">쿨링오프 제도 (견적티켓만 해당)</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>충동구매 방지를 위한 24시간 쿨링오프 적용</li>
                <li>최초 구매 회원에 한해 1회 적용</li>
                <li>구매 후 24시간 이내 전액 환불 (사용 여부 무관)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 제8조 환불 제한 및 제재 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">제8조 (환불 제한 및 제재)</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">8.1 환불 남용 방지</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>3개월 내 3회 이상 환불: 추가 환불 제한</li>
                <li>패턴 분석을 통한 악용 사례 모니터링</li>
                <li>환불 남용 시 서비스 이용 제한 가능</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">8.2 부정 이용 제재</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>타인 명의 결제 후 환불 시도</li>
                <li>해킹, 도용 카드 사용</li>
                <li>즉시 이용 정지 및 법적 조치</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 제9조 분쟁 해결 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">제9조 (분쟁 해결)</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">9.1 1차 처리</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>고객센터를 통한 상담 및 조정</li>
                <li>처리 기한: 접수일로부터 7일 이내</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">9.2 2차 처리</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>소비자분쟁조정위원회 조정 신청</li>
                <li>한국소비자원 피해구제 신청</li>
                <li>전자거래분쟁조정위원회 조정</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 제10조 정책 변경 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">제10조 (정책 변경)</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">10.1 변경 고지</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>변경 30일 전 홈페이지 공지</li>
                <li>중요 변경사항은 개별 통지 (이메일/SMS)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">10.2 변경 적용</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>기존 회원: 변경 전 정책 선택 가능 (유예기간 30일)</li>
                <li>신규 회원: 즉시 적용</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 부칙 */}
        <section className="border-t pt-6">
          <h2 className="text-2xl font-semibold mb-4">부칙</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">제1조 (시행일)</h3>
              <p className="text-gray-700">본 환불 정책은 2025년 9월 1일부터 시행합니다.</p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">제2조 (경과 조치)</h3>
              <p className="text-gray-700">시행일 이전 구매 건은 구매 당시의 환불 정책을 적용합니다.</p>
            </div>
          </div>
        </section>

        {/* 문의처 */}
        <section className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">문의처</h2>
          
          <div className="space-y-2">
            <p className="font-medium">둥지마켓 고객센터</p>
            <ul className="text-gray-700 space-y-1">
              <li>• 전화: <a href="tel:070-4507-4492" className="text-blue-600 hover:underline">070-4507-4492</a> (평일 09:00~18:00)</li>
              <li>• 이메일: <a href="mailto:dungjimarket@gmail.com" className="text-blue-600 hover:underline">dungjimarket@gmail.com</a></li>
              <li>• 카카오톡: @둥지마켓</li>
            </ul>
          </div>
        </section>

        {/* 최종 수정일 */}
        <div className="text-center text-gray-500 text-sm pt-8 border-t">
          <p>최종 수정일: 2025년 8월 13일</p>
          <p>둥지마켓 주식회사</p>
        </div>
      </div>
    </div>
  );
}