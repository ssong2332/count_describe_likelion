/**
 * Antigravity PreToolUse 가드 — .claude/hooks/ 의 안티그래비티 대응물.
 * 배선은 .agents/hooks.json (cwd 비의존 해석: scripts/ 와 ../scripts/ 둘 다 시도).
 *
 * 강제하는 규칙 (원본은 문서, 여기는 물리 차단 계층):
 * - AGENTS.md "시크릿 관리": 실제 .env(변형 포함) 읽기/수정/출력 차단
 * - docs/GitWorkflow.md: main/master 직접 커밋, 병합 없는 refspec push 차단
 *
 * 규약: stdin = {toolCall:{name,args}, ...}, stdout = {"decision":"allow"|"deny", "reason"?}
 * 오류 시 fail-open(allow) — 가드 버그가 세션을 막는 실패 모드가 더 나쁘기 때문
 * (.claude/hooks/README.md 와 동일 원칙).
 */

const { execSync } = require("child_process");

function main() {
  let input = "";
  process.stdin.setEncoding("utf8");

  process.stdin.on("data", (chunk) => {
    input += chunk;
  });

  process.stdin.on("end", () => {
    try {
      if (!input.trim()) {
        output({ decision: "allow" });
        return;
      }

      const payload = JSON.parse(input);
      const toolCall = payload.toolCall || {};
      const toolName = toolCall.name || "";
      const args = toolCall.args || {};

      const isEnvPath = (p) => {
        if (typeof p !== "string") return false;
        const base = p.replace(/\\/g, "/").split("/").pop() || "";
        return /^\.env(\..+)?$/.test(base) && base !== ".env.example";
      };

      // 1. 파일 도구에서 .env 접근 검사
      const targetPaths = [args.AbsolutePath, args.TargetFile, args.SearchPath, args.DirectoryPath].filter(Boolean);
      for (const p of targetPaths) {
        if (isEnvPath(p)) {
          output({
            decision: "deny",
            reason: `[AGENTS.md 시크릿 관리] 실제 .env 파일(${p}) 접근이 차단되었습니다. .env.example만 참조 가능합니다.`
          });
          return;
        }
      }

      // 2. 명령어 실행(run_command) 검사
      if (toolName === "run_command") {
        const command = args.CommandLine;
        if (typeof command === "string") {
          // 2-1. .env 명령행 노출 검사
          const envRefPattern = /(^|[\s"'`/\\:])\.env(?!\.example\b)(\.\w+)?(?=[\s"'`/\\:)]|$)/;
          if (envRefPattern.test(command)) {
            const revealsOrOverwrites =
              /\b(cat|type|more|less|head|tail|bat|Get-Content|code|vim|nvim|nano|notepad|cp|copy|scp|curl|tee|grep|rg|findstr|sed|awk)\b/i.test(
                command
              ) || />>?\s*['"]?\.env(?!\.example\b)/.test(command);

            if (revealsOrOverwrites) {
              output({
                decision: "deny",
                reason: `[AGENTS.md 시크릿 관리] .env 파일을 읽거나 덮어쓰는 명령 실행이 차단되었습니다.`
              });
              return;
            }
          }

          // 2-2. main/master 브랜치 직접 커밋 검사
          const isCommit = /\bgit\s+commit\b/.test(command);
          const refspec = command.match(/\bgit\s+push\b[^\n]*\s([\w./-]+):(?:refs\/heads\/)?(main|master)\b/);

          if (isCommit || refspec) {
            let branch = "";
            try {
              branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
            } catch {
              branch = "";
            }

            const onProtectedBranch = branch === "main" || branch === "master";

            if (isCommit && onProtectedBranch) {
              output({
                decision: "deny",
                reason: `[GitWorkflow] "${branch}" 브랜치에서 직접 git commit 실행이 차단되었습니다. 작업용 브랜치를 먼저 생성하세요.`
              });
              return;
            }

            if (refspec) {
              const src = refspec[1];
              const srcIsProtected = /^(refs\/heads\/)?(main|master)$/.test(src);
              const srcIsHeadOnProtected = src === "HEAD" && onProtectedBranch;
              if (!srcIsProtected && !srcIsHeadOnProtected) {
                output({
                  decision: "deny",
                  reason: `[GitWorkflow] 다른 브랜치를 main/master에 직접 push하는 행위가 차단되었습니다. 로컬에서 병합 후 push하세요.`
                });
                return;
              }
            }
          }
        }
      }

      // 기본 허용
      output({ decision: "allow" });
    } catch (e) {
      // 오류 발생 시 fail-open (도구 실행 방해 방지)
      output({ decision: "allow" });
    }
  });
}

function output(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

main();
