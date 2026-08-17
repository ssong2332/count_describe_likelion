# {{PROJECT_NAME}}

> 이 리포는 [start_coding](https://github.com/) 템플릿에서 생성되었다. 초기화 전이라면 아래 "새 프로젝트 시작"을 먼저 실행할 것.

## 새 프로젝트 시작 (템플릿 사용법)

1. GitHub에서 **Use this template** → 새 리포 생성 → clone
2. 초기화 스크립트 실행 (Windows):

```bash
powershell -ExecutionPolicy Bypass -File scripts/init.ps1 -ProjectName "프로젝트명"
```

   macOS/Linux:

```bash
bash scripts/init.sh "프로젝트명"
```

3. `docs/PRD.md` 작성부터 시작 (파이프라인 1단계)
4. Claude Code / Codex / 안티그래비티 어느 도구로 열어도 같은 규칙(AGENTS.md)이 적용된다.

| 도구 | 규칙 읽는 방식 |
|---|---|
| Claude Code | CLAUDE.md의 `@AGENTS.md` import |
| Codex | 루트 AGENTS.md 직접 읽음 |
| 안티그래비티 (Gemini) | 루트 AGENTS.md 직접 읽음 |

## 프로젝트 개요

<!-- 초기화 후 docs 에이전트가 채운다 -->

## 구조

```
{{PROJECT_NAME}}/
├── AGENTS.md          # 마스터 규칙 (단일 원본)
├── CLAUDE.md          # Claude Code 어댑터
├── docs/              # 프로젝트 문서 8종 + adr/ + ToolPacks.md(스킬·MCP 선택 팩)
├── scripts/           # 초기화 스크립트 init.ps1·init.sh (1회 실행)
├── .agents/skills/    # 공통 호환 스킬 팩 (안티그래비티·Codex·Claude 공유)
└── .claude/agents/    # 6-에이전트 팩 (Claude Code 전용)
```

## 개발 파이프라인

기획 → 설계 → 구현 → 리뷰/검증 → 문서화. 단계별 산출물과 게이트는 [AGENTS.md](AGENTS.md) 참조.

## 실행/빌드/테스트

<!-- 검증된 명령어는 docs/CodingRules.md "검증된 명령어" 절에 기록 후 여기에 반영 -->
