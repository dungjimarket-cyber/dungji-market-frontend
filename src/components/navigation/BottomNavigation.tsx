'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, User } from 'lucide-react';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavigationItem[] = [
  {
    href: '/',
    label: '홈',
    icon: Home,
  },
  {
    href: '/search',
    label: '검색',
    icon: Search,
  },
  {
    href: '/group-purchases/create',
    label: '등록',
    icon: Plus,
  },
  {
    href: '/profile',
    label: '마이',
    icon: User,
  },
];

/**
 * 하단 네비게이션 바 컴포넌트
 */
export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === '/' && pathname === '/group-purchases') ||
            (item.href === '/profile' && pathname.startsWith('/profile'));
          
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                isActive 
                  ? 'text-purple-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
