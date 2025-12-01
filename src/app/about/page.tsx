export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">둥지마켓 이용가이드</h1>

        <div className="prose lg:prose-lg max-w-none">
          {/* 소개 섹션 */}
          <div className="mb-12 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
            <h2 className="text-2xl font-semibold mb-4">내 주변 전문가, 이제 쉽게 만나세요</h2>
            <p className="text-gray-700 mb-4">
              둥지마켓은 <strong>우리동네 검증된 전문가</strong>와 <strong>지역 공동구매</strong>를 연결하는 플랫폼입니다.
            </p>
            <p className="text-gray-700">
              세무·회계·법률·부동산부터 인테리어·이사·청소까지, 복잡한 검색 없이 내 지역 전문가에게 바로 상담받으세요!
            </p>
          </div>

          {/* 전문가 상담 서비스 */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">우리동네 전문가 상담</h2>
            <p className="text-gray-600 mb-6">혼자 고민하지 마세요. 각 분야 전문가가 내 상황에 맞는 솔루션을 제안해드립니다.</p>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {/* 세무·회계 */}
              <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">💼</span>
                  <h3 className="text-lg font-semibold">세무사 · 회계사</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 종합소득세, 부가세 신고 대행</li>
                  <li>• 법인/개인사업자 기장 대리</li>
                  <li>• 세무조사 대응, 절세 컨설팅</li>
                  <li>• 창업·폐업 세무 상담</li>
                </ul>
              </div>

              {/* 법률 서비스 */}
              <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">⚖️</span>
                  <h3 className="text-lg font-semibold">변호사 · 법무사</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 부동산 등기, 법인 설립</li>
                  <li>• 민사·형사 소송 상담</li>
                  <li>• 계약서 검토, 내용증명</li>
                  <li>• 상속·이혼·채권 법률 자문</li>
                </ul>
              </div>

              {/* 부동산 */}
              <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🏠</span>
                  <h3 className="text-lg font-semibold">공인중개사</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 아파트·빌라·오피스텔 매매</li>
                  <li>• 전세·월세 임대차 중개</li>
                  <li>• 상가·사무실 임대</li>
                  <li>• 시세 조회, 투자 상담</li>
                </ul>
              </div>

              {/* 인테리어 */}
              <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🛠️</span>
                  <h3 className="text-lg font-semibold">인테리어</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 신축·리모델링 설계 및 시공</li>
                  <li>• 욕실·주방 부분 인테리어</li>
                  <li>• 상업공간 인테리어</li>
                  <li>• 무료 상담 신청</li>
                </ul>
              </div>

              {/* 이사 */}
              <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🚚</span>
                  <h3 className="text-lg font-semibold">이사 전문</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 포장이사, 반포장이사</li>
                  <li>• 원룸·투룸 소형이사</li>
                  <li>• 사무실 이전</li>
                  <li>• 보관이사, 폐기물 처리</li>
                </ul>
              </div>

              {/* 청소 */}
              <div className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🧹</span>
                  <h3 className="text-lg font-semibold">청소 전문</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 입주청소, 이사청소</li>
                  <li>• 에어컨·세탁기 분해청소</li>
                  <li>• 사무실·상가 정기청소</li>
                  <li>• 준공청소, 리모델링 후 청소</li>
                </ul>
              </div>
            </div>

            {/* 추가 전문가 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <span className="text-xl">📱</span>
                <p className="text-sm font-medium mt-1">휴대폰 대리점</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <span className="text-xl">🔧</span>
                <p className="text-sm font-medium mt-1">자동차 정비</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <span className="text-xl">🏢</span>
                <p className="text-sm font-medium mt-1">더 많은 업종</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <span className="text-xl">🔜</span>
                <p className="text-sm font-medium mt-1">계속 추가 중</p>
              </div>
            </div>
          </div>

          {/* 상담 신청 과정 */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">상담 신청은 이렇게!</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">업종 선택</h3>
                  <p className="text-gray-600 text-sm">필요한 서비스 분야를 선택하세요.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">상담 내용 작성</h3>
                  <p className="text-gray-600 text-sm">간단한 질문에 답하면 상담 내용이 자동 정리됩니다.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">전문가 매칭</h3>
                  <p className="text-gray-600 text-sm">내 지역 전문가에게 상담 요청이 전달됩니다.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">4</div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">상담 진행</h3>
                  <p className="text-gray-600 text-sm">전문가가 직접 연락드려 상담을 진행합니다.</p>
                </div>
              </div>
            </div>
          </div>

          {/* 커스텀 공구 & 중고거래 */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">함께하면 더 좋은 서비스</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                <h3 className="text-xl font-semibold mb-3 text-purple-800">🛒 커스텀 공구</h3>
                <p className="text-gray-700 text-sm mb-3">
                  우리동네 맛집, 카페, 헬스장 등 모이면 할인받는 단체할인 공구!
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 지역 업체 단체할인 쿠폰</li>
                  <li>• N명 모이면 특별 할인</li>
                  <li>• 수수료 무료</li>
                </ul>
              </div>

              <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                <h3 className="text-xl font-semibold mb-3 text-green-800">📱 중고직거래</h3>
                <p className="text-gray-700 text-sm mb-3">
                  내 동네에서 안전하게 중고폰, 전자제품 직거래!
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 지역 기반 안전 거래</li>
                  <li>• 중고폰, 전자제품 전문</li>
                  <li>• 가격 제안 기능</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 회원 유형 */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">회원 유형</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
                <h3 className="text-lg font-semibold mb-3">일반회원</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 전문가 상담 신청</li>
                  <li>• 공구 참여</li>
                  <li>• 중고거래</li>
                  <li className="text-blue-600 font-medium">완전 무료!</li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-blue-200">
                <h3 className="text-lg font-semibold mb-3 text-blue-700">전문가 회원</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 상담 요청 수신</li>
                  <li>• 프로필 노출</li>
                  <li>• 지역 고객 확보</li>
                  <li className="text-blue-600 font-medium">가입비 무료!</li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-purple-200">
                <h3 className="text-lg font-semibold mb-3 text-purple-700">판매회원</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 공구 견적 제안</li>
                  <li>• 지역 단체 고객 확보</li>
                  <li>• 거래 수수료 0원</li>
                  <li className="text-purple-600 font-medium">입점비 무료!</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 왜 둥지마켓인가 */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">왜 둥지마켓인가요?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl">📍</div>
                <div>
                  <h4 className="font-semibold">내 지역 전문가</h4>
                  <p className="text-sm text-gray-600">멀리 갈 필요 없이 동네 전문가와 상담</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl">✅</div>
                <div>
                  <h4 className="font-semibold">검증된 전문가</h4>
                  <p className="text-sm text-gray-600">자격증 인증, 리뷰 기반 신뢰도</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl">💰</div>
                <div>
                  <h4 className="font-semibold">무료 상담</h4>
                  <p className="text-sm text-gray-600">상담 신청 비용 없이 편하게 문의</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl">🔔</div>
                <div>
                  <h4 className="font-semibold">실시간 알림</h4>
                  <p className="text-sm text-gray-600">상담 진행 상황 즉시 알림</p>
                </div>
              </div>
            </div>
          </div>

          {/* 고객센터 정보 */}
          <div className="bg-gray-100 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">고객센터</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>전화:</strong> 070-4507-4492</p>
              <p><strong>운영시간:</strong> 평일 09:00 ~ 18:00 (주말, 공휴일 휴무)</p>
              <p><strong>이메일:</strong> dungjimarket@gmail.com</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
