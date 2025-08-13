'use client';

import { useEffect } from 'react';

export default function KakaoInAppBrowserHandler() {
  useEffect(() => {
    // 인앱 브라우저 감지
    const userAgent = navigator.userAgent.toLowerCase();
    
    // 다양한 인앱 브라우저 감지
    const inAppBrowsers = [
      'kakaotalk',  // 카카오톡
      'naver',      // 네이버
      'line',       // 라인
      'fb',         // 페이스북
      'instagram',  // 인스타그램
      'everytimeapp', // 에브리타임
      'reddit',     // 레딧
      'twitter',    // 트위터
      'telegram'    // 텔레그램
    ];
    
    const isInAppBrowser = inAppBrowsers.some(browser => userAgent.includes(browser));
    
    if (isInAppBrowser) {
      const currentUrl = window.location.href;
      
      // 카카오톡 인앱 브라우저인 경우 외부 브라우저로 직접 리다이렉트
      if (userAgent.includes('kakaotalk')) {
        // 카카오톡 전용 외부 브라우저 열기 스킴 사용
        window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(currentUrl);
        
        // 스킴이 작동하지 않는 경우를 대비한 폴백
        setTimeout(() => {
          // 페이지가 아직 남아있다면 안내 메시지 표시
          if (document.hasFocus()) {
            showExternalBrowserGuide();
          }
        }, 500);
      } 
      // 라인 인앱 브라우저인 경우
      else if (userAgent.includes('line')) {
        if (currentUrl.indexOf('?') !== -1) {
          window.location.href = currentUrl + '&openExternalBrowser=1';
        } else {
          window.location.href = currentUrl + '?openExternalBrowser=1';
        }
      }
      // 기타 인앱 브라우저
      else {
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        
        if (isMobile) {
          if (userAgent.includes('android')) {
            // 안드로이드 - Chrome으로 열기 시도
            const intent = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
            window.location.href = intent;
            
            // Intent가 작동하지 않는 경우 대비
            setTimeout(() => {
              if (document.hasFocus()) {
                showExternalBrowserGuide();
              }
            }, 500);
          } else {
            // iOS - 직접 리다이렉트 불가, 안내 메시지 표시
            showExternalBrowserGuide();
          }
        }
      }
    }
  }, []);

  const showExternalBrowserGuide = () => {
    // 이미 모달이 표시되어 있는지 확인
    if (document.getElementById('external-browser-guide')) return;
    
    // 외부 브라우저로 열기 안내 모달 표시
    const modal = document.createElement('div');
    modal.id = 'external-browser-guide';
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 0.3s ease-in-out;
      ">
        <div style="
          background: white;
          border-radius: 16px;
          padding: 28px 24px;
          max-width: 340px;
          width: 100%;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          animation: slideUp 0.3s ease-out;
        ">
          <div style="
            width: 60px;
            height: 60px;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </div>
          
          <h2 style="
            margin: 0 0 12px 0;
            font-size: 20px;
            font-weight: bold;
            color: #1a1a1a;
          ">외부 브라우저로 열어주세요</h2>
          
          <p style="
            margin: 0 0 24px 0;
            font-size: 14px;
            color: #666;
            line-height: 1.6;
          ">
            원활한 서비스 이용을 위해<br/>
            <strong>Safari</strong> 또는 <strong>Chrome</strong>에서<br/>
            열어주시기 바랍니다.
          </p>
          
          <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
            color: white;
            text-align: left;
          ">
            <p style="
              margin: 0 0 10px 0;
              font-size: 14px;
              font-weight: 600;
            ">📱 카카오톡에서 여는 방법</p>
            <p style="
              margin: 0;
              font-size: 13px;
              line-height: 1.5;
              opacity: 0.95;
            ">
              우측 상단 <span style="font-weight: bold; font-size: 16px;">⋯</span> 메뉴 터치<br/>
              → <span style="font-weight: bold;">다른 브라우저에서 열기</span> 선택
            </p>
          </div>
          
          <button onclick="
            this.parentElement.parentElement.parentElement.style.animation = 'fadeOut 0.3s ease-in-out';
            setTimeout(() => this.parentElement.parentElement.parentElement.remove(), 300);
          " style="
            background: #10B981;
            color: white;
            border: none;
            border-radius: 10px;
            padding: 14px 24px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: all 0.2s;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
          " 
          onmouseover="this.style.transform='scale(1.02)'"
          onmouseout="this.style.transform='scale(1)'"
          >확인했습니다</button>
        </div>
      </div>
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideUp {
          from { 
            transform: translateY(30px);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }
      </style>
    `;
    document.body.appendChild(modal);
  };

  return null;
}