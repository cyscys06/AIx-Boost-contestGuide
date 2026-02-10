#!/bin/bash

# 포트를 사용 중인 프로세스 종료 스크립트
# 사용법: bash kill_port.sh [포트번호]

PORT=${1:-8000}

echo "🔍 포트 $PORT 사용 중인 프로세스 확인 중..."

# Linux/Mac
if command -v lsof &> /dev/null; then
    PID=$(lsof -ti:$PORT)
    if [ -z "$PID" ]; then
        echo "✅ 포트 $PORT는 사용 중이 아닙니다."
        exit 0
    fi
    
    echo "⚠️  포트 $PORT를 사용 중인 프로세스: PID $PID"
    echo "🛑 프로세스 종료 중..."
    kill -9 $PID
    sleep 1
    
    # 확인
    PID=$(lsof -ti:$PORT)
    if [ -z "$PID" ]; then
        echo "✅ 포트 $PORT가 해제되었습니다."
    else
        echo "❌ 프로세스 종료 실패. 수동으로 종료해주세요: kill -9 $PID"
    fi
# Windows (Git Bash)
elif command -v netstat &> /dev/null; then
    echo "Windows 환경에서는 다음 명령어를 사용하세요:"
    echo "  netstat -ano | findstr :$PORT"
    echo "  taskkill /PID [프로세스ID] /F"
fi
