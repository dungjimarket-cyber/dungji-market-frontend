import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/axios';

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  sns_id?: string;
  sns_type?: string;
  accessToken?: string;
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
          setUser({
            ...response.data,
            sns_id: session.user.sns_id,
            sns_type: session.user.sns_type,
            accessToken: session.user.accessToken,
          });
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
