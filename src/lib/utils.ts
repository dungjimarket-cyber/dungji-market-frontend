import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 숫자에 천 단위 쉼표를 추가하는 함수
 * @param num 포맷팅할 숫자
 * @returns 천 단위 쉼표가 추가된 문자열
 */
export function formatNumberWithCommas(num: number | undefined): string {
  if (num === undefined || num === null) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 가격을 포맷팅하는 함수
 * @param price 포맷팅할 가격
 * @returns 포맷팅된 가격 문자열 (예: ₩123,456)
 */
export function formatPrice(price: number | undefined): string {
  if (price === undefined || price === null) return '₩0';
  return `₩${formatNumberWithCommas(price)}`;
}