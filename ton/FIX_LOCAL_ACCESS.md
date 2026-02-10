# 로컬 노트북에서 서버 접속 문제 해결

## 문제 상황

- 서버에서는 포트 포워딩 설정으로 해결됨
- 하지만 다른 노트북(로컬 개발 환경)에서 접속이 안 됨

## 단계별 확인 및 해결

### 1단계: 서버 IP 주소 확인

**서버에서:**
```bash
# 공인 IP 확인
curl ifconfig.me

# 내부 IP 확인
ipconfig  # Windows
# 또는
ip addr show  # Linux
```

### 2단계: Windows 포트 포워딩 확인 (서버에서)

**서버에서 관리자 권한으로 PowerShell 실행:**

```powershell
# 포트 포워딩 확인
netsh interface portproxy show all

# 정상 설정 예시:
# Listen on ipv4:             Connect to ipv4:
# Address         Port        Address         Port
# --------------- ----------  --------------- ----------
# 0.0.0.0         80          172.28.241.135  80
```

**포트 포워딩이 없거나 잘못된 경우:**

```powershell
# 기존 설정 삭제
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=0.0.0.0

# 올바른 내부 IP로 재설정
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=80 connectaddress=172.28.241.135

# 확인
netsh interface portproxy show all
```

### 3단계: Windows 방화벽 확인 (서버에서)

**서버에서 관리자 권한으로 PowerShell 실행:**

```powershell
# 포트 80 방화벽 규칙 확인
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*80*" -or $_.DisplayName -like "*HTTP*"}

# 포트 80이 허용되지 않은 경우
New-NetFirewallRule -DisplayName "HTTP Port 80" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# 포트 8080도 허용 (필요한 경우)
New-NetFirewallRule -DisplayName "HTTP Port 8080" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

### 4단계: 로컬 노트북에서 접속 테스트

**로컬 노트북에서:**

```bash
# Windows PowerShell/CMD
# 서버 IP로 ping 테스트
ping [서버_IP]

# 포트 연결 테스트
Test-NetConnection -ComputerName [서버_IP] -Port 80

# HTTP 접속 테스트
curl -I http://[서버_IP]

# 브라우저에서 접속 시도
# http://[서버_IP]
```

### 5단계: 네트워크 연결 확인

**로컬 노트북과 서버가 같은 네트워크에 있는지 확인:**

```bash
# 로컬 노트북에서
ipconfig

# 서버에서
ipconfig

# 같은 네트워크 대역인지 확인
# 예: 둘 다 172.28.x.x 또는 192.168.x.x
```

**다른 네트워크에서 접속하는 경우:**
- 공인 IP 주소를 사용해야 함
- 포트 포워딩이 공인 IP에서 작동하는지 확인

## 일반적인 문제 및 해결

### 문제 1: 포트 포워딩이 설정되지 않음

**해결:**
```powershell
# 서버에서 관리자 권한으로 실행
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=80 connectaddress=172.28.241.135
```

### 문제 2: 잘못된 내부 IP 주소

**해결:**
```powershell
# 서버에서 내부 IP 확인
ipconfig

# 올바른 내부 IP로 포트 포워딩 재설정
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=0.0.0.0
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=80 connectaddress=[올바른_내부_IP]
```

### 문제 3: Windows 방화벽이 포트를 차단

**해결:**
```powershell
# 서버에서 관리자 권한으로 실행
New-NetFirewallRule -DisplayName "HTTP Port 80" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
```

### 문제 4: 브라우저 캐시 문제

**해결:**
- 브라우저 캐시 삭제
- 쿠키 삭제
- 시크릿 모드로 접속 시도
- 다른 브라우저로 접속 시도

### 문제 5: 로컬 노트북의 방화벽/보안 소프트웨어

**해결:**
- 로컬 노트북의 방화벽 설정 확인
- 바이러스 백신 소프트웨어 확인
- 회사/학교 네트워크 정책 확인

## 종합 진단 스크립트

**서버에서 실행 (관리자 권한 PowerShell):**

```powershell
Write-Host "=== 1. 내부 IP 주소 확인 ===" -ForegroundColor Green
ipconfig | Select-String "IPv4"

Write-Host "`n=== 2. 포트 포워딩 설정 확인 ===" -ForegroundColor Green
netsh interface portproxy show all

Write-Host "`n=== 3. 방화벽 규칙 확인 ===" -ForegroundColor Green
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*80*" -or $_.DisplayName -like "*HTTP*"} | Format-Table DisplayName, Enabled, Direction

Write-Host "`n=== 4. 포트 리스닝 상태 확인 ===" -ForegroundColor Green
netstat -an | Select-String ":80"

Write-Host "`n=== 5. 공인 IP 확인 ===" -ForegroundColor Green
Invoke-WebRequest -Uri "https://ifconfig.me" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**로컬 노트북에서 실행 (PowerShell):**

```powershell
$SERVER_IP = "[서버_IP_주소]"

Write-Host "=== 1. 서버 IP로 ping 테스트 ===" -ForegroundColor Green
Test-Connection -ComputerName $SERVER_IP -Count 4

Write-Host "`n=== 2. 포트 80 연결 테스트 ===" -ForegroundColor Green
Test-NetConnection -ComputerName $SERVER_IP -Port 80

Write-Host "`n=== 3. HTTP 접속 테스트 ===" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://$SERVER_IP" -TimeoutSec 5 -UseBasicParsing
    Write-Host "성공! HTTP Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "실패: $($_.Exception.Message)" -ForegroundColor Red
}
```

## 빠른 해결 체크리스트

서버에서:
- [ ] 포트 포워딩 설정 확인 (`netsh interface portproxy show all`)
- [ ] 올바른 내부 IP 주소 사용 확인
- [ ] Windows 방화벽에서 포트 80 허용 확인
- [ ] 서버에서 `curl -I http://localhost` 정상 작동 확인

로컬 노트북에서:
- [ ] 서버 IP 주소가 올바른지 확인
- [ ] `ping [서버_IP]` 정상 작동 확인
- [ ] `Test-NetConnection -ComputerName [서버_IP] -Port 80` 정상 작동 확인
- [ ] 브라우저 캐시 삭제 후 재시도
- [ ] 다른 네트워크에서 접속 시도

---

더 자세한 내용은 `FIX_ACCESS_ISSUES.md`를 참고하세요.
