# 15분 만에 제미나이 정복하기

강원대 AI 마스터 챌린지 학습 웹페이지. 모바일 우선, Next.js + Vercel.

**이 사이트는 Gemini API를 호출하지 않습니다.** 학생이 제미나이를 다른 창/앱으로 띄워놓고,
이 페이지는 옆에서 무엇을 어떻게 시킬지 알려주는 코치 역할만 합니다.
모든 실습은 `[프롬프트 복사] → [제미나이 열기] → [돌아와서 확인]` 3단 루프로 통일돼 있습니다.

## 실행

```bash
npm run dev
```

```bash
npm run check
```

`check`는 진도 저장(손상 데이터 복구·버전 마이그레이션)과 응모 폼 검증의 자체 점검입니다.
콘텐츠를 고친 뒤에도 한 번 돌려보세요.

## 구조

| 경로 | 내용 |
|---|---|
| `content/steps.ts` | **커리큘럼 본문.** 대부분의 콘텐츠 수정은 여기서만 하면 됩니다 |
| `content/templates.ts` | 프롬프트 빌더 프리셋, Gem 지시문 템플릿 |
| `content/quiz.ts` | 최종 퀴즈 5문항 |
| `content/tools.ts` | 기능 사전 카드 |
| `content/tasks.ts` | "지금 뭘 하려고 하세요?" 작업별 기능 추천 조합 |
| `content/guides.ts` | 도구별 심화 가이드 3종 — NotebookLM · Gems · Nano Banana. `/tools/<id>` 로 자동 생성됩니다. **2026년 9월 기준이므로 캠페인 직전 재확인** |
| `lib/progress.ts` | 진도 저장 (localStorage, 버전 관리, 손상 복구) |
| `lib/validate.ts` | 이름·전화번호·동의 검증 (클라이언트/서버 공용) |
| `app/api/entry/route.ts` | 응모 접수 — 서버 재검증 + 레이트리밋 + Apps Script 중계 |
| `apps-script/Code.gs` | 구글 시트 저장 스크립트 (설치법은 파일 상단 주석) |

스텝 5개는 구조가 같아서 데이터 배열 하나 + 렌더러(`components/StepRunner.tsx`) 하나로 돕니다.
스텝을 추가하려면 `content/steps.ts`에 항목을 넣고 `lib/progress.ts`의 `STEP_IDS`에 id를 더하세요.

심화 가이드도 마찬가지입니다. `content/guides.ts`에 항목 하나를 추가하면
`app/tools/[guide]/page.tsx`가 페이지를 만들고, 기능 사전 상단 목록과 가이드 간 이동 링크에도
자동으로 들어갑니다. 커리큘럼 단계에서 링크하려면 해당 스텝에 `more` 를 넣으세요.

## 환경변수

`.env.local.example`를 `.env.local`로 복사해 채웁니다. Vercel에도 같은 값을 넣으세요.

| 변수 | 용도 | 없으면 |
|---|---|---|
| `ENTRY_WEBHOOK_URL` | Apps Script 웹앱 URL. **서버 전용** | 응모가 503 |
| `ENTRY_SHARED_SECRET` | Route Handler ↔ Apps Script 공유 비밀키 | 응모가 503 |
| `NEXT_PUBLIC_SIGNUP_URL` | STEP 0 혜택 가입 링크 (UTM 포함) | UTM 없는 기본 링크 → **사인업 KPI 귀속 불가** |
| `NEXT_PUBLIC_SITE_URL` | 배포 도메인 (og:image 절대 URL 생성) | Vercel 배포별 URL → 공유 썸네일이 프리뷰 주소를 가리킴 |
| `NEXT_PUBLIC_GA_ID` | GA4 측정 ID | 계측 전부 없음 |

`ENTRY_WEBHOOK_URL`을 클라이언트에 노출하면 누구나 개인정보 시트에 쓸 수 있습니다.
반드시 `NEXT_PUBLIC_` 없이 두고 `/api/entry`를 거치게 하세요.

## 계측 (KPI 대응)

| KPI | 이벤트 |
|---|---|
| 방문 2,500회 | `page_view` |
| **사인업 760회** | `signup_click`, `signup_confirmed` |
| 프롬프트 학습 30% | `step_complete { step: "prompt" }` |
| 완주 | `quiz_pass`, `entry_submit` |
| 이탈 분석 | `step_start` (스텝별 드롭오프) |

---

## 배포

```bash
npm run predeploy
```

`preflight`(배포를 막는 점검) → `check`(자체 점검) → `build` 를 차례로 돌립니다.
하나라도 실패하면 거기서 멈춥니다.

**preflight 가 막는 것** — 체크리스트로는 놓치는, 놓치면 안 되는 것들입니다.

| 검사 | 실패하면 |
|---|---|
| 처리방침 담당자 정보가 비어 있음 | **배포 중단.** 전화번호를 수집하면서 담당자가 없으면 안 됩니다 |
| `sample-lecture.pdf` 없음 / PDF 아님 | **배포 중단.** STEP 3 다운로드가 404 |
| 파기 예정일이 지남 | 경고 — 캠페인이 밀리면 문서와 실제가 어긋납니다 |
| Apps Script SECRET 이 기본값 | 경고 |
| `.env.local` 에 예시 값이 남음 | 경고 |

환경변수는 이 스크립트가 실행되는 환경 기준으로 표시만 합니다. **Vercel 대시보드에서 다시 확인하세요.**

### 배포 순서

1. **구글 시트 + Apps Script** — 시트를 만들고 `apps-script/Code.gs` 를 붙여넣습니다.
   `SECRET` 을 긴 무작위 문자열로 바꾸고, 웹 앱으로 배포해 `/exec` URL 을 받습니다.
2. **처리방침 담당자** — `app/privacy/page.tsx` 의 `OPERATOR` 를 채웁니다.
3. **Vercel 환경변수 5개** — 위 표 참고. `ENTRY_*` 는 `NEXT_PUBLIC_` 없이 서버 전용으로.
4. `npm run predeploy` 가 통과하는지 확인합니다.
5. Vercel 에 배포하고, **배포 URL 로 `NEXT_PUBLIC_SITE_URL` 을 채운 뒤 한 번 더 배포**합니다.
   (공유 썸네일의 절대 URL 이 이 값에서 나옵니다)
6. 배포본에서 경품 응모를 한 번 제출해 **시트에 실제로 행이 쌓이는지** 확인합니다.

## 실행 체크리스트

가장 급한 셋:
1. `NEXT_PUBLIC_SITE_URL` 설정 후 재배포 (공유 썸네일)
2. Apps Script 배포 → 경품 응모 파이프라인 연결
3. 에브리타임 인앱 브라우저 실기기 QA — **프롬프트 복사가 되는지가 1순위**

## 이미지 교체 방법

파비콘은 [app/icon.svg](app/icon.svg), 공유 썸네일은 [app/opengraph-image.tsx](app/opengraph-image.tsx)가
코드로 그립니다. 디자인된 이미지가 있으면 **파일만 바꿔 끼우면 됩니다** — 코드 수정 불필요:

- 파비콘: `app/icon.svg`를 `app/icon.png`로 교체 (또는 덮어쓰기)
- 썸네일: `app/opengraph-image.tsx`를 지우고 `app/opengraph-image.png`(1200×630) 배치

Next.js 파일 컨벤션이라 메타태그는 자동으로 갱신됩니다.
