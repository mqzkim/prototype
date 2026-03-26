# Prototype - Cloud-Native Daily Service

## Overview
이 프로젝트는 **로컬 환경 없이** Claude Code 클라우드만으로 개발/운영되는 서비스입니다.
매일 크론 잡이 실행되어 데이터를 수집하고, git에 커밋하고, 사이트를 재배포합니다.

## Architecture
- **Runtime**: Node.js (GitHub Codespaces / Claude Code Cloud)
- **Hosting**: GitHub Pages (static site)
- **CI/CD**: GitHub Actions (auto build & deploy)
- **Daily Jobs**: Claude Code Scheduled Triggers + GitHub Actions cron
- **Data**: JSON files in `data/` directory (**git-tracked, 매일 누적**)

## Data Accumulation Flow (핵심)
```
매일 09:00 UTC:
  npm run daily
    ├─ collect-stats.js    → data/snapshots.json (누적)
    ├─ select-quote.js     → data/daily-quote.json (매일 갱신)
    ├─ generate-til.js     → data/til.json (누적)
    ├─ fetch-trending.js   → data/trending.json (누적)
    ├─ log-improvement.js  → data/improvements.json (누적)
    ├─ fetch-apis.js       → data/api-data.json (누적)
    └─ daily-update.js     → data/daily-log.json + data/metrics.json (누적)

  npm run build            → dist/index.html (모든 data/ 반영)
  npm test                 → 검증
  git add data/ && git commit && git push
    └─ push 트리거 → deploy.yml → GitHub Pages 배포
```

**중요: `data/` 디렉토리의 JSON 파일들이 프로젝트의 상태이자 히스토리입니다.**
**매일 크론이 돌 때 반드시 `git add data/ && git commit && git push`가 실행되어야 합니다.**

## Project Structure
```
├── CLAUDE.md
├── .claude/
│   ├── settings.json       # Claude Code 설정 + SessionStart hook
│   ├── triggers.json       # Claude Code 크론 트리거 정의
│   └── hooks/
│       └── session-start.sh # 세션 시작 시 auto bootstrap
├── src/
│   ├── generators/
│   │   └── build.js         # data/ → dist/index.html 빌드
│   └── templates/
│       └── index.html       # AI-Native UI 대시보드 템플릿
├── scripts/
│   ├── daily-update.js      # 메인 크론 엔트리포인트 (6개 모듈 호출)
│   ├── collect-stats.js     # 레포 통계 수집 (commits, LOC, files)
│   ├── select-quote.js      # 날짜 기반 개발 명언 선택
│   ├── generate-til.js      # 코드 분석 기반 TIL 자동 생성
│   ├── fetch-trending.js    # GitHub trending 스크래핑
│   ├── log-improvement.js   # git commit 분석 → 개선 로그
│   └── fetch-apis.js        # 환율 + 날씨 API 수집
├── data/                    # ★ git-tracked, 매일 누적되는 데이터
│   ├── daily-log.json       # 일별 changelog (version, changes, stats)
│   ├── metrics.json         # 현재 메트릭 (streak, totals)
│   ├── snapshots.json       # 일별 레포 스냅샷 (LOC 차트용)
│   ├── quotes.json          # 명언 컬렉션 (55개)
│   ├── daily-quote.json     # 오늘의 명언
│   ├── til.json             # TIL 아카이브
│   ├── trending.json        # GitHub trending 히스토리
│   ├── improvements.json    # 자동 개선 로그
│   └── api-data.json        # 환율/날씨 히스토리
├── dist/                    # 빌드 결과 (gitignore)
├── tests/
│   └── build.test.js        # 데이터 검증 + 빌드 테스트
├── .github/workflows/
│   ├── deploy.yml           # push → GitHub Pages 배포
│   └── daily-cron.yml       # 매일 09:00 UTC 크론 (data/ 커밋 + 푸시)
└── package.json
```

## Commands
- `npm install` - 의존성 설치
- `npm run build` - 사이트 빌드 (dist/ 생성)
- `npm run daily` - 데일리 업데이트 실행 (6개 모듈)
- `npm test` - 테스트 실행
- `npm run lint` - 린트 실행

## Development Rules
1. 모든 데이터는 `data/` 디렉토리에 JSON으로 저장, **반드시 git-tracked**
2. 빌드 결과물은 `dist/`에 생성 (gitignore 대상)
3. 새 기능 추가 시 반드시 테스트 포함
4. 크론 잡은 멱등성(idempotent) 보장 — 같은 날 두 번 돌려도 안전
5. 외부 API 실패 시 graceful degradation — null 값 허용, 크래시 금지

## Cloud-Only Workflow
- 클론 후 `npm install && npm run build`로 즉시 실행 가능
- 환경 변수나 로컬 설정 불필요
- 모든 상태는 git-tracked JSON 파일로 관리
- SessionStart hook이 웹 세션에서 자동 bootstrap
