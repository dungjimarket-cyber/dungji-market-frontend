import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// Mock 설정
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/tokenUtils', () => ({
  tokenUtils: {
    getAccessToken: jest.fn(() => Promise.resolve('mock-token')),
  },
}));

// 전역 fetch mock
global.fetch = jest.fn();

describe('이슈 검증 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      back: jest.fn(),
    });
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, role: 'seller' },
      isAuthenticated: true,
      accessToken: 'mock-token',
    });
  });

  describe('이슈 #4: 판매회원 정보수정', () => {
    it('휴대폰번호가 010-****-**** 형식으로 포맷팅되어야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          nickname: 'test',
          phone: '01012345678',
          address_province: '서울특별시',
          address_city: '강남구',
          business_number: '123-45-67890',
        }),
      });

      const { container } = render(<SellerSettings />);
      
      await waitFor(() => {
        const phoneInput = container.querySelector('input[name="phone"]') as HTMLInputElement;
        expect(phoneInput).toBeInTheDocument();
        
        // 전화번호 입력 시뮬레이션
        fireEvent.change(phoneInput, { target: { value: '01012345678' } });
        
        // 포맷팅 확인
        expect(phoneInput.value).toBe('010-1234-5678');
      });
    });

    it('닉네임 중복체크가 동작해야 함', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            nickname: 'test',
            phone: '01012345678',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ available: false }),
        });

      const { container } = render(<SellerSettings />);
      
      await waitFor(() => {
        const nicknameInput = container.querySelector('input[name="nickname"]') as HTMLInputElement;
        expect(nicknameInput).toBeInTheDocument();
        
        // 닉네임 입력
        fireEvent.change(nicknameInput, { target: { value: 'duplicate' } });
      });

      // 중복 확인 메시지 대기
      await waitFor(() => {
        expect(screen.getByText('이미 사용중인 닉네임입니다.')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('저장 시 "수정되었습니다" 알림이 표시되어야 함', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            nickname: 'test',
            phone: '01012345678',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'success' }),
        });

      render(<SellerSettings />);
      
      await waitFor(() => {
        const saveButton = screen.getByText('저장하기');
        expect(saveButton).toBeInTheDocument();
        
        fireEvent.click(saveButton);
      });

      // Toast 메시지 확인
      await waitFor(() => {
        const toastContent = document.querySelector('[data-state="open"]');
        expect(toastContent?.textContent).toContain('수정되었습니다');
      });
    });

    it('비대면 판매 인증 파일 업로드 UI가 존재해야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          nickname: 'test',
          isRemoteSales: true,
        }),
      });

      render(<SellerSettings />);
      
      await waitFor(() => {
        const remoteSwitch = screen.getByText('비대면 판매가능 영업소 인증');
        expect(remoteSwitch).toBeInTheDocument();
        
        // 스위치 클릭
        const switchElement = remoteSwitch.parentElement?.querySelector('button[role="switch"]');
        if (switchElement) fireEvent.click(switchElement);
      });

      // 파일 업로드 UI 확인
      await waitFor(() => {
        expect(screen.getByText('비대면 판매가능 인증 파일 업로드')).toBeInTheDocument();
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
      });
    });
  });

  describe('이슈 #8: 거래 상태별 버튼 동기화', () => {
    it('구매자 최종선택 단계에서 구매확정/포기 버튼이 표시되어야 함', () => {
      render(
        <TradeStatusButtons
          status="final_selection_buyers"
          userRole="buyer"
          groupBuyId={1}
          myDecision="pending"
        />
      );

      expect(screen.getByText('구매확정')).toBeInTheDocument();
      expect(screen.getByText('구매포기')).toBeInTheDocument();
    });

    it('판매자 최종선택 단계에서 판매확정/포기 버튼이 표시되어야 함', () => {
      render(
        <TradeStatusButtons
          status="final_selection_seller"
          userRole="seller"
          groupBuyId={1}
          myDecision="pending"
          participantCount={10}
          confirmedCount={7}
        />
      );

      expect(screen.getByText('판매확정')).toBeInTheDocument();
      expect(screen.getByText('판매포기')).toBeInTheDocument();
      expect(screen.getByText('구매확정 인원 보기')).toBeInTheDocument();
    });

    it('거래중 상태에서 적절한 버튼들이 표시되어야 함', () => {
      render(
        <TradeStatusButtons
          status="in_progress"
          userRole="buyer"
          groupBuyId={1}
        />
      );

      expect(screen.getByText('판매자 정보보기')).toBeInTheDocument();
      expect(screen.getByText('노쇼신고하기')).toBeInTheDocument();
      expect(screen.getByText('구매완료')).toBeInTheDocument();
    });

    it('완료 상태에서 후기작성 버튼이 표시되어야 함', () => {
      render(
        <TradeStatusButtons
          status="completed"
          userRole="buyer"
          groupBuyId={1}
        />
      );

      expect(screen.getByText('구매후기 작성')).toBeInTheDocument();
    });
  });

  describe('이슈 #9: 판매자 입찰 UI', () => {
    it('입찰내역이 최근 5개만 표시되어야 함', async () => {
      const mockBids = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        groupbuy: i + 1,
        product_name: `상품 ${i + 1}`,
        amount: 100000 + i * 10000,
        status: 'pending',
        bid_type: 'support',
        created_at: new Date().toISOString(),
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBids,
      });

      render(<BidHistory />);

      await waitFor(() => {
        const cards = screen.getAllByRole('article');
        expect(cards).toHaveLength(5); // 최근 5개만 표시
      });
    });

    it('전체 입찰내역 보기 버튼이 있어야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          id: 1,
          groupbuy: 1,
          product_name: '테스트 상품',
          amount: 100000,
          status: 'pending',
          bid_type: 'support',
          created_at: new Date().toISOString(),
        }],
      });

      render(<BidHistory />);

      await waitFor(() => {
        expect(screen.getByText('전체 입찰내역 보기')).toBeInTheDocument();
      });
    });

    it('입찰 상태별 배지가 올바르게 표시되어야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          id: 1,
          groupbuy: 1,
          product_name: '테스트 상품',
          amount: 100000,
          status: 'selected',
          final_decision: 'pending',
          bid_type: 'support',
          created_at: new Date().toISOString(),
        }],
      });

      render(<BidHistory />);

      await waitFor(() => {
        expect(screen.getByText('최종선택 대기')).toBeInTheDocument();
      });
    });
  });

  describe('이슈 #10: 실시간 타임바', () => {
    it('타이머가 100%에서 시작해야 함', () => {
      const endTime = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6시간 후
      
      render(
        <UnifiedTimer
          endTime={endTime.toISOString()}
          status="final_selection_seller"
        />
      );

      const progressBar = document.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('data-value', '100');
    });

    it('구매자/판매자 최종선택 타이머가 올바르게 표시되어야 함', () => {
      const endTime = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3시간 후
      
      render(
        <UnifiedTimer
          endTime={endTime.toISOString()}
          status="final_selection_buyers"
        />
      );

      expect(screen.getByText(/구매자 최종선택/)).toBeInTheDocument();
    });
  });

  describe('이슈 #11: 낙찰자 UI', () => {
    it('최종 낙찰 지원금에 왕관 아이콘이 표시되어야 함', async () => {
      const mockGroupBuy = {
        id: 1,
        status: 'final_selection_buyers',
        winning_bid_amount: 500000,
        product_details: { name: '테스트 상품' },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockGroupBuy,
      });

      render(<GroupPurchaseDetailNew groupBuy={mockGroupBuy} />);

      await waitFor(() => {
        const crownIcon = document.querySelector('svg.lucide-crown');
        expect(crownIcon).toBeInTheDocument();
        expect(screen.getByText('최종 낙찰 지원금')).toBeInTheDocument();
      });
    });
  });

  describe('이슈 #12: 마감 후 UI', () => {
    it('입찰 진행 중이 아닐 때 입찰 UI가 표시되지 않아야 함', () => {
      const mockGroupBuy = {
        id: 1,
        status: 'final_selection_buyers', // 입찰 마감 후
        product_details: { name: '테스트 상품' },
      };

      render(<GroupPurchaseDetailNew groupBuy={mockGroupBuy} />);

      // 입찰 입력창이 없어야 함
      const bidInput = screen.queryByPlaceholderText(/지원금 입력|가격 입력/);
      expect(bidInput).not.toBeInTheDocument();
    });

    it('입찰 내역 보기 버튼은 마감 후에만 표시되어야 함', async () => {
      const mockGroupBuy = {
        id: 1,
        status: 'final_selection_buyers',
        winning_bid_amount: 500000,
        total_bids_count: 5,
        product_details: { name: '테스트 상품' },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockGroupBuy,
      });

      render(<GroupPurchaseDetailNew groupBuy={mockGroupBuy} />);

      await waitFor(() => {
        expect(screen.getByText('입찰 내역 보기')).toBeInTheDocument();
      });
    });
  });

  describe('이슈 #13: 최종낙찰금 마스킹', () => {
    it('참여자는 최종낙찰금액을 마스킹 없이 볼 수 있어야 함', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 1, role: 'buyer' },
        isAuthenticated: true,
        accessToken: 'mock-token',
      });

      const mockGroupBuy = {
        id: 1,
        status: 'final_selection_buyers',
        winning_bid_amount: 500000,
        is_participant: true,
        product_details: { name: '테스트 상품' },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockGroupBuy,
      });

      render(<GroupPurchaseDetailNew groupBuy={mockGroupBuy} />);

      await waitFor(() => {
        expect(screen.getByText(/500,000/)).toBeInTheDocument();
        expect(screen.queryByText(/\*\*\*/)).not.toBeInTheDocument();
      });
    });

    it('미참여자는 최종낙찰금액이 마스킹되어야 함', async () => {
      const mockGroupBuy = {
        id: 1,
        status: 'final_selection_buyers',
        winning_bid_amount_masked: '***,***원',
        is_participant: false,
        product_details: { name: '테스트 상품' },
      };

      render(<GroupPurchaseDetailNew groupBuy={mockGroupBuy} />);

      await waitFor(() => {
        expect(screen.getByText(/\*\*\*,\*\*\*원/)).toBeInTheDocument();
      });
    });
  });
});