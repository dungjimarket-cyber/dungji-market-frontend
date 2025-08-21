# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Dungji Market (둥지마켓) is a Next.js-based group purchasing platform for telecommunications and internet services in Korea. Users can create and participate in group purchases to get better deals on mobile plans, internet services, and electronics.

## Development Commands

### Core Commands
```bash
npm run dev           # Start development server (http://localhost:3000)
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
npm run test          # Run Jest tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Testing Specific Files
```bash
npm test -- src/__tests__/issue-verification.test.tsx  # Run specific test file
npm test -- --updateSnapshot                           # Update test snapshots
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.1.6 with App Router
- **UI**: React 19, Tailwind CSS, Radix UI components
- **State Management**: Zustand for global state, React Hook Form for forms
- **Authentication**: NextAuth.js with JWT tokens, supports Kakao/Google OAuth
- **Backend Integration**: Axios for API calls, WebSocket for real-time features
- **Testing**: Jest with React Testing Library
- **Deployment**: Vercel with serverless functions

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable React components organized by feature
- `src/contexts/` - React Context providers (AuthContext, PartnerContext)
- `src/lib/` - Utility functions and service layers
- `src/stores/` - Zustand stores for state management
- `src/types/` - TypeScript type definitions

### Authentication Flow
The app uses a dual authentication system:
1. **NextAuth.js** for OAuth providers (Kakao, Google)
2. **Custom JWT** implementation for email/password authentication
3. Auth tokens are stored in localStorage and managed via AuthContext
4. Role-based access control for buyers (일반회원) and sellers (판매자)

### API Integration Pattern
- Base API URL: Set via `NEXT_PUBLIC_API_URL` environment variable
- Auth headers automatically attached via axios interceptors
- Token refresh handled automatically on 401 responses
- API services organized in `src/lib/api/` by feature

### Key Features & Routes

#### User Types
- **일반회원 (Buyers)**: Can create/join group purchases
- **판매자 (Sellers)**: Can bid on group purchases, requires business verification

#### Main Pages
- `/` - Homepage with active group purchases
- `/group-purchases/create` - Create new group purchase
- `/groupbuys/[id]` - Group purchase detail page
- `/mypage` - User dashboard (different views for buyers/sellers)
- `/seller-dashboard` - Seller management interface
- `/bid-tickets` - Bid token purchase page

### Component Patterns
- Use existing UI components from `src/components/ui/`
- Follow shadcn/ui patterns for new components
- Client components marked with `'use client'` directive
- Server components by default in App Router

### Form Handling
- Use React Hook Form with Zod validation
- Form schemas defined alongside components
- Validation errors displayed via form.formState.errors

### Real-time Features
- Bid updates via WebSocket connections
- Timer synchronization for auction deadlines
- Notification system for bid status changes

## Environment Variables Required
```
NEXT_PUBLIC_API_URL              # Backend API URL
NEXT_PUBLIC_APP_URL              # Frontend URL
NEXTAUTH_URL                     # NextAuth base URL
NEXTAUTH_SECRET                  # NextAuth encryption secret
JWT_SECRET                       # JWT signing secret
KAKAO_CLIENT_ID                  # Kakao OAuth credentials
KAKAO_CLIENT_SECRET
GOOGLE_CLIENT_ID                 # Google OAuth credentials
GOOGLE_CLIENT_SECRET
```

## Common Development Tasks

### Adding a New Page
1. Create route in `src/app/[route]/page.tsx`
2. Add navigation link in DesktopNavbar/MobileNavbar if needed
3. Implement authentication check if required

### Creating API Routes
1. Add route handler in `src/app/api/[route]/route.ts`
2. Use NextResponse for responses
3. Handle auth verification via JWT tokens

### Working with Group Purchases
- Main types defined in `src/types/groupbuy.ts`
- State management via `src/stores/useGroupPurchase.ts`
- API services in `src/lib/api/`

### Styling Guidelines
- Use Tailwind CSS utility classes
- Follow existing component patterns
- Responsive design with mobile-first approach
- Dark mode not currently implemented

## Development Workflow

**IMPORTANT: After implementing any feature or fix, ALWAYS follow this workflow:**

1. **Build the project** to check for compilation errors:
   ```bash
   npm run build
   ```

2. **Test the changes** locally if applicable:
   ```bash
   npm run dev
   # Test the feature in the browser
   ```

3. **Commit and push** the changes:
   ```bash
   git add -A
   git commit -m "type: description of changes
   
   - Detail 1
   - Detail 2
   
   🤖 Generated with [Claude Code](https://claude.ai/code)
   
   Co-Authored-By: Claude <noreply@anthropic.com>"
   git push origin main
   ```

**This workflow ensures:**
- Code compiles without errors before deployment
- Changes are tested locally
- All changes are properly versioned and deployed
- Vercel automatically deploys on push to main

## Testing Approach
- Unit tests for utilities and hooks
- Integration tests for critical user flows
- Test files located alongside components or in `__tests__` directories
- Mock API responses for testing

## Deployment Notes
- Deployed on Vercel
- Serverless functions for API routes with 60s timeout
- Cron jobs configured for status updates
- Image optimization disabled due to Vercel free tier limits