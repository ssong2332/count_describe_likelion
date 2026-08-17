# 훅

**Claude Code 전용 강제 장치다.** Codex·안티그래비티에는 훅 체계가 없으므로, 여기 있는 규칙은 전부 AGENTS.md에도 문서로 존재해야 한다 — 훅은 Claude에서만 추가로 물리 차단하는 보조 계층이지, 규칙의 원본이 아니다.

## 두 종류

| 종류 | 이벤트 | 종료 코드 | 역할 |
|---|---|---|---|
| 가드 | PreToolUse | 차단 시 `2` | 실행 자체를 막는다 |
| 노티파이어 | PostToolUse | 항상 `0` | 경고만 전달, 절대 막지 않는다 |

| 파일 | 종류 | 무엇을 막는가 |
|---|---|---|
| `block-main-writes.js` | 가드 | main/master 체크아웃 상태의 `git commit`, 다른 브랜치를 main에 직접 써넣는 refspec push |
| `block-no-verify.js` | 가드 | `--no-verify`, `--no-gpg-sign`, 훅 우회 config |
| `block-env-access.js` | 가드 | 실제 `.env` 읽기·수정·출력·덮어쓰기 (`.env.example`은 허용) |
| `contract-check.js` | 노티파이어 | 규칙 문서 간 모순 5종(C1~C5) 검사 결과를 알림 |

## 원칙

- **fail-open이 기본이다.** 페이로드 파싱 실패·git 아님 등 예외 상황에서는 exit 0으로 통과시킨다. 훅 버그가 세션 전체를 막는 실패 모드가, 막으려던 것보다 나쁘기 때문이다. 어떤 가드가 **유일한** 방벽이 되는 상황이면 fail-closed로 바꾸고 그 이유를 파일 헤더에 남긴다.
- **문자열 매칭은 최선 노력이지 보안 경계가 아니다.** 의도적 우회(alias, 인코딩, 다른 도구 사용)는 못 막는다. 우발적·습관적 위반을 잡는 용도다.
- **오탐이 나면 패턴을 약화시키지 말고 명령을 다르게 쓴다.** 패턴을 느슨하게 만드는 순간 원래 막으려던 것도 통과한다.
- 훅 파일과 `settings.json`은 사용자 소유다. 에이전트가 차단을 우회하려고 편집하는 대상이 아니다.

## 단독 실행

```bash
node .claude/hooks/contract-check.js --report
```

## 검사 항목 (contract-check)

| ID | 검사 |
|---|---|
| C1 | 에이전트 frontmatter `name` ↔ 파일명 ↔ AGENTS.md 등재 일치 |
| C2 | 문서가 참조하는 `docs/*.md`·`.agents/skills/*/SKILL.md` 실존 |
| C3 | `.agents/skills/` 실제 스킬이 AGENTS.md 공용 스킬 표에 등재 |
| C4 | 소유권 표에 한 문서의 소유자가 둘 이상이 아닌지 |
| C5 | init 스크립트가 치환하지 않는 위치의 플레이스홀더 |

사람이 판단해야 하는 것(규칙끼리의 의미 충돌, 게이트가 실제로 판정을 바꾸는지 등)은 기계가 못 잡는다. 그런 결함은 `docs/KitFeedback.md`에 기록한다.
