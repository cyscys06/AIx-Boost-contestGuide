# 접속 문제 빠른 해결 가이드

## 로컬 노트북에서 서버 접속이 안 되는 경우

### 증상
- 서버에서는 포트 포워딩 설정으로 해결됨
- 하지만 다른 노트북(로컬 개발 환경)에서 접속이 안 됨

### 확인 사항

**1. 서버 IP 주소 확인**
```bash
# 서버에서 현재 IP 확인
curl ifconfig.me
```

**2. 로컬 노트북에서 서버 접속 테스트**
```bash
# Windows PowerShell/CMD
curl -I http://[서버_IP]
# 또는
ping [서버_IP]

# 브라우저에서 접속 시도
# http://[서버_IP]
```

**3. Windows 포트 포워딩 확인 (서버에서)**
```powershell
# 관리자 권한으로 PowerShell 실행
netsh interface portproxy show all

# 포트 포워딩이 설정되어 있는지 확인
# 예시:
# Listen on ipv4:             Connect to ipv4:
# Address         Port        Address         Port
# --------------- ----------  --------------- ----------
# 0.0.0.0         80          172.28.241.135  80
```

**4. Windows 방화벽 확인 (서버에서)**
```powershell
# 관리자 권한으로 PowerShell 실행
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*80*" -or $_.DisplayName -like "*HTTP*"}

# 포트 80이 허용되어 있는지 확인
# 허용되지 않았다면:
New-NetFirewallRule -DisplayName "HTTP Port 80" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
```

### 해결 방법

**방법 1: 서버에서 포트 포워딩 재설정**

서버에서 관리자 권한으로 PowerShell을 실행하고:

```powershell
# 기존 포트 포워딩 삭제 (있다면)
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=0.0.0.0

# 포트 포워딩 재설정
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=80 connectaddress=172.28.241.135

# 확인
netsh interface portproxy show all
```

**방법 2: 내부 IP 주소 확인**

서버의 실제 내부 IP 주소를 확인:

```powershell
# Windows에서 내부 IP 확인
ipconfig

# IPv4 주소 확인 (예: 172.28.241.135)
# 이 IP 주소를 connectaddress에 사용
```

**방법 3: 로컬 노트북에서 네트워크 확인**

```bash
# 서버 IP로 ping 테스트
ping [서버_IP]

# 포트 연결 테스트
# Windows
Test-NetConnection -ComputerName [서버_IP] -Port 80

# 또는 telnet 사용
telnet [서버_IP] 80
```

**방법 4: 브라우저 캐시 및 쿠키 삭제**

브라우저에서:
- 캐시 삭제
- 쿠키 삭제
- 시크릿 모드로 접속 시도

**방법 5: 다른 네트워크에서 접속 시도**

- 다른 Wi-Fi 네트워크에서 접속 시도
- 모바일 핫스팟 사용
- 같은 네트워크인지 확인

## 문제 1: localhost:5173에서만 접속되고 localhost만 치면 안 되는 문제

### 로컬 개발 환경 (개발 중)
- ✅ **정상 동작입니다!** `http://localhost:5173`으로 접속하세요
- Vite는 기본적으로 포트 5173에서만 실행됩니다

### 서버 배포 환경
- 서버에서는 Nginx를 통해 포트 80에서 서비스해야 합니다
- 아래 문제 2를 참고하세요

---

## 문제 2: IP 주소(202.31.147.98)로 접속이 안 되는 문제

### 즉시 확인할 명령어

```bash
# 1. 포트 리스닝 확인
sudo ss -tlnp | grep :80
# 결과가 0.0.0.0:80이어야 함 (정상)
# 예시: LISTEN 0 511 0.0.0.0:80 0.0.0.0:* users:(("nginx",pid=...))
```

**정상 상태 확인:**
- ✅ `0.0.0.0:80` → 모든 네트워크 인터페이스에서 리스닝 (정상, 외부 접속 가능)
- ❌ `127.0.0.1:80` → localhost에서만 리스닝 (문제, 외부 접속 불가)

# 2. Nginx 설정 확인
sudo grep -E "listen|server_name" /etc/nginx/sites-available/contest-guide
# listen 80; server_name _; 이어야 함

# 3. 방화벽 확인
sudo ufw status | grep 80

# 4. 기본 사이트 비활성화 확인
ls -la /etc/nginx/sites-enabled/
# default 파일이 없어야 함
```

### 빠른 수정 명령어

```bash
# Nginx 설정 자동 수정
sudo sed -i 's/listen 127.0.0.1:80;/listen 80;/' /etc/nginx/sites-available/contest-guide
sudo sed -i 's/server_name localhost;/server_name _;/' /etc/nginx/sites-available/contest-guide
sudo rm -f /etc/nginx/sites-enabled/default

