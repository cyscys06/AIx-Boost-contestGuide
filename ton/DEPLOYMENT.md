# 서버 배포 가이드

학교 서버 PC에서 이 웹 애플리케이션을 배포하는 방법입니다.

## 📦 배포 전 준비사항

서버에 배포하기 전에 다음을 확인하세요:

1. **프로젝트 파일 준비**: 로컬 컴퓨터에 완성된 프로젝트가 있어야 합니다
2. **서버 접근 권한**: 서버에 SSH 접근 권한이 있어야 합니다
3. **네트워크 연결**: 서버와 네트워크로 연결되어 있어야 합니다

## 📋 필수 요구사항

### 운영체제 선택

**권장: Linux (Ubuntu 20.04 LTS 이상 또는 CentOS 7 이상)**
- 안정성과 성능이 우수
- 무료 오픈소스
- 대부분의 학교 서버 환경에 적합

**대안: Windows Server 2019/2022**
- Windows 환경에 익숙한 경우
- IIS를 사용한 배포 가능

---

## 🐧 Linux 서버 배포 (권장)

### 1. 시스템 요구사항

```bash
# Python 3.8 이상
python3 --version

# Node.js 18 이상
node --version

# Nginx (웹 서버)
nginx -v

# Bash (대부분의 Linux에는 기본 설치되어 있음)
bash --version
```

**참고**: 대부분의 Linux 배포판(Ubuntu, Debian, CentOS, RHEL 등)은 기본적으로 bash가 설치되어 있습니다. 만약 bash가 없다면 아래 명령어로 설치하세요.

### 2. Bash 설치 (필요한 경우)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y bash

# CentOS/RHEL
sudo yum install -y bash
# 또는
sudo dnf install -y bash

# 설치 확인
bash --version
```

### 3. 필수 패키지 설치

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx

# CentOS/RHEL
sudo yum install -y python3 python3-pip nodejs npm nginx
# 또는
sudo dnf install -y python3 python3-pip nodejs npm nginx
```

**참고**: 
- `bash`는 위 패키지 설치 시 자동으로 포함됩니다 (이미 설치되어 있지 않다면)

#### Node.js 버전 확인 및 업그레이드 (필요한 경우)

기본 패키지 매니저로 설치한 Node.js 버전을 확인하세요:

```bash
node --version
```

**Node.js 18 이상이 설치되어 있다면**: 추가 작업 불필요 ✅

**Node.js 18 미만이거나 설치되지 않았다면**: 아래 명령어로 최신 버전을 설치하세요:

**⚠️ 주의**: 아래 명령어는 외부 스크립트를 다운로드하여 실행합니다. NodeSource는 공식 Node.js 배포 파트너이므로 안전하지만, 신뢰할 수 있는 서버에서만 실행하세요.

```bash
# Node.js 18+ 설치 (Ubuntu/Debian)
# 첫 번째 명령어: NodeSource 저장소 추가 (스크립트 실행)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 두 번째 명령어: Node.js 설치
sudo apt install -y nodejs

# Node.js 20+ (최신 버전)을 원한다면:
# curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
# sudo apt install -y nodejs
```

```bash
# Node.js 18+ 설치 (CentOS/RHEL)
# 첫 번째 명령어: NodeSource 저장소 추가
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# 두 번째 명령어: Node.js 설치
sudo yum install -y nodejs
# 또는 (CentOS 8+)
sudo dnf install -y nodejs
```

**설치 후 확인:**
```bash
# 버전 확인 (v18.x.x 이상이어야 함)
node --version
npm --version

# 예상 출력:
# v18.20.0 (또는 그 이상)
# 10.x.x (npm 버전)
```

### 4. 프로젝트 배포

서버에 프로젝트 파일을 전송하는 방법은 여러 가지가 있습니다:

#### 방법 1: Git을 사용한 배포 (권장)

**📋 사전 준비 (로컬 컴퓨터에서):**

1. **GitHub에 코드 업로드** (아직 없다면):
   ```bash
   # 로컬 컴퓨터에서 실행
   cd C:\Users\user\Desktop\ton1
   
   # Git 저장소 초기화 (아직 안 했다면)
   git init
   git add .
   git commit -m "Initial commit"
   
   # GitHub에서 새 리포지토리 생성 후:
   # GitHub 웹사이트에서 "New repository" 클릭
   # 리포지토리 이름 입력 (예: contest-guide)
   # 생성 후 나오는 URL 사용
   
   # 원격 저장소 추가 및 푸시
   git remote add origin https://github.com/username/contest-guide.git
   git branch -M main
   git push -u origin main
   ```

