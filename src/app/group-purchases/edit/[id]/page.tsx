import React from 'react';
import { Metadata } from 'next';
import EditGroupBuyForm from './EditGroupBuyForm';

export const metadata: Metadata = {
  title: '공구 수정 - 둥지마켓',
  description: '공구 정보를 수정하세요',
};

interface PageParams {
  id: string;
}

export default async function EditGroupBuyPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = await params;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">공구 수정</h1>
      <EditGroupBuyForm groupBuyId={resolvedParams.id} />
    </div>
  );
}