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

/**
 * Date 객체를 UTC ISO 문자열로 변환하는 함수
 * Django 백엔드와 호환되도록 UTC 타임존을 포함한 ISO 8601 형식으로 반환
 * @param date Date 객체
 * @returns UTC ISO 문자열 (예: 2024-03-21T06:30:00Z)
 */
export function toKSTString(date: Date): string {
  // toISOString()은 자동으로 UTC로 변환하여 반환
  return date.toISOString();
}