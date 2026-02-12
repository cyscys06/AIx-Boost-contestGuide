# 서버 접속 진단 스크립트
# 서버 PC에서 관리자 권한으로 실행: .\check_server_access.ps1

$SERVER_IP = "202.31.147.98"

Write-Host "=== 서버 접속 진단 ===" -ForegroundColor Cyan
Write-Host ""

# 1. 내부 IP 확인
Write-Host "1. 내부 IP 주소 확인" -ForegroundColor Green
$internalIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"} | Select-Object -ExpandProperty IPAddress
foreach ($ip in $internalIPs) {
    Write-Host "   내부 IP: $ip" -ForegroundColor Gray
}
Write-Host ""

# 2. 포트 포워딩 확인
Write-Host "2. 포트 포워딩 설정 확인" -ForegroundColor Green
$portProxy = netsh interface portproxy show all
if ($portProxy) {
    Write-Host $portProxy -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  포트 포워딩이 설정되지 않았습니다!" -ForegroundColor Yellow
}
Write-Host ""

# 3. 방화벽 규칙 확인
Write-Host "3. 방화벽 규칙 확인 (포트 80)" -ForegroundColor Green
$firewallRules = Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*80*" -or $_.DisplayName -like "*HTTP*"} | Select-Object DisplayName, Enabled, Direction
if ($firewallRules) {
    $firewallRules | Format-Table -AutoSize
} else {
    Write-Host "   ⚠️  포트 80 방화벽 규칙이 없습니다!" -ForegroundColor Yellow
}
Write-Host ""

# 4. 포트 리스닝 상태 확인
Write-Host "4. 포트 리스닝 상태 확인" -ForegroundColor Green
$listening = Get-NetTCPConnection -State Listen -LocalPort 80 -ErrorAction SilentlyContinue
if ($listening) {
    foreach ($conn in $listening) {
        $localAddr = $conn.LocalAddress
        if ($localAddr -eq "0.0.0.0") {
            Write-Host "   ✅ 포트 80이 0.0.0.0에서 리스닝 중 (정상)" -ForegroundColor Green
        } elseif ($localAddr -eq "127.0.0.1") {
            Write-Host "   ❌ 포트 80이 127.0.0.1에서만 리스닝 중 (외부 접속 불가)" -ForegroundColor Red
        } else {
            Write-Host "   ⚠️  포트 80이 $localAddr에서 리스닝 중" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ❌ 포트 80에서 리스닝하는 프로세스가 없습니다!" -ForegroundColor Red
}
Write-Host ""

# 5. localhost 접속 테스트
Write-Host "5. localhost 접속 테스트" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ localhost 접속 성공! HTTP Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ localhost 접속 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 6. 공인 IP 접속 테스트 (서버에서 자신의 IP로 접속)
Write-Host "6. 공인 IP 접속 테스트 (서버에서 자신의 IP로)" -ForegroundColor Green
Write-Host "   주의: 서버에서 자신의 공인 IP로 접속하는 것은 'Hairpin NAT' 문제로 실패할 수 있습니다." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$SERVER_IP" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ 공인 IP 접속 성공! HTTP Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  공인 IP 접속 실패: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   이것은 정상일 수 있습니다. 다른 컴퓨터에서 접속해보세요." -ForegroundColor Gray
}
Write-Host ""

# 7. 내부 IP 접속 테스트
Write-Host "7. 내부 IP 접속 테스트" -ForegroundColor Green
if ($internalIPs) {
    $firstInternalIP = $internalIPs[0]
    try {
        $response = Invoke-WebRequest -Uri "http://$firstInternalIP" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "   ✅ 내부 IP ($firstInternalIP) 접속 성공! HTTP Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ 내부 IP ($firstInternalIP) 접속 실패: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️  내부 IP를 찾을 수 없습니다." -ForegroundColor Yellow
}
Write-Host ""

# 8. 포트 연결 테스트
Write-Host "8. 포트 80 연결 테스트" -ForegroundColor Green
$testConnection = Test-NetConnection -ComputerName $SERVER_IP -Port 80 -WarningAction SilentlyContinue
if ($testConnection.TcpTestSucceeded) {
    Write-Host "   ✅ 포트 80 연결 성공!" -ForegroundColor Green
} else {
    Write-Host "   ❌ 포트 80 연결 실패" -ForegroundColor Red
    Write-Host "   TcpTestSucceeded: $($testConnection.TcpTestSucceeded)" -ForegroundColor Gray
}
Write-Host ""

# 종합 진단 결과
Write-Host "=== 종합 진단 결과 ===" -ForegroundColor Cyan
Write-Host ""

$issues = @()

# 포트 포워딩 확인
if (-not $portProxy -or $portProxy -notlike "*0.0.0.0*") {
    $issues += "포트 포워딩이 설정되지 않았거나 잘못 설정되었습니다."
}

# 포트 리스닝 확인
$listening80 = Get-NetTCPConnection -State Listen -LocalPort 80 -ErrorAction SilentlyContinue
if (-not $listening80) {
    $issues += "포트 80에서 리스닝하는 서비스가 없습니다."
} elseif ($listening80.LocalAddress -eq "127.0.0.1") {
    $issues += "포트 80이 localhost에서만 리스닝 중입니다. 0.0.0.0에서 리스닝해야 합니다."
}

# localhost 접속 확인
try {
    $null = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
} catch {
    $issues += "localhost 접속이 실패했습니다. 웹 서버가 실행되지 않았을 수 있습니다."
}

if ($issues.Count -eq 0) {
    Write-Host "✅ 모든 설정이 정상입니다!" -ForegroundColor Green
    Write-Host ""
    Write-Host "서버에서 자신의 공인 IP로 접속이 안 되는 것은 정상일 수 있습니다 (Hairpin NAT 문제)." -ForegroundColor Yellow
    Write-Host "다른 컴퓨터나 모바일 기기에서 접속해보세요:" -ForegroundColor Yellow
    Write-Host "  http://$SERVER_IP" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  다음 문제를 해결해야 합니다:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "  - $issue" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "해결 방법은 FIX_LOCAL_ACCESS.md 파일을 참고하세요." -ForegroundColor Gray
}
