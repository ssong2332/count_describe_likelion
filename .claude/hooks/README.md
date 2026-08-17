# 훅

세 도구 모두 강제 계층이 있다. **여기 있는 스크립트는 Claude Code와 Codex가 공유**하고(payload 스키마 `tool_name`/`tool_input`와 차단 규약 exit 2가 동일), 안티그래비티만 출력 규약이 달라 별도 어댑터를 쓴다. 규칙의 원본은 언제나 AGENTS.md다 — 훅은 물리 차단 보조 계층이다.

| 도구 | 배선 | 실행 스크립트 | 차단 신호 |
|---|---|---|---|
| Claude Code | `.claude/settings.json` | `.claude/hooks/*.js` | exit `2` |
| Codex | `.codex/hooks.json` | **같은 `.claude/hooks/*.js`** | exit `2` |
| 안티그래비티 | `.agents/hooks.json` | `scripts/agy-guard.js` | stdout `{"decision":"deny"}` |

규칙을 고칠 때는 **세 배선과 두 스크립트를 함께** 본다. 특히 안티그래비티 어댑터는 별도 파일이라 드리프트가 생기기 쉽다.

## 도구별 활성 조건 (지키지 않으면 조용히 무동작)

| 도구 | 조건 |
|---|---|
| Codex | **최초 1회 `/hooks`로 훅 정의를 신뢰 승인해야 한다.** 승인 전에는 훅이 실행되지 않는다 |
| Codex | `sandbox_mode`·`approval_policy`는 리포에 넣어도 무시된다 — `~/.codex/config.toml`에 각자 설정 |
| Codex | 훅 실행 cwd가 워크스페이스 루트라는 전제 — `.codex/hooks.json`의 `node .claude/hooks/*.js`는 상대 경로다 (아래 참조) |
| 안티그래비티 | 훅 실행 cwd가 워크스페이스 루트라는 전제 (아래 참조) |
| Claude Code | 별도 조건 없음 (프로젝트 settings.json 로드 시 활성) |

**cwd 전제 (Codex·안티그래비티 공통)**: 둘 다 배선 경로가 상대 경로이고, 공식 문서에 훅 실행 cwd 규약이 명시돼 있지 않다. cwd가 워크스페이스 루트가 아니면 스크립트를 못 찾아 **조용히 무동작**한다 — C6 검사도 이 경우는 못 잡는다(파일 자체는 실재하므로). 확인법: 해당 도구에서 `.env` 열기를 시도해 차단되는지 1회 테스트. 차단이 안 되면 command 경로를 조정하거나(예: `node ../.claude/hooks/...`), 두 경로를 모두 시도하는 해석기로 바꾼다.

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
| `contract-check.js` | 노티파이어 | 규칙 문서 간 모순 6종(C1~C6) 검사 결과를 알림 (Claude Code에서만 자동 실행) |

`block-env-access.js`는 Codex의 `apply_patch`도 처리한다 — 그 도구는 파일 경로가 아니라 **패치 본문**을 `tool_input.command`에 담으므로 `*** Add/Update/Delete File:` 줄에서 대상 경로를 파싱한다.

**근거 기록 (matcher·인자명 출처)**: `.codex/hooks.json`의 matcher(`Bash|shell|local_shell`, `apply_patch|Read|Edit|Write`)와 `.agents/hooks.json`의 파일 인자명(`AbsolutePath`·`TargetFile`·`SearchPath`·`DirectoryPath`)은 Codex `codex-cli 0.148.0-alpha.9` 실측(로컬 `~/.codex/hooks.json`의 impeccable 훅 배선 관찰)과 [learn.chatgpt.com/docs/hooks](https://learn.chatgpt.com/docs/hooks)·[antigravity.google/docs/ide/hooks](https://antigravity.google/docs/ide/hooks)를 근거로 정했다. 도구 버전이 바뀌어 이름이 달라지면 훅은 조용히 무동작하므로, 새 버전으로 넘어갈 때는 위 cwd 전제 확인과 같은 방식(`.env` 열기 1회 시도)으로 재검증한다.

## 원칙

- **fail-open이 기본이다.** 페이로드 파싱 실패·git 아님 등 예외 상황에서는 exit 0으로 통과시킨다. 훅 버그가 세션 전체를 막는 실패 모드가, 막으려던 것보다 나쁘기 때문이다. 어떤 가드가 **유일한** 방벽이 되는 상황이면 fail-closed로 바꾸고 그 이유를 파일 헤더에 남긴다.
- **문자열 매칭은 최선 노력이지 보안 경계가 아니다.** 의도적 우회(alias, 인코딩, 다른 도구 사용)는 못 막는다. 우발적·습관적 위반을 잡는 용도다.
- **오탐이 나면 패턴을 약화시키지 말고 명령을 다르게 쓴다.** 패턴을 느슨하게 만드는 순간 원래 막으려던 것도 통과한다.
- **복합 명령의 브랜치 판정은 실행 전 HEAD 기준이다.** `git checkout main && git commit` 같은 체인은 판정을 비껴간다 — git 명령은 나눠 실행한다.
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
| C6 | 훅 설정(`.claude/settings.json`·`.codex/hooks.json`·`.agents/hooks.json`)이 가리키는 스크립트 실존 |

**C6의 한계** (기계 검사가 못 잡는 것): ① 파일은 실재하지만 cwd 전제가 어긋나 무동작하는 경우(위 cwd 전제 참조) ② `matcher` 문자열의 오타(도구명이 틀려도 스크립트 경로 검사는 통과) ③ 세 배선 간 강제 규칙 세트의 비대칭(예: 한 도구에만 없는 규칙) ④ Claude Code에서만 자동 실행되므로 Codex·안티그래비티에서 한 편집은 다음에 Claude Code로 돌아올 때까지 미검사 — `--report`로 수동 실행해 보완한다.

사람이 판단해야 하는 것(규칙끼리의 의미 충돌, 게이트가 실제로 판정을 바꾸는지 등)은 기계가 못 잡는다. 그런 결함은 `docs/KitFeedback.md`에 기록한다.
