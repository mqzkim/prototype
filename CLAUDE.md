# Prototype — Project Router

요청 처리:
1. 기존 스킬 중 매칭되면 즉시 실행
2. 판단이 어려우면 `.claude/context/project.md`를 읽고 결정
3. 매칭 실패 → Architect Agent 호출

## 도메인

| 도메인 | 참조 | 키워드 |
|--------|------|--------|
| Project | .claude/context/project.md | 아키텍처, 빌드, 테스트, 크론, 데이터 |

## 명령어

- `npm run build` — 사이트 빌드
- `npm test` — 테스트
- `npm run daily` — 데일리 크론 실행
