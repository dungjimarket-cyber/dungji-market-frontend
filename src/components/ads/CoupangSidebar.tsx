'use client';

/**
 * 쿠팡 파트너스 사이드바 광고
 * PC에서만 표시되는 우측 사이드바
 * fixed 포지셔닝으로 메인 컨텐츠 오른쪽 빈 공간 중앙에 배치
 * xl (1280px) 이상에서만 표시
 * 위치: 화면 중앙(50%) + 메인 컨텐츠 절반(640px) + 여유 공간
 */
export function CoupangSidebar() {
  return (
    <aside
      className="hidden xl:block fixed top-24 z-10"
      style={{ left: 'calc(50% + 680px)' }}
    >
      <div className="flex flex-col gap-3">
        {/* 쿠팡 파트너스 광고 1 */}
        <div className="flex flex-col items-center gap-2 bg-white rounded-lg shadow-sm p-2">
          <iframe
            src="https://coupa.ng/ckmbC6"
            width="120"
            height="240"
            frameBorder="0"
            scrolling="no"
            referrerPolicy="unsafe-url"
            className="border-0"
          ></iframe>
        </div>

        {/* 쿠팡 파트너스 광고 2 */}
        <div className="flex flex-col items-center gap-2 bg-white rounded-lg shadow-sm p-2">
          <iframe
            src="https://coupa.ng/ckmUCR"
            width="120"
            height="240"
            frameBorder="0"
            scrolling="no"
            referrerPolicy="unsafe-url"
            className="border-0"
          ></iframe>
        </div>

        {/* 공지 문구 */}
        <p className="text-[9px] text-gray-400 text-center leading-tight px-2">
          쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
        </p>
      </div>
    </aside>
  );
}
