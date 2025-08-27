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
              <strong>휴대폰, 인터넷, 렌탈 서비스</strong>를 공동구매로 최고 지원금과 혜택을 받을 수 있는 플랫폼입니다.
            </p>
            <p className="text-gray-700">
              한 곳에서 비교하고, 공동구매로 견적받아 <strong>최대한의 지원금 혜택</strong>을 누려보세요!
            </p>
          </div>

          {/* 주요 서비스 */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">🎯 주요 서비스</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="text-3xl mb-3">📱</div>
                <h3 className="text-xl font-semibold mb-3">휴대폰 개통</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• SKT, KT, LG U+ 전 요금제</li>
                  <li>• 신규/번호이동/기기변경</li>
                  <li>• 최대 지원금 혜택</li>
                  <li>• 온라인 간편 개통</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="text-3xl mb-3">🌐</div>
                <h3 className="text-xl font-semibold mb-3">인터넷/TV</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 광랜, 케이블, IPTV</li>
                  <li>• 결합상품 할인</li>
                  <li>• 설치비 무료</li>
                  <li>• 현금 지원금</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="text-3xl mb-3">🏠</div>
                <h3 className="text-xl font-semibold mb-3">렌탈 서비스</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 정수기, 비데, 매트리스</li>
                  <li>• 공기청정기, 안마의자</li>
                  <li>• 무료 설치 및 A/S</li>
                  <li>• 월 렌탈료 할인</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 이용 방법 */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">📋 이용 방법</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">회원가입 및 로그인</h3>
                  <p className="text-gray-600">카카오톡 간편가입 또는 이메일로 회원가입하세요.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">공동구매 상품 찾기</h3>
                  <p className="text-gray-600">휴대폰, 인터넷, 렌탈 카테고리에서 원하는 상품을 찾아보세요.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">공동구매 참여</h3>
                  <p className="text-gray-600">관심 있는 공동구매에 참여하고 다른 구매자들과 함께 혜택을 받으세요.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">4</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">판매자 선택 및 계약</h3>
                  <p className="text-gray-600">입찰에 참여한 판매자 중 최적의 조건을 제공하는 판매자를 선택하세요.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">5</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">개통 및 설치</h3>
                  <p className="text-gray-600">선택한 판매자가 개통/설치를 진행하고 최고 혜택을 받으세요!</p>
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
                  <li>• 공동구매 참여하여 최고 혜택 받기</li>
                  <li>• 여러 판매자 견적 비교</li>
                  <li>• 안전한 거래 보장</li>
                  <li>• 실시간 알림 서비스</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-xl font-semibold mb-3 text-blue-800">🦅 판매회원 (사업자)</h3>
                <ul className="text-gray-700 space-y-2">
                  <li>• 공동구매 고객에게 견적 제공</li>
                  <li>• 사업자등록증 기반 인증</li>
                  <li>• 전문적인 상담 서비스</li>
                  <li>• 고객 관리 시스템</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 특징 및 혜택 */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">✨ 둥지마켓의 특징</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="text-xl">💰</div>
                  <div>
                    <h4 className="font-semibold">최고 지원금 혜택</h4>
                    <p className="text-sm text-gray-600">공동구매로 개별 구매보다 더 많은 혜택을 받으세요</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="text-xl">🛡️</div>
                  <div>
                    <h4 className="font-semibold">검증된 판매자</h4>
                    <p className="text-sm text-gray-600">사업자등록증 인증을 통한 신뢰할 수 있는 판매자</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="text-xl">📱</div>
                  <div>
                    <h4 className="font-semibold">간편한 온라인 개통</h4>
                    <p className="text-sm text-gray-600">방문 없이 온라인으로 간편하게 개통 가능</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="text-xl">🔍</div>
                  <div>
                    <h4 className="font-semibold">한 곳에서 비교</h4>
                    <p className="text-sm text-gray-600">여러 판매자의 조건을 한 번에 비교할 수 있어요</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="text-xl">🎯</div>
                  <div>
                    <h4 className="font-semibold">지역별 맞춤 서비스</h4>
                    <p className="text-sm text-gray-600">거주지역에 맞는 최적의 서비스를 제공해요</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="text-xl">⚡</div>
                  <div>
                    <h4 className="font-semibold">실시간 알림</h4>
                    <p className="text-sm text-gray-600">공동구매 진행 상황을 실시간으로 알려드려요</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 고객센터 정보 */}
          <div className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">📞 고객센터</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>전화:</strong> 1566-0025</p>
              <p><strong>운영시간:</strong> 평일 09:00 ~ 18:00 (주말, 공휴일 휴무)</p>
              <p><strong>이메일:</strong> support@dungjimarket.com</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
