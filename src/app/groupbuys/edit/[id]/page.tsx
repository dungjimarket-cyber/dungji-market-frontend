import React from 'react';
import { Metadata } from 'next';
import EditForm from './EditForm';

export const metadata: Metadata = {
  title: '공구 수정 - 둥지마켓',
  description: '공구를 수정하세요',
};

/**
 * 그룹 구매 수정 페이지 파라미터
 */
interface PageParams {
  id: string;
}

/**
 * 그룹 구매 수정 페이지 컴포넌트
 */
export default async function EditGroupBuyPage({ params }: { params: Promise<PageParams> }) {
  // params가 Promise이므로 await 처리
  const resolvedParams = await params;
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">공구 수정</h1>
      <EditForm groupBuyId={resolvedParams.id} />
    </div>
  );
}
