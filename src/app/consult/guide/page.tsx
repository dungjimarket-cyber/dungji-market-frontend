'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Users,
  Phone,
  Bell,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  FileText,
  Shield,
  Clock,
  Star
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: React.ReactElement;
  content: React.ReactElement;
}

export default function ConsultGuidePage() {
  const [openSection, setOpenSection] = useState<string | null>('flow');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const sections: Section[] = [
    {
      id: 'flow',
      title: '상담 서비스 흐름',
      icon: <ArrowRight className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          {/* 전체 흐름 요약 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
            <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              간편한 5단계 프로세스
            </h4>
            <div className="flex flex-col gap-2">
              {[
                { step: 1, text: '상담 신청', desc: 'AI가 내용을 정리해드려요' },
                { step: 2, text: '전문가 자동 매칭', desc: '조건에 맞는 전문가에게 전달' },
                { step: 3, text: '전문가 답변', desc: '여러 전문가의 답변 비교' },
                { step: 4, text: '전문가 선택', desc: '마음에 드는 전문가와 연결' },
                { step: 5, text: '상담 진행', desc: '연락처 공개 후 직접 상담' },
              ].map((item, idx) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {item.step}
                  </div>
                  <div className="flex-1 bg-white rounded-lg p-2.5 border border-blue-100">
                    <p className="text-sm font-medium text-gray-900">{item.text}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  {idx < 4 && <ChevronDown className="w-4 h-4 text-blue-400 rotate-0 md:rotate-[-90deg]" />}
                </div>
              ))}
            </div>
          </div>

          {/* 상세 단계 */}
          <div className="space-y-3">
            {/* Step 1 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 mb-1">상담 신청하기</h5>
                  <p className="text-xs text-gray-600 mb-2">
                    업종 선택 후 단계별 질문에 답변하면 상담 내용이 자동으로 정리됩니다.
                  </p>
                  <div className="bg-purple-50 rounded-lg p-2.5 border border-purple-200">
                    <p className="text-xs font-medium text-purple-800 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI 자동 정리 기능
                    </p>
                    <p className="text-xs text-purple-700 mt-0.5">
                      입력한 내용을 AI가 전문적으로 정리해서 전문가에게 전달해드려요
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 mb-1">전문가 자동 매칭</h5>
                  <p className="text-xs text-gray-600 mb-2">
                    업종과 지역에 맞는 검증된 전문가들에게 상담 요청이 자동 전달됩니다.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">업종 매칭</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">지역 매칭</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">즉시 알림</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 mb-1">전문가 답변 확인</h5>
                  <p className="text-xs text-gray-600 mb-2">
                    여러 전문가의 답변을 비교하고 상담 가능 시간을 확인하세요.
                  </p>
                  <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200">
                    <p className="text-xs text-amber-800">
                      💡 이 단계에서는 아직 연락처가 공개되지 않아요. 답변 내용만 먼저 확인할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 mb-1">전문가 선택 및 연결</h5>
                  <p className="text-xs text-gray-600 mb-2">
                    마음에 드는 전문가를 선택하면 양쪽 연락처가 공개됩니다.
                  </p>
                  <div className="bg-green-50 rounded-lg p-2.5 border border-green-200">
                    <p className="text-xs font-medium text-green-800 mb-1">✅ 연결 완료 시</p>
                    <ul className="text-xs text-green-700 space-y-0.5">
                      <li>• 전문가 연락처 (전화번호, 이메일) 확인 가능</li>
                      <li>• 전문가에게도 고객님 연락처 전달</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  5
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 mb-1">상담 진행</h5>
                  <p className="text-xs text-gray-600 mb-2">
                    전화, 문자, 방문 등 편한 방법으로 자유롭게 상담을 진행하세요.
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                      <Phone className="w-4 h-4 mx-auto mb-1 text-gray-600" />
                      <p className="text-xs text-gray-600">전화상담</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                      <MessageSquare className="w-4 h-4 mx-auto mb-1 text-gray-600" />
                      <p className="text-xs text-gray-600">문자상담</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                      <Users className="w-4 h-4 mx-auto mb-1 text-gray-600" />
                      <p className="text-xs text-gray-600">방문상담</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai',
      title: 'AI 자동 정리 기능',
      icon: <Sparkles className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
            <h4 className="text-sm font-bold text-purple-900 mb-2">
              복잡한 상담 내용, AI가 깔끔하게 정리해드려요
            </h4>
            <p className="text-xs text-purple-800 leading-relaxed">
              상담하고 싶은 내용을 자유롭게 입력하시면, AI가 전문적인 형태로 정리해서 전문가에게 전달합니다.
              어떻게 써야 할지 고민할 필요 없어요!
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                상담 내용 자동 요약
              </h5>
              <div className="space-y-2">
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-xs text-gray-500 mb-1">입력 예시</p>
                  <p className="text-xs text-gray-700">
                    "작년에 프리랜서로 일했는데 종소세 신고를 어떻게 해야 할지 모르겠어요.
                    수입은 3천만원 정도였고 경비처리 같은 것도 받을 수 있는지 궁금해요"
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="bg-purple-100 rounded-full px-3 py-1">
                    <p className="text-xs text-purple-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI 정리
                    </p>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-2.5 border border-purple-200">
                  <p className="text-xs text-gray-500 mb-1">정리된 내용</p>
                  <p className="text-xs text-gray-700">
                    프리랜서 종합소득세 신고 관련 상담 요청입니다.
                    연 수입 약 3,000만원 규모이며, 필요경비 처리 방법과 절세 방안에 대한 안내가 필요합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                상담 유형 자동 추천
              </h5>
              <p className="text-xs text-gray-600 mb-2">
                입력한 내용을 분석해서 가장 적합한 상담 유형을 추천해드려요.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">종합소득세 신고 95%</span>
                <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">절세 상담 80%</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">기장 대행 60%</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                AI 기능은 상담 품질을 높이기 위한 보조 도구입니다.
                정리된 내용은 언제든 수정할 수 있어요.
              </span>
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'matching',
      title: '스마트 매칭 시스템',
      icon: <Users className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <h4 className="text-sm font-bold text-green-900 mb-2">
              조건에 딱 맞는 전문가를 자동으로 찾아드려요
            </h4>
            <p className="text-xs text-green-800 leading-relaxed">
              상담 신청 즉시, 업종과 지역이 일치하는 모든 전문가에게 알림이 전송됩니다.
              여러 전문가의 답변을 받아 비교할 수 있어요.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h5 className="text-sm font-semibold text-gray-900 mb-1">업종 매칭</h5>
              <p className="text-xs text-gray-600">
                선택한 업종의 전문가에게만 전달됩니다
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <h5 className="text-sm font-semibold text-gray-900 mb-1">지역 매칭</h5>
              <p className="text-xs text-gray-600">
                희망 지역에서 활동하는 전문가와 연결
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <h5 className="text-sm font-semibold text-gray-900 mb-2">매칭되는 전문가 업종</h5>
            <div className="flex flex-wrap gap-2">
              {['세무사', '회계사', '변호사', '법무사', '공인중개사', '인테리어', '이사/청소', '휴대폰 대리점', '정비소'].map(category => (
                <span key={category} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg">
                  {category}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h5 className="text-xs font-semibold text-amber-900 mb-1">💡 더 많은 답변을 받으려면?</h5>
            <ul className="text-xs text-amber-800 space-y-0.5">
              <li>• 상담 내용을 구체적으로 작성해주세요</li>
              <li>• 희망 지역을 넓게 설정하면 더 많은 전문가와 매칭됩니다</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'notification',
      title: '실시간 알림 서비스',
      icon: <Bell className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
            <h4 className="text-sm font-bold text-orange-900 mb-2">
              중요한 소식, 놓치지 않게 알려드려요
            </h4>
            <p className="text-xs text-orange-800 leading-relaxed">
              전문가 답변, 상담 연결 등 중요한 알림을 앱 알림과 SMS로 받아보세요.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <h5 className="text-sm font-semibold text-gray-900 mb-2">고객님이 받는 알림</h5>
              <div className="space-y-2">
                <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-2.5">
                  <Bell className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">전문가 답변 알림</p>
                    <p className="text-xs text-gray-600">"{'{전문가명}'} 전문가가 상담에 답변했습니다"</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-green-50 rounded-lg p-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">연결 완료 알림</p>
                    <p className="text-xs text-gray-600">전문가 연락처 정보와 함께 안내</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <h5 className="text-sm font-semibold text-gray-900 mb-2">전문가가 받는 알림</h5>
              <div className="space-y-2">
                <div className="flex items-start gap-2 bg-purple-50 rounded-lg p-2.5">
                  <MessageSquare className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">새 상담 요청</p>
                    <p className="text-xs text-gray-600">"새 {'{업종}'} 상담 요청이 있습니다"</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-green-50 rounded-lg p-2.5">
                  <Users className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">고객 연결 알림</p>
                    <p className="text-xs text-gray-600">"{'{고객명}'}님과 연결되었습니다. 연락처를 확인하세요"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <Bell className="w-5 h-5 mx-auto mb-1.5 text-gray-600" />
              <p className="text-xs font-medium text-gray-900">앱 알림</p>
              <p className="text-xs text-gray-500">실시간 푸시</p>
            </div>
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <MessageSquare className="w-5 h-5 mx-auto mb-1.5 text-gray-600" />
              <p className="text-xs font-medium text-gray-900">SMS 알림</p>
              <p className="text-xs text-gray-500">문자 발송</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'privacy',
      title: '연락처 보호 정책',
      icon: <Shield className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              연결 전까지 연락처는 안전하게 보호됩니다
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              전문가와 연결을 확정하기 전까지는 양측 연락처가 공개되지 않아요.
              답변 내용을 충분히 검토한 후 연결을 결정할 수 있습니다.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-700">단계별 정보 공개 범위</p>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">1</div>
                  <span className="text-xs text-gray-700">답변 대기</span>
                </div>
                <span className="text-xs text-gray-500">연락처 비공개</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">2</div>
                  <span className="text-xs text-gray-700">답변 완료</span>
                </div>
                <span className="text-xs text-blue-600">전문가 연락처 공개</span>
              </div>
              <div className="p-3 flex items-center justify-between bg-green-50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">3</div>
                  <span className="text-xs font-medium text-gray-900">연결 완료</span>
                </div>
                <span className="text-xs text-green-600 font-medium">양측 연락처 공개</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-blue-900 mb-1">고객 → 전문가</h5>
              <p className="text-xs text-blue-700">
                연결 후 이름, 연락처 전달
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-green-900 mb-1">전문가 → 고객</h5>
              <p className="text-xs text-green-700">
                답변 후 연락처 확인 가능
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800 flex items-start gap-2">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                고객 이름은 연결 알림 시 일부 마스킹 처리됩니다. (예: 홍길동 → 홍*동)
              </span>
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'faq',
      title: '자주 묻는 질문',
      icon: <MessageSquare className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          {[
            {
              q: '상담 비용이 있나요?',
              a: '상담 신청 및 전문가 매칭은 무료입니다. 실제 상담 비용은 전문가와 직접 협의하세요.'
            },
            {
              q: '답변을 받기까지 얼마나 걸리나요?',
              a: '보통 24시간 이내에 답변을 받을 수 있습니다. 업종과 지역에 따라 달라질 수 있어요.'
            },
            {
              q: '여러 전문가와 연결할 수 있나요?',
              a: '네, 한 상담 건으로 여러 전문가의 답변을 받고 원하는 전문가와 연결할 수 있습니다.'
            },
            {
              q: '비회원도 상담 신청이 가능한가요?',
              a: '네, 연락처만 입력하면 비회원도 상담 신청이 가능합니다. 다만 상담 내역 관리를 위해 회원가입을 권장드려요.'
            },
            {
              q: '상담 내용이 다른 사람에게 공개되나요?',
              a: '아니요, 상담 내용은 매칭된 전문가에게만 전달됩니다. 개인정보는 안전하게 보호됩니다.'
            },
            {
              q: '전문가 답변이 없으면 어떻게 되나요?',
              a: '7일간 답변이 없는 상담은 자동으로 만료됩니다. 새로운 상담을 신청해주세요.'
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
              <h5 className="text-sm font-semibold text-gray-900 mb-1.5 flex items-start gap-2">
                <span className="text-blue-500 font-bold">Q.</span>
                {item.q}
              </h5>
              <p className="text-xs text-gray-600 pl-5">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200 py-6">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4">
          <h1 className="text-lg md:text-xl font-bold mb-1.5 text-gray-900">전문가 상담 서비스 가이드</h1>
          <p className="text-gray-600 text-sm">AI 매칭으로 나에게 맞는 전문가를 빠르게 찾아보세요</p>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">AI 자동 정리</span>
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full whitespace-nowrap">
              <Users className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-700">스마트 매칭</span>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-full whitespace-nowrap">
              <Bell className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">실시간 알림</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full whitespace-nowrap">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">연락처 보호</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6 pb-24">
        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="text-blue-600">{section.icon}</div>
                  <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
                </div>
                {openSection === section.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {openSection === section.id && (
                <div className="p-4 pt-0 bg-gray-50">
                  <div className="bg-white p-4 rounded-lg">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-xl text-white text-center">
          <h3 className="font-bold mb-1">지금 바로 상담 신청하기</h3>
          <p className="text-sm text-blue-100 mb-3">전문가의 도움이 필요하신가요?</p>
          <a
            href="/consult"
            className="inline-block bg-white text-blue-600 font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-blue-50 transition-colors"
          >
            상담 신청하기
          </a>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            문의사항은 둥지마켓 카카오톡 채널로 연락주세요
          </p>
        </div>
      </div>
    </div>
  );
}
