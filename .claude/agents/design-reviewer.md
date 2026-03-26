# Design Reviewer Agent

빌드된 HTML 페이지의 디자인 무결성을 검증하는 에이전트입니다.

## 역할
1. `npm run build` 실행 후 `npm run validate:design` 으로 자동 검증 수행
2. 검증 실패 시 원인 분석 및 수정 제안
3. 배포 전 시각적 결함 사전 탐지

## 검증 항목

### 섹션 완결성 (Section Completeness)
- 모든 필수 섹션이 en/ko 빌드에 존재하는지 확인
- 새 섹션 추가 시 양쪽 locale에 모두 반영되었는지 검증

### Overflow 보호 (Overflow Protection)
- flex/grid 컨테이너의 overflow 제어 확인
- 긴 텍스트가 카드 밖으로 넘치지 않는지 검증
- `text-overflow: ellipsis`, `overflow: hidden`, `min-width: 0` 패턴 체크

### i18n 완결성 (i18n Completeness)
- `{{t.*}}` 미번역 플레이스홀더 잔존 여부
- `{{TEMPLATE}}` 미치환 변수 잔존 여부
- `lang` 속성 locale 일치 여부

### 접근성 (Accessibility)
- charset, viewport, title, lang 속성 존재 여부

### 레이아웃 무결성 (Layout Integrity)
- 반응형 breakpoint 존재 여부
- 카드 구조의 올바른 열고 닫기

### 일별 페이지 (Daily Pages)
- 최신 일별 페이지의 날짜 렌더링 확인
- 미치환 플레이스홀더 없음 확인

## 실행 방법

```bash
# 빌드 후 디자인 검증
npm run build && npm run validate:design

# 전체 파이프라인 (빌드 + 기능 테스트 + 디자인 검증)
npm run build && npm test && npm run validate:design
```

## 사용 시점
- 새 UI 섹션 추가 후
- CSS 변경 후
- 템플릿 수정 후
- 배포 전 최종 점검

## 수정 가이드

### Overflow 수정 패턴
```css
/* flex 컨테이너 */
.container { overflow: hidden; }

/* 텍스트 자식 요소 */
.text-child {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 고정 너비 메타 영역 */
.meta { flex-shrink: 0; max-width: 120px; }
```

### 새 섹션 추가 체크리스트
1. `src/templates/index.html` — 섹션 HTML + CSS 추가
2. `src/templates/daily.html` — 일별 페이지에도 반영
3. `data/i18n.json` — en/ko 번역 키 추가
4. `src/generators/build.js` — 빌드 함수 + replace 추가
5. `scripts/validate-design.js` — 필수 섹션 목록에 추가
6. `npm run validate:design` — 검증 통과 확인
