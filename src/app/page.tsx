import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Categories from '@/components/Categories';
import Link from 'next/link';
import GroupBuyList from '@/components/groupbuy/GroupBuyList';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-6">둥지마켓에 오신 것을 환영합니다!</h1>
        <p className="text-lg text-gray-600 mb-8">
          함께 모여 더 좋은 가격으로 구매하세요.
        </p>
        {!session && (
          <div className="flex gap-4">
            <Link
              href="/register"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              회원가입하기
            </Link>
            <Link
              href="/about"
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              둥지마켓 알아보기
            </Link>
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">카테고리</h2>
        <Categories />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">인기 공동구매</h2>
          <div className="space-y-4">
            <GroupBuyList type="popular" limit={4} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">새로운 공동구매</h2>
          <div className="space-y-4">
            <GroupBuyList type="recent" limit={4} />
          </div>
        </div>
      </section>
    </div>
  );
}
