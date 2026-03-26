# Prototype - Cloud-Native Daily Service + Video LLM SaaS

## Overview
이 프로젝트는 **로컬 환경 없이** Claude Code 클라우드만으로 개발/운영되는 서비스입니다.
매일 크론 잡이 실행되어 데이터를 수집하고, git에 커밋하고, 사이트를 재배포합니다.

## Architecture
- **Runtime**: Node.js (GitHub Codespaces / Claude Code Cloud)
- **Hosting**: GitHub Pages (static site) + API proxy server
- **CI/CD**: GitHub Actions (auto build & deploy)
- **Daily Jobs**: Claude Code Scheduled Triggers + GitHub Actions cron
- **Data**: JSON files in `data/` directory (**git-tracked, 매일 누적**)

## Video LLM SaaS — API Proxy Architecture

이 프로젝트는 비디오 LLM 모델들을 통합하는 **API proxy SaaS** 플랫폼을 포함합니다.

```
Client SDK (src/client/)
    ↓ HTTP (Bearer token auth)
API Server (src/server/)
    ├── CORS → Logger → Auth → RateLimit (미들웨어 체인)
    ├── POST /v1/generate    → 비디오 생성 (스마트 라우팅)
    ├── POST /v1/analyze     → 비디오 이해/분석
    ├── GET  /v1/models      → 사용 가능 모델 목록
    ├── GET  /v1/costs       → 프로바이더별 비용 비교
    ├── GET  /v1/usage       → API 키별 사용량 통계
    └── GET  /v1/health      → 헬스체크 (인증 불필요)

VideoRouter (src/video-llm/)
    ├── Veo 3.1 (Google)     → 포토리얼리즘 최강, 4K
    ├── Kling 3.0 (Kuaishou) → 모션 품질 최강, 최저가
    ├── Seedance 2.0         → 시네마 품질
    ├── Runway Gen-4.5       → 크리에이터 친화적
    ├── Gemini 3 Pro         → 비디오 이해 SOTA
    └── GPT-4o               → 멀티모달 추론
```

### Pricing Tiers
| Tier | Price | Generations/mo | Max Resolution | Margin |
|------|-------|----------------|----------------|--------|
| Free | $0 | 5 | 720p | — |
| Starter | $19/mo | 50 | 1080p | 52-74% |
| Pro | $79/mo | 250 | 4K | 49-68% |
| Enterprise | $299/mo | 1,000 | 4K | 50-73% |

### Smart Routing Strategies
- `best-quality` → Veo + Gemini
- `best-value` → Kling + GPT-4o (기본값)
- `best-motion` → Kling + Gemini
- `cinema` → Seedance + Gemini

## Self-Evolution System

RULES.md에 정의된 **고정 평가 기준**(100점 만점, 5개 카테고리)을 기반으로
Daily Cron이 코드베이스를 자동 평가하고, 점수를 올리기 위한 개선을 수행합니다.

```
매일 09:00 UTC:
  npm run daily
    ├─ Steps 1-6: 기존 데이터 수집
    └─ Step 7: evaluate-rules.js → data/evaluation-scores.json

  Claude Code Self-Evolution:
    1. data/evaluation-scores.json 읽기
    2. 가장 낮은 점수 카테고리 식별
    3. 코드 개선 1-3개 수행
    4. 재평가로 개선 확인
    ⚠️ RULES.md는 절대 수정하지 않음 — 규칙은 고정 목표
```

## Data Accumulation Flow (핵심)
```
매일 09:00 UTC:
  npm run daily
    ├─ collect-stats.js      → data/snapshots.json (누적)
    ├─ select-quote.js       → data/daily-quote.json (매일 갱신)
    ├─ generate-til.js       → data/til.json (누적)
    ├─ fetch-trending.js     → data/trending.json (누적)
    ├─ log-improvement.js    → data/improvements.json (누적)
    ├─ fetch-apis.js         → data/api-data.json (누적)
    ├─ evaluate-rules.js     → data/evaluation-scores.json (누적)
    └─ daily-update.js       → data/daily-log.json + data/metrics.json (누적)

  npm run build              → dist/index.html (모든 data/ 반영)
  npm test                   → 검증
  git add data/ && git commit && git push
    └─ push 트리거 → deploy.yml → GitHub Pages 배포
```

**중요: `data/` 디렉토리의 JSON 파일들이 프로젝트의 상태이자 히스토리입니다.**
**매일 크론이 돌 때 반드시 `git add data/ && git commit && git push`가 실행되어야 합니다.**

