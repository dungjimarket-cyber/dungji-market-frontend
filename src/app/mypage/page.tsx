import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileSection from '@/components/mypage/ProfileSection';

export default async function MyPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">마이페이지</h1>
      <div className="space-y-6">
        <ProfileSection />
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">참여중인 공동구매</h2>
          {/* TODO: Add participating group purchases list */}
          <p className="text-gray-500">참여중인 공동구매가 없습니다.</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">주문 내역</h2>
          {/* TODO: Add order history */}
          <p className="text-gray-500">주문 내역이 없습니다.</p>
        </div>
      </div>
    </div>
  );
}
