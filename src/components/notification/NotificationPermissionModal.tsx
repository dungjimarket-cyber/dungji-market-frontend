'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAllow: () => void;
}

export default function NotificationPermissionModal({
  isOpen,
  onClose,
  onAllow,
}: NotificationPermissionModalProps) {
  if (!isOpen) return null;

  const handleAllow = () => {
    onAllow();
    onClose();
  };

  const handleLater = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
        {/* 닫기 버튼 */}
        <button
          onClick={handleLater}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 로고 */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
            <Image
              src="/logos/dungji_logo.jpg"
              alt="둥지마켓"
              width={48}
              height={48}
              className="rounded-full"
            />
          </div>
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-bold text-center mb-2">
          거래과정 푸시알림 받기
        </h3>

        {/* 설명 */}
        <p className="text-sm text-gray-600 text-center mb-6">
          공구 참여 과정, 중고거래(거래수락,취소) 등<br />
          중요한 거래 정보를 놓치지 마세요!
        </p>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleLater}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            나중에
          </button>
          <button
            onClick={handleAllow}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            알림 받기
          </button>
        </div>
      </div>
    </div>
  );
}
