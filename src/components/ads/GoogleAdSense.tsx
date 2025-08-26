'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface GoogleAdSenseProps {
  className?: string;
  style?: React.CSSProperties;
}

export function GoogleAdSense({ className, style }: GoogleAdSenseProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`flex justify-center ${className || ''}`}>
      <ins 
        className="adsbygoogle"
        style={{
          display: 'inline-block',
          width: '728px',
          height: '90px',
          ...style
        }}
        data-ad-client="ca-pub-6300478122055996"
        data-ad-slot="2577430328"
      />
    </div>
  );
}

// 반응형 광고 컴포넌트
export function ResponsiveAdSense({ className }: { className?: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`flex justify-center ${className || ''}`}>
      <ins 
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          maxWidth: '728px',
          height: '90px'
        }}
        data-ad-client="ca-pub-6300478122055996"
        data-ad-slot="2577430328"
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
}