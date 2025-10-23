'use client';

/**
 * 쿠팡 파트너스 사이드바 광고
 * PC에서만 표시되는 우측 사이드바
 */
export function CoupangSidebar() {
  return (
    <aside className="hidden xl:block sticky top-20 w-[160px] flex-shrink-0">
      <div className="flex flex-col gap-4">
        {/* 쿠팡 파트너스 광고 */}
        <div className="flex flex-col items-center gap-2 bg-white rounded-lg shadow-sm p-3">
          <iframe
            src="https://coupa.ng/ckmbC6"
            width="120"
            height="240"
            frameBorder="0"
            scrolling="no"
            referrerPolicy="unsafe-url"
            className="border-0"
          ></iframe>
          <p className="text-[9px] text-gray-400 text-center leading-tight">
            쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
          </p>
        </div>
      </div>
    </aside>
  );
}
