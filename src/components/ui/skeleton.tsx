import { cn } from "@/lib/utils";

/**
 * 로딩 상태 표시를 위한 스켈레톤 컴포넌트
 * @param className - 추가 CSS 클래스
 * @param props - 기타 HTML div 요소 속성
 * @returns Skeleton 컴포넌트
 * @example
 * <Skeleton className="h-20 w-full" />
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
