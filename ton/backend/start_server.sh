#!/bin/bash

# 백엔드 서버 실행 스크립트
# 서버 컴퓨터에서 bash로 실행: bash start_server.sh

set -e  # 에러 발생 시 스크립트 중단

echo "🚀 백엔드 서버 시작 중..."

# 현재 디렉토리 확인
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📁 작업 디렉토리: $(pwd)"

# Python 버전 확인
echo "🐍 Python 버전 확인 중..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    echo "✅ python3 발견: $(python3 --version)"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    echo "✅ python 발견: $(python --version)"
else
    echo "❌ Python이 설치되어 있지 않습니다."
    exit 1
fi

# 가상환경 처리
if [ -d "venv" ]; then
    echo "📦 기존 가상환경 발견"
    
    # pyvenv.cfg 파일 확인
    if [ -f "venv/pyvenv.cfg" ]; then
        echo "⚠️  기존 가상환경이 다른 사용자 경로를 참조할 수 있습니다."
        echo "🗑️  기존 가상환경 삭제 중..."
        rm -rf venv
        echo "✅ 기존 가상환경 삭제 완료"
    fi
fi

# 가상환경이 없으면 생성
if [ ! -d "venv" ]; then
    echo "📦 새 가상환경 생성 중..."
    $PYTHON_CMD -m venv venv
    echo "✅ 가상환경 생성 완료"
fi

# 가상환경 활성화
echo "🔌 가상환경 활성화 중..."
source venv/bin/activate

# pip 업그레이드
echo "⬆️  pip 업그레이드 중..."
pip install --upgrade pip --quiet

# 의존성 설치
echo "📥 의존성 설치 중..."
pip install -r requirements.txt --quiet

echo "✅ 모든 준비 완료!"
echo ""

# 포트 확인 및 해제
PORT=8000
echo "🔍 포트 $PORT 확인 중..."
if command -v lsof &> /dev/null; then
    PID=$(lsof -ti:$PORT 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "⚠️  포트 $PORT를 사용 중인 프로세스 발견 (PID: $PID)"
        echo "🛑 프로세스 종료 중..."
        kill -9 $PID 2>/dev/null || true
        sleep 1
        echo "✅ 포트 $PORT 해제 완료"
    fi
fi

echo "🌐 서버 시작 중..."
echo "   - 백엔드: http://localhost:$PORT"
echo "   - API 문서: http://localhost:$PORT/docs"
echo ""

# 서버 실행
$PYTHON_CMD -m uvicorn main:app --host 0.0.0.0 --port $PORT --reload
