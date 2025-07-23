import { useEffect, useState } from 'react';

/**
 * 모바일 키보드 상태를 감지하는 커스텀 훅
 */
export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // 모바일에서 뷰포트 높이 변화로 키보드 상태 감지
        const currentHeight = window.visualViewport?.height || window.innerHeight;
        const screenHeight = window.screen.height;
        
        // 키보드가 열린 것으로 추정되는 경우
        if (currentHeight < screenHeight * 0.75) {
          setIsKeyboardOpen(true);
          setKeyboardHeight(screenHeight - currentHeight);
        } else {
          setIsKeyboardOpen(false);
          setKeyboardHeight(0);
        }
      }
    };

    // visualViewport API 지원 여부 확인
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // 초기 상태 확인
    handleResize();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return { isKeyboardOpen, keyboardHeight };
}

/**
 * 모바일에서 입력 필드로 스크롤 및 포커스하는 유틸리티 함수
 */
export function scrollToInputField(element: HTMLElement | null, delay: number = 300) {
  if (!element) return;
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // 모바일에서는 키보드 높이를 고려하여 스크롤
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'nearest' 
    });
    
    // 키보드가 열릴 시간을 고려하여 포커스 지연
    setTimeout(() => {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.focus({ preventScroll: true });
      } else {
        const input = element.querySelector('input, textarea');
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          input.focus({ preventScroll: true });
        }
      }
    }, delay);
  } else {
    // 데스크톱에서는 일반적인 스크롤 및 포커스
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.focus();
      } else {
        const input = element.querySelector('input, textarea');
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          input.focus();
        }
      }
    }, delay);
  }
}