2. **리포지토리 URL 확인**:
   - GitHub 리포지토리 페이지에서 "Code" 버튼 클릭
   - HTTPS URL 복사 (예: `https://github.com/username/contest-guide.git`)
   - 또는 SSH URL (예: `git@github.com:username/contest-guide.git`)

**🚀 서버에서 배포 (서버 PC에서 실행):**

```bash
# 프로젝트 디렉토리 생성
sudo mkdir -p /var/www/contest-guide
sudo chown $USER:$USER /var/www/contest-guide

# Git 저장소에서 클론
cd /var/www/contest-guide
git clone <your-repo-url> .

# 예시 (HTTPS 사용):
# git clone https://github.com/username/contest-guide.git .

# 예시 (SSH 사용 - SSH 키 설정 필요):
# git clone git@github.com:username/contest-guide.git .
```

**💡 참고**:
- **HTTPS**: 간단하지만 매번 사용자명/비밀번호 입력 필요 (또는 Personal Access Token)
- **SSH**: 한 번 설정하면 자동 인증 (권장)
  - SSH 키 설정 방법: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

**📝 Git 사용 시 업데이트 방법:**

Git은 **자동으로 갱신되지 않습니다**. 코드를 수정한 후 서버에 반영하려면:

1. **로컬 컴퓨터에서**: 코드 수정 후 Git에 푸시
   ```bash
   git add .
   git commit -m "업데이트 내용"
   git push
   ```

2. **서버 PC에서**: 변경사항을 가져오기
   ```bash
   cd /var/www/contest-guide
   git pull
   
   # 백엔드 의존성 업데이트 (필요한 경우)
   cd ton/backend
   source venv/bin/activate
   pip install -r requirements.txt
   sudo systemctl restart contest-guide-api
   
   # 프론트엔드 재빌드 (필요한 경우)
   cd ../frontend
   npm install
   npm run build
   sudo systemctl reload nginx
   ```

**자동 갱신을 원한다면**: GitHub Actions, GitLab CI/CD 등의 CI/CD 파이프라인을 설정할 수 있습니다 (고급).

#### 방법 2: SCP를 사용한 파일 전송

**⚠️ 중요**: 아래 명령어는 **로컬 컴퓨터(코드를 작성한 PC)에서 실행**합니다.

**먼저 서버에서 디렉토리 생성:**
```bash
# 서버 PC에서 실행
sudo mkdir -p /var/www/contest-guide
sudo chown $USER:$USER /var/www/contest-guide
```

**로컬 컴퓨터(Windows)에서 실행:**
```powershell
# PowerShell에서 OpenSSH 사용 (Windows 10+)
# 서버 IP와 사용자명을 실제 값으로 변경하세요
scp -r C:\Users\user\Desktop\ton1\ton\ user@server-ip:/var/www/contest-guide/

# 예시:
# scp -r C:\Users\user\Desktop\ton1\ton\ admin@192.168.1.100:/var/www/contest-guide/
```

**로컬 컴퓨터(Linux/Mac)에서 실행:**
```bash
# 프로젝트 폴더 전체를 서버로 전송
scp -r ~/Desktop/ton1/ton/ user@server-ip:/var/www/contest-guide/

# 예시:
# scp -r ~/Desktop/ton1/ton/ admin@192.168.1.100:/var/www/contest-guide/
```

**대안: WinSCP, FileZilla 같은 GUI 도구 사용**
- WinSCP (Windows): https://winscp.net/
- FileZilla (Windows/Mac/Linux): https://filezilla-project.org/

#### 방법 3: 압축 파일로 전송

**로컬 컴퓨터에서 실행:**
```powershell
# Windows PowerShell
Compress-Archive -Path C:\Users\user\Desktop\ton1\ton\ -DestinationPath ton.zip
scp ton.zip user@server-ip:/tmp/
```

**서버 PC에서 실행:**
```bash
# 디렉토리 생성
sudo mkdir -p /var/www/contest-guide
sudo chown $USER:$USER /var/www/contest-guide

# 압축 해제
cd /var/www/contest-guide
unzip /tmp/ton.zip
# 또는 tar.gz인 경우
# tar -xzf /tmp/ton.tar.gz

# 임시 파일 삭제
rm /tmp/ton.zip
```

#### 방법 4: USB 또는 네트워크 공유 폴더 사용

서버가 같은 네트워크에 있다면:
```bash
# 네트워크 공유 폴더 마운트
sudo mount -t cifs //local-pc-ip/shared-folder /mnt/shared -o username=user,password=pass

# 파일 복사
cp -r /mnt/shared/ton /var/www/contest-guide/
```

