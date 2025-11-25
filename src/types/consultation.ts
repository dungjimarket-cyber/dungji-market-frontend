/**
 * 상담 신청 관련 타입 정의
 */

// 상담 유형
export interface ConsultationType {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: number;
  category_name: string;
  order_index: number;
}

// 상담 신청 생성 요청
export interface ConsultationRequestCreate {
  name: string;
  phone: string;
  email?: string;
  category: number;
  consultation_type?: number;
  region: string;
  content: string;
  ai_summary?: string;
  ai_recommended_types?: AIRecommendedType[];
}

// 상담 신청 목록
export interface ConsultationRequestList {
  id: number;
  name: string;
  phone: string;
  email: string;
  category: number;
  category_name: string;
  category_icon: string;
  consultation_type: number | null;
  consultation_type_name: string | null;
  region: string;
  status: ConsultationStatus;
  status_display: string;
  created_at: string;
}

// 상담 신청 상세
export interface ConsultationRequestDetail extends ConsultationRequestList {
  user: number | null;
  user_username: string | null;
  content: string;
  ai_summary: string;
  ai_recommended_types: AIRecommendedType[];
  admin_note: string;
  updated_at: string;
  contacted_at: string | null;
  completed_at: string | null;
}

// 상담 상태
export type ConsultationStatus = 'pending' | 'contacted' | 'completed' | 'cancelled';

// AI 추천 상담 유형
export interface AIRecommendedType {
  id: number;
  name: string;
  relevance: number;
}

// AI Assist 요청
export interface AIAssistRequest {
  category: number;
  content: string;
}

// AI Assist 응답
export interface AIAssistResponse {
  summary: string;
  recommended_types: AIRecommendedType[];
}

// 상담 질문 플로우 선택지
export interface ConsultationFlowOption {
  id: number;
  key: string;
  label: string;
  icon: string;
  logo?: string;  // 로고 이미지 경로 (예: /logos/skt.png)
  description: string;
  is_custom_input: boolean;
  order_index: number;
}

// 상담 질문 플로우
export interface ConsultationFlow {
  id: number;
  step_number: number;
  question: string;
  is_required: boolean;
  depends_on_step: number | null;
  depends_on_options: string[];
  options: ConsultationFlowOption[];
}

// 플로우 선택 결과
export interface FlowSelection {
  step: number;
  question: string;
  answer: string;
  optionKey: string;
  isCustom?: boolean;
}

// AI 다듬기 요청
export interface AIPolishRequest {
  category: number | string;
  selections: FlowSelection[];
  additional_content?: string;
}

// AI 다듬기 응답
export interface AIPolishResponse {
  polished_content: string;
  raw_summary: string;
}

// 상담 신청 모달 props
export interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedCategory?: {
    id: number;
    name: string;
    icon: string;
  };
}

// 상담 신청 폼 데이터
export interface ConsultationFormData {
  // Step 1: 기본 정보
  name: string;
  phone: string;
  email: string;
  category: number | null;
  region: string;
  regionDetail: string;

  // Step 2: 상담 내용
  content: string;
  consultationType: number | null;

  // AI 결과
  aiSummary: string;
  aiRecommendedTypes: AIRecommendedType[];
}
