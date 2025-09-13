'use client';

import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface UserRatingBadgeProps {
  userId: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function UserRatingBadge({
  userId,
  showCount = true,
  size = 'sm'
}: UserRatingBadgeProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/used/users/${userId}/rating/`
        );
        setStats({
          avg_rating: response.data.average_rating,
          total_reviews: response.data.total_reviews
        });
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchStats();
    }
  }, [userId]);

  if (loading || !stats || stats.total_reviews === 0) {
    return null;
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'lg':
        return 'text-sm gap-1';
      case 'md':
        return 'text-xs gap-0.5';
      default:
        return 'text-xs gap-0.5';
    }
  };

  const getStarSize = () => {
    switch (size) {
      case 'lg':
        return 'h-4 w-4';
      case 'md':
        return 'h-3.5 w-3.5';
      default:
        return 'h-3 w-3';
    }
  };

  const rating = stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : '0.0';

  return (
    <div className={`inline-flex items-center ${getSizeClasses()}`}>
      <Star className={`${getStarSize()} fill-yellow-400 text-yellow-400`} />
      <span className="font-medium">{rating}</span>
      {showCount && (
        <span className="text-gray-500">({stats.total_reviews})</span>
      )}
    </div>
  );
}