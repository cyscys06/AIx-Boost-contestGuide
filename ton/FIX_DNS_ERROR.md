# DNS 서버 연결 오류 해결 가이드

## 오류 메시지

```
;; communications error to 10.255.255.254#53: timed out
;; communications error to 10.255.255.254#53: timed out
;; communications error to 10.255.255.254#53: timed out
;; no servers could be reached
```

## 원인

1. **DNS 서버(10.255.255.254)에 연결할 수 없음**
   - 네트워크 문제
   - 방화벽이 DNS 포트(53)를 차단
   - DNS 서버가 다운되었거나 응답하지 않음

2. **`nslookup [IP주소]` 사용 오류**
   - `nslookup`으로 IP 주소를 조회하는 것은 역방향 DNS 조회입니다
   - IP 주소를 확인하려면 다른 명령어를 사용해야 합니다

## 해결 방법

### 방법 1: IP 주소 확인 (올바른 방법)

**`nslookup`은 도메인 이름을 IP로 변환하는 도구입니다. IP 주소를 확인하려면:**

```bash
# 공인 IP 주소 확인 (외부에서 보이는 IP)
curl ifconfig.me
# 또는
curl ipinfo.io/ip
# 또는
curl icanhazip.com

# 로컬 네트워크 인터페이스 IP 확인
hostname -I | awk '{print $1}'
# 또는
ip addr show | grep "inet " | grep -v 127.0.0.1
# 또는
ifconfig | grep "inet " | grep -v 127.0.0.1

# 모든 네트워크 인터페이스 확인
ip addr show
# 또는
ifconfig
```

### 방법 2: DNS 서버 연결 문제 해결

**다른 DNS 서버 사용:**

```bash
# Google DNS 사용
nslookup contest-guide.ac.kr 8.8.8.8

# Cloudflare DNS 사용
nslookup contest-guide.ac.kr 1.1.1.1

# 역방향 DNS 조회 (IP → 도메인)
nslookup 202.31.147.98 8.8.8.8
```

**DNS 설정 확인:**

```bash
# 현재 DNS 서버 확인
cat /etc/resolv.conf

# DNS 서버 변경 (임시)
sudo nano /etc/resolv.conf
# nameserver 8.8.8.8 추가
```

### 방법 3: 네트워크 연결 확인

```bash
# DNS 서버에 ping 테스트
ping 10.255.255.254

# DNS 포트(53) 연결 테스트
nc -zv 10.255.255.254 53
# 또는
telnet 10.255.255.254 53

# 네트워크 라우팅 확인
ip route
```

## 일반적인 사용 사례

### 서버 IP 주소 확인 (가장 흔한 경우)

```bash
# 공인 IP 확인
curl ifconfig.me

# 로컬 IP 확인
hostname -I
```

### 도메인 이름을 IP로 변환

```bash
# 정상적인 nslookup 사용
nslookup contest-guide.ac.kr

# 다른 DNS 서버 사용 (기본 DNS가 안 될 때)
nslookup contest-guide.ac.kr 8.8.8.8
```

### IP 주소를 도메인으로 변환 (역방향 DNS)

```bash
# 역방향 DNS 조회
nslookup 202.31.147.98

# 다른 DNS 서버 사용
nslookup 202.31.147.98 8.8.8.8
```

## NXDOMAIN 오류 해결

### 오류 메시지

```
** server can't find contest.kunsan.ac.kr: NXDOMAIN
```

### 원인

- **도메인이 DNS에 등록되지 않음**
- DNS A 레코드가 설정되지 않았거나 잘못 설정됨

### 해결 방법

**학교 도메인 관리자 페이지에서 DNS A 레코드 설정:**

```
호스트: contest
타입: A
값: 202.31.147.98  (또는 현재 서버 IP 주소)
TTL: 300
```

**설정 후 확인:**
```bash
# DNS 전파 확인 (몇 분~몇 시간 소요될 수 있음)
nslookup contest.kunsan.ac.kr

# 정상 응답 예시:
# Name: contest.kunsan.ac.kr
# Address: 202.31.147.98
```

### DNS 서버 주소 vs 웹 서버 IP 주소

**중요한 구분:**

