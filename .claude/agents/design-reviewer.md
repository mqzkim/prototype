# Design Reviewer Agent

빌드된 HTML 페이지의 디자인 무결성을 검증하는 에이전트입니다.

## 역할
1. `npm run build` 실행 시 자동으로 디자인 검증 수행 (빌드에 체이닝됨)
2. 검증 실패 시 원인 분석 → CSS 수정 → 재검증까지 자동 수행
3. 배포 전 시각적 결함 사전 탐지

## 핵심 원칙: 휴리스틱 검증

**개별 CSS 속성의 존재 여부만 체크하는 것은 무의미합니다.**
실제 overflow를 방지하려면 관련 속성들이 **완전한 패턴으로 함께** 존재해야 합니다.

### Overflow 방지의 3대 패턴

#### 1. Ellipsis Triplet (셋 다 있어야 작동)
```css
.text-field {
  white-space: nowrap;     /* ← 없으면 줄바꿈되어 ellipsis 무효 */
  overflow: hidden;        /* ← 없으면 텍스트가 넘침 */
  text-overflow: ellipsis; /* ← 없으면 잘린 부분이 안 보임 */
}
```
**하나라도 빠지면 overflow 발생.** 셋 다 있는지 검증합니다.

#### 2. Flex-child Blowout Prevention
```css
.flex-text-container {
  flex: 1;
  min-width: 0;       /* ← 없으면 flex item이 content 크기로 팽창 */
  overflow: hidden;    /* ← 없으면 자식 텍스트가 넘침 */
}
```
`min-width: 0` 없이 `flex: 1`만 쓰면 flex item이 줄어들지 않습니다.

#### 3. Fixed-element Shrink Protection
```css
.rank-badge { flex-shrink: 0; min-width: 24px; }  /* 줄어들지 않음 */
.meta-area { flex-shrink: 0; max-width: 120px; }   /* 고정 영역 */
```

### 콘텐츠 기반 위험 탐지

CSS가 완벽해도 **실제 데이터가 얼마나 긴지**에 따라 위험도가 달라집니다.
하네스는 빌드된 HTML에서 실제 텍스트 길이를 측정하고,
임계값(60ch, 80ch 등)을 초과하면 **full overflow chain이 있는지** 검증합니다.

예시:
```
✓ content-ok: .trending-name (28/60 chars)           ← 짧아서 안전
✗ content-risk: .trending-desc (237ch > 80) has full overflow chain  ← 길어서 검증
```

## 검증 카테고리

| 카테고리 | 검증 방식 |
|---------|----------|
| **섹션 완결성** | en/ko 빌드에 모든 필수 섹션 텍스트 존재 여부 |
| **Ellipsis Triplet** | nowrap + overflow:hidden + text-overflow:ellipsis 동시 존재 |
| **Flex-child 보호** | min-width:0 + overflow:hidden 동시 존재 |
| **Flex-row 제어** | 행 컨테이너에 overflow:hidden 존재 |
| **Card 클리핑** | grid 안의 카드에 overflow:hidden 존재 |
| **Shrink 방지** | 고정 요소(rank, meta)에 flex-shrink:0 존재 |
| **콘텐츠 위험** | 실제 텍스트 길이 > 임계값일 때 full chain 검증 |
| **i18n 완결성** | 미번역 플레이스홀더 잔존 여부 |
| **접근성** | charset, viewport, title, lang |
| **레이아웃** | 반응형 breakpoint, 카드 구조 |
| **일별 페이지** | daily 페이지 플레이스홀더 미잔존 |

## 실행

빌드에 체이닝되어 있으므로 별도 실행 불필요:
```bash
npm run build  # 자동으로 validate:design 실행됨
```

## 새 섹션 추가 시 체크리스트
1. `src/templates/index.html` — 섹션 HTML + CSS 추가
2. `src/templates/daily.html` — 일별 페이지에도 반영
3. `data/i18n.json` — en/ko 번역 키 추가
4. `src/generators/build.js` — 빌드 함수 + replace 추가
5. `scripts/validate-design.js` — 필수 섹션 목록에 추가
6. `npm run validate:design` — 검증 통과 확인

## 학습된 교훈

### 2026-03-26: GitHub Trending overflow 사건
- **증상**: trending 카드의 긴 description과 language 라벨이 카드 밖으로 넘침
- **원인**: `text-overflow:ellipsis`는 있었지만 `white-space:nowrap` + `overflow:hidden`이 불완전
- **교훈**: 개별 속성이 아니라 **패턴 전체**를 검증해야 함
- **반영**: validate:design을 패턴 기반 휴리스틱으로 전면 개편
