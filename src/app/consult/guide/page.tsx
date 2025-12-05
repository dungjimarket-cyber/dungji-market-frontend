'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MessageSquare, Users, Shield, CheckCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categories = [
  { name: '변호사', image: '/images/변호사.png' },
  { name: '법무사', image: '/images/법무사.png' },
  { name: '세무사', image: '/images/세무사.png' },
  { name: '회계사', image: '/images/회계사.png' },
  { name: '공인중개사', image: '/images/공인중개사.png' },
  { name: '인테리어', image: '/images/인테리어.png' },
  { name: '자동차정비', image: '/images/자동차정비.png' },
  { name: '휴대폰대리점', image: '/images/휴대폰대리점.png' },
  { name: '청소', image: '/images/청소.png' },
  { name: '이사', image: '/images/이사.png' },
];

export default function ConsultGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/local-businesses">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                돌아가기
              </Button>
            </Link>
            <h1 className="text-lg font-bold text-gray-900">전문가 상담 이용가이드</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* 서비스 소개 */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            서비스 소개
          </h2>
          <div className="bg-white rounded-lg p-4 border space-y-3">
            <p className="text-sm text-gray-700">
              전문가 상담은 <strong>세무, 법률, 부동산, 인테리어</strong> 등 다양한 분야의
              전문가와 연결해드리는 서비스입니다.
            </p>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-sm text-blue-800 font-medium">
                상담 신청 및 전문가 답변 확인까지 무료!
              </p>
            </div>
          </div>
        </section>

        {/* 이용 방법 */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            이용 방법
          </h2>
          <div className="bg-white rounded-lg p-4 border space-y-4">
            <div className="flex gap-3">
              <div className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900">상담 신청</h3>
                <p className="text-sm text-gray-600">업종 선택 후 상담 내용을 입력하세요</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900">전문가 답변 확인</h3>
                <p className="text-sm text-gray-600">매칭된 전문가들의 답변을 비교하세요</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900">추가 상담 진행</h3>
                <p className="text-sm text-gray-600">원하는 전문가와 직접 상담을 진행하세요</p>
              </div>
            </div>
          </div>
        </section>

        {/* 상담 가능 업종 */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            상담 가능 업종
          </h2>
          <div className="bg-white rounded-lg p-2 border">
            <div className="grid grid-cols-5 gap-0">
              {categories.map((cat) => (
                <div key={cat.name} className="flex flex-col items-center p-1">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                  <span className="text-xs text-gray-700 text-center">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 연락처 정책 */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            연락처 공개 정책
          </h2>
          <div className="bg-white rounded-lg p-4 border">
            <ul className="space-y-1 text-gray-600 text-sm">
              <li>• 전문가 정보를 <strong>미리 확인</strong>할 수 있습니다</li>
              <li>• 답변 후 전문가 연락처 확인 가능</li>
            </ul>
          </div>
        </section>

        {/* 자주 묻는 질문 */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-gray-600" />
            자주 묻는 질문
          </h2>
          <div className="bg-white rounded-lg p-4 border space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Q. 상담 비용이 있나요?</h3>
              <p className="text-sm text-gray-600">
                상담 신청 및 매칭은 무료입니다. 실제 상담 비용은 전문가와 협의하세요.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Q. 답변까지 얼마나 걸리나요?</h3>
              <p className="text-sm text-gray-600">
                보통 24시간 이내에 답변을 받을 수 있습니다.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Q. 전문가와 추가 상담도 가능한가요?</h3>
              <p className="text-sm text-gray-600">
                네, 여러 전문가의 답변을 받고 원하는 전문가와 추가 상담을 진행해 보세요.
              </p>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="text-center mt-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-blue-800 mb-3">
              전문가 상담 시작하기
            </h2>
            <p className="text-blue-700 mb-4 text-sm">
              지금 바로 전문가의 도움을 받아보세요!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/local-businesses">
                <Button size="sm" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  상담 신청하기
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
