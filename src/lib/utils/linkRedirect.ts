/**
 * HTML 내의 외부 링크를 리다이렉트 페이지를 거치도록 변환
 * 네이버 봇 차단 우회를 위한 유틸리티
 */

/**
 * HTML 문자열의 모든 링크를 리다이렉트 페이지를 거치도록 변환
 * @param html - 원본 HTML 문자열
 * @returns 변환된 HTML 문자열
 */
export function convertLinksToRedirect(html: string): string {
  if (!html) return html;

  // <a> 태그를 찾아서 href를 리다이렉트 페이지로 변환
  return html.replace(
    /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
    (match, before, url, after) => {
      // 이미 상대 경로이거나 내부 링크인 경우 변환하지 않음
      if (url.startsWith('/') || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
        return match;
      }

      // http:// 또는 https://로 시작하는 외부 링크만 변환
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const encodedUrl = encodeURIComponent(url);
        return `<a ${before}href="/redirect?url=${encodedUrl}"${after}>`;
      }

      // 프로토콜 없이 www로 시작하는 경우
      if (url.startsWith('www.')) {
        const fullUrl = `https://${url}`;
        const encodedUrl = encodeURIComponent(fullUrl);
        return `<a ${before}href="/redirect?url=${encodedUrl}"${after}>`;
      }

      return match;
    }
  );
}

/**
 * 외부 링크 URL을 리다이렉트 페이지 URL로 변환
 * @param url - 원본 URL
 * @returns 리다이렉트 페이지 URL
 */
export function getRedirectUrl(url: string): string {
  if (!url) return url;

  // 이미 상대 경로이거나 내부 링크인 경우 그대로 반환
  if (url.startsWith('/') || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
    return url;
  }

  // 외부 링크인 경우 리다이렉트 페이지로 변환
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `/redirect?url=${encodeURIComponent(url)}`;
  }

  // 프로토콜 없이 www로 시작하는 경우
  if (url.startsWith('www.')) {
    const fullUrl = `https://${url}`;
    return `/redirect?url=${encodeURIComponent(fullUrl)}`;
  }

  return url;
}
