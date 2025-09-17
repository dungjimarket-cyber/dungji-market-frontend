export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">둥지마켓 이용가이드</h1>
        
        <div className="prose lg:prose-lg max-w-none">
          {/* 소개 섹션 */}
          <div className="mb-12 bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">💡 둥지마켓이란?</h2>
            <p className="text-gray-700 mb-4">
              내가 원하는 상품의 견적을 여러 판매자가 경쟁하여 제안하는 <strong>공동구매 중개 플랫폼</strong>입니다.
            </p>
            <p className="text-gray-700">
              구매자들이 모여 공구를 만들면, 판매자들이 서로 경쟁하여 최고의 조건을 제안합니다!
            </p>
          </div>

          {/* 주요 취급 상품 */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">🎯 주요 취급 상품</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="text-3xl mb-3">📱</div>
                <h3 className="text-xl font-semibold mb-3">휴대폰</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 통신 3사 모든 요금제 취급</li>
                  <li>• 신규가입, 번호이동, 기기변경</li>
                  <li>• 판매자별 지원금 비교 가능</li>
                  <li>• 우리 동네 대리점과 직거래</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="text-3xl mb-3">🌐</div>
                <h3 className="text-xl font-semibold mb-3">인터넷/TV</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 각 통신사 인터넷, IPTV 상품</li>
                  <li>• 판매자별 지원금 비교 가능</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 공구 진행 과정 */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">📋 공구 진행 과정</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">공구 생성/참여</h3>
                  <p className="text-gray-600">원하는 상품의 공구를 직접 만들거나, 진행 중인 공구에 참여하세요.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">구매자 모집</h3>
                  <p className="text-gray-600">같은 상품을 원하는 구매자들이 모입니다. 많이 모일수록 협상력이 강해져요!</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">판매자 견적 제안</h3>
                  <p className="text-gray-600">여러 판매자가 경쟁하며 각자 최고의 조건을 제시합니다.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">4</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">최종 선택</h3>
                  <p className="text-gray-600">모집 기간 종료 후 가장 좋은 조건의 판매자가 선정됩니다.<br />
                  구매자는 12시간 내 구매확정/포기를 선택할 수 있어요.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">5</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">직거래 진행</h3>
                  <p className="text-gray-600">구매 확정 시 판매자 연락처가 공개되며, 직접 만나 거래를 진행합니다.</p>
                </div>
              </div>
            </div>
          </div>

          {/* 회원 유형 */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">👥 회원 유형</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-xl font-semibold mb-3 text-green-800">🐦 일반회원 (구매자)</h3>
                <ul className="text-gray-700 space-y-2">
                  <li>• 공구 생성 및 참여 가능</li>
                  <li>• 여러 판매자 견적 한눈에 비교</li>
                  <li>• 수수료 없이 무료 이용</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-xl font-semibold mb-3 text-blue-800">🦅 판매회원 (사업자)</h3>
                <ul className="text-gray-700 space-y-2">
                  <li>• 공구에 견적 제안 가능</li>
                  <li>• 이용권 구독시 무제한 견적 제안 (업계 최초)</li>
                  <li>• 입점비용, 거래 수수료 0원</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 둥지마켓만의 차별점 */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">✨ 둥지마켓만의 차별점</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="text-xl">🤝</div>
                <div>
                  <h4 className="font-semibold">공동구매로 비교견적 받기</h4>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="text-xl">🛡️</div>
                <div>
                  <h4 className="font-semibold">비대면 익명 참여</h4>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="text-xl">📍</div>
                <div>
                  <h4 className="font-semibold">지역 기반 거래 매칭</h4>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="text-xl">🔔</div>
                <div>
                  <h4 className="font-semibold">실시간 알림</h4>
                  <p className="text-sm text-gray-600">공구 진행 상황, 견적 도착 등 중요 정보 즉시 알림</p>
                </div>
              </div>
            </div>
          </div>

          {/* 고객센터 정보 */}
          <div className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">📞 고객센터</h2>
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