# 백엔드 서버 실행 스크립트 (PowerShell)
# 사용법: .\start_server.ps1

param(
    [int]$Port = 8000
)

Write-Host "🚀 백엔드 서버 시작 중..." -ForegroundColor Cyan

# 현재 디렉토리 확인
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "📁 작업 디렉토리: $(Get-Location)" -ForegroundColor Gray

# Python 버전 확인
Write-Host "🐍 Python 버전 확인 중..." -ForegroundColor Cyan
if (Get-Command python3 -ErrorAction SilentlyContinue) {
    $PythonCmd = "python3"
    $version = python3 --version
    Write-Host "✅ python3 발견: $version" -ForegroundColor Green
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $PythonCmd = "python"
    $version = python --version
    Write-Host "✅ python 발견: $version" -ForegroundColor Green
} else {
    Write-Host "❌ Python이 설치되어 있지 않습니다." -ForegroundColor Red
    exit 1
}

# 가상환경 처리
if (Test-Path "venv") {
    Write-Host "📦 기존 가상환경 발견" -ForegroundColor Yellow
    
    if (Test-Path "venv/pyvenv.cfg") {
        Write-Host "⚠️  기존 가상환경이 다른 사용자 경로를 참조할 수 있습니다." -ForegroundColor Yellow
        Write-Host "🗑️  기존 가상환경 삭제 중..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force venv
        Write-Host "✅ 기존 가상환경 삭제 완료" -ForegroundColor Green
    }
}

# 가상환경이 없으면 생성
if (-not (Test-Path "venv")) {
    Write-Host "📦 새 가상환경 생성 중..." -ForegroundColor Cyan
    & $PythonCmd -m venv venv
    Write-Host "✅ 가상환경 생성 완료" -ForegroundColor Green
}

# 가상환경 활성화
Write-Host "🔌 가상환경 활성화 중..." -ForegroundColor Cyan
& "venv\Scripts\Activate.ps1"

# pip 업그레이드
Write-Host "⬆️  pip 업그레이드 중..." -ForegroundColor Cyan
python -m pip install --upgrade pip --quiet

# 의존성 설치
Write-Host "📥 의존성 설치 중..." -ForegroundColor Cyan
pip install -r requirements.txt --quiet

Write-Host "✅ 모든 준비 완료!" -ForegroundColor Green
Write-Host ""

# 포트 확인 및 해제
Write-Host "🔍 포트 $Port 확인 중..." -ForegroundColor Cyan
$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if ($connections) {
    $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    
    foreach ($pid in $processes) {
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "⚠️  포트 $Port를 사용 중인 프로세스: $($process.ProcessName) (PID: $pid)" -ForegroundColor Yellow
            Write-Host "🛑 프로세스 종료 중..." -ForegroundColor Yellow
            
            try {
                Stop-Process -Id $pid -Force
                Write-Host "✅ 프로세스가 종료되었습니다." -ForegroundColor Green
            } catch {
                Write-Host "❌ 프로세스 종료 실패. 다른 포트를 사용하세요." -ForegroundColor Red
                Write-Host "   예: .\start_server.ps1 -Port 8001" -ForegroundColor Yellow
            }
        }
    }
    
    Start-Sleep -Seconds 1
}

Write-Host "🌐 서버 시작 중..." -ForegroundColor Cyan
Write-Host "   - 백엔드: http://localhost:$Port" -ForegroundColor Gray
Write-Host "   - API 문서: http://localhost:$Port/docs" -ForegroundColor Gray
Write-Host ""

# 서버 실행
& $PythonCmd -m uvicorn main:app --host 0.0.0.0 --port $Port --reload
