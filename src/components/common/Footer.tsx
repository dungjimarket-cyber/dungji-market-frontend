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
    <footer className="border-t mt-1 sm:mt-2 md:mt-4 py-1 sm:py-2 md:py-3 bg-gray-50 mb-16 md:mb-0">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company Info */}
          <div>
            <p className="text-sm text-gray-600 mb-1">상호: 둥지마켓</p>
            <p className="text-sm text-gray-600 mb-1">대표자명: 김성민</p>
            <p className="text-sm text-gray-600 mb-1">사업자등록번호: 275-23-02159</p>
            <p className="text-sm text-gray-600 mb-1">통신판매업: 제2025-경기하남-1650호</p>
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
              <li>
                <Link href="/notices" className="text-sm text-gray-600 hover:text-emerald-600">
                  공지사항
                </Link>
              </li>
              <li>
                <Link href="/inquiries" className="text-sm text-gray-600 hover:text-emerald-600">
                  1:1 문의
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
            
            {/* SNS 링크 */}
            <div className="flex items-center gap-4 mb-4">
              <a 
                href="https://www.instagram.com/dungjimarket" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-gray-600 hover:text-pink-600 transition-colors duration-200"
                title="둥지마켓 인스타그램"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
                </svg>
                <span className="ml-2 text-sm">인스타그램</span>
              </a>
              
              <a 
                href="https://m.blog.naver.com/dungjimarket-1-" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-gray-600 hover:text-green-600 transition-colors duration-200"
                title="둥지마켓 블로그"
              >
                <div className="w-6 h-6 bg-green-500 rounded text-white flex items-center justify-center font-bold text-sm">
                  N
                </div>
                <span className="ml-2 text-sm">블로그</span>
              </a>
            </div>
            
            <div>
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} 둥지마켓. All rights reserved.
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                둥지마켓은 통신판매중개자로서, 통신판매의 당사자가 아니며 상품의 주문, 배송 및 환불 등과 관련한 의무와 책임은 각 판매자에게 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
