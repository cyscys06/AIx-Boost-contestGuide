# 서버 IP 주소 변경 가이드

서버 IP 주소가 변경되었을 때 업데이트해야 하는 모든 설정을 안내합니다.

## 1단계: 현재 서버 IP 주소 확인

서버에서 다음 명령어로 현재 IP 주소를 확인하세요:

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

**주의:** `nslookup [IP주소]`는 역방향 DNS 조회를 위한 명령어이며, DNS 서버가 필요합니다. IP 주소를 확인하려면 위의 명령어를 사용하세요.

**DNS 서버 연결 오류가 발생하는 경우:**
```bash
# DNS 서버 연결 오류 예시:
# ;; communications error to 10.255.255.254#53: timed out
# ;; no servers could be reached

# 해결 방법 1: 다른 DNS 서버 사용
nslookup [IP주소] 8.8.8.8  # Google DNS 사용
# 또는
nslookup [IP주소] 1.1.1.1  # Cloudflare DNS 사용

# 해결 방법 2: IP 주소 확인은 위의 curl/ip 명령어 사용 (권장)
curl ifconfig.me
```

## 2단계: 설정 파일 업데이트

### 백엔드 CORS 설정 업데이트

**파일:** `backend/config.py`

```python
# CORS Settings
# Add server IP and domain to CORS origins
CORS_ORIGINS = DEFAULT_CORS_ORIGINS + [
    "http://[새로운_IP_주소]",  # 여기를 새로운 IP로 변경
    "http://contest-guide.ac.kr",
    "https://contest-guide.ac.kr",
]
```

**업데이트 방법:**

**방법 1: config.py 직접 수정 (가장 간단, 권장)**

`.env` 파일 권한 문제를 피하고 싶다면 이 방법을 사용하세요:

```bash
cd /var/www/contest-guide/ton/backend

# config.py 수정
sudo nano config.py

# CORS_ORIGINS 부분에서 직접 IP 주소 추가:
# CORS_ORIGINS.append("http://[새로운_IP_주소]")

# 또는 sed로 자동 변경
sudo sed -i 's/http:\/\/202\.31\.147\.98/http:\/\/[새로운_IP_주소]/' config.py

# 백엔드 재시작
sudo systemctl restart contest-guide-api
```

**방법 2: .env 파일 사용 (환경 변수)**

**".env: Permission denied" 오류가 발생하는 경우:**

```bash
cd /var/www/contest-guide/ton/backend

# 방법 2-1: .env 파일 권한 수정
sudo chown $USER:$USER .env
chmod 600 .env

# .env 파일에 추가
echo "SERVER_IP=[새로운_IP_주소]" >> .env

# 방법 2-2: sudo로 직접 추가
sudo bash -c 'echo "SERVER_IP=[새로운_IP_주소]" >> .env'
sudo chown $USER:$USER .env
chmod 600 .env

# 방법 2-3: .env 파일이 없으면 생성
if [ ! -f .env ]; then
    sudo touch .env
    sudo chown $USER:$USER .env
    chmod 600 .env
fi
echo "SERVER_IP=[새로운_IP_주소]" >> .env

# 백엔드 재시작
sudo systemctl restart contest-guide-api
```

## 3단계: DNS 레코드 업데이트

학교 도메인 관리자 페이지에 접속하여 DNS A 레코드를 업데이트하세요:

**설정 내용:**
- **호스트/서브도메인**: `contest-guide`
- **타입**: `A`
- **값/IP 주소**: `[새로운_IP_주소]` ← 여기를 새로운 IP로 변경
- **TTL**: `300` (또는 기본값)

**DNS 전파 확인:**
```bash
# 몇 분 후 확인
dig contest-guide.ac.kr
nslookup contest-guide.ac.kr

# 정상 응답 예시:
# contest-guide.ac.kr. 300 IN A [새로운_IP_주소]
```

## 4단계: 문서 업데이트 (선택사항)

문서에서 IP 주소 예시를 업데이트하려면:

```bash
# COMPLETE_GUIDE.md에서 IP 주소 찾기
grep -n "202.31.147.98" COMPLETE_GUIDE.md

# FIX_ACCESS_ISSUES.md에서 IP 주소 찾기
grep -n "202.31.147.98" FIX_ACCESS_ISSUES.md

# 일괄 변경 (예: 192.168.1.100으로 변경)
sed -i 's/202\.31\.147\.98/[새로운_IP_주소]/g' COMPLETE_GUIDE.md
sed -i 's/202\.31\.147\.98/[새로운_IP_주소]/g' FIX_ACCESS_ISSUES.md
```

## 5단계: 접속 테스트

```bash
# 서버에서 IP 접속 테스트
curl -I http://[새로운_IP_주소]

# 도메인 접속 테스트 (DNS 전파 후)
curl -I http://contest-guide.ac.kr
```

## 빠른 업데이트 스크립트

새로운 IP 주소를 환경 변수로 설정하고 한 번에 업데이트:

```bash
# 새로운 IP 주소 설정
NEW_IP="[새로운_IP_주소]"  # 예: NEW_IP="192.168.1.100"

# 백엔드 CORS 설정 업데이트
cd /var/www/contest-guide/ton/backend
sudo sed -i "s/http:\/\/202\.31\.147\.98/http:\/\/${NEW_IP}/" config.py

# 백엔드 재시작
sudo systemctl restart contest-guide-api

# 접속 테스트
curl -I http://${NEW_IP}
```

## 확인 사항 체크리스트

- [ ] 서버 IP 주소 확인 완료
- [ ] `backend/config.py`의 CORS 설정 업데이트 완료
- [ ] 백엔드 서비스 재시작 완료
- [ ] DNS A 레코드 업데이트 완료 (도메인 사용 시)
- [ ] DNS 전파 확인 완료
- [ ] IP 주소로 접속 테스트 완료
- [ ] 도메인으로 접속 테스트 완료 (도메인 사용 시)

## 문제 해결

### CORS 오류가 발생하는 경우

브라우저 콘솔에서 CORS 오류가 발생하면:
1. `backend/config.py`의 CORS_ORIGINS에 새로운 IP가 포함되어 있는지 확인
2. 백엔드 서비스를 재시작했는지 확인
3. 브라우저 캐시를 지우고 다시 시도

### DNS가 업데이트되지 않는 경우

1. DNS 레코드 설정이 올바른지 확인
2. TTL 시간만큼 대기 (보통 몇 분~몇 시간)
3. 온라인 DNS 체크 도구 사용: https://dnschecker.org/

---

**참고:** 문서의 IP 주소 예시는 참고용이므로 반드시 업데이트할 필요는 없습니다. 중요한 것은 `backend/config.py`의 CORS 설정과 DNS 레코드입니다.
