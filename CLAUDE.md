# Prototype - Cloud-Native Daily Service

## Overview
이 프로젝트는 **로컬 환경 없이** Claude Code 클라우드만으로 개발/운영되는 서비스입니다.
매일 Claude Code 크론 잡이 실행되어 콘텐츠를 업데이트하고, 코드를 개선합니다.

## Architecture
- **Runtime**: Node.js (GitHub Codespaces / Claude Code Cloud)
- **Hosting**: GitHub Pages (static site)
- **CI/CD**: GitHub Actions (auto build & deploy)
- **Daily Jobs**: Claude Code Scheduled Triggers (cron)
- **Data**: JSON files in `data/` directory (git-tracked)

## Project Structure
```
├── CLAUDE.md              # 이 파일 - Claude Code 프로젝트 컨텍스트
├── .claude/
│   └── settings.json      # Claude Code 설정
├── src/
│   ├── generators/        # 사이트 생성 스크립트
│   │   └── build.js       # 메인 빌드 스크립트
│   └── templates/         # HTML 템플릿
│       └── index.html     # 메인 페이지 템플릿
├── scripts/
│   └── daily-update.js    # 크론 잡에서 실행하는 데일리 업데이트
├── data/
│   ├── daily-log.json     # 일별 업데이트 로그
│   └── metrics.json       # 서비스 메트릭
├── dist/                  # 빌드 결과물 (GitHub Pages)
├── .github/workflows/
│   ├── deploy.yml         # GitHub Pages 배포
│   └── daily-cron.yml     # 데일리 크론 (fallback)
└── package.json
```

## Commands
- `npm install` - 의존성 설치
- `npm run build` - 사이트 빌드 (dist/ 생성)
- `npm run daily` - 데일리 업데이트 실행
- `npm test` - 테스트 실행
- `npm run lint` - 린트 실행

## Development Rules
1. 모든 데이터는 `data/` 디렉토리에 JSON으로 저장
2. 빌드 결과물은 `dist/`에 생성 (gitignore 대상)
3. 새 기능 추가 시 반드시 테스트 포함
4. 크론 잡은 멱등성(idempotent) 보장

## Daily Cron Job Responsibilities
1. `data/daily-log.json`에 오늘 날짜 엔트리 추가
2. 서비스 메트릭 업데이트
3. 사이트 재빌드 및 배포 트리거
4. (확장) 외부 API 데이터 수집, 콘텐츠 자동 생성

## Cloud-Only Workflow
- 클론 후 `npm install && npm run build`로 즉시 실행 가능
- 환경 변수나 로컬 설정 불필요
- 모든 상태는 git-tracked JSON 파일로 관리
