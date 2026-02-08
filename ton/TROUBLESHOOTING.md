# 문제 해결 가이드

## 화면에 아무것도 안 뜨는 경우

### 1. 브라우저 URL 확인
- **올바른 URL**: `http://localhost:5173`
- Vite는 기본적으로 포트 5173을 사용합니다

### 2. 서버 실행 상태 확인

#### 백엔드 서버 확인
```bash
# 백엔드 터미널에서 확인
# 다음 메시지가 보여야 합니다:
# INFO:     Uvicorn running on http://127.0.0.1:8000
```

#### 프론트엔드 서버 확인
```bash
# 프론트엔드 터미널에서 확인
# 다음 메시지가 보여야 합니다:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

### 3. 브라우저 콘솔 확인
1. 브라우저에서 `F12` 또는 `Ctrl+Shift+I`로 개발자 도구 열기
2. **Console** 탭 확인
3. 빨간색 에러 메시지가 있는지 확인

### 4. 네트워크 탭 확인
1. 개발자 도구의 **Network** 탭 열기
2. 페이지 새로고침 (`F5`)
3. 실패한 요청(빨간색)이 있는지 확인

### 5. 일반적인 문제와 해결 방법

#### 문제: "Cannot GET /" 또는 404 에러
**해결**: 
- 프론트엔드 서버가 실행 중인지 확인
- `http://localhost:5173`으로 접속 (포트 번호 확인)

#### 문제: "Failed to fetch" 또는 CORS 에러
**해결**:
- 백엔드 서버가 실행 중인지 확인
- 백엔드가 `http://localhost:8000`에서 실행 중인지 확인

#### 문제: "Module not found" 또는 import 에러
**해결**:
```bash
cd frontend
npm install
npm run dev
```

#### 문제: 빈 화면 (흰색 화면)
**해결**:
1. 브라우저 콘솔에서 JavaScript 에러 확인
2. 개발자 도구의 Elements 탭에서 `<div id="root">`가 있는지 확인
3. React가 렌더링되었는지 확인

### 6. 서버 재시작
```bash
# 백엔드 재시작
cd backend
.\venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000

# 프론트엔드 재시작 (새 터미널)
cd frontend
npm run dev
```

### 7. 포트 충돌 확인
다른 프로그램이 포트를 사용 중일 수 있습니다:
- 포트 8000 (백엔드)
- 포트 5173 (프론트엔드)

포트를 변경하려면:
- 백엔드: `python -m uvicorn main:app --reload --port 8001`
- 프론트엔드: `vite.config.js`에서 `port: 5174`로 변경

### 8. 캐시 클리어
브라우저 캐시 문제일 수 있습니다:
- `Ctrl+Shift+R` (강력 새로고침)
- 또는 개발자 도구에서 "Disable cache" 체크
