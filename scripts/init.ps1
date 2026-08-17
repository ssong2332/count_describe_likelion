# init.ps1 — 템플릿에서 새 프로젝트 생성 직후 1회 실행
# 사용법: powershell -ExecutionPolicy Bypass -File scripts/init.ps1 -ProjectName "프로젝트명"
# 동작: README.md와 docs/ 전체에서 {{PROJECT_NAME}}, {{DATE}} 치환 후 잔여 플레이스홀더 0건인지 자체 검증

param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectName
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$today = Get-Date -Format "yyyy-MM-dd"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$targets = @(Join-Path $root "README.md")
$targets += Get-ChildItem -Path (Join-Path $root "docs") -Filter "*.md" -Recurse | ForEach-Object { $_.FullName }

$changed = @()
foreach ($file in $targets) {
    $text = [System.IO.File]::ReadAllText($file)
    $new = $text.Replace("{{PROJECT_NAME}}", $ProjectName).Replace("{{DATE}}", $today)
    if ($new -ne $text) {
        [System.IO.File]::WriteAllText($file, $new, $utf8NoBom)
        $changed += $file
    }
}

# 자체 검증: 잔여 플레이스홀더가 있으면 실패로 보고
$leftover = @()
foreach ($file in $targets) {
    if ([System.IO.File]::ReadAllText($file) -match "\{\{(PROJECT_NAME|DATE)\}\}") {
        $leftover += $file
    }
}

Write-Host "### 결론: 치환 완료 — 파일 $($changed.Count)개 변경, 잔여 플레이스홀더 $($leftover.Count)건"
foreach ($f in $changed) { Write-Host "  변경: $f" }
if ($leftover.Count -gt 0) {
    foreach ($f in $leftover) { Write-Host "  잔여: $f" }
    exit 1
}
Write-Host "다음 단계: docs/PRD.md 작성부터 시작. 이 스크립트(scripts/init.ps1)는 삭제해도 된다."
