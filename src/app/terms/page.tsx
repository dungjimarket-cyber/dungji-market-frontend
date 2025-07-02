'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TermsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'seller'>('general');

  const handleTabChange = (tab: 'general' | 'seller') => {
    setActiveTab(tab);
    router.push(`/terms/${tab}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">둥지마켓 이용약관</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'general'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => handleTabChange('general')}
          >
            일반 회원 약관
          </button>
          <button
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'seller'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => handleTabChange('seller')}
          >
            판매 회원 약관
          </button>
        </div>

        <div className="p-6 text-center">
          <p className="text-lg mb-8">
            둥지마켓을 이용하시기 전에 해당하는 이용약관을 확인해주세요.
          </p>
          
          <div className="flex justify-center space-x-6">
            <Link
              href="/terms/general"
              className="btn-animated btn-primary py-3 px-6"
            >
              <span>일반 회원 약관 보기</span>
            </Link>
            <Link
              href="/terms/seller"
              className="btn-animated btn-secondary py-3 px-6"
            >
              <span>판매 회원 약관 보기</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
