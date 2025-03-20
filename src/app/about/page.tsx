export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">둥지마켓 소개</h1>
        
        <div className="prose lg:prose-lg">
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">둥지마켓이란?</h2>
            <p className="text-gray-600 mb-4">
              둥지마켓은 함께 모여 더 좋은 가격으로 구매할 수 있는 공동구매 플랫폼입니다.
              여러 사람이 모여 대량으로 구매하면 개별 구매보다 저렴한 가격에 좋은 제품을 구매할 수 있습니다.
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">이런 분들에게 추천해요</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>합리적인 가격으로 물건을 구매하고 싶으신 분</li>
              <li>같은 관심사를 가진 사람들과 함께 구매하고 싶으신 분</li>
              <li>신뢰할 수 있는 판매자로부터 제품을 구매하고 싶으신 분</li>
              <li>다양한 제품을 한 곳에서 편리하게 구매하고 싶으신 분</li>
            </ul>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">둥지마켓의 장점</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">합리적인 가격</h3>
                <p className="text-gray-600">
                  공동구매를 통해 더 저렴한 가격으로 구매할 수 있어요.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">검증된 판매자</h3>
                <p className="text-gray-600">
                  신뢰할 수 있는 판매자들이 엄선한 제품을 제공해요.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">편리한 구매</h3>
                <p className="text-gray-600">
                  간편한 결제와 배송 시스템으로 쉽게 구매할 수 있어요.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">이용 방법</h2>
            <ol className="list-decimal list-inside space-y-4 text-gray-600">
              <li>
                <span className="font-semibold">회원가입</span>
                <p className="ml-6 mt-1">
                  간단한 이메일 인증 또는 소셜 로그인으로 시작하세요.
                </p>
              </li>
              <li>
                <span className="font-semibold">공동구매 찾기</span>
                <p className="ml-6 mt-1">
                  관심 있는 카테고리나 제품을 검색하여 진행 중인 공동구매를 찾아보세요.
                </p>
              </li>
              <li>
                <span className="font-semibold">참여하기</span>
                <p className="ml-6 mt-1">
                  원하는 공동구매에 참여하고 결제를 진행하세요.
                </p>
              </li>
              <li>
                <span className="font-semibold">배송 받기</span>
                <p className="ml-6 mt-1">
                  공동구매가 성사되면 제품을 배송 받으실 수 있습니다.
                </p>
              </li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
