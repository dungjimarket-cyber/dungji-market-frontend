'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  currentParticipants: number;
  maxParticipants: number;
  imageUrl: string;
  status: 'ongoing' | 'completed' | 'pending';
  deadline?: string;
}

export function ProductCard({
  id,
  title,
  price,
  currentParticipants,
  maxParticipants,
  imageUrl,
  status,
  deadline
}: ProductCardProps) {
  const statusColor = {
    ongoing: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800'
  };

  const statusText = {
    ongoing: '진행중',
    completed: '완료',
    pending: '대기중'
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 w-full">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
          <Badge variant="secondary" className={statusColor[status]}>
            {statusText[status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          <p className="text-2xl font-bold">
            {price.toLocaleString()}원
          </p>
          <p className="text-sm text-gray-500">
            {currentParticipants}/{maxParticipants}명 참여중
          </p>
          {deadline && (
            <p className="text-sm text-gray-500">
              마감까지 {deadline}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link href={`/groupbuys/${id}`} className="w-full">
          <Button className="w-full">
            공구 참여하기
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
