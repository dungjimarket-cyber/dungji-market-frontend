"use client"

/**
 * 별점을 표시하고 선택할 수 있는 컴포넌트
 */
import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  /** 초기 별점 값 (1-5) */
  initialRating?: number;
  /** 별점 변경 시 호출되는 콜백 함수 */
  onChange?: (rating: number) => void;
  /** 읽기 전용 모드 여부 */
  readOnly?: boolean;
  /** 별 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 컴포넌트에 적용할 추가 클래스 */
  className?: string;
}

/**
 * 별점을 표시하고 선택할 수 있는 컴포넌트
 * 
 * @example
 * // 읽기 전용 별점
 * <StarRating initialRating={4.5} readOnly />
 * 
 * // 별점 선택 가능
 * <StarRating initialRating={3} onChange={(rating) => console.log(`Selected rating: ${rating}`)} />
 */
const StarRating: React.FC<StarRatingProps> = ({
  initialRating = 0,
  onChange,
  readOnly = false,
  size = 'md',
  className = '',
}) => {
  const [rating, setRating] = useState<number>(initialRating);
  const [hoverRating, setHoverRating] = useState<number>(0);

  // 별 크기에 따른 클래스 결정
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  /**
   * 별점 변경 처리 함수
   */
  const handleRatingChange = (newRating: number) => {
    if (readOnly) return;
    
    setRating(newRating);
    onChange && onChange(newRating);
  };

  /**
   * 마우스 호버 시 별점 표시 함수
   */
  const handleMouseEnter = (index: number) => {
    if (readOnly) return;
    setHoverRating(index);
  };

  /**
   * 마우스 나갈 시 호버 별점 초기화
   */
  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
  };

  // 배열로 별 5개 생성
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  
  // 소수점 별점 표시를 위한 처리
  const roundedRating = Math.round(rating * 2) / 2; // 0.5 단위로 반올림
  
  return (
    <div 
      className={`flex items-center ${className}`} 
      onMouseLeave={handleMouseLeave}
    >
      {stars.map((index) => {
        // 현재 별이 꽉 찬 별인지 반 별인지 빈 별인지 결정
        const displayRating = hoverRating || roundedRating;
        const isFilled = index <= displayRating;
        const isHalfFilled = !isFilled && index - 0.5 <= displayRating;
        
        return (
          <div
            key={index}
            className="relative cursor-pointer"
            onClick={() => handleRatingChange(index)}
            onMouseEnter={() => handleMouseEnter(index)}
          >
            <Star
              className={`${sizeClass} ${
                readOnly ? 'cursor-default' : 'cursor-pointer'
              } ${
                isFilled 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : isHalfFilled 
                    ? 'text-yellow-400' 
                    : 'text-gray-300'
              }`}
              strokeWidth={1.5}
            />
            {isHalfFilled && (
              <div 
                className="absolute inset-0 overflow-hidden" 
                style={{ width: '50%' }}
              >
                <Star
                  className={`${sizeClass} text-yellow-400 fill-yellow-400`}
                  strokeWidth={1.5}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StarRating;
