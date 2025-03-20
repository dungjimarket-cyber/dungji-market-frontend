// 판매자 전용 레이아웃
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import SellerSidebar from '@/components/seller/SellerSidebar';

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role || session.user.role !== 'SELLER') {
    return new Response('Unauthorized', { status: 401 });
  }
  
  return (
    <div className="flex min-h-screen">
      <SellerSidebar />
      <main className="flex-1 p-8 bg-gray-50">
        {children}
      </main>
    </div>
  );
}
