import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 공구 상태 자동 업데이트 스케줄러
// 이 API는 cron job으로 주기적으로 호출되어 공구 상태를 업데이트합니다.
export async function GET(request: NextRequest) {
  try {
    // 인증 키 확인 (보안을 위해 API 키 사용)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    if (token !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { error: '유효하지 않은 인증 토큰입니다.' },
        { status: 403 }
      );
    }
    
    // 백엔드 Django 관리 명령어 실행
    const backendPath = process.env.BACKEND_PATH || '/Users/crom/workspace_joshua/dungji-market/backend';
    const pythonPath = process.env.PYTHON_PATH || 'python';
    
    try {
      const { stdout, stderr } = await execAsync(
        `cd ${backendPath} && ${pythonPath} manage.py update_groupbuy_status`,
        { timeout: 30000 } // 30초 타임아웃
      );
      
      if (stderr && stderr.includes('ERROR')) {
        console.error('Django command stderr:', stderr);
        return NextResponse.json(
          { 
            error: '공구 상태 업데이트 중 오류가 발생했습니다.',
            details: stderr
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: '공구 상태가 성공적으로 업데이트되었습니다.',
        output: stdout,
        timestamp: new Date().toISOString()
      });
      
    } catch (execError: any) {
      console.error('Django command execution error:', execError);
      return NextResponse.json(
        { 
          error: 'Django 명령어 실행에 실패했습니다.',
          details: execError.message
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Error in cron API:', error);
    return NextResponse.json(
      { error: '공동구매 상태 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
