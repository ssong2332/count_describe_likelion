# Tasks — 실시간 출결 및 자리비움 현황판 (Count & Status Sync)

> 소유자: planner | 최종 수정: 2026-08-25
> 2026-08-25: 배포 후 긴급 대응 5건(T-09~T-13)을 사후 기록했다. 이 5건은 파이프라인 순서대로 planner가 착수 전환한 것이 아니라 배포 장애 대응으로 구현·검증·병합이 먼저 이뤄졌고, planner가 사후에 근거와 함께 "완료"로 기록한 것이다. T-09~T-13의 테스트 수치·실측 결과는 구현 보고에서 가져온 값이므로 (인용) 표시했다 — planner가 이번 세션에 직접 재실행하지 않았다.

## 상태 판정표

| 상태 | 의미 | 전환 주체·시점 |
|---|---|---|
| 대기 | 착수 전 | 초기값 (planner가 작업 생성 시) |
| 진행 | 구현 중 | planner가 작업 착수 시 |
| 검증중 | 리뷰/QA 단계 | planner가 implementer의 "검증 전환 요청"(구현 근거 첨부)을 받고 근거 기록과 함께 |
| 완료 | DefinitionOfDone 전부 통과 + 근거 기록됨 | planner가 리뷰·QA 통과 보고를 받은 뒤 |
| 보류 | 사용자 결정 대기 (Open Question 번호 기재) | planner |

상태 전환은 전부 planner만 수행한다 — 다른 에이전트는 요청·보고로만 관여한다.

완료 판정은 임의로 하지 않는다 — 근거 열이 비어 있으면 완료로 표시 금지.

## 작업 목록

T-01은 고정 첫 작업이다 — T-01 완료 전 T-02 이후 작업 착수 금지 (T-01 자신은 이 조건 없이 착수. AGENTS.md "검증 루프" 규칙).

