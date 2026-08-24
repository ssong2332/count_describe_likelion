# 0001. 실시간 동기화 스토리지 및 듀얼 어댑터 구조 (Firebase + Local Broadcast)

- 상태: 승인
- 날짜: 2026-08-24
- 결정자: architect

## 맥락

모바일 현장 관리자 2명과 일반 사용자가 실시간으로 출결 및 자리비움 타이머를 동기화해야 한다.
동시에 로컬 개발, 단위/통합 테스트, Firebase API 키 미설정 환경에서도 완전한 기능 시연 및 동작이 가능해야 한다.

## 결정

스토리지/동기화 계층을 인터페이스(`IRoomService`)로 추상화하고 두 가지 어댑터를 구현한다:
1. **FirebaseRealtimeService**: Firebase Realtime DB / Firestore를 이용한 클라우드 실시간 동기화 (원격 멀티 디바이스 지원)
2. **LocalBroadcastService**: `BroadcastChannel` 및 `localStorage`를 이용한 로컬 실시간 동기화 (단위 테스트, 오프라인 시연, API 키 없는 환경 지원)

앱 실행 시 환경변수(`VITE_FIREBASE_API_KEY` 등) 존재 여부에 따라 자동 전환되도록 팩토리 패턴을 적용한다.

## 결과

- 외부 Firebase 계정 설정 여부와 무관하게 즉시 로컬 멀티 탭 시연 및 단위 테스트 통과 가능
- 실시간 통신 라이브러리 교체 시 도메인 및 UI 코드의 수정 없이 어댑터만 교체 가능
