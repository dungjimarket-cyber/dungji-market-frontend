'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ChevronLeft className="w-4 h-4 mr-1" />
          뒤로가기
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-8">개인정보처리방침</h1>
      
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          둥지마켓(이하 "회사")은 이용자의 개인정보를 중요시하며, "정보통신망 이용촉진 및 정보보호에 관한 법률" 등 관련 법령을 준수하고 있습니다.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. 수집하는 개인정보의 항목</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold mb-2">회원가입 시</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>필수항목: 이메일, 비밀번호, 이름, 연락처, 활동지역</li>
              <li>선택항목: 프로필 이미지</li>
              <li>소셜 로그인 시: 소셜 계정 정보(이메일, 이름)</li>
            </ul>
            
            <h3 className="font-semibold mb-2 mt-4">판매회원 추가 정보</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>필수항목: 사업자등록번호, 사업장 주소, 대표자명</li>
              <li>선택항목: 사업자등록증 사본</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. 개인정보의 수집 및 이용목적</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별</li>
            <li>서비스 제공: 공구 참여, 입찰, 거래 중개 서비스 제공</li>
            <li>고지사항 전달: 서비스 이용에 관한 통지, 공지사항 전달</li>
            <li>마케팅 및 광고: 이벤트 등 광고성 정보 전달(선택 동의 시)</li>
            <li>서비스 개선: 접속 빈도 파악, 서비스 이용 통계</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. 개인정보의 보유 및 이용기간</h2>
          <div className="bg-blue-50 p-6 rounded-lg">
            <p className="text-gray-700 mb-2">
              회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>회원 탈퇴 시: 즉시 삭제</li>
              <li>전자상거래법에 의한 보존: 5년 (계약 또는 청약철회 기록 등)</li>
              <li>통신비밀보호법에 의한 보존: 3개월 (로그인 기록)</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. 개인정보의 제3자 제공</h2>
          <p className="text-gray-600 mb-4">
            회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>이용자가 사전에 동의한 경우</li>
            <li>거래 당사자 간 필요한 정보 교환 (연락처 등)</li>
            <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차에 따라 요구가 있는 경우</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. 개인정보의 파기절차 및 방법</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold mb-2">파기절차</h3>
            <p className="text-gray-600 mb-4">
              이용목적이 달성된 개인정보는 별도의 DB로 옮겨져 내부 방침 및 관련 법령에 의한 보유기간 동안 저장된 후 파기됩니다.
            </p>
            
            <h3 className="font-semibold mb-2">파기방법</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>전자적 파일 형태: 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제</li>
              <li>종이 문서: 분쇄기로 분쇄하거나 소각</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. 이용자의 권리와 행사방법</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>개인정보 열람 요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제 요구</li>
            <li>처리정지 요구</li>
          </ul>
          <p className="text-gray-600 mt-4">
            위 권리는 마이페이지 또는 고객센터를 통해 행사할 수 있습니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. 쿠키(Cookie)의 운용</h2>
          <p className="text-gray-600 mb-4">
            회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 쿠키를 사용합니다.
          </p>
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="font-semibold mb-2">쿠키 설정 거부 방법</h3>
            <p className="text-gray-600">
              웹브라우저 설정을 통해 쿠키를 거부할 수 있으나, 일부 서비스 이용에 제한이 있을 수 있습니다.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. 개인정보 보호책임자</h2>
          <div className="bg-blue-50 p-6 rounded-lg">
            <p className="font-semibold mb-2">개인정보 보호책임자</p>
            <ul className="space-y-1 text-gray-600">
              <li>성명: 홍길동</li>
              <li>직책: 개인정보보호팀장</li>
              <li>이메일: privacy@dungjimarket.com</li>
              <li>전화: 1234-5678</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. 개인정보처리방침의 변경</h2>
          <p className="text-gray-600">
            이 개인정보처리방침은 2024년 1월 1일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
          </p>
        </section>

        <div className="mt-12 p-6 bg-gray-100 rounded-lg">
          <p className="text-center text-gray-600">
            시행일자: 2024년 1월 1일
          </p>
        </div>
      </div>
    </div>
  );
}