# 방화벽 허용
sudo ufw allow 80/tcp
sudo ufw reload

# Nginx 재시작
sudo nginx -t && sudo systemctl restart nginx

# 확인
curl -I http://202.31.147.98
```

---

## 문제 3: 도메인 주소로 접속이 안 되는 문제

### 1단계: DNS 레코드 확인

```bash
# 서버에서 확인
dig contest-guide.ac.kr
# 또는
nslookup contest-guide.ac.kr

# 정상 응답:
# contest-guide.ac.kr. 300 IN A 202.31.147.98
```

### 2단계: DNS A 레코드 설정

**학교 도메인 관리자 페이지에서 설정:**

```
호스트: contest-guide
타입: A
값: 202.31.147.98
TTL: 300
```

### 3단계: DNS 전파 확인

```bash
# 몇 분 후 다시 확인
dig contest-guide.ac.kr

# 온라인 도구로도 확인:
# https://dnschecker.org/
```

### 4단계: Nginx 설정 확인

```bash
# 도메인도 허용하도록 설정
sudo nano /etc/nginx/sites-available/contest-guide
```

```nginx
server {
    listen 80;
    server_name _ contest-guide.ac.kr;  # IP와 도메인 모두 허용
    # ... 나머지 설정 ...
}
```

```bash
sudo nginx -t && sudo systemctl restart nginx
```

---

## 종합 진단 스크립트

서버에서 다음 명령어를 실행하여 모든 문제를 한 번에 확인:

```bash
echo "=== 1. 포트 리스닝 상태 ==="
sudo ss -tlnp | grep :80
echo ""

echo "=== 2. Nginx 설정 ==="
sudo grep -E "listen|server_name" /etc/nginx/sites-available/contest-guide
echo ""

echo "=== 3. 방화벽 상태 ==="
sudo ufw status | grep 80
echo ""

echo "=== 4. 기본 사이트 비활성화 확인 ==="
ls -la /etc/nginx/sites-enabled/ | grep default
echo ""

echo "=== 5. DNS 확인 ==="
dig contest-guide.ac.kr +short
echo ""

echo "=== 6. 서버에서 IP 접속 테스트 ==="
curl -I http://202.31.147.98 2>&1 | head -3
echo ""

echo "=== 7. 서버에서 도메인 접속 테스트 ==="
curl -I http://contest-guide.ac.kr 2>&1 | head -3
```

---

## localhost는 되는데 IP 주소로는 타임아웃되는 경우

### 증상

```bash
# localhost 접속: 정상
$ curl -I http://localhost
HTTP/1.1 200 OK
Server: nginx/1.24.0

# IP 주소 접속: 타임아웃
$ curl -I http://202.31.147.98
curl: (28) Failed to connect to 202.31.147.98 port 80 after 141681 ms
```

**확인된 사항:**
- ✅ Nginx: `0.0.0.0:80`에서 리스닝 중 (정상)
- ✅ 방화벽: 포트 80 허용됨 (정상)
- ✅ localhost 접속: 정상 작동
- ❌ IP 주소 접속: 타임아웃

### 원인

**포트 체크 결과:**
- **State: filtered** → 네트워크 레벨에서 포트 80이 차단됨
- **Port 80: closed** → 외부에서 포트 80 접속 불가

1. **네트워크 레벨 차단** (확인됨)
   - 학교 네트워크에서 포트 80을 차단
   - 외부에서 포트 80 접속 불가
   - 방화벽이나 라우터에서 포트 80 필터링

2. **Hairpin NAT 문제** (가능성 낮음)
   - 서버에서 자신의 공인 IP로 접속할 수 없음
   - 하지만 포트 체크 도구에서도 "filtered"로 나타나므로 네트워크 차단이 확실함

### 해결 방법

**1단계: 다른 컴퓨터에서 접속 시도**

서버가 아닌 다른 컴퓨터에서 브라우저로 접속:
- `http://202.31.147.98`
- 접속이 되면: Hairpin NAT 문제 (서버에서만 안 되는 것)
- 접속이 안 되면: 네트워크 레벨 차단

**2단계: 온라인 포트 체크 도구 사용**

- https://www.yougetsignal.com/tools/open-ports/
- https://canyouseeme.org/
- 포트 80이 열려있는지 확인

**3단계: 포트 8080 사용 (임시 해결)**

포트 80이 차단되어 있다면 포트 8080 사용:

```bash
# Nginx 설정 수정
sudo sed -i 's/listen 80;/listen 8080;/' /etc/nginx/sites-available/contest-guide

# 방화벽에서 포트 8080 허용 (이미 허용되어 있음)
sudo ufw allow 8080/tcp
sudo ufw reload

# Nginx 재시작
sudo nginx -t && sudo systemctl restart nginx

# 확인
curl -I http://localhost:8080
```

