// 제품 선택 및 입찰 조건 설정을 위한 폼
import { useGroupPurchaseStore } from '@/stores/useGroupPurchase';

export default function CreateForm() {
  const { addPurchase } = useGroupPurchaseStore();

  // 폼 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 임시 데이터 구조
    const newPurchase = {
      id: Date.now().toString(),
      title: '삼성 갤럭시 S24 공동구매',
      productName: '삼성 갤럭시 S24',
      description: '삼성 갤럭시 S24 공동구매입니다.',
      currentBid: 0,
      minBid: 1000,
      endTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      bidHistory: [],
      status: 'ongoing' as const,
      sellerId: 'current-user-id' // TODO: Replace with actual user ID
    };
    addPurchase(newPurchase);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow-md">
      <div>
        <label className="block text-sm font-medium text-gray-700">제품 선택</label>
        <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
          <option>휴대폰</option>
          <option>가전제품</option>
          <option>인터넷</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        공구 생성
      </button>
    </form>
  );
}
