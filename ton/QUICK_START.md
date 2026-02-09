# 빠른 시작 가이드

컴퓨터를 껐다 켤 때마다 참고하는 서버 실행 방법입니다.

---

## 🚀 서버 실행 방법

### 백엔드 서버 실행 (터미널 1)

```bash
# 1. 프로젝트 디렉토리로 이동
cd C:\Users\user\Desktop\ton1\ton\backend

# 2. 가상환경 활성화
.\venv\Scripts\activate

# 3. 서버 실행
python -m uvicorn main:app --reload --port 8000
```

**확인:**
- 백엔드: http://localhost:8000
- API 문서: http://localhost:8000/docs

---

### 프론트엔드 서버 실행 (터미널 2 - 별도 터미널)

```bash
# 1. 프로젝트 디렉토리로 이동
cd C:\Users\user\Desktop\ton1\ton\frontend

# 2. 서버 실행
npm run dev
```

**확인:**
- 프론트엔드: http://localhost:5173

---

## ⚠️ 주의사항

1. **두 개의 터미널 필요**: 백엔드와 프론트엔드를 각각 별도 터미널에서 실행해야 합니다.

2. **가상환경 활성화**: 백엔드 실행 전에 반드시 가상환경을 활성화하세요.
   - PowerShell/CMD: `.\venv\Scripts\activate`
   - Git Bash: `source venv/Scripts/activate`

3. **포트 충돌**: 
   - 백엔드: 포트 8000 사용 중이면 다른 포트 사용 불가
   - 프론트엔드: 포트 5173 사용 중이면 자동으로 다른 포트 사용

4. **의존성 설치**: 최초 1회 또는 `requirements.txt`나 `package.json`이 변경된 경우:
   ```bash
   # 백엔드
   cd backend
   .\venv\Scripts\activate
   python -m pip install -r requirements.txt
   
   # 프론트엔드
   cd frontend
   npm install
   ```

---

## 🔧 문제 해결

### 백엔드가 실행되지 않는 경우

```bash
# 가상환경이 없으면 생성
cd backend
python -m venv venv
.\venv\Scripts\activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 프론트엔드가 실행되지 않는 경우

```bash
# 의존성 재설치
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### 포트가 이미 사용 중인 경우

**백엔드:**
```bash
# 다른 포트 사용
python -m uvicorn main:app --reload --port 8001
```

**프론트엔드:**
- Vite가 자동으로 다른 포트를 사용합니다 (예: 5174, 5175 등)

---

## 📝 체크리스트

서버 실행 전 확인:
- [ ] 백엔드 가상환경 활성화됨
- [ ] 백엔드 의존성 설치됨 (`requirements.txt`)
- [ ] 프론트엔드 의존성 설치됨 (`npm install`)
- [ ] 포트 8000, 5173 사용 가능

서버 실행 후 확인:
- [ ] 백엔드: http://localhost:8000 접속 가능
- [ ] 프론트엔드: http://localhost:5173 접속 가능
- [ ] 브라우저에서 홈페이지 정상 표시

---

## 💡 팁

- **터미널 분할**: VS Code나 다른 에디터에서 터미널을 분할하여 두 서버를 동시에 볼 수 있습니다.
- **자동 재시작**: `--reload` 옵션으로 코드 변경 시 자동으로 서버가 재시작됩니다.
- **로그 확인**: 터미널에서 에러 메시지를 확인하여 문제를 빠르게 파악할 수 있습니다.

---

더 자세한 내용은 `COMPLETE_GUIDE.md`를 참고하세요.
