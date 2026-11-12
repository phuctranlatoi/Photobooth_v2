# LE SOUVENIR Photobooth V2 — repair Orchestrator delegation in OpenCode V2.
# Changes ONLY .opencode/agents/orchestrator.md, after backing it up.
# Does NOT edit opencode.json, source code, V1, .env, Git history, or remote.
# PowerShell 5.1+; run from E:\HK1_2026_2027\PhotoboothDesktop_v2
param([switch]$Preview)
$ErrorActionPreference = 'Stop'

$project = (Get-Location).Path
$pathJson = Join-Path $project 'opencode.json'
$pathMd = Join-Path $project '.opencode\agents\orchestrator.md'
if (-not (Test-Path -LiteralPath $pathJson)) { throw "Missing opencode.json in $project" }
if (-not (Test-Path -LiteralPath $pathMd)) { throw "Missing .opencode/agents/orchestrator.md. No changes made. Need inspect how Orchestrator is defined." }

$config = Get-Content -LiteralPath $pathJson -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $config.agents.orchestrator -or -not $config.agents.'visual-reviewer') {
    throw 'orchestrator or visual-reviewer not declared in opencode.json. No changes made.'
}
$jsonAllow = @($config.agents.orchestrator.permissions | Where-Object {
    $_.action -eq 'subagent' -and $_.resource -eq 'visual-reviewer' -and $_.effect -eq 'allow'
})
if ($jsonAllow.Count -eq 0) { throw 'Missing visual-reviewer allow in JSON orchestrator permissions. No changes made.' }

$old = [System.IO.File]::ReadAllText($pathMd)
$fm = [regex]::Match($old, '\A(?:\uFEFF)?---\r?\n(?<front>[\s\S]*?)\r?\n---(?=\r?\n|\z)')
if (-not $fm.Success) { throw 'Invalid YAML frontmatter in orchestrator.md; no changes made.' }
$front = $fm.Groups['front'].Value
if (-not [regex]::IsMatch($front, '(?m)^permissions:[ \t]*$')) {
    throw 'No YAML permissions: section in orchestrator.md; no changes made.'
}

$pattern = '(?m)^(?<item>[ \t]*)-[ \t]+action:[ \t]*subagent[ \t]*\r?\n(?<field>[ \t]+)resource:[ \t]*(?<resource>[^\r\n]+)\r?\n[ \t]+effect:[ \t]*(?<effect>allow|deny|ask)[ \t]*(?=\r?\n|\z)'
$rules = [regex]::Matches($front, $pattern)
if ($rules.Count -eq 0) { throw 'No 3-line subagent permission rule in orchestrator.md frontmatter; no changes made.' }

$last = $rules[$rules.Count - 1]
$lastResource = $last.Groups['resource'].Value.Trim()
$lastEffect = $last.Groups['effect'].Value
$newline = if ($old.Contains("`r`n")) { "`r`n" } else { "`n" }
$updated = $old
$addedAllow = $false
if (-not ($lastResource -eq 'visual-reviewer' -and $lastEffect -eq 'allow')) {
    $itemIndent = $last.Groups['item'].Value
    $fieldIndent = $last.Groups['field'].Value
    $insertion = $newline + $itemIndent + '- action: subagent' + $newline +
                 $fieldIndent + 'resource: visual-reviewer' + $newline +
                 $fieldIndent + 'effect: allow'
    $insertAt = $fm.Groups['front'].Index + $last.Index + $last.Length
    $updated = $updated.Insert($insertAt, $insertion)
    $addedAllow = $true
}

$markerBegin = '<!-- LS_ORCHESTRATOR_ROUTING_V2_BEGIN -->'
$markerEnd = '<!-- LS_ORCHESTRATOR_ROUTING_V2_END -->'
$addedPolicy = $false
if (-not $updated.Contains($markerBegin)) {
$policy = @'
<!-- LS_ORCHESTRATOR_ROUTING_V2_BEGIN -->
## LE SOUVENIR V2 — delegation and recovery policy

Orchestrator is a coordinator, not an implementer. For implementation work, invoke the real specialist subagent tool. Never pretend to have delegated. Never edit code directly or bypass explicit permissions.

1. Before any implementation, examine the current Git status. If changes are already present, do not reset, discard, force-push, stage everything, or commit changes you do not own. First identify and safely commit only previously verified work with a descriptive message when appropriate and permitted. Never commit .env or credentials. V1 at E:\HK1_2026_2027\PhotoboothDesktop is read-only.
2. Classify each request. For visual/UI requests: use `ui-designer` to plan (if needed), `frontend-coder` to implement, `tester-reviewer` to run safe tests and capture UI screenshots, then `visual-reviewer` to inspect the ACTUAL screenshots. For non-UI requests, use relevant `architect`, `backend-engineer`, `camera-engineer`, `printer-engineer`, or `legacy-auditor` as appropriate. Do not invoke all specialists without a task-specific need.
3. `visual-reviewer` is registered as a read-only subagent. Call it by the exact ID `visual-reviewer` with the child-agent tool. Do not infer an agent is absent based on AGENTS.md's incomplete inventory or because a permission call failed; actual registration and permission status must be checked separately.
4. Only describe work as completed if the tool produced a real result. Visual review requires screenshots that the reviewer actually opened, ideally at 1280x800 and 1920x1200. No screenshot means 'not visually verified'.
5. When a child-agent call fails, report its exact error (permission, model, provider, timeout, or unsupported tool), distinguish it from agent registration, and continue other independent safe subtasks. Do not invent a child result, ignore a failed call, abandon the whole user request, or unilaterally switch to an unrelated agent. If essential verification is blocked, say what is blocked and what remains unverified.
6. Preserve workflows: photo selection/order/slot mapping, configurable countdown and shots, touch UX, camera/print/payment/database boundaries. Do not mutate production payment, Neon, printer, Cloudinary, or camera without explicit authorization. Preserve V1 unchanged.
7. For each task, report a short role-based plan, actual specialist calls and results, changed files, tests run, failures and next safe action. Never declare PASS from reasoning alone.
<!-- LS_ORCHESTRATOR_ROUTING_V2_END -->
'@
    $updated = $updated.TrimEnd([char[]]@([char]13, [char]10)) + $newline + $newline + $policy.TrimEnd([char[]]@([char]13, [char]10)) + $newline
    $addedPolicy = $true
}

if (-not $addedAllow -and -not $addedPolicy) {
    Write-Host 'Already configured: last Markdown subagent rule allows visual-reviewer and routing policy exists. No changes.' -ForegroundColor Green
    exit 0
}

Write-Host "Project: $project"
Write-Host "Changes: add final visual allow = $addedAllow; add delegation policy = $addedPolicy"
if ($Preview) {
    Write-Host 'Preview only. No file changed.' -ForegroundColor Cyan
    exit 0
}

$backupDir = Join-Path $env:TEMP 'lesouvenir-opencode-backups'
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$backupPath = Join-Path $backupDir ('orchestrator.md.' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.bak')
Copy-Item -LiteralPath $pathMd -Destination $backupPath -ErrorAction Stop
[System.IO.File]::WriteAllText($pathMd, $updated, ([System.Text.UTF8Encoding]::new($false)))
Write-Host "Saved: $pathMd" -ForegroundColor Green
Write-Host "Backup: $backupPath"
Write-Host 'Close OpenCode completely. Start a NEW session. Validate with opencode debug agents.'