접속 주소: `http://202.31.147.98:8080`

**포트 8080도 localhost만 되고 IP 접속이 안 되는 경우:**

이것은 포트 8080도 학교 네트워크에서 차단되고 있다는 의미입니다.

**TCP Retransmission 발생:**

접속 과정에서 TCP Retransmission이 발생한다면:
- 패킷이 전송되지만 응답이 없음
- 네트워크 레벨에서 패킷이 차단되거나 드롭됨
- 방화벽이나 라우터에서 연결을 차단

**TCP Retransmission 확인 방법:**
```bash
# tcpdump로 패킷 확인
sudo tcpdump -i any -n 'host 202.31.147.98 and port 80'

# 또는 Wireshark 사용
# Retransmission 패킷이 반복적으로 나타나면 네트워크 차단
```

**TCP Retransmission 해결:**

**Windows 서버에서 포트 포워딩 설정 (해결됨!):**

Windows 서버를 사용하는 경우, 포트 포워딩을 설정하면 해결됩니다:

```powershell
# 관리자 권한으로 PowerShell 실행 후
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=80 connectaddress=172.28.241.135

# 포트 포워딩 확인
netsh interface portproxy show all

# 포트 포워딩 삭제 (필요한 경우)
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=0.0.0.0
```

**설명:**
- `listenport=80`: 외부에서 접속할 포트
- `listenaddress=0.0.0.0`: 모든 네트워크 인터페이스에서 리스닝
- `connectport=80`: 내부 서버의 포트
- `connectaddress=172.28.241.135`: 내부 서버의 IP 주소

**다른 해결 방법:**

1. **네트워크 관리자에게 문의** (가장 확실)
   - 포트 80, 8080 개방 요청
   - 방화벽 정책 확인

2. **다른 포트 시도**
   - 표준 포트가 아닌 다른 포트 사용
   - 예: 3000, 5000, 8888 등

3. **VPN 또는 프록시 사용** (임시 해결)
   - VPN을 통해 접속
   - 리버스 프록시 사용

**해결 방법 1: 여러 포트 동시 테스트**

여러 포트를 동시에 열어서 어떤 포트가 작동하는지 확인:

```bash
# Nginx 설정에 여러 포트 추가
sudo nano /etc/nginx/sites-available/contest-guide
```

다음과 같이 수정:
```nginx
server {
    listen 80;
    listen 8080;
    listen 3000;
    listen 5000;
    listen 8888;
    server_name _;
    
    # ... 나머지 설정 ...
}
```

```bash
# 방화벽에서 여러 포트 허용
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
sudo ufw allow 8888/tcp
sudo ufw reload

# Nginx 재시작
sudo nginx -t && sudo systemctl restart nginx

# 확인
sudo ss -tlnp | grep -E ":80|:8080|:3000|:5000|:8888"
```

그 다음 다른 컴퓨터에서 각 포트로 접속 시도:
- `http://202.31.147.98:80`
- `http://202.31.147.98:8080`
- `http://202.31.147.98:3000`
- `http://202.31.147.98:5000`
- `http://202.31.147.98:8888`

**해결 방법 2: 학교 네트워크 관리자에게 문의 (가장 확실)**

여러 포트가 모두 차단되어 있다면:
1. **학교 네트워크 관리자에게 특정 포트 개방 요청**
   - 포트 80 또는 443 개방 요청 (표준 HTTP/HTTPS 포트)
   - 또는 특정 포트(8080, 3000 등) 개방 요청

2. **포트 포워딩 설정 요청**
   - 내부 IP → 공인 IP 포트 포워딩

3. **방화벽 정책 확인**
   - 학교 네트워크 방화벽 정책 확인
   - 특정 IP/포트 허용 목록에 추가 요청

**4단계: 학교 네트워크 관리자에게 문의**

- 포트 80 개방 요청
- 또는 포트 8080 사용 허가 요청
- 네트워크 정책 확인

## 여전히 안 되면

1. **학교 네트워크 관리자에게 문의**
   - 포트 80 개방 요청
   - 또는 포트 8080 사용

2. **온라인 포트 체크 도구 사용**
   - https://www.yougetsignal.com/tools/open-ports/
   - 포트 80이 열려있는지 확인

3. **다른 컴퓨터에서 접속 시도**
   - 같은 네트워크에서 접속되는지 확인
   - 외부 네트워크에서 접속되는지 확인

---

더 자세한 내용은 `COMPLETE_GUIDE.md`의 "문제 해결 가이드" 섹션을 참고하세요.
