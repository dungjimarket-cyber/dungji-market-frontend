'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import { formatDate } from '@/lib/utils';

interface GroupBuy {
  id: number;
  title: string;
  description: string;
  product_name: string;
  end_time: string;
  start_time: string;
  status: string;
  current_participants: number;
  min_participants: number;
  max_participants: number;
}

interface GroupBuyListProps {
  type?: 'all' | 'active' | 'completed' | 'popular' | 'recent';
  limit?: number;
}

export default function GroupBuyList({ type = 'all', limit }: GroupBuyListProps) {
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGroupBuys = async () => {
      try {
        let url = '/api/groupbuys/';
        
        if (type === 'popular') {
          url = '/api/groupbuys/popular/';
        } else if (type === 'recent') {
          url = '/api/groupbuys/recent/';
        } else if (type !== 'all') {
          url = `/api/groupbuys/?status=${type}`;
        }

        const response = await apiClient.get(url);
        let data = response.data;
        
        if (limit) {
          data = data.slice(0, limit);
        }
        
        setGroupBuys(data);
        setLoading(false);
      } catch (err) {
        setError('공동구매 목록을 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchGroupBuys();
  }, [type, limit]);

  if (loading) {
    return <div className="text-center">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (groupBuys.length === 0) {
    return <div className="text-gray-500">진행중인 공동구매가 없습니다.</div>;
  }

  return (
    <div className="space-y-4">
      {groupBuys.map((groupBuy) => (
        <Link
          href={`/groupbuys/${groupBuy.id}`}
          key={groupBuy.id}
          className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold mb-2">{groupBuy.title || groupBuy.product_name}</h3>
              <p className="text-gray-600 text-sm mb-2">{groupBuy.description || '설명이 없습니다.'}</p>
              <div className="flex space-x-4 text-sm">
                <span className="text-blue-600">
                  {groupBuy.current_participants}명 참여
                </span>
                <span className="text-gray-500">
                  마감일: {formatDate(groupBuy.end_time)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                참여인원: {groupBuy.current_participants} / {groupBuy.max_participants}
              </div>
              <div className="mt-2">
                <span className={`px-2 py-1 text-sm rounded ${
                  new Date(groupBuy.end_time) > new Date()
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {new Date(groupBuy.end_time) > new Date() ? '진행중' : '완료'}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
