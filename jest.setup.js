import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Filter: ({ className, ...props }) => <div data-testid="filter-icon" className={className} {...props} />,
  ChevronDown: ({ className, ...props }) => <div data-testid="chevron-down-icon" className={className} {...props} />,
  X: ({ className, ...props }) => <div data-testid="x-icon" className={className} {...props} />,
  Check: ({ className, ...props }) => <div data-testid="check-icon" className={className} {...props} />,
}))

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000/api'
