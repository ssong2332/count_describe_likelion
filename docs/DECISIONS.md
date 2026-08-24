# DECISIONS — 실시간 출결 및 자리비움 현황판 (Count & Status Sync)

> 소유자: architect | 결정 한 줄 로그. 배경·대안 비교가 필요한 결정은 adr/에 별도 기록하고 여기서 링크한다.

## 결정 로그

| # | 날짜 | 결정 | 이유 (한 줄) | ADR |
|---|---|---|---|---|
| 1 | 2026-08-24 | IRoomService 인터페이스 기반 듀얼 어댑터(Firebase + LocalBroadcast) 도입 | 키 미설정 로컬 시연 및 클라우드 원격 동기화를 모두 완벽히 지원하기 위함 | [ADR-0001](adr/0001-realtime-storage-and-dual-adapter.md) |
| 2 | 2026-08-24 | React + Vite + Vanilla CSS 모바일 글래스모피즘 스택 채택 | 가볍고 빠른 번들과 커스텀 모바일 터치 UI 최적화 | — |
| 3 | 2026-08-24 | 관리자(PIN)/사용자(이름선택) 롤 분기 UX 채택 | 사용자 편의성 극대화 및 오조작 방지 | — |
| 4 | 2026-08-25 | 배포 플랫폼 환경변수 값을 런타임에 정제한다 (`sanitizeConfigValue()`) | Vercel 대시보드 값은 따옴표째 번들에 인라인되어 `databaseURL`이 깨졌다 — 사람이 올바르게 입력하는 것에만 의존하지 않는다 | [ADR-0002](adr/0002-normalize-external-data-at-boundaries.md) |
| 5 | 2026-08-25 | Firebase 스냅샷을 도메인 경계에서 정규화한다 (`normalizeRoom()`) | RTDB가 빈 배열·빈 객체를 저장하지 않아 `logs` 키가 사라지고 런타임에 터졌다 — 저장소 표현과 도메인 모델의 차이를 경계 한 곳에서 흡수한다 | [ADR-0002](adr/0002-normalize-external-data-at-boundaries.md) |
| 6 | 2026-08-25 | 동기화 실패를 삼키지 않고 `SyncError`로 던져 사용자에게 노출한다 | 저장되지 않은 것을 저장된 줄 아는 것보다 작업이 중단되고 오류가 보이는 편이 낫다 | [ADR-0003](adr/0003-fail-loud-sync-error-propagation.md) |
| 7 | 2026-08-25 | PWA 도입 + 알림은 서비스워커 `showNotification()` 경로, 실패 무전파, 무음(경고음 삭제) | Android Chrome의 `new Notification()` TypeError가 React 트리를 무너뜨려 검은 화면을 만들었다 (추정) | [ADR-0004](adr/0004-pwa-service-worker-notifications.md) |
| 8 | 2026-08-25 | DB는 규칙만 강화하고, 룸 목록은 서버 열거 대신 기기 접속 기록(localStorage 최대 10개) + Firebase 콘솔로 관리한다 | 사용자 선택 원문: "규칙만 강화 (코드 변경 없음)" / "기기 기준 룸 목록 + 콘솔 (권장)" — 규칙이 `/rooms` 열거를 차단하므로 목록의 원본을 기기로 옮겼다 | [ADR-0005](adr/0005-rules-only-security-and-device-room-history.md) |

## 사후 기록 고지

결정 4~8은 배포 후 긴급 대응 과정에서 내려진 뒤 기록된 **사후 기록(post-hoc)**이다. 구현·배포가 이미 완료된 상태이며, 문서화 시점에 새로 설계한 내용이 아니다. 관련 ADR의 상태는 전부 `제안`이며 사용자 승인 대기 중이다.
