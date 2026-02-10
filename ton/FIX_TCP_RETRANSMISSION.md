# TCP Retransmission 문제 해결 가이드

## 문제 증상

접속 과정에서 TCP Retransmission이 발생하는 경우:

- 패킷이 전송되지만 응답이 없음
- 연결이 타임아웃됨
- `curl: (28) Failed to connect` 오류
- 포트 체크 도구에서 "filtered" 또는 "closed" 상태

## 원인

TCP Retransmission은 다음 상황에서 발생합니다:

1. **네트워크 레벨 차단**
   - 방화벽이나 라우터에서 패킷 차단
   - 학교 네트워크에서 특정 포트 차단
   - 패킷이 전송되지만 응답이 없어 재전송 발생

2. **네트워크 혼잡**
   - 네트워크가 과부하 상태
   - 패킷 손실 발생

3. **라우팅 문제**
   - 네트워크 경로 문제
   - 중간 라우터에서 패킷 드롭

## 확인 방법

### 1. tcpdump로 패킷 확인

```bash
# 포트 80 패킷 확인
sudo tcpdump -i any -n 'host 202.31.147.98 and port 80'

# Retransmission 패킷 확인
sudo tcpdump -i any -n 'host 202.31.147.98 and port 80' | grep -i retransmit

# SYN 패킷만 확인 (연결 시도)
sudo tcpdump -i any -n 'host 202.31.147.98 and port 80 and tcp[tcpflags] & tcp-syn != 0'
```

**정상 작동 시:**
- SYN → SYN-ACK → ACK (3-way handshake 완료)
- 데이터 패킷 교환

**문제 발생 시:**
- SYN → (응답 없음) → SYN 재전송 → (응답 없음) → 반복
- TCP Retransmission 반복 발생

### 2. Wireshark로 확인

GUI 도구를 사용하여 패킷을 시각적으로 확인:
- Wireshark 설치 후 네트워크 인터페이스 캡처
- Retransmission 패킷이 빨간색으로 표시됨
- 패킷이 전송되지만 응답이 없는 것을 확인

### 3. netstat으로 연결 상태 확인

```bash
# 연결 상태 확인
sudo netstat -an | grep 202.31.147.98

# TIME_WAIT, SYN_SENT 상태가 많으면 문제
```

## 해결 방법

### 방법 1: 학교 네트워크 관리자에게 문의 (가장 확실)

TCP Retransmission이 발생하는 것은 네트워크 레벨에서 차단되고 있다는 확실한 증거입니다.

**요청 사항:**
1. **포트 개방 요청**
   - 포트 80 또는 443 개방 (표준 HTTP/HTTPS)
   - 또는 특정 포트(8080, 3000 등) 개방

2. **방화벽 정책 확인**
   - 특정 IP 주소(202.31.147.98)에 대한 방화벽 규칙 확인
   - 허용 목록에 추가 요청

3. **포트 포워딩 설정**
   - 내부 IP → 공인 IP 포트 포워딩 설정

### 방법 2: 다른 포트 사용

표준 포트가 아닌 다른 포트를 시도:

```bash
# 여러 포트 동시 테스트
sudo nano /etc/nginx/sites-available/contest-guide
```

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
# 방화벽 허용
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
sudo ufw allow 8888/tcp
sudo ufw reload

# Nginx 재시작
sudo nginx -t && sudo systemctl restart nginx
```

온라인 포트 체크 도구로 각 포트 확인:
- https://www.yougetsignal.com/tools/open-ports/
- 어떤 포트가 열려있는지 확인

### 방법 3: VPN 또는 프록시 사용 (임시 해결)

**VPN 사용:**
- VPN 서버를 통해 접속
- 네트워크 차단을 우회

**리버스 프록시 사용:**
- 외부 프록시 서버 사용
- 프록시를 통해 접속

### 방법 4: 네트워크 설정 확인

```bash
# 네트워크 인터페이스 확인
ip addr show

# 라우팅 테이블 확인
ip route

# DNS 확인
cat /etc/resolv.conf

# 네트워크 연결 테스트
ping 8.8.8.8  # Google DNS
ping 202.31.147.98  # 서버 IP
```

## 진단 스크립트

다음 스크립트로 종합 진단:

```bash
#!/bin/bash

echo "=== 1. 포트 리스닝 상태 ==="
sudo ss -tlnp | grep -E ":80|:8080"
echo ""

echo "=== 2. 방화벽 상태 ==="
sudo ufw status | grep -E "80|8080"
echo ""

echo "=== 3. 서버에서 localhost 접속 테스트 ==="
curl -I http://localhost 2>&1 | head -3
echo ""

echo "=== 4. 서버에서 IP 접속 테스트 ==="
CURRENT_IP=$(curl -s ifconfig.me)
timeout 5 curl -I http://$CURRENT_IP 2>&1 | head -3
echo ""

echo "=== 5. TCP 연결 테스트 ==="
timeout 5 nc -zv $CURRENT_IP 80 2>&1
echo ""

echo "=== 6. 패킷 전송 확인 (tcpdump) ==="
echo "다음 명령어로 패킷 확인: sudo tcpdump -i any -n 'host $CURRENT_IP and port 80'"
echo ""
```

## 요약

**TCP Retransmission 발생 = 네트워크 레벨 차단**

- ✅ 서버 설정: 정상 (포트 리스닝, 방화벽 허용)
- ✅ localhost 접속: 정상
- ❌ IP 주소 접속: TCP Retransmission 발생
- ❌ 원인: 학교 네트워크에서 포트 차단

**해결책:**
1. 학교 네트워크 관리자에게 포트 개방 요청 (가장 확실)
2. 다른 포트 시도 (3000, 5000, 8888 등)
3. VPN 또는 프록시 사용 (임시 해결)

---

더 자세한 내용은 `FIX_ACCESS_ISSUES.md`를 참고하세요.
