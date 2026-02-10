# Contest Guide - 완전 가이드

AI 기반 공모전 추천 및 전략 분석 웹 애플리케이션의 전체 가이드입니다.

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
3. [서버 배포 가이드](#서버-배포-가이드)
4. [문제 해결 가이드](#문제-해결-가이드)
5. [Git 사용 가이드](#git-사용-가이드)
6. [서버 설정 제거](#서버-설정-제거)

---

## 프로젝트 개요

### 주요 기능

- **공모전 분석**: 포스터 이미지 또는 텍스트로 공모전 분석
- **개인화 추천**: 사용자 프로필 기반 맞춤 추천
- **준비도 평가**: 기술, 시간, 진행 상황 기반 점수
- **AI 어시스턴트**: 실시간 조언 및 일정 관리
- **타임라인**: 액션 중심 일정 관리

### 프로젝트 구조

```
ton/
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/         # UI 컴포넌트
│   │   ├── contexts/           # React Context (상태 관리)
│   │   ├── pages/              # 페이지 컴포넌트
│   │   ├── styles/             # CSS 스타일
│   │   └── utils/              # 유틸리티 함수
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # FastAPI 백엔드
│   ├── services/
│   │   └── gpt_service.py      # GPT 서비스
│   ├── main.py                 # API 엔드포인트
│   ├── schemas.py              # Pydantic 모델
│   ├── config.py               # 설정
│   └── requirements.txt
│
└── README.md
```

### 기술 스택

- **Frontend**: React 18, Vite, React Router
- **Backend**: FastAPI, Pydantic
- **AI**: OpenAI GPT (예정)
- **Storage**: Browser LocalStorage

---

## 로컬 개발 환경 설정

### 필수 요구사항

- Python 3.8 이상
- Node.js 18 이상
- npm 또는 yarn

### 1. 백엔드 설정

```bash
cd backend

# 가상환경 생성
python -m venv venv

# 가상환경 활성화
# Windows PowerShell/CMD:
.\venv\Scripts\activate
# Windows Git Bash:
source venv/Scripts/activate
# Linux/Mac:
source venv/bin/activate

# 의존성 설치
python -m pip install -r requirements.txt

# 서버 실행
python -m uvicorn main:app --reload --port 8000
```

백엔드: http://localhost:8000  
API 문서: http://localhost:8000/docs

### 2. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드: http://localhost:5173

---

## 서버 배포 가이드

### Windows 서버 배포

#### Windows에서 포트 포워딩 설정 (해결됨!)

**문제:** localhost는 되는데 IP 주소로 접속이 안 되는 경우

**해결:** Windows 포트 포워딩 설정

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
- `connectaddress=172.28.241.135`: 내부 서버의 IP 주소 (실제 내부 IP로 변경)

**다른 포트 사용 시:**
```powershell
# 포트 8080 사용
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=172.28.241.135
```

**Windows 방화벽 설정:**
```powershell
# 포트 80 허용
New-NetFirewallRule -DisplayName "HTTP Port 80" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# 포트 8080 허용
New-NetFirewallRule -DisplayName "HTTP Port 8080" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

---

### Linux 서버 배포 (권장)

#### 1. 시스템 요구사항

```bash
# Python 3.8 이상
python3 --version

# Node.js 18 이상
node --version

# Nginx
nginx -v

# Bash (대부분 기본 설치됨)
bash --version
```

#### 2. 필수 패키지 설치

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx bash

# CentOS/RHEL
sudo yum install -y python3 python3-pip nodejs npm nginx bash
# 또는
sudo dnf install -y python3 python3-pip nodejs npm nginx bash
```

#### 3. Node.js 버전 업그레이드 (필요한 경우)

```bash
# Node.js 18+ 설치 (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 확인
node --version
npm --version
```

#### 4. 프로젝트 파일 전송

**방법 1: Git 사용 (권장)**

```bash
# 서버에서
cd /var/www
sudo git clone [리포지토리 URL] contest-guide
cd contest-guide/ton

# 업데이트 시
cd /var/www/contest-guide
sudo git pull origin main
```

**방법 2: SCP 사용**

```bash
# 로컬 컴퓨터에서
scp -r ton/ user@서버IP:/var/www/contest-guide/
```

#### 5. 백엔드 설정

```bash
cd /var/www/contest-guide/ton/backend

# 가상환경 생성
python3 -m venv venv

# 가상환경 활성화
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 서비스 파일 생성
sudo nano /etc/systemd/system/contest-guide-api.service
```

서비스 파일 내용:
```ini
[Unit]
Description=Contest Guide API
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/contest-guide/ton/backend
Environment="PATH=/var/www/contest-guide/ton/backend/venv/bin"
ExecStart=/var/www/contest-guide/ton/backend/venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000

[Install]
WantedBy=multi-user.target
```

```bash
# 서비스 활성화 및 시작
sudo systemctl daemon-reload
sudo systemctl enable contest-guide-api
sudo systemctl start contest-guide-api
sudo systemctl status contest-guide-api
```

#### 6. 프론트엔드 빌드

```bash
cd /var/www/contest-guide/ton/frontend

# 의존성 설치
npm install

# 빌드
npm run build

# 권한 설정
sudo chown -R www-data:www-data /var/www/contest-guide
```

#### 7. Nginx 설정

```bash
# 설정 파일 생성
sudo nano /etc/nginx/sites-available/contest-guide
```

설정 파일 내용:
```nginx
server {
    listen 80;
    server_name _;  # 모든 호스트 허용 (IP 또는 도메인)

    # 프론트엔드 정적 파일
    root /var/www/contest-guide/ton/frontend/dist;
    index index.html;

    # 프론트엔드 라우팅 (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 백엔드 API 프록시
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/contest-guide /etc/nginx/sites-enabled/

# 기본 사이트 비활성화 (중요!)
sudo rm -f /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

#### 8. 방화벽 설정

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

#### 9. HTTPS 설정 (선택사항)

```bash
# Certbot 설치
sudo apt install -y certbot python3-certbot-nginx
# 또는
sudo yum install -y certbot python3-certbot-nginx

# 인증서 발급 (DNS 설정 완료 후)
sudo certbot --nginx -d contest-guide.ac.kr

# 자동 갱신 설정
sudo certbot renew --dry-run
```

---

## 문제 해결 가이드

### 🔴 주요 접속 문제 해결

#### 문제 1: localhost:5173에서만 접속되고 localhost만 치면 안 되는 문제

**원인:**
- 로컬 개발 환경에서는 Vite가 기본적으로 포트 5173에서만 실행됩니다
- `localhost`만 입력하면 포트가 없어서 접속할 수 없습니다

**해결 방법:**

**로컬 개발 환경 (개발 중):**
- 정상 동작입니다. `http://localhost:5173`으로 접속하세요
- 또는 `vite.config.js`에서 포트를 80으로 변경할 수 있지만, 관리자 권한이 필요합니다

**서버 배포 환경 (프로덕션):**
- 서버에서는 Nginx를 통해 포트 80에서 서비스해야 합니다
- 아래 "IP 주소로 접속이 안 되는 문제" 섹션을 참고하세요

#### 문제 2: IP 주소(202.31.147.98)로 접속이 안 되는 문제

**단계별 확인 및 해결:**

**1단계: 서버에서 포트 리스닝 확인**
```bash
# 포트 80이 0.0.0.0에서 리스닝하는지 확인
sudo ss -tlnp | grep :80

# 결과 예시 (정상):
# LISTEN 0 511 0.0.0.0:80 0.0.0.0:* users:(("nginx",pid=1234,fd=6))

# 문제가 있는 경우:
# LISTEN 0 511 127.0.0.1:80 0.0.0.0:*  ← 이렇게 나오면 문제!
```

**2단계: Nginx 설정 확인**
```bash
# Nginx 설정 파일 확인
sudo cat /etc/nginx/sites-available/contest-guide | grep -E "listen|server_name"

# 정상 설정:
# listen 80;
# server_name _;

# 문제가 있는 경우:
# listen 127.0.0.1:80;  ← 이렇게 되어 있으면 수정 필요
# server_name localhost;  ← 이렇게 되어 있으면 수정 필요
```

**3단계: Nginx 설정 수정 (필요한 경우)**
```bash
# 설정 파일 수정
sudo nano /etc/nginx/sites-available/contest-guide
```

다음과 같이 수정:
```nginx
server {
    listen 80;  # IP 없이 포트만 (모든 인터페이스에서 리스닝)
    server_name _;  # 모든 호스트 허용
    
    # ... 나머지 설정 ...
}
```

또는 자동으로 수정:
```bash
# listen 설정 수정
sudo sed -i 's/listen 127.0.0.1:80;/listen 80;/' /etc/nginx/sites-available/contest-guide
sudo sed -i 's/listen 127.0.0.1:8080;/listen 8080;/' /etc/nginx/sites-available/contest-guide

# server_name 설정 수정
sudo sed -i 's/server_name localhost;/server_name _;/' /etc/nginx/sites-available/contest-guide
sudo sed -i 's/server_name 127.0.0.1;/server_name _;/' /etc/nginx/sites-available/contest-guide

# 기본 사이트 비활성화 (중요!)
sudo rm -f /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

**4단계: 방화벽 확인**
```bash
# UFW 상태 확인
sudo ufw status

# 포트 80 허용 확인
sudo ufw status | grep 80

# 포트 80이 허용되지 않은 경우
sudo ufw allow 80/tcp
sudo ufw reload

# 또는 firewalld 사용 시
sudo firewall-cmd --list-ports
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload
```

**5단계: 서버에서 직접 테스트**
```bash
# 서버에서 자신의 IP로 접속 테스트
curl -I http://202.31.147.98

# 또는
curl -I http://localhost

# 정상 응답 예시:
# HTTP/1.1 200 OK
# Server: nginx/1.18.0
# ...
```

**6단계: 네트워크 레벨 확인**
```bash
# 서버의 네트워크 인터페이스 확인
ip addr show

# 공인 IP 확인
curl ifconfig.me

# 포트가 외부에서 열려있는지 확인 (온라인 도구 사용)
# https://www.yougetsignal.com/tools/open-ports/
# 또는
# https://canyouseeme.org/
```

**여전히 안 되면:**
- 학교 네트워크 관리자에게 포트 80 개방 요청
- 또는 포트 8080 사용 (아래 참고)

#### 문제 3: 도메인 주소로 접속이 안 되는 문제

**원인:**
- DNS A 레코드가 설정되지 않았거나
- DNS 전파가 완료되지 않았거나
- 도메인과 IP 주소가 매핑되지 않음

**해결 방법:**

**1단계: DNS 레코드 확인**
```bash
# 서버에서 DNS 확인
dig contest-guide.ac.kr
# 또는
nslookup contest-guide.ac.kr

# 정상 응답 예시:
# contest-guide.ac.kr. 300 IN A 202.31.147.98

# 문제가 있는 경우:
# NXDOMAIN  ← DNS 레코드가 없음
```

**2단계: DNS A 레코드 설정**

학교 도메인 관리자 페이지에 접속하여 다음을 설정:

**설정 내용:**
- **호스트/서브도메인**: `contest-guide`
- **타입**: `A`
- **값/IP 주소**: `202.31.147.98`
- **TTL**: `300` (또는 기본값)

**설정 예시:**
```
호스트: contest-guide
타입: A
값: 202.31.147.98
TTL: 300
```

**3단계: DNS 전파 확인**
```bash
# DNS 전파 확인 (몇 분에서 몇 시간 소요될 수 있음)
dig contest-guide.ac.kr
nslookup contest-guide.ac.kr

# 온라인 도구로도 확인 가능:
# https://dnschecker.org/
# https://www.whatsmydns.net/
```

**4단계: Nginx 설정에 도메인 추가 (선택사항)**
```bash
# Nginx 설정 파일 수정
sudo nano /etc/nginx/sites-available/contest-guide
```

다음과 같이 수정:
```nginx
server {
    listen 80;
    server_name _ contest-guide.ac.kr;  # IP와 도메인 모두 허용
    
    # ... 나머지 설정 ...
}
```

또는 도메인 전용 서버 블록 추가:
```nginx
# IP 주소로 접속
server {
    listen 80;
    server_name _;
    # ... 설정 ...
}

# 도메인으로 접속
server {
    listen 80;
    server_name contest-guide.ac.kr;
    # ... 동일한 설정 ...
}
```

**5단계: Nginx 재시작**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

**6단계: 접속 테스트**
```bash
# 서버에서 테스트
curl -I http://contest-guide.ac.kr

# 브라우저에서 테스트
# http://contest-guide.ac.kr
```

**DNS 설정이 완료되지 않은 경우:**
- 학교 IT 관리자에게 DNS A 레코드 설정 요청
- 설정 완료까지 시간이 걸릴 수 있음 (보통 몇 분~몇 시간)

### 정상 작동 시 표시되는 화면

**접속 방법:**
- `http://localhost:5173` → 로컬 개발 환경 (Vite 개발 서버)
- `http://localhost` → 서버에서 Nginx를 통해 접속 (서버 배포 후)
- `http://202.31.147.98` → 서버 IP로 접속 (서버 배포 후)
- `http://contest-guide.ac.kr` → 도메인으로 접속 (DNS 설정 완료 후)

**정상 작동 시 표시되는 화면:**
1. 상단 헤더: "KSNU AIX-Boost" 로고, 네비게이션 메뉴, 프로필 버튼
2. 메인 콘텐츠: 마감 임박 공모전, 오늘의 포커스, 다음 행동, 공모전 카드들

### 프론트엔드 빌드 문제

#### `dist` 폴더가 생성되지 않음

```bash
# 권한 문제 해결
sudo chown -R $USER:$USER /var/www/contest-guide
cd /var/www/contest-guide/ton/frontend
npm run build

# 또는 npx 사용
npx vite build
```

#### `Permission denied` 오류

**일반적인 권한 문제:**
```bash
# 실행 권한 부여
chmod +x node_modules/.bin/*
npm run build
```

#### `EACCES: permission denied, open 'vite.config.js.timestamp-*.mjs'` 오류

**증상:**
```
failed to load config from /var/www/contest-guide/ton/frontend/vite.config.js
error during build:
Error: EACCES: permission denied, open '/var/www/contest-guide/ton/frontend/vite.config.js.timestamp-*.mjs'
```

**원인:**
- Vite가 빌드 시 임시 파일을 생성하려고 하는데 권한이 없음
- frontend 디렉토리나 vite.config.js 파일의 소유권 문제

**해결 방법:**

**방법 1: frontend 디렉토리 전체 소유권 변경 (권장)**
```bash
cd /var/www/contest-guide/ton/frontend

# 현재 사용자로 소유권 변경
sudo chown -R $USER:$USER .

# 또는 특정 사용자로 변경 (예: www-data)
# sudo chown -R www-data:www-data .

# 권한 부여
chmod -R 755 .

# 빌드 실행
npm run build
```

**방법 2: vite.config.js 및 임시 파일 권한 부여**
```bash
cd /var/www/contest-guide/ton/frontend

# vite.config.js 권한 확인 및 수정
sudo chown $USER:$USER vite.config.js
chmod 644 vite.config.js

# 임시 파일이 있다면 삭제
rm -f vite.config.js.timestamp-*.mjs

# node_modules 권한도 확인
sudo chown -R $USER:$USER node_modules

# 빌드 실행
npm run build
```

**방법 3: npm 캐시 권한 수정**
```bash
cd /var/www/contest-guide/ton/frontend

# npm 캐시 디렉토리 권한 확인
npm config get cache

# npm 캐시 권한 수정
sudo chown -R $USER:$USER $(npm config get cache)

# 또는 npm 캐시 정리
npm cache clean --force

# 빌드 실행
npm run build
```

**방법 4: 프로젝트 전체 디렉토리 권한 수정**
```bash
# 프로젝트 루트에서
cd /var/www/contest-guide

# 전체 프로젝트 소유권 변경
sudo chown -R $USER:$USER .

# 또는 www-data 사용자인 경우
# sudo chown -R www-data:www-data .

# frontend로 이동하여 빌드
cd ton/frontend
npm run build
```

**방법 5: 빌드 디렉토리 권한 사전 설정**
```bash
cd /var/www/contest-guide/ton/frontend

# dist 디렉토리 생성 및 권한 부여
mkdir -p dist
sudo chown -R $USER:$USER dist
chmod -R 755 dist

# 빌드 실행
npm run build
```

**서버 환경에서 www-data 사용자로 빌드하는 경우:**
```bash
cd /var/www/contest-guide/ton/frontend

# www-data 사용자로 소유권 변경
sudo chown -R www-data:www-data .

# www-data 사용자로 빌드 실행
sudo -u www-data npm run build

# 또는
sudo su -s /bin/bash www-data -c "cd /var/www/contest-guide/ton/frontend && npm run build"
```

### 프론트엔드 서버 실행 오류

#### 오류 1: "EADDRINUSE: address already in use" (포트가 이미 사용 중)

**증상:**
```
Error: listen EADDRINUSE: address already in use :::5173
```

**해결 방법:**

**방법 1: 사용 중인 프로세스 종료**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID [프로세스ID] /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
# 또는
sudo kill -9 $(sudo lsof -t -i:5173)
```

**방법 2: 다른 포트 사용**
```bash
# vite.config.js 수정 또는 환경 변수 사용
npm run dev -- --port 5174
```

**방법 3: Vite가 자동으로 다른 포트 사용**
- Vite는 포트 5173이 사용 중이면 자동으로 5174, 5175 등을 시도합니다
- 터미널 메시지에서 실제 사용 중인 포트를 확인하세요

#### 오류 2: "Permission denied" (권한 문제)

**증상:**
```
Error: EACCES: permission denied
# 또는
sh: 1: vite: Permission denied
```

**해결 방법:**

**Linux/Mac (가장 흔한 경우):**

**방법 1: vite 실행 파일에 권한 부여 (즉시 해결)**
```bash
cd frontend

# node_modules/.bin의 모든 실행 파일에 권한 부여
chmod +x node_modules/.bin/*

# 또는 vite만 권한 부여
chmod +x node_modules/.bin/vite

# 서버 실행
npm run dev
```

**"Operation not permitted" 오류가 발생하는 경우:**

**해결 방법 1: sudo 사용 (권한이 필요한 경우)**
```bash
cd frontend

# sudo로 권한 부여
sudo chmod +x node_modules/.bin/*

# 소유권도 현재 사용자로 변경
sudo chown -R $USER:$USER node_modules

# 서버 실행
npm run dev
```

**해결 방법 2: node_modules 전체 재설치 (가장 확실한 방법)**

**권한 문제가 없는 경우:**
```bash
cd frontend

# 기존 node_modules 완전 삭제
rm -rf node_modules package-lock.json

# npm 캐시 정리
npm cache clean --force

# 재설치 (올바른 권한으로 자동 설치됨)
npm install

# 서버 실행
npm run dev
```

**권한 문제가 있는 경우 (rm -rf가 안 될 때):**
```bash
cd frontend

# 방법 2-1: sudo로 삭제
sudo rm -rf node_modules package-lock.json

# npm 캐시 정리
npm cache clean --force

# 재설치 (현재 사용자 권한으로)
npm install

# 서버 실행
npm run dev
```

**또는 방법 2-2: 소유권 변경 후 삭제**
```bash
cd frontend

# 먼저 소유권을 현재 사용자로 변경
sudo chown -R $USER:$USER node_modules package-lock.json

# 그 다음 삭제 (sudo 없이 가능)
rm -rf node_modules package-lock.json

# npm 캐시 정리
npm cache clean --force

# 재설치
npm install

# 서버 실행
npm run dev
```

**또는 방법 2-3: npm으로 직접 재설치 (삭제 없이)**
```bash
cd frontend

# npm install --force로 강제 재설치
npm install --force

# 또는
npm ci --force

# 서버 실행
npm run dev
```

**해결 방법 3: 파일 시스템 확인 (읽기 전용 마운트 확인)**
```bash
# 현재 디렉토리가 읽기 전용인지 확인
mount | grep $(pwd)

# 읽기 전용이면 쓰기 가능하도록 재마운트 (주의: 루트 권한 필요)
# sudo mount -o remount,rw /path/to/directory
```

**방법 2: node_modules 전체 권한 수정**
```bash
cd frontend

# 소유권 및 권한 수정
sudo chown -R $USER:$USER node_modules
chmod -R 755 node_modules

# 특히 .bin 디렉토리
chmod -R +x node_modules/.bin

# 서버 실행
npm run dev
```

**방법 3: npm 재설치 (권한 문제가 지속되는 경우)**
```bash
cd frontend

# 기존 파일 삭제
rm -rf node_modules package-lock.json

# npm 캐시 정리
npm cache clean --force

# 재설치 (권한 문제 없이)
npm install

# 서버 실행
npm run dev
```

**방법 4: npx를 사용하여 우회 (임시 해결)**
```bash
cd frontend

# npx를 사용하면 권한 문제를 우회할 수 있음
npx vite

# 또는
npx vite --port 5173
```

**Windows:**
```bash
# 관리자 권한으로 터미널 실행
# 또는 node_modules 권한 확인
cd frontend
npm install --force
npm run dev
```

**서버 환경 (Linux)에서 발생하는 경우:**
```bash
cd /var/www/contest-guide/ton/frontend

# www-data 사용자 권한으로 실행하거나
sudo chown -R www-data:www-data node_modules
sudo chmod -R +x node_modules/.bin

# 또는 현재 사용자로 권한 수정
sudo chown -R $USER:$USER node_modules
chmod -R +x node_modules/.bin
```

#### 오류 3: "Cannot find module" 또는 "Module not found"

**증상:**
```
Error: Cannot find module 'xxx'
```

**해결 방법:**
```bash
cd frontend

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# 또는
npm ci
```

#### 오류 4: "Access is denied" (Windows)

**증상:**
```
Error: Access is denied
```

**해결 방법:**

**방법 1: 관리자 권한으로 실행**
- PowerShell 또는 CMD를 관리자 권한으로 실행
- 프로젝트 디렉토리로 이동 후 `npm run dev` 실행

**방법 2: 방화벽 확인**
```bash
# Windows 방화벽에서 Node.js 허용 확인
# 제어판 > 시스템 및 보안 > Windows Defender 방화벽 > 고급 설정
```

**방법 3: 바이러스 백신 소프트웨어 확인**
- 바이러스 백신이 node_modules를 차단하는 경우 예외 추가

#### 오류 5: "Port 5173 is already in use" (Vite)

**증상:**
```
Port 5173 is in use, trying another one...
```

**해결 방법:**

**방법 1: 다른 포트 명시적으로 지정**
```bash
# vite.config.js 수정
export default defineConfig({
  server: {
    port: 3000,  // 원하는 포트로 변경
  }
})
```

**방법 2: 환경 변수 사용**
```bash
# Windows
set PORT=3000 && npm run dev

# Linux/Mac
PORT=3000 npm run dev
```

#### 오류 6: 네트워크 접근 거부 (방화벽)

**증상:**
- 서버는 실행되지만 다른 컴퓨터에서 접속 불가

**해결 방법:**

**방법 1: Vite 설정에서 호스트 허용**
```javascript
// vite.config.js
export default defineConfig({
  server: {
    host: '0.0.0.0',  // 모든 네트워크 인터페이스에서 접속 허용
    port: 5173,
  }
})
```

**방법 2: 방화벽 포트 허용 (Windows)**
```bash
# PowerShell (관리자 권한)
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

**방법 3: 방화벽 포트 허용 (Linux)**
```bash
sudo ufw allow 5173/tcp
sudo ufw reload
```

#### 종합 해결 방법

**모든 오류를 한 번에 해결:**
```bash
cd frontend

# 1. 기존 프로세스 종료 (포트 5173 사용 중인 경우)
# Windows
netstat -ano | findstr :5173
# Linux/Mac
lsof -ti:5173 | xargs kill -9

# 2. node_modules 및 캐시 정리
rm -rf node_modules package-lock.json
npm cache clean --force

# 3. 재설치
npm install

# 4. 권한 확인 (Linux/Mac)
sudo chown -R $USER:$USER node_modules

# 5. 서버 실행
npm run dev
```

**Windows에서 관리자 권한이 필요한 경우:**
1. PowerShell 또는 CMD를 우클릭
2. "관리자 권한으로 실행" 선택
3. 프로젝트 디렉토리로 이동 후 `npm run dev` 실행

### 포트 접속 문제

#### localhost는 되는데 IP로는 안 되는 경우

**확인 사항:**
```bash
# 1. 포트 리스닝 상태 확인
sudo ss -tlnp | grep :80
# 결과가 0.0.0.0:80이어야 함 (127.0.0.1:80이면 안 됨)

# 2. Nginx listen 설정 확인
sudo grep "listen" /etc/nginx/sites-available/contest-guide
# listen 80; 이어야 함 (listen 127.0.0.1:80; 이면 안 됨)

# 3. 방화벽 상태 확인
sudo ufw status | grep 80

# 4. 기본 사이트 비활성화 확인
ls -la /etc/nginx/sites-enabled/
# default 파일이 없어야 함
```

**해결 방법:**
```bash
# Nginx 설정 수정
sudo sed -i 's/listen 127.0.0.1:80;/listen 80;/' /etc/nginx/sites-available/contest-guide
sudo sed -i 's/server_name localhost;/server_name _;/' /etc/nginx/sites-available/contest-guide

# 기본 사이트 비활성화
sudo rm -f /etc/nginx/sites-enabled/default

# Nginx 재시작
sudo nginx -t && sudo systemctl restart nginx
```

#### 포트 80이 차단된 경우 (포트 8080 사용)

```bash
# Nginx 설정 수정
sudo sed -i 's/listen 80;/listen 8080;/' /etc/nginx/sites-available/contest-guide

# 방화벽에서 포트 8080 허용
sudo ufw allow 8080/tcp
sudo ufw reload

# Nginx 재시작
sudo nginx -t && sudo systemctl restart nginx

# 확인
sudo ss -tlnp | grep :8080
```

접속 주소: `http://[서버IP]:8080`

### DNS 문제

#### Certbot 인증 실패 (NXDOMAIN)

**증상:**
```
DNS problem: NXDOMAIN looking up A for contest-guide.ac.kr
```

**해결:**
1. 학교 도메인 관리자 페이지에 접속
2. DNS A 레코드 추가:
   - 호스트: `contest-guide`
   - 타입: `A`
   - 값: `202.31.147.98` (서버 IP)
3. DNS 전파 확인:
   ```bash
   dig contest-guide.ac.kr
   # 또는
   nslookup contest-guide.ac.kr
   ```

### 방화벽 문제

#### `ufw: command not found`

**Ubuntu/Debian:**
```bash
sudo apt install -y ufw
```

**CentOS/RHEL (firewalld 사용):**
```bash
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload
```

### Certbot 문제

#### `certbot: command not found`

```bash
# Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y epel-release
sudo yum install -y certbot python3-certbot-nginx
```

### CORS 설정

백엔드 `main.py`에서 CORS 설정:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://202.31.147.98",
        "http://contest-guide.ac.kr",
        "https://contest-guide.ac.kr"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Git 사용 가이드

### Git Push 문제 해결

#### "push declined due to repository rule violations"

**원인:**
- `.env` 파일 등 민감한 정보 포함
- 큰 파일 (100MB 이상) 포함
- 브랜치 보호 규칙

**해결:**
1. `.gitignore` 확인:
   ```
   venv/
   node_modules/
   __pycache__/
   .env
   *.pyc
   dist/
   ```

2. 이미 커밋된 파일 제거:
   ```bash
   git rm -r --cached backend/venv frontend/node_modules backend/__pycache__
   git rm --cached backend/.env
   git commit -m "Remove sensitive files and large folders"
   git push
   ```

3. Pull Request 사용:
   ```bash
   git checkout -b update/cleanup
   git push origin update/cleanup
   # GitHub에서 Pull Request 생성
   ```

### 로컬에서 수정사항 커밋 및 푸시

로컬 컴퓨터에서 파일을 수정한 후 리포지토리에 반영하는 방법입니다.

#### 1. 변경사항 확인

```bash
# 프로젝트 디렉토리로 이동
cd C:\Users\user\Desktop\ton1\ton

# 변경된 파일 확인
git status

# 변경 내용 확인
git diff
```

#### 2. 변경사항 스테이징 (커밋 준비)

```bash
# 특정 파일만 추가
git add 파일명

# 모든 변경사항 추가
git add .

# 특정 디렉토리만 추가
git add frontend/
git add backend/
```

#### 3. 커밋 (변경사항 저장)

```bash
# 의미 있는 커밋 메시지와 함께 커밋
git commit -m "커밋 메시지"

# 예시:
git commit -m "프론트엔드 UI 개선"
git commit -m "백엔드 API 엔드포인트 추가"
git commit -m "버그 수정: 로그인 오류 해결"
```

**좋은 커밋 메시지 작성 팁:**
- 무엇을 변경했는지 명확하게 작성
- 왜 변경했는지 간단히 설명 (필요한 경우)
- 예: "프론트엔드: 대시보드 레이아웃 개선", "백엔드: CORS 설정 추가"

#### 4. 원격 리포지토리에 푸시

```bash
# main 브랜치에 푸시
git push origin main

# 또는 현재 브랜치에 푸시
git push
```

#### 5. 전체 워크플로우 예시

```bash
# 1. 프로젝트 디렉토리로 이동
cd C:\Users\user\Desktop\ton1\ton

# 2. 변경사항 확인
git status

# 3. 변경사항 추가
git add .

# 4. 커밋
git commit -m "프론트엔드 컴포넌트 수정"

# 5. 푸시
git push origin main
```

#### 주의사항

1. **`.gitignore` 확인**: 민감한 정보나 큰 파일이 커밋되지 않도록 확인
   - `.env` 파일
   - `venv/`, `node_modules/` 폴더
   - `__pycache__/` 폴더

2. **커밋 전 테스트**: 커밋하기 전에 로컬에서 테스트하여 오류가 없는지 확인

3. **작은 단위로 커밋**: 관련된 변경사항끼리 묶어서 커밋하는 것이 좋습니다

4. **푸시 전 확인**: `git status`로 커밋할 파일이 올바른지 확인

### Git을 사용한 배포 업데이트

**서버에서:**
```bash
cd /var/www/contest-guide
sudo git pull origin main

# 프론트엔드 재빌드
cd ton/frontend
npm install
npm run build

# 백엔드 재시작
sudo systemctl restart contest-guide-api
sudo systemctl restart nginx
```

#### git pull 덮어쓰기 오류 해결

**증상:**
```
error: Your local changes to the following files would be overwritten by merge:
  ...
Please commit your changes or stash them before you merge.
```

**해결 방법 1: 로컬 변경사항 버리기 (권장 - 서버에서는 보통 원격 변경사항을 따름)**

```bash
cd /var/www/contest-guide

# 현재 상태 확인
sudo git status

# 로컬 변경사항 모두 버리기 (주의: 로컬 수정사항이 모두 사라집니다)
sudo git reset --hard HEAD

# 원격 변경사항 가져오기
sudo git pull origin main

# 프론트엔드 재빌드
cd ton/frontend
npm install
npm run build

# 백엔드 재시작
sudo systemctl restart contest-guide-api
sudo systemctl restart nginx
```

**해결 방법 2: 로컬 변경사항 임시 저장 후 적용**

```bash
cd /var/www/contest-guide

# 로컬 변경사항 임시 저장
sudo git stash

# 원격 변경사항 가져오기
sudo git pull origin main

# 저장했던 변경사항 다시 적용 (필요한 경우)
sudo git stash pop

# 프론트엔드 재빌드
cd ton/frontend
npm install
npm run build

# 백엔드 재시작
sudo systemctl restart contest-guide-api
sudo systemctl restart nginx
```

**해결 방법 3: 특정 파일만 원격 버전으로 되돌리기**

```bash
cd /var/www/contest-guide

# 특정 파일만 원격 버전으로 되돌리기
sudo git checkout origin/main -- 파일경로

# 예시:
sudo git checkout origin/main -- ton/frontend/package.json

# 그 후 pull
sudo git pull origin main
```

**해결 방법 4: 강제로 원격 버전으로 덮어쓰기**

```bash
cd /var/www/contest-guide

# 원격 저장소 정보 가져오기
sudo git fetch origin

# 로컬 브랜치를 원격 브랜치로 강제로 리셋 (주의: 모든 로컬 변경사항 삭제)
sudo git reset --hard origin/main

# 프론트엔드 재빌드
cd ton/frontend
npm install
npm run build

# 백엔드 재시작
sudo systemctl restart contest-guide-api
sudo systemctl restart nginx
```

**주의사항:**
- 서버에서는 일반적으로 **방법 1 또는 방법 4**를 사용하는 것이 안전합니다
- 서버의 로컬 변경사항은 보통 빌드 산출물이나 설정 파일이므로 원격 버전을 따르는 것이 좋습니다
- 중요한 로컬 변경사항이 있다면 먼저 백업하세요

---

## 서버 설정 제거

### 완전 제거 방법

```bash
# 1. 백엔드 서비스 중지 및 제거
sudo systemctl stop contest-guide-api
sudo systemctl disable contest-guide-api
sudo rm /etc/systemd/system/contest-guide-api.service
sudo systemctl daemon-reload

# 2. Nginx 설정 제거
sudo rm /etc/nginx/sites-available/contest-guide
sudo rm /etc/nginx/sites-enabled/contest-guide
sudo nginx -t
sudo systemctl restart nginx

# 3. 프로젝트 파일 삭제
sudo rm -rf /var/www/contest-guide

# 4. 방화벽 규칙 제거 (선택사항)
sudo ufw delete allow 80/tcp
sudo ufw delete allow 443/tcp
sudo ufw reload
```

---

## 추가 리소스

- **빠른 실행 가이드**: `QUICK_START.md` 참고
- **API 문서**: http://localhost:8000/docs (로컬 개발 시)
- **프로젝트 README**: `README.md` 참고

---

## 문의 및 지원

문제가 지속되면 다음을 확인하세요:
1. 서버 로그: `sudo journalctl -u contest-guide-api -f`
2. Nginx 로그: `sudo tail -f /var/log/nginx/error.log`
3. 네트워크 관리자에게 포트 개방 요청
