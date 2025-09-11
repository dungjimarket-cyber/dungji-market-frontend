'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, Bell, Package, Users, Settings, TrendingUp,
  FileText, Store, AlertCircle, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const adminMenus = [
    {
      title: '노쇼 관리',
      description: '노쇼 신고 및 이의제기 관리',
      icon: Shield,
      href: '/admin/noshow',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: '공지사항 관리',
      description: 'Django Admin에서 공지사항 관리',
      icon: Bell,
      href: 'https://api.dungjimarket.com/admin/api/notice/',
      external: true,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: '기존 관리 페이지',
      description: '셀러 승인, 공구 동의서, 상품 등록',
      icon: Settings,
      href: '/admin',
      color: 'text-dungji-primary',
      bgColor: 'bg-dungji-primary-50'
    },
    {
      title: '사용자 관리',
      description: 'Django Admin에서 사용자 관리',
      icon: Users,
      href: 'https://api.dungjimarket.com/admin/api/user/',
      external: true,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: '공구 관리',
      description: 'Django Admin에서 공구 관리',
      icon: Package,
      href: 'https://api.dungjimarket.com/admin/api/groupbuy/',
      external: true,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: '배너/이벤트 관리',
      description: 'Django Admin에서 배너 및 이벤트 관리',
      icon: TrendingUp,
      href: 'https://api.dungjimarket.com/admin/api/banner/',
      external: true,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">관리자 대시보드</h1>
          <p className="text-gray-600">둥지마켓 관리 기능에 빠르게 접근하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminMenus.map((menu) => (
            menu.external ? (
              <a
                key={menu.title}
                href={menu.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className={`w-12 h-12 ${menu.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                      <menu.icon className={`w-6 h-6 ${menu.color}`} />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {menu.title}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </CardTitle>
                    <CardDescription>{menu.description}</CardDescription>
                  </CardHeader>
                </Card>
              </a>
            ) : (
              <Link key={menu.title} href={menu.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className={`w-12 h-12 ${menu.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                      <menu.icon className={`w-6 h-6 ${menu.color}`} />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {menu.title}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </CardTitle>
                    <CardDescription>{menu.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          ))}
        </div>

        <div className="mt-12 p-6 bg-yellow-50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">관리자 안내사항</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Django Admin 링크는 새 창에서 열립니다</li>
                <li>• Django Admin 접속 시 별도 로그인이 필요할 수 있습니다</li>
                <li>• 노쇼 관리는 프론트엔드 커스텀 페이지입니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}