'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SellerSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: '입찰 관리', href: '/seller-dashboard/bids' },
    { name: '상품 등록', href: '/seller-dashboard/products' },
    { name: '매출 통계', href: '/seller-dashboard/analytics' },
    { name: '고객 문의', href: '/seller-dashboard/inquiries' },
  ];

  return (
    <aside className="w-64 bg-white border-r">
      <nav className="p-4">
        <h2 className="text-lg font-semibold mb-4">판매자 메뉴</h2>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block p-2 rounded-md ${pathname === item.href ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
