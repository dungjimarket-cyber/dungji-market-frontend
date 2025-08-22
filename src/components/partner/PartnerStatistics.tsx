'use client';

import { useEffect, useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { partnerService } from '@/lib/api/partnerService';
import { PartnerStats } from '@/types/partner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface PartnerStatisticsProps {
  className?: string;
}

export default function PartnerStatistics({ className }: PartnerStatisticsProps) {
  const [stats, setStats] = useState<PartnerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'month' | 'week'>('month');

  const loadStatistics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await partnerService.getStatistics(period);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '통계 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [period]);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // 차트 데이터 준비
  const labels = stats.map(stat => {
    const date = new Date(stat.period);
    return period === 'month' 
      ? `${date.getMonth() + 1}월`
      : `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const signupData = {
    labels,
    datasets: [
      {
        label: '신규 가입자',
        data: stats.map(stat => stat.signup_count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: '구독자',
        data: stats.map(stat => stat.subscription_count),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.3,
        fill: true,
      }
    ],
  };

  const revenueData = {
    labels,
    datasets: [
      {
        label: '수수료 수익',
        data: stats.map(stat => stat.revenue),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 1,
      }
    ],
  };

  // 최근 데이터로 도넛 차트 생성
  const recentStats = stats[stats.length - 1];
  const conversionRate = recentStats ? 
    (recentStats.subscription_count / Math.max(recentStats.signup_count, 1) * 100) : 0;

  const conversionData = {
    labels: ['구독 전환', '미전환'],
    datasets: [
      {
        data: [conversionRate, 100 - conversionRate],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(229, 231, 235, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(156, 163, 175)',
        ],
        borderWidth: 2,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const revenueOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      },
    },
  };

  const conversionOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed.toFixed(1)}%`;
          }
        }
      }
    },
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 mr-2" />
          <h2 className="text-2xl font-bold">통계 분석</h2>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('month')}
          >
            <Calendar className="h-4 w-4 mr-1" />
            월별
          </Button>
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('week')}
          >
            <Calendar className="h-4 w-4 mr-1" />
            주별
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {recentStats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">이번달 신규 가입</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {recentStats.signup_count}명
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">전환율</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {conversionRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">이번달 수익</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(recentStats.revenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>회원 가입 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <Line data={signupData} options={chartOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>수수료 수익 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={revenueData} options={revenueOptions} />
          </CardContent>
        </Card>
      </div>

      {/* Conversion Chart */}
      <Card>
        <CardHeader>
          <CardTitle>구독 전환율 ({period === 'month' ? '이번달' : '이번주'})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md mx-auto">
            <Doughnut data={conversionData} options={conversionOptions} />
          </div>
          <div className="text-center mt-4 text-sm text-gray-600">
            {recentStats && (
              <>
                신규 가입 {recentStats.signup_count}명 중 {recentStats.subscription_count}명이 구독으로 전환
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}