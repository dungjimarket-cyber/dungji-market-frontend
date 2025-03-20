'use client';

import { useState } from 'react';

type Inquiry = {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'answered';
  createdAt: Date;
};

export default function InquiryManager() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([
    {
      id: '1',
      title: '배송 문의',
      content: '배송 예상 일자가 어떻게 되나요?',
      status: 'pending',
      createdAt: new Date('2024-03-01'),
    },
  ]);

  const handleReply = (inquiryId: string) => {
    setInquiries(inquiries.map(inquiry =>
      inquiry.id === inquiryId
        ? { ...inquiry, status: 'answered' }
        : inquiry
    ));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">미답변 문의</h3>
      <div className="space-y-4">
        {inquiries
          .filter(inquiry => inquiry.status === 'pending')
          .map(inquiry => (
            <div key={inquiry.id} className="border rounded-md p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{inquiry.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{inquiry.content}</p>
                </div>
                <button
                  onClick={() => handleReply(inquiry.id)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                >
                  답변 완료
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {inquiry.createdAt.toLocaleDateString()}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
