#!/usr/bin/env node
// PreToolUse 가드 (Bash): 훅·서명을 우회하는 git 플래그를 차단한다.
// docs/GitWorkflow.md 금지 조항("--no-verify 등 훅 우회 금지")을 강제한다.
const { readHookInput } = require("./lib/read-hook-input");

readHookInput((payload) => {
  const command = payload?.tool_input?.command;
  if (typeof command !== "string" || !/\bgit\b/.test(command)) process.exit(0);

  const skipPatterns = [
    /--no-verify\b/,
    /--no-gpg-sign\b/,
    /\bcommit\b[^\n]*\s-n\b/, // git commit -n (--no-verify 단축형; git clean -n 등 커밋 외 -n과 구분)
    /-c\s*commit\.gpgsign=false\b/,
    /-c\s*core\.hooksPath=/,
  ];
  const hit = skipPatterns.find((p) => p.test(command));
  if (hit) {
    console.error(
      `차단: 훅/서명을 우회하는 git 플래그 (${hit}) — docs/GitWorkflow.md: 훅 우회 금지. 사용자가 이번 턴에 이 명령을 명시적으로 요청한 경우에만 예외.`
    );
    process.exit(2);
  }

  process.exit(0);
});
