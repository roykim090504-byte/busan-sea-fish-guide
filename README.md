# 오늘의 부산 앞바다

부산 9개 해역의 해양 환경을 한눈에 확인하고, 규칙 기반으로 12개 어종의 환경 적합도를 계산하는 반응형 Next.js 프로토타입입니다.

> 어종별 점수는 실제 포획 확률이나 어획량 예측이 아닙니다. 수온, 계절, 풍속, 파고, 조류를 이용해 계산한 참고용 환경 적합도입니다.

## 주요 기능

- 부산 9개 해역 선택 및 해양 환경 요약
- 수온, 풍향·풍속, 파고, 조류, 날씨, 관측 시각 표시
- 조업 환경 5단계 참고 판단
- 강풍, 높은 파도 등 해상 위급 상황 점검
- 추천 어종과 전체 12개 어종 순위
- 어종별 점수, 신뢰도, 판단 이유와 누락 데이터 안내
- 수온·풍속·파고·조류의 2시간 단위 참고 추세 차트
- Leaflet·OpenStreetMap 기반 부산 앞바다 지도
- 간편 보기와 상세 보기 전환
- 모바일, 태블릿, 데스크톱 반응형 화면

## 기술 구성

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Leaflet / OpenStreetMap
- Recharts
- Lucide React
- Vitest

프로젝트는 표준 Next.js 빌드를 사용하므로 GitHub 저장소를 Vercel에 직접 연결할 수 있습니다.

## 로컬 실행

Node.js 22 이상을 권장합니다.

```bash
pnpm install
pnpm dev
```

`npm`을 사용하는 경우에도 실행할 수 있습니다.

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 환경변수

프로젝트 루트의 `.env.example`을 복사하여 `.env.local`을 만듭니다.

```env
KHOA_API_KEY=국립해양조사원_API_키
KMA_API_KEY=기상청_API_키
```

두 변수는 서버에서만 사용되므로 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다. `.env.local`은 Git에 포함되지 않습니다. 키가 없거나 외부 API 호출에 실패하면 앱 내부의 예시 데이터로 자동 전환됩니다.

## 검사 명령

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

GitHub의 `main` 브랜치 또는 Pull Request에 변경 사항을 올리면 `.github/workflows/ci.yml`이 위 검사를 자동으로 실행합니다.

## GitHub에 올리기

GitHub에서 비어 있는 저장소를 만든 뒤 다음 명령을 실행합니다.

```bash
git remote add origin https://github.com/사용자명/저장소명.git
git branch -M main
git push -u origin main
```

이미 `origin`이 등록되어 있다면 새로 추가하지 말고 다음 명령으로 주소를 확인합니다.

```bash
git remote -v
```

실제 API 키가 들어 있는 `.env.local`은 절대 커밋하지 마세요.

## Vercel 배포

1. [Vercel 새 프로젝트](https://vercel.com/new)를 엽니다.
2. GitHub 계정을 연결하고 이 저장소를 선택합니다.
3. Framework Preset이 `Next.js`인지 확인합니다.
4. Root Directory는 프로젝트 루트인 `./`로 둡니다.
5. Build Command와 Output Directory는 기본 자동 설정을 사용합니다.
6. Project Settings → Environment Variables에 `KHOA_API_KEY`, `KMA_API_KEY`를 등록합니다.
7. Deploy를 누릅니다.

배포 후 다음 경로를 확인합니다.

- `/` — 대시보드
- `/map` — 지도
- `/area/gijang` — 해역 상세
- `/api/marine` — 해양 데이터 응답

이후 `main` 브랜치에 푸시하면 운영 사이트가 자동으로 다시 배포되고, Pull Request에는 미리보기 주소가 생성됩니다.

GitHub Pages는 정적 파일 전용이므로 `/api/marine` Route Handler와 서버 전용 API 키가 필요한 현재 구성에는 적합하지 않습니다.

## 예시 데이터 수정

- 해양 관측 예시: `src/data/marine-observations.ts`
- 부산 해역과 좌표: `src/data/sea-areas.ts`
- 관측소 연결 정보: `src/data/observation-stations.ts`
- 어종별 선호 환경: `src/data/fish-conditions.ts`

예시 관측값을 수정하면 화면과 예측 결과가 자동으로 다시 계산됩니다.

### 부산 해역 추가

1. `src/data/sea-areas.ts`에 고유한 `id`, 해역명, 위도, 경도를 추가합니다.
2. `src/data/marine-observations.ts`에 같은 `areaId`의 예시 관측값을 추가합니다.
3. 필요하면 `src/data/observation-stations.ts`의 관측소 연결 정보를 보완합니다.

### 새로운 어종 추가

`src/data/fish-conditions.ts`에 고유한 어종 ID와 선호 수온, 풍속, 파고, 조류, 출현 월 조건을 추가합니다. 추가된 어종은 전체 순위 계산에 자동으로 포함됩니다.

모든 선호 환경 수치는 프로토타입 계산을 위한 참고값이며 실제 어획 기준이 아닙니다.

## 환경 적합도 계산

기본 가중치는 다음과 같습니다.

- 수온 50%
- 계절 20%
- 풍속 10%
- 파고 10%
- 조류 10%

누락된 항목은 0점으로 처리하지 않고 계산에서 제외하며, 남은 가중치를 다시 정규화합니다. 최종 점수는 항상 0~100 범위로 제한됩니다.

- 80~100점: 매우 높음
- 60~79점: 높음
- 40~59점: 보통
- 20~39점: 낮음
- 0~19점: 매우 낮음

## 현재 방식의 한계

- 규칙 기반 적합도이며 머신러닝 어획 예측이 아닙니다.
- 관측소와 해역 중심점 사이의 실제 국지 차이를 완전히 반영하지 못합니다.
- 먹이, 염분, 용존산소, 수심, 어군 이동, 조업 장비와 방식이 점수에 포함되지 않습니다.
- 2시간 단위 추세는 프로토타입용 참고 데이터이며 완전한 과거 관측 시계열이 아닙니다.
- 해상 위급 상황 영역은 현재 관측값이 기준에 가까운지 확인하는 참고 기능이며 공식 특보 발효 여부를 직접 보장하지 않습니다.

## 향후 발전 방향

실제 장기 관측 데이터와 위치·시각·어종별 어획 기록이 확보되면 다음과 같이 발전시킬 수 있습니다.

- 해역별 장기 시계열 저장과 결측값 품질 관리
- 조석, 염분, 용존산소, 수심, 위성 수온 등 변수 추가
- 실제 어획 기록을 이용한 검증·백테스트
- 해역과 계절별 보정 모델
- 통계 모델과 머신러닝 모델 비교
- 예측 구간, 불확실성, 데이터 품질 지표 제공
- 공식 기상특보·항행 통제 정보와의 별도 연동
