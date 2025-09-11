import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-dungji-primary/50 focus:ring-offset-2",
  {
    variants: {
      variant: {
        // 메인 그린 배지
        default:
          "border-transparent bg-dungji-primary text-white hover:bg-dungji-primary-dark",
        // 서브 블루 배지
        secondary:
          "border-transparent bg-dungji-secondary text-white hover:bg-dungji-secondary-dark",
        // 파괴적 액션 - 새로운 Danger 색상
        destructive:
          "border-transparent bg-dungji-danger text-white hover:bg-dungji-danger-dark",
        // Danger 배지
        danger:
          "border-transparent bg-dungji-danger text-white",
        // Danger 아웃라인
        "outline-danger":
          "border-dungji-danger text-dungji-danger bg-transparent",
        // Danger 소프트
        "soft-danger":
          "border-transparent bg-dungji-danger-50 text-dungji-danger-700 hover:bg-dungji-danger-100",
        // 아웃라인 스타일
        outline: 
          "border-dungji-primary text-dungji-primary bg-transparent",
        // 소프트 그린
        soft:
          "border-transparent bg-dungji-primary-50 text-dungji-primary-700 hover:bg-dungji-primary-100",
        // 소프트 블루
        "soft-secondary":
          "border-transparent bg-dungji-secondary-50 text-dungji-secondary-700 hover:bg-dungji-secondary-100",
        // 크림 배지
        cream:
          "border-dungji-primary-200 bg-dungji-cream text-dungji-primary-700",
        // 성공 상태
        success:
          "border-transparent bg-dungji-primary text-white",
        // 경고 상태
        warning:
          "border-transparent bg-amber-500 text-white",
        // 정보 상태
        info:
          "border-transparent bg-dungji-secondary text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
