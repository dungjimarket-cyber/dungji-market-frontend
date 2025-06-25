'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 검색창 컴포넌트
 * @param className - 추가 스타일 클래스
 * @param placeholder - 검색창 플레이스홀더 텍스트
 */
export function SearchBar({ 
  className = '', 
  placeholder = '공구마켓에서 검색하기'
}: { 
  className?: string;
  placeholder?: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <form 
      onSubmit={handleSearch}
      className={`flex items-center bg-gray-100 rounded-full overflow-hidden px-3 py-2 ${className}`}
    >
      <Search className="w-5 h-5 text-gray-400 mr-2" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent border-none outline-none flex-1 text-sm"
      />
    </form>
  );
}
