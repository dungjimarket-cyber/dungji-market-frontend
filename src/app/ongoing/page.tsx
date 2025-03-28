'use client';

import GroupBuyList from '@/components/groupbuy/GroupBuyList';

export default function OngoingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">진행중인 공동구매</h1>
      {/* GroupBuyList 컴포넌트를 사용하여 진행 중인 공동구매 표시 */}
      <GroupBuyList type="active" />
    </div>
  );
}