#!/usr/bin/env bash
# init.sh — 템플릿에서 새 프로젝트 생성 직후 1회 실행 (Linux/macOS용, Windows는 init.ps1)
# 사용법: bash scripts/init.sh "프로젝트명"
# 동작: 치환 결과를 임시 파일로 먼저 만들어 검증한 뒤 한 번에 반영. 검증 실패 시 아무 파일도 바뀌지 않는다.
set -euo pipefail

name="${1:-}"
if ! printf '%s' "$name" | grep -q '[^[:space:]]'; then
    echo "### 결론: 초기화 실패 — 프로젝트명이 비었거나 공백뿐이다. 사용법: bash scripts/init.sh \"프로젝트명\""
    exit 1
fi

root="$(cd "$(dirname "$0")/.." && pwd)"
today="$(date +%F)"

# sed 치환문에서 특수문자(\, &, 구분자 |) 이스케이프
esc="$(printf '%s' "$name" | sed -e 's/[\\&|]/\\&/g')"

targets=("$root/README.md")
while IFS= read -r f; do targets+=("$f"); done < <(find "$root/docs" -name '*.md' | sort)

# 1단계: 임시 파일로 치환 결과 생성 (원본은 아직 그대로)
tmps=()
cleanup() {
    for t in "${tmps[@]:-}"; do
        if [ -n "$t" ]; then rm -f "$t"; fi
    done
}
trap cleanup EXIT

for f in "${targets[@]}"; do
    tmp="$f.init-tmp"
    sed -e "s|{{PROJECT_NAME}}|$esc|g" -e "s|{{DATE}}|$today|g" "$f" > "$tmp"
    tmps+=("$tmp")
done

# 2단계: 반영 전 검증 — 잔여 플레이스홀더가 있으면 전부 폐기하고 실패
bad=()
for t in "${tmps[@]}"; do
    if grep -Eq '\{\{[A-Z0-9_]+\}\}' "$t"; then
        bad+=("$t")
    fi
done
if [ "${#bad[@]}" -gt 0 ]; then
    echo "### 결론: 초기화 실패 — 알 수 없는 플레이스홀더 잔존. 변경된 파일 없음."
    for t in "${bad[@]}"; do
        echo "  잔존: ${t%.init-tmp}: $(grep -Eo '\{\{[A-Z0-9_]+\}\}' "$t" | sort -u | tr '\n' ' ')"
    done
    exit 1
fi

# 3단계: 일괄 반영 — 교체 실패 시 이미 바꾼 파일을 백업에서 원복
changed=0
backups=()
rollback() {
    for b in "${backups[@]:-}"; do
        if [ -n "$b" ]; then mv -f "$b" "${b%.init-bak}"; fi
    done
}
for f in "${targets[@]}"; do
    tmp="$f.init-tmp"
    if cmp -s "$f" "$tmp"; then
        rm -f "$tmp"
        continue
    fi
    if ! cp -p "$f" "$f.init-bak" || ! mv -f "$tmp" "$f"; then
        rm -f "$f.init-bak"
        rollback
        echo "### 결론: 초기화 실패 — 반영 중 오류가 나서 이미 변경한 ${changed}개 파일을 원복했다. 변경된 파일 없음."
        exit 1
    fi
    backups+=("$f.init-bak")
    echo "  변경: $f"
    changed=$((changed + 1))
done
for b in "${backups[@]:-}"; do
    if [ -n "$b" ]; then rm -f "$b"; fi
done
tmps=()

echo "### 결론: 초기화 성공 — 파일 ${changed}개 치환, 잔여 플레이스홀더 0건"
echo "다음 단계: docs/PRD.md 작성부터 시작. scripts/의 초기화 스크립트는 삭제해도 된다."