## Project Structure
```
├── CLAUDE.md
├── RULES.md                     # ★ 고정 평가 기준 (100점, 5개 카테고리)
├── .claude/
│   ├── settings.json
│   ├── triggers.json
│   └── hooks/
│       └── session-start.sh
├── src/
│   ├── generators/
│   │   └── build.js              # data/ → dist/ 빌드
│   ├── templates/
│   │   ├── index.html            # 메인 대시보드
│   │   └── daily.html            # 일별 상세 페이지
│   ├── server/                   # ★ Video LLM SaaS API Server
│   │   ├── index.js              # HTTP 서버 엔트리 (createServer)
│   │   ├── router.js             # Zero-dep URL 라우터
│   │   ├── middleware/
│   │   │   ├── auth.js           # Bearer token 인증
│   │   │   ├── rate-limit.js     # 티어별 레이트 리밋
│   │   │   ├── logger.js         # 요청 로깅
│   │   │   └── cors.js           # CORS 처리
│   │   ├── routes/
│   │   │   ├── health.js         # GET /v1/health
│   │   │   ├── models.js         # GET /v1/models
│   │   │   ├── costs.js          # GET /v1/costs
│   │   │   ├── generate.js       # POST /v1/generate
│   │   │   ├── analyze.js        # POST /v1/analyze
│   │   │   └── usage.js          # GET /v1/usage
│   │   └── utils/
│   │       ├── response.js       # JSON 응답 헬퍼
│   │       ├── validation.js     # 입력 검증
│   │       ├── api-keys.js       # API 키 관리
│   │       └── usage-tracker.js  # 사용량 추적
│   ├── client/                   # ★ Client SDK
│   │   ├── index.js              # VideoLLMClient 클래스
│   │   └── types.js              # JSDoc 타입 정의
│   └── video-llm/                # ★ 비디오 LLM 통합 라우터
│       ├── index.js              # Public API
│       ├── config.js             # 프로바이더 설정 + 라우팅 룰
│       ├── router.js             # VideoRouter 클래스
│       └── adapters/
│           ├── base.js           # 어댑터 인터페이스
│           ├── veo.js            # Google Veo 3.1
│           ├── kling.js          # Kling 3.0
│           └── gemini.js         # Gemini 3 Pro
├── scripts/
│   ├── daily-update.js           # 메인 크론 (7개 모듈 호출)
│   ├── evaluate-rules.js         # ★ RULES.md 평가 엔진
│   ├── lint.js                   # ★ Zero-dep 린터
│   ├── collect-stats.js
│   ├── select-quote.js
│   ├── generate-til.js
│   ├── fetch-trending.js
│   ├── log-improvement.js
│   └── fetch-apis.js
├── data/                         # ★ git-tracked, 매일 누적
│   ├── daily-log.json
│   ├── metrics.json
│   ├── snapshots.json
│   ├── quotes.json / daily-quote.json
│   ├── til.json
│   ├── trending.json
│   ├── improvements.json
│   ├── api-data.json
│   ├── i18n.json
│   ├── video-llm-research.json   # 비디오 모델 리서치
│   ├── video-llm-cost-plan.json  # SaaS 비용 분석
│   ├── api-keys.json             # API 키 + 티어 설정
│   ├── usage-log.json            # 사용량 로그
│   └── evaluation-scores.json    # ★ 평가 점수 히스토리
├── tests/
│   ├── build.test.js             # 데이터 검증 + 빌드 테스트
│   ├── server/
│   │   └── integration.test.js   # API 서버 통합 테스트
│   ├── video-llm/
│   │   ├── router.test.js        # VideoRouter 테스트
│   │   └── adapters.test.js      # Adapter 테스트
│   └── client/
│       └── sdk.test.js           # Client SDK 테스트
├── dist/                         # 빌드 결과 (gitignore)
├── .github/workflows/
│   ├── deploy.yml
│   └── daily-cron.yml
└── package.json
```

## Commands
- `npm install` - 의존성 설치
- `npm run build` - 사이트 빌드 (dist/ 생성)
- `npm run daily` - 데일리 업데이트 실행 (7개 모듈 + 평가)
- `npm start` - API 서버 시작 (port 3000)
- `npm test` - 전체 테스트 실행 (49개 테스트)
- `npm run lint` - 린트 실행 (zero-dep)
- `npm run evaluate` - RULES.md 기준 코드베이스 평가

## Development Rules
1. 모든 데이터는 `data/` 디렉토리에 JSON으로 저장, **반드시 git-tracked**
2. 빌드 결과물은 `dist/`에 생성 (gitignore 대상)
3. 새 기능 추가 시 반드시 테스트 포함
4. 크론 잡은 멱등성(idempotent) 보장 — 같은 날 두 번 돌려도 안전
5. 외부 API 실패 시 graceful degradation — null 값 허용, 크래시 금지
6. **Zero runtime dependencies** — Node.js 내장 모듈만 사용
7. **RULES.md는 절대 수정하지 않음** — 평가 기준은 고정
8. 서버 라우트에서 **readFileSync 금지** — async I/O만 사용

## Cloud-Only Workflow
- 클론 후 `npm install && npm run build`로 즉시 실행 가능
- 환경 변수나 로컬 설정 불필요
- 모든 상태는 git-tracked JSON 파일로 관리
- SessionStart hook이 웹 세션에서 자동 bootstrap