- **`Server: 10.255.255.254`** - 이것은 **DNS 서버**의 주소입니다 (정상)
- **`Address: 10.255.255.254#53`** - 이것도 **DNS 서버**의 주소입니다 (정상)
- **`202.31.147.98`** - 이것은 **웹 서버**의 IP 주소입니다

**`nslookup` 출력 해석:**

```
Server:         10.255.255.254    ← DNS 서버 주소 (정상)
Address:        10.255.255.254#53 ← DNS 서버 주소 (정상)

** server can't find contest.kunsan.ac.kr: NXDOMAIN
← 도메인이 DNS에 등록되지 않음 (DNS A 레코드 설정 필요)
```

**정상 작동 시 예시:**
```
Server:         10.255.255.254
Address:        10.255.255.254#53

Name:   contest.kunsan.ac.kr
Address: 202.31.147.98    ← 이것이 웹 서버 IP 주소
```

## 요약

- **IP 주소를 확인하려면**: `curl ifconfig.me` 또는 `hostname -I` 사용
- **도메인을 IP로 변환하려면**: `nslookup [도메인]` 사용
- **DNS 서버 연결 오류 시**: 다른 DNS 서버(8.8.8.8, 1.1.1.1) 사용
- **NXDOMAIN 오류**: DNS A 레코드 설정 필요

---

## IP 주소 접속 vs 도메인 접속

### 중요한 구분

**IP 주소로 접속 (`http://202.31.147.98`):**
- ✅ **DNS와 무관합니다!** IP 주소는 DNS를 거치지 않고 직접 접속합니다.
- IP 주소로 접속이 안 되는 이유:
  1. **Nginx 설정 문제**: `listen 127.0.0.1:80;`이면 안 됨, `listen 80;`이어야 함
  2. **방화벽 문제**: 포트 80이 차단됨
  3. **네트워크 레벨 차단**: 학교 네트워크에서 포트 80 차단
  4. **서버가 실행되지 않음**: Nginx가 실행되지 않음

**도메인으로 접속 (`http://contest.kunsan.ac.kr`):**
- ❌ **DNS가 필요합니다!** 도메인을 IP로 변환하려면 DNS A 레코드가 필요합니다.
- 도메인으로 접속이 안 되는 이유:
  1. **DNS A 레코드가 없음**: `NXDOMAIN` 오류
  2. **DNS 전파가 안 됨**: 레코드를 설정했지만 아직 전파되지 않음
  3. **잘못된 IP 주소**: DNS 레코드의 IP가 실제 서버 IP와 다름

### 현재 상황 진단

**IP 주소로 접속이 안 되는 경우:**
```bash
# 서버에서 확인
curl -I http://202.31.147.98
# 또는
curl -I http://localhost

# Nginx 설정 확인
sudo grep -E "listen|server_name" /etc/nginx/sites-available/contest-guide
# listen 80; server_name _; 이어야 함

# 방화벽 확인
sudo ufw status | grep 80
```

**도메인으로 접속이 안 되는 경우:**
```bash
# DNS 레코드 확인
nslookup contest.kunsan.ac.kr

# NXDOMAIN이면 DNS A 레코드 설정 필요
# 정상이면 IP 주소가 나타남
```

### 해결 순서

1. **먼저 IP 주소로 접속 확인**
   - IP 주소로 접속이 되면 서버는 정상 작동 중
   - IP 주소로 접속이 안 되면 Nginx/방화벽 설정 확인

2. **그 다음 도메인으로 접속 확인**
   - IP 주소로 접속이 되는데 도메인으로 안 되면 DNS 문제
   - DNS A 레코드 설정 필요

**참고:** 
- `Server`와 `Address`는 DNS 서버 주소이지, 웹 서버 IP가 아닙니다.
- 웹 서버 IP는 DNS A 레코드가 설정된 후 `nslookup` 결과의 `Address` 필드에 나타납니다.
- **IP 주소 접속은 DNS와 무관합니다.** IP 주소로 접속이 안 되는 것은 Nginx 설정이나 방화벽 문제입니다.
- 학교 네트워크에서는 내부 DNS 서버(10.255.255.254)를 사용해야 할 수 있습니다.
