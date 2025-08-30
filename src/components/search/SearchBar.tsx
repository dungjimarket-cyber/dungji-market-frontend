'use client';

import { Search, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

/**
 * 검색창 컴포넌트
 * @param className - 추가 스타일 클래스
 * @param placeholder - 검색창 플레이스홀더 텍스트
 * @param showMyRegionButton - 내지역 버튼 표시 여부
 */
export function SearchBar({ 
  className = '', 
  placeholder = '통합검색',
  showMyRegionButton = false
}: { 
  className?: string;
  placeholder?: string;
  showMyRegionButton?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/group-purchases?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleMyRegionClick = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    // 사용자의 지역 정보를 기반으로 필터링
    if (user.address_region) {
      const regionName = user.address_region.name || user.address_region.full_name;
      router.push(`/group-purchases?region=${encodeURIComponent(regionName)}`);
    } else {
      alert('내 지역 정보가 설정되지 않았습니다. 내 정보 설정에서 지역을 설정해주세요.');
      router.push('/mypage/settings');
    }
  };

  return (
    <div className={`flex items-center gap-2 w-full ${className}`}>
      <form 
        onSubmit={handleSearch}
        className="flex-1 min-w-0 flex items-center bg-gray-100 rounded-full overflow-hidden px-3 py-2"
      >
        <Search className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent border-none outline-none flex-1 text-sm min-w-0"
        />
      </form>
      
      {showMyRegionButton && (
        <Button
          type="button"
          onClick={handleMyRegionClick}
          variant="outline"
          size="sm"
          className="flex items-center gap-1 rounded-full px-3 py-1 flex-shrink-0 text-xs"
        >
          <MapPin className="w-3 h-3" />
          <span className="whitespace-nowrap">내지역</span>
        </Button>
      )}
    </div>
  );
}
