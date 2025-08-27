import 'next-auth';

declare module 'next-auth' {
  interface User {
    id?: string | number;
    role?: string;
    roles?: string[];
    username?: string; // 닉네임
    nickname?: string; // 대체 닉네임 필드
    accessToken?: string;
    birth_date?: string; // 생년월일 (YYYY-MM-DD)
    gender?: 'M' | 'F'; // 성별
    jwt?: {
      access: string;
      refresh: string;
    };
    // 판매회원 필드
    address_region?: {
      id?: string;
      code?: string;
      name?: string;
      full_name?: string;
      level?: number;
    };
    seller_category?: string;
    representative_name?: string;
    business_reg_number?: string;
    business_verified?: boolean;
    user_type?: string;
    first_name?: string;
    business_number?: string;
    is_business_verified?: boolean;
  }

  interface Session {
    user: User & {
      role?: string;
      accessToken?: string;
      jwt?: {
        access: string;
        refresh: string;
      };
    };
    accessToken?: string;
    jwt?: {
      access: string;
      refresh: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    accessToken?: string;
    jwt?: {
      access: string;
      refresh: string;
    };
  }
}
