import { authOptions } from '@/lib/auth';
import NextAuth from 'next-auth';
import { cookies } from 'next/headers';

// NextAuth 핸들러 정의
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
