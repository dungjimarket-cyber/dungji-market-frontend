'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  
  // Don't show footer on terms pages to avoid redundancy
  if (pathname.startsWith('/terms')) {
    return null;
  }

  return (
    <footer className="border-t mt-12 py-6 bg-gray-50 min-h-[300px]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-gray-700 mb-3">둥지마켓</h3>
            <p className="text-sm text-gray-600 mb-1">상호: 둥지마켓</p>
            <p className="text-sm text-gray-600 mb-1">사업자등록번호: 275-23-02159</p>
            <p className="text-sm text-gray-600 mb-1">통신판매업신고: (준비중)</p>
            <p className="text-sm text-gray-600 mb-1">주소: 경기도 하남시 검단산로 239, B1층 26호</p>
            <p className="text-sm text-gray-600 mb-1">(창우동, 하남시 벤처집착시설)</p>
            <p className="text-sm text-gray-600">
              고객센터: <a href="tel:070-4507-4492" className="text-emerald-600 hover:text-emerald-700 font-medium">070-4507-4492</a>
            </p>
          </div>
          
          {/* Links */}
          <div>
            <h3 className="font-bold text-gray-700 mb-3">이용안내</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms/general" className="text-sm text-gray-600 hover:text-emerald-600">
                  이용약관 (일반회원)
                </Link>
              </li>
              <li>
                <Link href="/terms/seller" className="text-sm text-gray-600 hover:text-emerald-600">
                  이용약관 (판매회원)
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-emerald-600">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-sm text-gray-600 hover:text-emerald-600">
                  환불정책
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-gray-600 hover:text-emerald-600">
                  자주 묻는 질문
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="font-bold text-gray-700 mb-3">고객지원</h3>
            <p className="text-sm text-gray-600 mb-4">
              궁금한 점이 있으신가요? 언제든지 문의해주세요.
            </p>
            
            {/* 카카오톡 문의 버튼 */}
            <a 
              href="http://pf.kakao.com/_Jyavn/chat" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg transition-colors duration-200 mb-4"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
              </svg>
              카카오톡 문의하기
            </a>
            
            <div>
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} 둥지마켓. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
