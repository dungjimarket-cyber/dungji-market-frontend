'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * 사업자 정보 및 이용약관 섹션 컴포넌트
 * 상품 상세 페이지 하단에 표시되는 사업자 정보 및 이용약관 링크를 제공합니다.
 */
const BusinessInfoSection: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="business-info-section mt-8 border-t pt-4">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full py-2 text-left text-gray-700"
      >
        <span className="font-medium">사업자 정보 및 이용약관</span>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      
      {isExpanded && (
        <div className="mt-2 text-sm text-gray-600 space-y-4 animate-fadeIn">
          <div className="business-info">
            <h4 className="font-medium mb-2">사업자 정보</h4>
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="py-1 pr-4 font-medium">상호명</td>
                  <td>둥지마켓</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-medium">대표자</td>
                  <td>홍길동</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-medium">사업자등록번호</td>
                  <td>123-45-67890</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-medium">통신판매업신고</td>
                  <td>제2023-서울강남-1234호</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-medium">주소</td>
                  <td>서울특별시 강남구 테헤란로 123, 4층</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-medium">고객센터</td>
                  <td>02-123-4567 (평일 10:00~18:00, 점심시간 12:00~13:00)</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4 font-medium">이메일</td>
                  <td>support@dungjimarket.com</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="terms-links">
            <h4 className="font-medium mb-2">이용약관</h4>
            <ul className="space-y-1">
              <li>
                <Link 
                  href="/terms/general" 
                  className="text-blue-600 hover:underline"
                >
                  일반회원 이용약관
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms/seller" 
                  className="text-blue-600 hover:underline"
                >
                  판매회원 이용약관
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="text-blue-600 hover:underline"
                >
                  개인정보 처리방침
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="disclaimer text-xs text-gray-500 mt-4">
            <p>
              둥지마켓은 통신판매중개자이며 통신판매의 당사자가 아닙니다. 
              따라서 둥지마켓은 상품 거래정보 및 거래에 대하여 책임을 지지 않습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessInfoSection;
