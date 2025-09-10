/**
 * 에러 로깅 유틸리티
 * 에러 발생 시 자동으로 수집하여 분석 가능하도록 함
 */

interface ErrorLog {
  timestamp: string;
  url: string;
  userAgent: string;
  error: {
    message: string;
    stack?: string;
    type: string;
  };
  context?: any;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 50;

  // 에러 로그 추가
  log(error: Error | string, context?: any) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.name : 'CustomError'
      },
      context
    };

    // 로그 저장 (최대 50개)
    this.logs.push(errorLog);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 로컬 스토리지에도 저장
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('errorLogs', JSON.stringify(this.logs));
      } catch (e) {
        console.error('Failed to save error logs to localStorage');
      }
    }

    // 콘솔에도 출력
    console.error('Error logged:', errorLog);

    return errorLog;
  }

  // 저장된 로그 가져오기
  getLogs(): ErrorLog[] {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('errorLogs');
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to load error logs from localStorage');
      }
    }
    return this.logs;
  }

  // 로그 클리어
  clearLogs() {
    this.logs = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('errorLogs');
    }
  }

  // 로그를 텍스트로 변환 (공유용)
  exportLogs(): string {
    return this.logs.map(log => 
      `[${log.timestamp}] ${log.error.type}: ${log.error.message}
URL: ${log.url}
Context: ${JSON.stringify(log.context, null, 2)}
Stack: ${log.error.stack || 'N/A'}
---`
    ).join('\n\n');
  }

  // 클립보드에 복사
  async copyToClipboard(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(this.exportLogs());
      return true;
    } catch (e) {
      console.error('Failed to copy logs to clipboard');
      return false;
    }
  }
}

// 싱글톤 인스턴스
export const errorLogger = new ErrorLogger();

// 전역 에러 핸들러 설정 (옵션)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.log(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      { type: 'unhandledrejection' }
    );
  });

  window.addEventListener('error', (event) => {
    errorLogger.log(
      event.error || new Error(event.message),
      { type: 'global-error', filename: event.filename, lineno: event.lineno }
    );
  });
}