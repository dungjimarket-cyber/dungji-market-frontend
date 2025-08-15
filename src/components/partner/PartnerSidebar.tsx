'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePartner } from '@/contexts/PartnerContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  BarChart3,
  Users,
  Link2,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Menu,
  Download,
} from 'lucide-react';

const menuItems = [
  {
    href: '/partner-dashboard',
    icon: BarChart3,
    label: '대시보드',
  },
  {
    href: '/partner-dashboard/members',
    icon: Users,
    label: '추천 회원 관리',
  },
  {
    href: '/partner-dashboard/referral-link',
    icon: Link2,
    label: '추천링크 관리',
  },
  {
    href: '/partner-dashboard/settlements',
    icon: CreditCard,
    label: '정산 관리',
  },
  {
    href: '/partner-dashboard/export',
    icon: Download,
    label: '데이터 내보내기',
  },
  {
    href: '/partner-dashboard/notifications',
    icon: Bell,
    label: '알림',
  },
  {
    href: '/partner-dashboard/settings',
    icon: Settings,
    label: '설정',
  },
];

interface SidebarContentProps {
  onItemClick?: () => void;
}

function SidebarContent({ onItemClick }: SidebarContentProps) {
  const pathname = usePathname();
  const { partner, logout } = usePartner();

  const isActive = (href: string) => {
    if (href === '/partner-dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">둥지마켓</h1>
        <p className="text-sm text-gray-600">파트너 센터</p>
        {partner && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">{partner.partner_name}</p>
            <p className="text-xs text-gray-500">{partner.partner_code}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    active
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={onItemClick}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={logout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          로그아웃
        </Button>
      </div>
    </div>
  );
}

export default function PartnerSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 lg:bg-white lg:border-r lg:border-gray-200">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">둥지마켓</h1>
            <p className="text-xs text-gray-600">파트너 센터</p>
          </div>
          
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent onItemClick={() => setIsMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}