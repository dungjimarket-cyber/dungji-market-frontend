import GroupBuyList from "@/components/groupbuy/GroupBuyList";

export default function CompletedPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">완료된 공동구매</h1>
      {/* GroupBuyList 컴포넌트를 사용하여 완료된 공동구매 표시 */}
            <GroupBuyList type="completed" />
      <p className="text-gray-500">완료된 공동구매가 없습니다.</p>
    </div>
  );
}
