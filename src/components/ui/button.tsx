import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dungji-primary/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // 메인 그린 버튼
        default:
          "bg-dungji-primary text-white shadow-md hover:bg-dungji-primary-dark hover:shadow-lg transform hover:-translate-y-0.5",
        // 파괴적 액션 - 새로운 Danger 색상
        destructive:
          "bg-dungji-danger text-white shadow-sm hover:bg-dungji-danger-dark active:bg-dungji-danger-darker",
        // Danger 버튼 (destructive 별칭)
        danger:
          "bg-dungji-danger text-white shadow-md hover:bg-dungji-danger-dark hover:shadow-lg transform hover:-translate-y-0.5 active:bg-dungji-danger-darker",
        // Danger 아웃라인
        "outline-danger":
          "border-2 border-dungji-danger text-dungji-danger bg-transparent hover:bg-dungji-danger hover:text-white shadow-sm",
        // Danger 소프트
        "soft-danger":
          "bg-dungji-danger-50 text-dungji-danger-700 border border-dungji-danger-200 hover:bg-dungji-danger-100",
        // 아웃라인 버튼 - 그린 테두리
        outline:
          "border-2 border-dungji-primary text-dungji-primary bg-transparent hover:bg-dungji-primary hover:text-white shadow-sm",
        // 서브 블루 버튼
        secondary:
          "bg-dungji-secondary text-white shadow-md hover:bg-dungji-secondary-dark hover:shadow-lg transform hover:-translate-y-0.5",
        // 고스트 버튼
        ghost: 
          "hover:bg-dungji-primary-50 hover:text-dungji-primary-700",
        // 링크 스타일
        link: 
          "text-dungji-primary underline-offset-4 hover:underline",
        // 소프트 버튼 - 크림 배경
        soft:
          "bg-dungji-cream text-dungji-primary-700 border border-dungji-primary-200 hover:bg-dungji-cream-dark shadow-sm",
        // 아웃라인 서브 - 블루 테두리
        "outline-secondary":
          "border-2 border-dungji-secondary text-dungji-secondary bg-transparent hover:bg-dungji-secondary hover:text-white shadow-sm",
        // 그라디언트 버튼
        gradient:
          "bg-gradient-to-r from-dungji-primary to-dungji-secondary text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
        // 아웃라인 소프트 - 연한 테두리
        "outline-soft":
          "border border-dungji-primary-300 text-dungji-primary-600 bg-white hover:bg-dungji-primary-50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
