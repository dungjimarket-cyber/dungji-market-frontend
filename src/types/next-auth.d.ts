import 'next-auth';

declare module 'next-auth' {
  interface User {
    id?: string | number;
    role?: string;
    roles?: string[];
    username?: string; // 닉네임
    nickname?: string; // 대체 닉네임 필드
    accessToken?: string;
    jwt?: {
      access: string;
      refresh: string;
    };
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
