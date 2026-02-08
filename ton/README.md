# Contest Guide - 공모전 전략 분석 플랫폼

AI 기반 공모전 추천 및 전략 분석 웹 애플리케이션

## 주요 기능

- **공모전 분석**: 포스터 이미지 또는 텍스트로 공모전 분석
- **개인화 추천**: 사용자 프로필 기반 맞춤 추천
- **준비도 평가**: 기술, 시간, 진행 상황 기반 점수
- **AI 어시스턴트**: 실시간 조언 및 일정 관리
- **타임라인**: 액션 중심 일정 관리

## 프로젝트 구조

```
ton/
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/         # UI 컴포넌트
│   │   │   ├── Assistant/      # AI 어시스턴트 패널
│   │   │   ├── Contest/        # 공모전 관련 컴포넌트
│   │   │   └── Layout/         # 레이아웃 컴포넌트
│   │   ├── contexts/           # React Context (상태 관리)
│   │   ├── pages/              # 페이지 컴포넌트
│   │   ├── styles/             # CSS 스타일
│   │   └── utils/              # 유틸리티 함수
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # FastAPI 백엔드
│   ├── services/
│   │   └── gpt_service.py      # GPT 서비스 (mock 포함)
│   ├── main.py                 # API 엔드포인트
│   ├── schemas.py              # Pydantic 모델
│   ├── config.py               # 설정
│   └── requirements.txt
│
└── README.md
```

## 실행 방법

### 1. 백엔드 실행

```powershell
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
uvicorn main:app --reload --port 8000
```

백엔드: http://localhost:8000
API 문서: http://localhost:8000/docs

### 2. 프론트엔드 실행

```powershell
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드: http://localhost:5173

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/health` | 서버 상태 확인 |
| POST | `/analyze` | 공모전 분석 |
| POST | `/extract` | 이미지에서 정보 추출 |
| POST | `/assistant/suggest` | AI 어시스턴트 제안 |
| POST | `/readiness` | 준비도 점수 계산 |

## 기술 스택

- **Frontend**: React 18, Vite, React Router
- **Backend**: FastAPI, Pydantic
- **AI**: OpenAI GPT-5.2 (예정)
- **Storage**: Browser LocalStorage

## 페이지 구성

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 대시보드 | `/` | 현황 요약, 마감 임박, 다음 행동 |
| 분석하기 | `/analyze` | 공모전 입력 및 AI 분석 |
| 내 공모전 | `/contests` | 관심 공모전 관리 |
| 타임라인 | `/timeline` | 액션 기반 일정 |
| 프로필 | `/profile` | 사용자 정보 설정 |

## 현재 상태

- [x] 프론트엔드 UI 구현
- [x] 백엔드 API 구조
- [x] Mock 데이터 생성
- [x] LocalStorage 연동
- [ ] GPT-5.2 실제 연동
- [ ] 이미지 분석 (Vision)

## GPT 연동 위치

`backend/services/gpt_service.py` 파일의 TODO 주석 참고:

```python
async def analyze_contest(...):
    # TODO: Replace with actual GPT API call
    # client = OpenAI(api_key=OPENAI_API_KEY)
    # response = client.chat.completions.create(...)
```

## 라이선스

Academic / Contest Project
