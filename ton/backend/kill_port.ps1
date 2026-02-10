# 포트를 사용 중인 프로세스 종료 스크립트 (PowerShell)
# 사용법: .\kill_port.ps1 [포트번호]

param(
    [int]$Port = 8000
)

Write-Host "🔍 포트 $Port 사용 중인 프로세스 확인 중..." -ForegroundColor Cyan

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
                Write-Host "❌ 프로세스 종료 실패: $_" -ForegroundColor Red
                Write-Host "관리자 권한으로 실행해보세요." -ForegroundColor Yellow
            }
        }
    }
    
    # 확인
    Start-Sleep -Seconds 1
    $remaining = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if (-not $remaining) {
        Write-Host "✅ 포트 $Port가 해제되었습니다." -ForegroundColor Green
    } else {
        Write-Host "⚠️  포트 $Port가 아직 사용 중입니다." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ 포트 $Port는 사용 중이 아닙니다." -ForegroundColor Green
}
