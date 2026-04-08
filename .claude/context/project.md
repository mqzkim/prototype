# Prototype — Project Context

> 이 파일은 on-demand 참조용입니다. CLAUDE.md에서 안내받아 여기 도달합니다.

## Overview

로컬 환경 없이 Claude Code 클라우드만으로 개발/운영되는 서비스.
매일 크론 잡이 데이터 수집 → git 커밋 → 사이트 재배포.

## Architecture

- **Runtime**: Node.js (GitHub Codespaces / Claude Code Cloud)
- **Hosting**: GitHub Pages (static) + API proxy server
- **CI/CD**: GitHub Actions (auto build & deploy)
- **Daily Jobs**: Claude Code Scheduled Triggers + GitHub Actions cron
- **Data**: JSON files in `data/` (git-tracked, 매일 누적)

## Video LLM SaaS — API Proxy

```
Client SDK (src/client/)
    ↓ HTTP (Bearer token auth)
API Server (src/server/)
    ├── POST /v1/generate    → 비디오 생성 (스마트 라우팅)
    ├── POST /v1/analyze     → 비디오 이해/분석
    ├── GET  /v1/models      → 모델 목록
    ├── GET  /v1/costs       → 비용 비교
    ├── GET  /v1/usage       → 사용량 통계
    └── GET  /v1/health      → 헬스체크

VideoRouter (src/video-llm/)
    ├── Veo 3.1      → 포토리얼리즘 최강, 4K
    ├── Kling 3.0    → 모션 품질 최강, 최저가
    ├── Seedance 2.0 → 시네마 품질
    ├── Runway Gen-4.5 → 크리에이터 친화적
    ├── Gemini 3 Pro → 비디오 이해 SOTA
    └── GPT-4o       → 멀티모달 추론
```

### Smart Routing Strategies
- `best-quality` → Veo + Gemini
- `best-value` → Kling + GPT-4o (기본값)
- `best-motion` → Kling + Gemini
- `cinema` → Seedance + Gemini

### Pricing Tiers
| Tier | Price | Generations/mo | Max Resolution |
|------|-------|----------------|----------------|
| Free | $0 | 5 | 720p |
| Starter | $19/mo | 50 | 1080p |
| Pro | $79/mo | 250 | 4K |
| Enterprise | $299/mo | 1,000 | 4K |

## Data Accumulation Flow

```
매일 09:00 UTC — npm run daily:
  collect-stats.js      → data/snapshots.json
  select-quote.js       → data/daily-quote.json
  generate-til.js       → data/til.json
  fetch-trending.js     → data/trending.json
  log-improvement.js    → data/improvements.json
  fetch-apis.js         → data/api-data.json
  fetch-saas.js         → data/saas.json
  evaluate-rules.js     → data/evaluation-scores.json
  daily-update.js       → data/daily-log.json + data/metrics.json

  npm run build → dist/index.html
  npm test → 검증
  git add data/ && git commit && git push → GitHub Pages 배포
```

**`data/` 디렉토리의 JSON 파일 = 프로젝트 상태이자 히스토리.**

## Development Rules

1. 모든 데이터는 `data/`에 JSON, 반드시 git-tracked
2. 빌드 결과물은 `dist/`에 (gitignore)
3. 새 기능 추가 시 반드시 테스트 포함
4. 크론 잡은 멱등성 보장
5. 외부 API 실패 시 graceful degradation
6. **Zero runtime dependencies** — Node.js 내장 모듈만
7. 서버 라우트에서 readFileSync 금지

## Design Validation

UI 변경 시: `npm run build && npm run validate:design`

검증 항목: 섹션 완결성, overflow 보호, i18n 완결성, 접근성, 레이아웃 무결성.
에이전트: `.claude/agents/design-reviewer.md`

## Commands

- `npm install` — 의존성 설치
- `npm run build` — 사이트 빌드
- `npm run daily` — 데일리 크론 실행
- `npm start` — API 서버 시작 (port 3000)
- `npm test` — 전체 테스트
- `npm run lint` — 린트
- `npm run evaluate` — 코드베이스 평가
- `npm run validate:design` — 디자인 검증
