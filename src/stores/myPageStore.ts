import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface UserProfile {
  id: number;
  userId: number;
  nickname: string;
  profileImage?: string;
  bio?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  identityVerified: boolean;
  tradeRegion: string;
  tradeRegionDetail?: string;
  preferTradeType: 'direct' | 'delivery' | 'both';
  availableTime?: string;
  sellCount: number;
  buyCount: number;
  averageRating: number;
  totalReviews: number;
  userLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  badges: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TradeStats {
  selling: number;
  reserved: number;
  sold: number;
  offering: number;
  buying: number;
  purchased: number;
}

interface MyPageState {
  profile: UserProfile | null;
  stats: TradeStats;
  activeTab: 'sales' | 'purchases' | 'reviews' | 'settings';
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
}

interface MyPageActions {
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  uploadProfileImage: (file: File) => Promise<void>;
  fetchStats: () => Promise<void>;
  setActiveTab: (tab: MyPageState['activeTab']) => void;
  resetStore: () => void;
}

type MyPageStore = MyPageState & MyPageActions;

const initialState: MyPageState = {
  profile: null,
  stats: {
    selling: 0,
    reserved: 0,
    sold: 0,
    offering: 0,
    buying: 0,
    purchased: 0,
  },
  activeTab: 'sales',
  isLoading: false,
  isUpdating: false,
  error: null,
};

export const useMyPageStore = create<MyPageStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: API 호출 구현
          // const response = await api.get('/api/mypage/profile/');
          // set({ profile: response.data, isLoading: false });
          
          // 임시 목업 데이터
          const mockProfile: UserProfile = {
            id: 1,
            userId: 1,
            nickname: '둥지새',
            profileImage: '/images/default-profile.jpg',
            bio: '안전한 거래를 지향합니다',
            phoneVerified: true,
            emailVerified: true,
            identityVerified: false,
            tradeRegion: '서울시 강남구',
            tradeRegionDetail: '역삼동',
            preferTradeType: 'both',
            availableTime: '평일 저녁, 주말 전체',
            sellCount: 5,
            buyCount: 3,
            averageRating: 4.5,
            totalReviews: 8,
            userLevel: 'silver',
            badges: ['trusted_seller', 'quick_response'],
            createdAt: '2024-01-01',
            updatedAt: '2024-12-01',
          };
          
          set({ profile: mockProfile, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '프로필을 불러오는데 실패했습니다.',
            isLoading: false 
          });
        }
      },

      updateProfile: async (data: Partial<UserProfile>) => {
        set({ isUpdating: true, error: null });
        try {
          // TODO: API 호출 구현
          // const response = await api.put('/api/mypage/profile/', data);
          // set({ profile: response.data, isUpdating: false });
          
          const currentProfile = get().profile;
          if (currentProfile) {
            set({ 
              profile: { ...currentProfile, ...data },
              isUpdating: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.',
            isUpdating: false 
          });
        }
      },

      uploadProfileImage: async (file: File) => {
        set({ isUpdating: true, error: null });
        try {
          // TODO: API 호출 구현
          const formData = new FormData();
          formData.append('image', file);
          // const response = await api.post('/api/mypage/profile/image/', formData);
          
          // 임시로 URL 생성
          const imageUrl = URL.createObjectURL(file);
          const currentProfile = get().profile;
          if (currentProfile) {
            set({ 
              profile: { ...currentProfile, profileImage: imageUrl },
              isUpdating: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.',
            isUpdating: false 
          });
        }
      },

      fetchStats: async () => {
        try {
          // TODO: API 호출 구현
          // const response = await api.get('/api/mypage/stats/');
          // set({ stats: response.data });
          
          // 임시 목업 데이터
          set({ 
            stats: {
              selling: 3,
              reserved: 1,
              sold: 5,
              offering: 2,
              buying: 1,
              purchased: 3,
            }
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '통계를 불러오는데 실패했습니다.'
          });
        }
      },

      setActiveTab: (tab: MyPageState['activeTab']) => {
        set({ activeTab: tab });
      },

      resetStore: () => {
        set(initialState);
      },
    }),
    {
      name: 'mypage-store',
    }
  )
);