| ID | 작업 | 관련 요구사항 | 선행 | 상태 | 근거 (완료 시: 커밋/테스트 출력) |
|---|---|---|---|---|---|
| T-01 | 테스트 하네스 구축 (Vite + React + Vitest 러너 설정 + 스모크 테스트 1개 + docs/CodingRules.md 명령어 등록) | 전체 | — | 완료 | vitest 1 passed, build 성공, CodingRules 등록 |
| T-02 | 핵심 비즈니스 로직 및 실시간 동기화/스토리지 계층 구현 (타이머 계산, 상태 전이, 로그 기록, Firebase/로컬 어댑터 TDD) | F-01, F-04, F-07 | T-01 | 완료 | 20개 단위 테스트 전원 통과 (member-logic, time-formatter, local-broadcast) |
| T-03 | 룸 접속/생성 및 역할별 진입 화면 구현 (관리자 PIN 인증 vs 사용자 이름 선택) | F-01 | T-02 | 완료 | join-screen.test.tsx 2 passed, 브라우저 E2E 룸 생성 및 모드별 진입 검증 완료 |
| T-04 | 관리자 대시보드 화면 구현 (인원 추가/수정/삭제, 출결 2단계 토글, 실시간 요약 카운터) | F-02, F-03 | T-02 | 완료 | 브라우저 E2E 인원 추가/수정/삭제 및 상단 실시간 카운터 통계 검증 완료 |
| T-05 | 사용자 전용 제어 화면 및 자리비움(화장실, 흡연, 기타-사유 모달) 원터치 제어 & 실시간 타이머 구현 | F-04, F-05, F-06 | T-03, T-04 | 완료 | 브라우저 E2E 사용자 전용 패널 터치 조작 및 화장실/흡연/기타 타이머 연동 검증 완료 |
| T-06 | 상세 타임로그 히스토리 뷰어 및 관리자 당일 데이터 수동 리셋(초기화) 기능 구현 | F-07, F-08 | T-05 | 완료 | 브라우저 E2E 타임로그 드로어 뷰어 및 리셋 확인 모달 검증 완료 |
| T-07 | PWA(모바일 홈 화면 바로가기) 설정 및 모바일 글래스모피즘 UI 최적화 | F-09, N-02, N-04 | T-06 | 완료 | **2026-08-25 사실 정정:** 기존 근거 "vite.config.ts PWA 매니페스트 및 Safe-area 모바일 다크 글래스모피즘 CSS 빌드 완료"는 PWA 부분이 사실과 달랐다. 실제로는 T-11(커밋 074f274) 이전까지 vite.config.ts에 PWA 플러그인이 없었고 index.html에도 매니페스트 링크가 없었다(`grep VitePWA\|manifest` 결과 없음, vite-plugin-pwa는 package.json에 설치만 되어 있었음). 즉 F-09/N-04의 PWA 부분은 당시 미구현 상태로 "완료" 처리되어 있었고, T-11에서 실제 구현됐다. 실제로 완료된 범위는 모바일 Safe-area 다크 글래스모피즘 CSS(N-02)뿐이다. |
| T-08 | 관리자 2인 + 사용자 1인 실시간 동시 조작 통합 검증, 반응형 터치 테스트 및 문서화(README/CHANGELOG) 갱신 | N-01, N-02, N-03, 전체 | T-07 | 완료 | 브라우저 subagent E2E 자동화 검증 완료 (비디오 녹화: app_e2e_verified) |
| T-09 | 배포 환경 실시간 동기화 복구 (환경변수 따옴표 sanitize + RTDB 빈 배열 누락 normalize) | N-01, N-05, N-06 | T-08 | 완료 | 커밋 279db50 / 병합 acd5d8d. 근본 원인 1: Vercel의 VITE_FIREBASE_* 7개가 큰따옴표를 포함해 저장되어 번들에 `'"https://...app"'`로 인라인 → REST는 배포 도메인 상대경로로 404, WebSocket은 ERR_NAME_NOT_RESOLVED. 근본 원인 2: RTDB가 빈 배열을 저장하지 않아 `logs` 키 소실 → `member.logs.length`/`[...member.logs]` 예외 (로컬 BroadcastChannel은 localStorage가 빈 배열을 보존해 재현 안 되던 배포 전용 결함). 수정: `src/services/firebase-config.ts` sanitizeConfigValue(), `src/domain/room-normalizer.ts` normalizeRoom()을 읽기 경로 4곳 적용. 검증: vitest 33 passed (인용). 따옴표 환경변수 빌드 번들 브라우저 구동으로 룸 생성·원격 기기 인원 추가 실시간 반영·출석·화장실 타이머·복귀 로그가 실제 Firebase DB에 반영됨 확인. 배포 후 프로덕션 콘솔 에러 10건 → 0건 (인용). |
| T-10 | 동기화 실패의 사용자 노출 (오류 은폐 구조 제거) | F-11, N-05 | T-09 | 완료 | 커밋 2165646 / 병합 36873e4. 문제: 모든 Firebase 실패가 console.warn 및 `.catch(() => {})`로 삼켜져 클라우드 저장 전면 실패에도 화면 표시 없음. 수정: `src/services/rest-client.ts`의 firebaseRest()가 네트워크 실패·비2xx를 SyncError로 던짐(상태코드별 한국어 안내, url·status 첨부), 쓰기 catch 12곳 전파, SDK 미러 무음 실패 20곳 console.error 기록, subscribeRoom에 onError 콜백 신설 → useRoomSync의 error로 전달. 검증: vitest 40 passed (인용). 잘못된 databaseURL 빌드 구동 시 "클라우드 주소를 찾을 수 없습니다 (Firebase 설정값을 확인하세요) [HTTP 404]" 배너 표시 + 대시보드 진입 차단 확인. |
| T-11 | PWA 설치 지원 + 모바일 무음 알림 전환 + 검은 화면(렌더 트리 언마운트) 해결 | F-09, F-10, F-12, N-04 | T-10 | 완료 | 커밋 074f274 / 병합 03fdb5b. PWA: vite-plugin-pwa 활성화, manifest.webmanifest(standalone·한국어·아이콘 192/512/maskable) + sw.js 생성, apple-touch-icon·mobile-web-app-capable 메타 추가, Firebase 실시간 응답은 NetworkOnly로 캐시 제외. 검은 화면: Android Chrome이 `new Notification()` 생성자에서 TypeError를 던지고 이것이 useEffect 안에서 터져 React 트리가 언마운트된 것으로 **추정**(데스크톱 재현 불가) → `src/services/notification.service.ts`로 발송 분리해 실패를 모두 삼키고 `src/components/common/ErrorBoundary.tsx`를 앱 루트에 배치해 빈 화면 대신 오류 메시지+새로고침 버튼 표시. 알림: 서비스워커 registration.showNotification() 우선 경로, 인원별 tag 중복 덮어쓰기, 9분 초과만 requireInteraction. 소리: playAlertBeep(Web Audio 경고음) 전량 삭제, silent: true 무음 발송. 검증: vitest 51 passed (인용). 프로덕션에서 서비스워커 등록·활성, showNotification 사용 가능, manifest standalone·아이콘 3종 확인. 번들 내 createOscillator/webkitAudioContext 0건. |
| T-12 | Firebase RTDB 보안 규칙 작성 및 게시 (무인증 공개 차단) | N-07 | T-11 | 완료 | 커밋 0cc5bb7 / 병합 bfd4248, 사용자가 Firebase 콘솔에 게시 완료("규칙 게시했어"). 문제: 기본 테스트 모드 규칙으로 무인증 전체 읽기·쓰기 가능(무인증 PUT이 HTTP 200 성공). 조치: `firebase.rules.json` — 루트·/rooms 열거 차단, 룸 통째 삭제 금지(newData.exists()), roomId/pin/createdAt 필수·길이 및 인원 name/activeStatus/isPresent 형식 검증. 게시 후 실측: 루트 읽기 401, 전체 룸 열거 401, 루트 임의 경로 쓰기 401, /rooms 통째 덮어쓰기 401, 필수 필드 없는 룸 생성 401, 룸 삭제 401 / 개별 룸 읽기 200 (인용). 배포본으로 룸 생성·인원 등록·출석·흡연·복귀·인원 삭제 전 과정 성공, 콘솔 에러 0건 (인용). **한계: 인증이 없으므로 룸 코드를 아는 사람의 읽기·수정은 막지 못한다 — 부스 실운영 전 익명 인증 전환 필요(T-14).** 사용자 선택: "규칙만 강화 (코드 변경 없음)". |
| T-13 | 룸 목록을 서버 전체 열거 → 기기 기준(localStorage) 기록으로 전환 | F-13, N-07 | T-12 | 완료 | 커밋 a172d58 / 병합 bfffe41. 배경: T-12 규칙이 전체 룸 열거를 막아 서버 열거 기반 룸 목록이 동작 불가 → 사용자 선택 "기기 기준 룸 목록 + 콘솔 (권장)". 수정: `src/services/room-history.ts`(localStorage 최대 10개, 대문자 정규화, 재방문 시 최상단, 깨진 값은 빈 목록), App.tsx 세션 확정 지점 1곳에서 기록, RoomListModal이 listRooms() 열거를 제거하고 기기 기록 사용·인원수는 개별 조회·사라진 룸은 "삭제됨" 표시, 룸 삭제 버튼은 "이 기기 목록에서 빼기"로 변경(데이터 보존). 영구 삭제·복구는 Firebase 콘솔에서 수행. 검증: vitest 60 passed (인용). 브라우저에서 입장 후 목록 기록·인원수 채움 확인, 네트워크에 /rooms.json 열거 요청 0건, 개별 룸 조회만 발생 (인용). |
| T-14 | 익명 인증 전환 (Firebase 콘솔 익명 로그인 활성화 + 규칙 `auth != null` 변경 + REST 직접 호출을 SDK 경로로 정리) | N-07, Open Question 2 | T-12, T-13 | 보류 (Open Question 2) | 미착수 — 사용자 답변 "지금은 테스트 중 — 자유롭게"로 테스트 기간 현행 유지 결정. 부스 실운영 전 착수 필요. 콘솔 설정 변경(사용자)과 코드 변경(implementer)이 함께 필요해 단독 코드 작업으로 끝나지 않음. |
| T-15 | 규칙 검증용 잔여 `ZZRULECHECK` 빈 룸 삭제 | N-07 | T-12 | 대기 | 미조치 — 보안 규칙이 룸 삭제를 금지(`newData.exists()`)하므로 앱·REST로는 제거 불가. Firebase 콘솔에서 사용자가 직접 삭제해야 한다 (에이전트 수행 불가, 사용자 조치 항목). |
