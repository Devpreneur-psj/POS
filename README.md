## 소확행 POS & Store Simulation

React + FastAPI 기반으로 구축한 칵테일 바 `소확행 (So-Whak-Haeng)` 전용 POS 및 매장 시뮬레이션 시스템입니다. 관리자와 직원, 손님 흐름을 모두 아우르는 주문 · 결제 · 재고 · 통계 · 직원 관리 기능을 제공하며, 실서비스 배포(Frontend: Vercel/Cloudflare, Backend: Render/PythonAnywhere)를 목표로 설계되었습니다.

---

## 기술 스택
- Frontend: React 18, TypeScript, TailwindCSS, Recharts, Vite
- Backend: FastAPI, SQLAlchemy, SQLite
- Runtime: Node.js 18+, Python 3.11+
- 통신: REST API (Axios)
- 데이터: `data/init.json`, `data/sales.db`

---

## 폴더 구조
```
.
├── backend
│   ├── main.py                # FastAPI 진입점 및 API 엔드포인트
│   ├── database.py            # SQLite 연결 및 세션 관리
│   ├── models.py              # Pydantic 스키마 정의
│   ├── tables.py              # SQLAlchemy ORM 모델
│   ├── init_data.py           # 초기 데이터 로더
│   ├── inventory_manager.py   # 재고 차감 및 경고 로직
│   ├── employee_manager.py    # 근무·급여 관리 로직
│   ├── sales_manager.py       # 매출/통계 집계 로직
│   ├── receipt_generator.py   # 영수증 생성기
│   └── requirements.txt
├── data
│   └── init.json              # 메뉴·재고·테이블·직원 초기 설정
└── frontend
    ├── public
    │   └── index.html
    ├── src
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── index.css
    │   ├── types.ts
    │   ├── lib/api.ts
    │   ├── hooks/usePolling.ts
    │   ├── components
    │   │   ├── CashPaymentModal.tsx
    │   │   ├── EmployeePanel.tsx
    │   │   ├── MenuList.tsx
    │   │   ├── OrderTable.tsx
    │   │   └── ReceiptModal.tsx
    │   └── pages
    │       ├── AdminDashboard.tsx
    │       ├── POSPage.tsx
    │       └── Statistics.tsx
    ├── package.json
    ├── tsconfig.json
    ├── postcss.config.cjs
    ├── styles/tailwind.config.js
    └── .eslintrc.cjs
```

---

## 로컬 개발 환경 설정

### 1) 백엔드
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

- 서버 기동 후 `http://127.0.0.1:8000/docs`에서 Swagger UI 사용 가능
- 최초 실행 시 `data/init.json` 기반으로 메뉴·재고·테이블·직원 정보 자동 로드 및 `/data/sales.db` 생성

### 2) 프론트엔드
```bash
cd frontend
npm install
npm run dev
```

- 개발 서버: `http://127.0.0.1:5173`
- Vite 프록시 설정으로 `/api` 요청은 자동으로 FastAPI (`http://127.0.0.1:8000`)로 전달됩니다.

---

## 주요 기능
- **POS 주문 관리**: 테이블별 주문 생성/수정, 메뉴 수량 조절 및 합계 자동 계산
- **결제 처리**: 카드/현금 결제, 현금 결제 시 거스름돈 자동 계산 및 영수증 출력
- **재고 관리**: 주문 시 원재료 차감, 임계값 이하시 경고 발송, 관리자 직접 재고 조정
- **직원 관리**: 근무 시작/종료 기록, 시급 기반 급여 집계
- **통계 대시보드**: 일/주/월/연 매출 추이, 메뉴별 매출 비중, 손님 만족도, 급여 현황

---

## 대표 API 엔드포인트
| Method | Endpoint                | Description                 |
|--------|-------------------------|-----------------------------|
| GET    | `/menu`                 | 전체 메뉴 조회              |
| POST   | `/order`                | 주문 생성                   |
| PUT    | `/order/{order_id}`     | 주문 업데이트               |
| DELETE | `/order/{order_id}`     | 주문 삭제                   |
| GET    | `/order/{order_id}/receipt` | 영수증 조회            |
| GET    | `/inventory`            | 재고 현황 조회              |
| PUT    | `/inventory/update`     | 재고/임계값 수정            |
| GET    | `/inventory/alerts`     | 재고 경고 조회              |
| POST   | `/employee/start`       | 근무 시작 기록              |
| POST   | `/employee/end`         | 근무 종료 기록              |
| GET    | `/employee/payroll`     | 누적 급여 현황              |
| GET    | `/sales/summary`        | 매출/통계 대시보드 데이터   |

---

## 배포 가이드
- **Frontend**: `npm run build` 후 생성되는 `dist/`를 Vercel 또는 Cloudflare Pages에 업로드
- **Backend**: `uvicorn main:app --host 0.0.0.0 --port 8000` 명령을 Render/PythonAnywhere 등에서 서비스화
- 환경 변수 `VITE_API_BASE_URL`을 사용하면 프론트엔드에서 배포된 백엔드 API 엔드포인트를 지정할 수 있습니다.

---

## 테스트 & 검증
- 프론트엔드: `npm run dev`로 실시간 UI 확인, `npm run build`로 번들 검증
- 백엔드: Swagger UI에서 API 호출 테스트, SQLite 데이터 상태 확인
- 핵심 시나리오: 주문 → 결제(현금/카드) → 영수증 확인, 재고 임계값 경고, 직원 근무 기록 및 급여 집계, 통계 대시보드 그래프 확인

---

## 확장 로드맵
1. 손님 만족도 기반 추천 메뉴 분석
2. 매출 예측 모델 (scikit-learn / MLX)
3. 지점 추가 시 다점포 관리 기능
4. WebSocket 기반 실시간 주문 알림

---

궁금한 점이나 추가 기능이 필요하면 언제든 말씀 주세요. 🚀

# POS
