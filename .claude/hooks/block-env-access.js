#!/usr/bin/env node
// PreToolUse 가드 (Read/Edit/Write/NotebookEdit/Grep 및 Bash): 실제 .env 파일
// (.env.local 등 변형 포함)의 읽기·수정·출력·덮어쓰기를 차단한다.
// AGENTS.md "시크릿 관리" 절을 강제한다: 추적·공유는 .env.example만.
//
// Bash 문자열 매칭은 최선 노력 계층이지 보안 경계가 아니다 — 우발적·습관적
// 위반을 잡는 용도이며, 의도적 우회는 막지 못한다(.claude/hooks/README.md).
const { readHookInput } = require("./lib/read-hook-input");

readHookInput((payload) => {
  const toolName = payload?.tool_name;
  const ti = payload?.tool_input || {};

  const isEnvPath = (p) => {
    if (typeof p !== "string") return false;
    const base = p.replace(/\\/g, "/").split("/").pop() || "";
    return /^\.env(\..+)?$/.test(base) && base !== ".env.example";
  };

  const block = (what) => {
    console.error(
      `차단: ${what} — AGENTS.md "시크릿 관리": 실제 .env(변형 포함)는 에이전트가 읽거나 노출하지 않는다. 추적·공유는 .env.example만. .env 관리는 사용자에게 요청할 것.`
    );
    process.exit(2);
  };

  if (["Read", "Edit", "Write", "NotebookEdit"].includes(toolName)) {
    if (isEnvPath(ti.file_path)) block(`${toolName} "${ti.file_path}"`);
    process.exit(0);
  }

  if (toolName === "Grep") {
    const globRefsEnv = typeof ti.glob === "string" && /\.env(?!\.example\b)/.test(ti.glob);
    if (isEnvPath(ti.path) || globRefsEnv) block(`Grep (path/glob이 .env를 겨냥)`);
    process.exit(0);
  }

  if (toolName === "Bash") {
    const command = ti.command;
    if (typeof command !== "string") process.exit(0);

    // ".env" 또는 ".env.변형"이 독립 경로 세그먼트로 등장 (.env.example 제외).
    // "process.env" 처럼 식별자 일부인 경우는 앞 문자 조건으로 걸러진다.
    const envRefPattern = /(^|[\s"'`/\\:])\.env(?!\.example\b)(\.\w+)?(?=[\s"'`/\\:)]|$)/;
    if (!envRefPattern.test(command)) process.exit(0);

    const revealsOrOverwrites =
      /\b(cat|type|more|less|head|tail|bat|Get-Content|code|vim|nvim|nano|notepad|cp|copy|scp|curl|tee|grep|rg|findstr|sed|awk)\b/i.test(
        command
      ) || />>?\s*['"]?\.env(?!\.example\b)/.test(command);

    if (revealsOrOverwrites) block(`.env를 읽거나 덮어쓰는 명령: ${command}`);
  }

  process.exit(0);
});
