import 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: string;
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
