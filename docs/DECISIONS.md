# DECISIONS — 실시간 출결 및 자리비움 현황판 (Count & Status Sync)

> 소유자: architect | 결정 한 줄 로그. 배경·대안 비교가 필요한 결정은 adr/에 별도 기록하고 여기서 링크한다.

## 결정 로그

| # | 날짜 | 결정 | 이유 (한 줄) | ADR |
|---|---|---|---|---|
| 1 | 2026-08-24 | IRoomService 인터페이스 기반 듀얼 어댑터(Firebase + LocalBroadcast) 도입 | 키 미설정 로컬 시연 및 클라우드 원격 동기화를 모두 완벽히 지원하기 위함 | [ADR-0001](adr/0001-realtime-storage-and-dual-adapter.md) |
| 2 | 2026-08-24 | React + Vite + Vanilla CSS 모바일 글래스모피즘 스택 채택 | 가볍고 빠른 번들과 커스텀 모바일 터치 UI 최적화 | — |
| 3 | 2026-08-24 | 관리자(PIN)/사용자(이름선택) 롤 분기 UX 채택 | 사용자 편의성 극대화 및 오조작 방지 | — |
