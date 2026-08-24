# 0004. 알림은 서비스워커 경로로 보내고 실패를 전파하지 않는다 (PWA 도입)

- 상태: 제안 (사후 기록 — 구현·배포 완료 후 작성, 사용자 승인 대기)
- 날짜: 2026-08-25
- 결정자: architect
- 관련 결정: DECISIONS.md #7
- 사용자 요청 원문 (축어 인용): "1. PWA 홈 화면 추가되게 해줘 2. DB무인증 공개도 해결 3. 핸드폰에서 상태 변환 시 검은 화면으로 바뀌고, 새로고침하면 다시 돌아오는데 이 문제 해결 4. 소리 알림은 끄고, 핸드폰에서 오는 알림 형태로 변환"

## 맥락

- Android Chrome은 `new Notification()` 생성자를 지원하지 않고 `TypeError: Illegal constructor`를 던진다. 이 예외가 `useEffect` 안에서 터지면 React 트리가 언마운트되어 화면이 검게 비고 새로고침해야 복구된다. 사용자가 보고한 증상("핸드폰에서 상태 변환 시 검은 화면")과 일치하지만, 데스크톱에서 재현되지 않아 **추정**으로 표시한다. 확인 방법: Android Chrome 원격 디버깅으로 상태 전환 시 콘솔에 `Illegal constructor`가 찍히는지 본다.
- 모바일에서 알림을 띄우려면 서비스워커의 `registration.showNotification()`이 필요하다 — 서비스워커가 없으면 경로 자체가 없다.
- 사용자가 홈 화면 추가와 무음 알림을 함께 요구했다.

## 검토한 대안

| 대안 | 장점 | 단점 |
|---|---|---|
| A. 알림 코드를 try/catch로만 감싸기 (PWA 없음) | 최소 변경, 검은 화면은 막힘 | 모바일에서는 알림이 **영영 뜨지 않는다**. 홈 화면 추가 요구도 미충족 |
| B. Web Audio 경고음 유지 + 알림 병행 | 화면을 안 보고 있어도 인지 | 사용자가 명시적으로 소리를 끄라고 요구했다. 부스 현장 소음 유발 |
| C. PWA 서비스워커 도입 + showNotification 우선, 실패 무전파 (채택) | 모바일 알림·홈 화면 추가·검은 화면 방지를 한 번에 해결 | 서비스워커 캐시가 오래된 화면·오래된 현황을 보여줄 위험 → 런타임 캐싱 정책으로 상쇄 |

## 결정

C를 채택한다.

- `vite-plugin-pwa`를 도입하고 `registerType: 'autoUpdate'`, `display: 'standalone'`, 192/512/maskable-512 아이콘으로 매니페스트를 구성한다 (`vite.config.ts`).
- `src/services/notification.service.ts`가 **1순위 `registration.showNotification()`**(`navigator.serviceWorker.ready`), **2순위 데스크톱 `new Notification()`** 으로 발송하되, **어떤 실패도 호출자에게 전파하지 않는다.** 실패는 `console.error`로만 남기고 `false`를 반환한다.
- 알림은 `silent: true` 무음이며 Web Audio 경고음 코드는 전량 삭제했다. 중복 쌓임 방지를 위해 `tag` 옵션을 지원한다.
- 실시간 DB 응답(`https://*.firebasedatabase.app/*`)은 `NetworkOnly`로 두어 **오래된 현황이 캐시되지 않게 한다.** 구글 폰트만 `CacheFirst`.

## 결과 (트레이드오프 포함)

- 얻는 것: 홈 화면 추가·독립 실행 가능. 모바일에서 알림이 실제로 뜬다. 알림 실패가 화면을 무너뜨리지 않는다.
- 감수하는 것: 알림 실패가 사용자에게 보이지 않는다 — ADR-0003의 fail-loud 원칙에 대한 **의도적 예외**다. 알림은 보조 통지이고, 전파하면 애초에 고치려던 검은 화면을 다시 만든다.
- 감수하는 것: 서비스워커 도입으로 배포 후 갱신 타이밍이 한 단계 늘어난다(`autoUpdate`로 완화). 실시간 데이터는 캐시 대상에서 제외했으므로 현황이 낡을 위험은 없다.
- 미검증: Android 실기기에서 `showNotification` 성공 및 검은 화면 해소 여부는 이 세션에서 확인하지 않았다 — QA 단계에서 실기기 검증이 필요하다.
