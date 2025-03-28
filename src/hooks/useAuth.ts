import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/axios';
import type { DefaultUser } from 'next-auth';
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
          // Set auth token for all subsequent requests
          if (session.user.accessToken) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${session.user.accessToken}`;
          }

          // Get user details from backend
          const response = await apiClient.get('/api/user/');
          if (isExtendedUser(session.user)) {
            const { sns_id, sns_type, accessToken } = session.user as User & {
              sns_id?: string;
              sns_type?: string;
              accessToken?: string;
            };
            setUser({
              ...response.data,
              sns_id,
              sns_type,
              accessToken,
            });
          } else {
            setUser(response.data);
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
          setUser(null);
        }
      } else if (status === 'unauthenticated') {
        setUser(null);
        delete apiClient.defaults.headers.common['Authorization'];
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
