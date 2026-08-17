# ToolPacks — 스킬·MCP 선택 팩 카탈로그

> 소유자: 사용자 | 2026-08-17 조사 기준 (GitHub API 실측 검증). 프로젝트 성격에 맞는 팩만 골라 설치한다.

## 금지

- 전부 설치 금지 — MCP는 도구 정의만으로 컨텍스트를 상시 소모한다. 프로젝트당 MCP 3~5개 이내.
- SDD 프레임워크(Spec Kit, OpenSpec, GSD, BMAD, cc-sdd, Agent OS 등) 통설치 금지 — 이 템플릿의 AGENTS.md 파이프라인과 체계가 이중이 된다. 규칙 개선 참고용으로만.
- 통합 하네스(superpowers 전체, everything-claude-code, wshobson/agents 전체) 통설치 금지 — 6-에이전트 팩과 역할 충돌. 개별 스킬만 선별 차용.
- 스킬은 Claude Code 전용이다(예외: impeccable·ui-ux-pro-max는 Codex·Antigravity 지원). 3-도구 공통 규칙은 AGENTS.md에만 둔다.

## 전역 코어 (이미 설치됨 — 2026-08-17)

| 항목 | 정체 | 상태 |
|---|---|---|
| context7 | MCP (라이브러리 최신 문서) | 연결됨 (플러그인) |
| sequential-thinking | MCP (단계적 추론) | 연결됨 (user 스코프) |
| GitHub MCP | MCP (이슈·PR·CI) | 연결됨 (claude.ai 커넥터) |
| playwright | MCP (E2E 브라우저) | 연결됨 (플러그인) |
| Figma MCP | MCP (디자인→코드) | 연결됨 (claude.ai 커넥터) |
| claude-mem | 플러그인 (세션 메모리 지속성) | 설치됨 (`claude-mem install` 완료) |
| ponytail | 플러그인 (YAGNI·최소 코드 강제) | 설치됨 (full 모드) |
| 스킬 7종 | frontend-design, theme-factory, brainstorming, taste-skill, animate, impeccable(+Codex·.agents), ui-ux-pro-max(CLI만, 프로젝트별 `uipro init`) | `~/.claude/skills` 설치됨 |

## 프로젝트별 선택 팩 (해당할 때만 설치)

### 웹 프론트엔드 팩

| 항목 | 설치 |
|---|---|
| ui-ux-pro-max (디자인 시스템 생성) | 프로젝트 루트에서 `uipro init --ai claude` (codex/antigravity도 지원) |
| lighthouse-mcp (성능) | `claude mcp add -s project lighthouse -- npx lighthouse-mcp` |
| Axe MCP (접근성, Deque 공식) | Docker `dequesystems/axe-mcp-server` |

### DB 팩

| 항목 | 설치 |
|---|---|
| DBHub (다중 DBMS, Bytebase) | `claude mcp add -s project dbhub -- npx @bytebase/dbhub` (read-only 모드 권장) |
| Postgres MCP Pro (인덱스 튜닝) | PostgreSQL 전용, uv/Docker |

### 보안 팩 (결제·인증·개인정보 다룰 때)

| 항목 | 설치 |
|---|---|
| 공식 /security-review | Claude Code 내장 — 설치 불요 |
| trailofbits/skills (CodeQL·Semgrep 감사 12종+) | `/plugin marketplace add trailofbits/skills` |
| SonarQube MCP (품질 게이트) | 계정 필요, Docker |

### 구현 보조 팩 (대형 코드베이스·TDD 강제 시)

| 항목 | 설치 |
|---|---|
| Serena (LSP 심볼 탐색·정밀 편집) | `claude mcp add -s project serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server` |
| TDD Guard (테스트 없는 구현 차단 훅) | `npm i -g tdd-guard` + PreToolUse 훅 + 스택별 리포터 (JS/TS·Python·PHP·Go·Rust) |
| debug-skill (DAP 실제 디버거) | 스킬 복사 + dap 바이너리 |
| GitMCP (임의 리포 문서화) | 원격 URL `gitmcp.io/{owner}/{repo}` 등록 |

### 리뷰·QA 확장 팩

| 항목 | 설치 |
|---|---|
| 공식 code-review·pr-review-toolkit 플러그인 | `/plugin install code-review@claude-plugins-official` 등 |
| Sentry MCP (프로덕션 에러) | `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp` (OAuth) |
| BrowserStack MCP (실기기 E2E) / mcp-k6 (부하) | 계정 필요 |

### 문서화 팩

| 항목 | 설치 |
|---|---|
| changelog-generator (ComposioHQ/awesome-claude-skills 내) | 스킬 폴더 복사 |
| oh-my-mermaid (코드베이스 다이어그램) | `npm i -g oh-my-mermaid && omm setup` |
| mermaid-skill (다이어그램 23종) | 스킬 폴더 복사 |

## 판정 규칙 (새 프로젝트 시작 시)

| 조건 | 설치 |
|---|---|
| 모든 프로젝트 | 전역 코어만으로 시작 (추가 설치 없음) |
| 웹 UI 있음 | + 웹 프론트엔드 팩 |
| DB 있음 | + DB 팩 (read-only 모드) |
| 결제·인증·개인정보 | + 보안 팩 |
| 코드베이스 10k줄 이상 | + Serena |
| TDD 엄격 적용 | + TDD Guard |
