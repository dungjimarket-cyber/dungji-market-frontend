'use client';

import { useState, useEffect } from 'react';
import { X, Bug, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
}

export default function MobileDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // 기존 console 메서드 백업
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    // console 메서드 오버라이드
    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args.join(' '));
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args.join(' '));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args.join(' '));
    };

    console.info = (...args) => {
      originalInfo(...args);
      addLog('info', args.join(' '));
    };

    // cleanup
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, []);

  const addLog = (type: LogEntry['type'], message: string) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message: typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message)
    };
    
    setLogs(prev => [...prev.slice(-99), entry]); // 최대 100개 로그 유지
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const copyLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    navigator.clipboard.writeText(logText);
    alert('로그가 클립보드에 복사되었습니다.');
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch(type) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-300';
    }
  };

  // 개발 환경에서만 표시
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-50 bg-black/80 text-white p-3 rounded-full shadow-lg hover:bg-black"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* 디버그 패널 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 overflow-hidden">
          {/* 헤더 */}
          <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
            <h2 className="text-white font-bold">Debug Console</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={copyLogs}
                className="text-white hover:text-blue-400"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearLogs}
                className="text-white hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 로그 영역 */}
          <div className="h-full overflow-auto p-4 pb-20">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center mt-10">
                아직 로그가 없습니다
              </div>
            ) : (
              <div className="space-y-1 font-mono text-xs">
                {logs.map(log => (
                  <div key={log.id} className="break-all">
                    <span className="text-gray-500">[{log.timestamp}]</span>
                    <span className={` ${getLogColor(log.type)} ml-2`}>
                      {log.type.toUpperCase()}:
                    </span>
                    <span className="text-gray-300 ml-2">
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}