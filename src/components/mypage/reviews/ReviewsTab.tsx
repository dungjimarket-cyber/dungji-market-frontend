'use client';

import { useEffect, useState } from 'react';
import MyTradeReviews from '@/components/used/MyTradeReviews';
import { useAuth } from '@/contexts/AuthContext';

export default function ReviewsTab() {
  const { user } = useAuth();
  const [userId, setUserId] = useState<number | undefined>();

  useEffect(() => {
    // 사용자 ID 가져오기
    const fetchUserId = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token || !user) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserId(data.id);
        }
      } catch (error) {
        console.error('Failed to fetch user ID:', error);
      }
    };

    fetchUserId();
  }, [user]);

  return (
    <div className="bg-white rounded-lg p-4">
      <MyTradeReviews userId={userId} />
    </div>
  );
}