'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ExternalLink, X } from 'lucide-react';

interface LinkPreviewProps {
  url: string;
  onRemove?: () => void;
}

interface LinkMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
}

export default function LinkPreview({ url, onRemove }: LinkPreviewProps) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/link-preview/?url=${encodeURIComponent(url)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch metadata');
        }

        const data = await response.json();
        setMetadata(data);
      } catch (err) {
        console.error('Link preview error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchMetadata();
    }
  }, [url]);

  if (loading) {
    return (
      <div className="border border-slate-200 rounded-lg p-4 animate-pulse">
        <div className="flex gap-3">
          <div className="w-20 h-20 bg-slate-200 rounded flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-full" />
            <div className="h-3 bg-slate-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <div className="border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-slate-600">
          <ExternalLink className="w-4 h-4" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm truncate flex-1"
          >
            {url}
          </a>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition group relative"
    >
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition z-10"
        >
          <X className="w-4 h-4 text-slate-600" />
        </button>
      )}

      <div className="flex gap-3 p-4">
        {metadata.image && (
          <div className="relative w-20 h-20 flex-shrink-0 bg-slate-100 rounded overflow-hidden">
            <Image
              src={metadata.image}
              alt={metadata.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-900 line-clamp-1 group-hover:text-blue-600 transition">
            {metadata.title || '제목 없음'}
          </h3>
          {metadata.description && (
            <p className="text-sm text-slate-600 line-clamp-2 mt-1">
              {metadata.description}
            </p>
          )}
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
            <ExternalLink className="w-3 h-3" />
            <span className="truncate">{new URL(url).hostname}</span>
          </div>
        </div>
      </div>
    </a>
  );
}