**프로젝트 구조 확인:**
```bash
cd /var/www/contest-guide
ls -la
# 다음 구조가 보여야 합니다:
# ton/
# ├── backend/
# ├── frontend/
# └── README.md
```

### 5. 백엔드 설정

```bash
cd /var/www/contest-guide/ton/backend

# 가상환경 생성 및 활성화
python3 -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# Gunicorn 설치 (프로덕션용 WSGI 서버)
pip install gunicorn

# 환경 변수 파일 생성
nano .env
```

**.env 파일 내용:**
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
OPENAI_VISION_MODEL=gpt-4o
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7
API_TIMEOUT=60
```

### 6. 백엔드 systemd 서비스 생성

```bash
sudo nano /etc/systemd/system/contest-guide-api.service
```

**서비스 파일 내용:**
```ini
[Unit]
Description=Contest Guide API (FastAPI)
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/contest-guide/ton/backend
Environment="PATH=/var/www/contest-guide/ton/backend/venv/bin"
ExecStart=/var/www/contest-guide/ton/backend/venv/bin/gunicorn \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    main:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**서비스 시작:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable contest-guide-api
sudo systemctl start contest-guide-api
sudo systemctl status contest-guide-api
```

### 7. 프론트엔드 빌드

```bash
cd /var/www/contest-guide/ton/frontend

# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# 빌드 결과 확인 (dist 폴더 생성됨)
ls -la dist
```

### 8. Nginx 설정

```bash
sudo nano /etc/nginx/sites-available/contest-guide
```

**Nginx 설정 파일 내용:**
```nginx
server {
    listen 80;
    server_name your-server-ip-or-domain.com;  # 서버 IP 또는 도메인으로 변경

    # 프론트엔드 정적 파일 서빙
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
        
        # 파일 업로드 크기 제한
        client_max_body_size 20M;
        
        # 타임아웃 설정 (AI 분석 시간 고려)
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**사이트 활성화:**
```bash
sudo ln -s /etc/nginx/sites-available/contest-guide /etc/nginx/sites-enabled/
sudo nginx -t  # 설정 테스트
sudo systemctl restart nginx
```

### 9. 방화벽 설정

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  # HTTPS 사용 시
sudo ufw enable

# firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 10. 백엔드 CORS 설정 업데이트

서버 도메인을 CORS에 추가해야 합니다:

```bash
cd /var/www/contest-guide/ton/backend
nano config.py
```

**config.py 수정:**
```python
# CORS Settings
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://your-server-ip-or-domain.com",  # 추가
    "https://your-server-ip-or-domain.com",  # HTTPS 사용 시
]
```

변경 후 서비스 재시작:
```bash
sudo systemctl restart contest-guide-api
```

---

## 🪟 Windows Server 배포

### 1. 필수 소프트웨어 설치

- **Python 3.8 이상**: https://www.python.org/downloads/
- **Node.js 18 이상**: https://nodejs.org/
- **Nginx for Windows**: http://nginx.org/en/download.html
  - 또는 **IIS** 사용 가능

### 2. 프로젝트 배포

```powershell
# 프로젝트 디렉토리 생성
mkdir C:\www\contest-guide
cd C:\www\contest-guide

# 프로젝트 파일 복사
```

### 3. 백엔드 설정

```powershell
cd C:\www\contest-guide\ton\backend

# 가상환경 생성
python -m venv venv
.\venv\Scripts\activate

# 의존성 설치
python -m pip install -r requirements.txt
python -m pip install gunicorn

# .env 파일 생성
notepad .env
```

**.env 파일 내용 (Linux와 동일):**
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
OPENAI_VISION_MODEL=gpt-4o
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7
API_TIMEOUT=60
```

### 4. 백엔드 서비스 실행 (NSSM 사용)

**NSSM (Non-Sucking Service Manager) 설치:**
- https://nssm.cc/download 에서 다운로드
- 압축 해제 후 `nssm.exe`를 PATH에 추가

**서비스 등록:**
```powershell
# 관리자 권한 PowerShell에서 실행
nssm install ContestGuideAPI "C:\www\contest-guide\ton\backend\venv\Scripts\python.exe" "-m gunicorn --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000 --timeout 120 main:app"
nssm set ContestGuideAPI AppDirectory "C:\www\contest-guide\ton\backend"
nssm set ContestGuideAPI DisplayName "Contest Guide API"
nssm start ContestGuideAPI
```

### 5. 프론트엔드 빌드

```powershell
cd C:\www\contest-guide\ton\frontend
npm install
npm run build
```

### 6. Nginx 설정 (Windows)

**nginx.conf 수정:**
```nginx
http {
    # ... 기존 설정...

    server {
        listen 80;
        server_name your-server-ip-or-domain.com;

        root C:/www/contest-guide/ton/frontend/dist;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

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
            
            client_max_body_size 20M;
            proxy_read_timeout 120s;
            proxy_connect_timeout 120s;
        }

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

**Nginx 서비스 시작:**
```powershell
# Nginx 설치 디렉토리에서
.\nginx.exe
```

---

## 🔒 보안 설정

### 1. HTTPS 설정 (Let's Encrypt - Linux)

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com

# 자동 갱신 설정
sudo certbot renew --dry-run
```

### 2. 방화벽 규칙

- **필수 포트만 개방**: 80 (HTTP), 443 (HTTPS)
- **백엔드 포트(8000)는 외부에 노출하지 않음** (Nginx를 통해서만 접근)

### 3. 파일 권한 설정 (Linux)

```bash
# 백엔드 디렉토리
sudo chown -R www-data:www-data /var/www/contest-guide/ton/backend
sudo chmod -R 755 /var/www/contest-guide/ton/backend

# 프론트엔드 디렉토리
sudo chown -R www-data:www-data /var/www/contest-guide/ton/frontend
sudo chmod -R 755 /var/www/contest-guide/ton/frontend
```

---

## 🔍 모니터링 및 로그

### 백엔드 로그 확인 (Linux)

```bash
# 서비스 로그
sudo journalctl -u contest-guide-api -f

# 또는
sudo tail -f /var/log/contest-guide-api.log
```

### Nginx 로그 확인

```bash
# 액세스 로그
sudo tail -f /var/log/nginx/access.log

# 에러 로그
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 업데이트 방법

코드를 수정한 후 서버에 반영하는 방법입니다.

### Git을 사용한 경우

```bash
# 서버 PC에서 실행
cd /var/www/contest-guide

# 최신 코드 가져오기
git pull

# 백엔드 업데이트
cd ton/backend
source venv/bin/activate
pip install -r requirements.txt  # 새로운 패키지가 추가된 경우
sudo systemctl restart contest-guide-api

# 프론트엔드 업데이트
cd ../frontend
npm install  # 새로운 패키지가 추가된 경우
npm run build
sudo systemctl reload nginx
```

### SCP/압축 파일을 사용한 경우

로컬에서 수정한 파일을 다시 서버로 전송한 후:

```bash
# 서버 PC에서 실행

# 백엔드 업데이트
cd /var/www/contest-guide/ton/backend
source venv/bin/activate
pip install -r requirements.txt  # 새로운 패키지가 추가된 경우
sudo systemctl restart contest-guide-api

# 프론트엔드 업데이트
cd ../frontend
npm install  # 새로운 패키지가 추가된 경우
npm run build
sudo systemctl reload nginx
```

**⚠️ 참고**: 
- Git은 **자동으로 갱신되지 않습니다**. `git pull`을 수동으로 실행해야 합니다.
- 자동 배포를 원한다면 CI/CD 파이프라인(GitHub Actions 등)을 설정해야 합니다.

---

## 🐛 문제 해결

### 백엔드가 시작되지 않을 때

```bash
# 서비스 상태 확인
sudo systemctl status contest-guide-api

# 로그 확인
sudo journalctl -u contest-guide-api -n 50

# 수동 실행 테스트
cd /var/www/contest-guide/ton/backend
source venv/bin/activate
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### Nginx 502 Bad Gateway

- 백엔드 서비스가 실행 중인지 확인
- 포트 8000이 열려있는지 확인: `netstat -tlnp | grep 8000`
- Nginx 에러 로그 확인

### CORS 오류

- `config.py`의 `CORS_ORIGINS`에 서버 도메인 추가 확인
- 백엔드 서비스 재시작

---

## 📝 체크리스트

배포 전 확인사항:

- [ ] Python 3.8+ 설치됨
- [ ] Node.js 18+ 설치됨
- [ ] Nginx/Apache 설치 및 설정 완료
- [ ] 백엔드 가상환경 생성 및 의존성 설치
- [ ] `.env` 파일 생성 및 API 키 설정
- [ ] 백엔드 서비스 등록 및 시작
- [ ] 프론트엔드 빌드 완료
- [ ] Nginx 설정 및 프록시 구성
- [ ] 방화벽 포트 개방 (80, 443)
- [ ] CORS 설정 업데이트
- [ ] HTTPS 설정 (선택사항)
- [ ] 로그 모니터링 설정

---

## 📞 추가 도움말

- **FastAPI 문서**: https://fastapi.tiangolo.com/deployment/
- **Nginx 문서**: https://nginx.org/en/docs/
- **Gunicorn 문서**: https://docs.gunicorn.org/
