# 서버 상태 확인 가이드

## 포트 리스닝 상태 확인

### 정상 상태 예시

```bash
$ sudo ss -tlnp | grep :80
LISTEN 0 511 0.0.0.0:80 0.0.0.0:* users:(("nginx",pid=3143,fd=5),...)
```

**해석:**
- ✅ `0.0.0.0:80` → **정상!** 모든 네트워크 인터페이스에서 포트 80 리스닝
- ✅ `nginx` 프로세스 실행 중 → **정상!**
- ✅ 외부에서 접속 가능한 상태

### 백엔드 포트 확인

```bash
$ sudo ss -tlnp | grep :8000
LISTEN 0 2048 127.0.0.1:8000 0.0.0.0:* users:(("gunicorn",pid=4080,fd=3),...)
```

**해석:**
- ✅ `127.0.0.1:8000` → **정상!** localhost에서만 리스닝 (보안상 정상)
- ✅ `gunicorn` 프로세스 실행 중 → **정상!**
- ✅ Nginx를 통해서만 접속 가능 (직접 외부 접속 불가, 보안상 올바름)

## 종합 상태 확인

### 1. Nginx 상태 확인

```bash
# Nginx 실행 상태
sudo systemctl status nginx

# Nginx 설정 테스트
sudo nginx -t

# Nginx 설정 확인
sudo grep -E "listen|server_name" /etc/nginx/sites-available/contest-guide
```

**정상 설정:**
```
listen 80;
server_name _;
```

### 2. 방화벽 확인

```bash
# UFW 상태 확인
sudo ufw status

# 포트 80 허용 확인
sudo ufw status | grep 80

# 포트 80이 허용되지 않은 경우
sudo ufw allow 80/tcp
sudo ufw reload
```

### 3. 서버에서 접속 테스트

```bash
# localhost 접속 테스트
curl -I http://localhost

# IP 주소 접속 테스트 (현재 서버 IP 확인 후)
CURRENT_IP=$(curl -s ifconfig.me)
curl -I http://$CURRENT_IP

# 또는 직접 IP 입력
curl -I http://202.31.147.98
```

**정상 응답 예시:**
```
HTTP/1.1 200 OK
Server: nginx/1.18.0
Content-Type: text/html
...
```

### 4. 외부에서 접속 테스트

**다른 컴퓨터에서:**
- 브라우저에서 `http://[서버_IP]` 접속 시도
- 또는 온라인 도구 사용: https://www.yougetsignal.com/tools/open-ports/

## 문제 해결 체크리스트

포트 리스닝이 정상(`0.0.0.0:80`)인데도 접속이 안 되는 경우:

- [ ] 방화벽에서 포트 80 허용 확인
- [ ] Nginx 설정 확인 (`listen 80;`, `server_name _;`)
- [ ] 기본 사이트 비활성화 확인 (`/etc/nginx/sites-enabled/default` 삭제)
- [ ] 서버에서 `curl -I http://localhost` 테스트
- [ ] 서버에서 `curl -I http://[서버_IP]` 테스트
- [ ] 다른 컴퓨터에서 접속 시도
- [ ] 온라인 포트 체크 도구로 포트 80 확인
- [ ] 학교 네트워크 관리자에게 포트 80 개방 요청

## 정상 상태 요약

**포트 리스닝 상태가 다음과 같으면 정상입니다:**

```
LISTEN 0 511 0.0.0.0:80 0.0.0.0:* users:(("nginx",...))
LISTEN 0 2048 127.0.0.1:8000 0.0.0.0:* users:(("gunicorn",...))
```

- ✅ Nginx: `0.0.0.0:80` (외부 접속 가능)
- ✅ 백엔드: `127.0.0.1:8000` (Nginx를 통해서만 접속, 보안상 정상)

이 상태에서도 접속이 안 되면:
1. 방화벽 문제
2. 네트워크 레벨 차단 (학교 네트워크)
3. Nginx 설정 문제

위 항목들을 확인하세요.
