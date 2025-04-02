import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import type { User } from 'next-auth';

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  sns_id?: string;
  sns_type?: string;
  accessToken?: string;
}

function isExtendedUser(user: User | undefined): user is User & {
  sns_id?: string;
  sns_type?: string;
  accessToken?: string;
} {
  return (
    typeof user === 'object' &&
    user !== null &&
    ('sns_id' in user || 'sns_type' in user || 'accessToken' in user)
  );
}

export function useAuth() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (status === 'authenticated' && session?.user) {
        try {
          const headers: HeadersInit = {};
          if (session.user.accessToken) {
            headers['Authorization'] = `Bearer ${session.user.accessToken}`;
          }
    
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/`, { headers });
          const data = await response.json();
    
          if (isExtendedUser(session.user)) {
            const { sns_id, sns_type, accessToken } = session.user;
            setUser({
              ...data,
              sns_id,
              sns_type,
              accessToken,
            });
          } else {
            setUser(data);
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
          setUser(null);
        }
      } else if (status === 'unauthenticated') {
        // User is not authenticated
        // No need to handle headers as fetch doesn't maintain default headers
      }
      setLoading(false);
    };

    initializeAuth();
  }, [session, status]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isLoading: status === 'loading' || loading,
  };
}
