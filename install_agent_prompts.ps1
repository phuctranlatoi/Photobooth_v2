# LE SOUVENIR V2 - Upgrade the content of all existing OpenCode agents.
# IMPORTANT: This updates ONLY the Markdown BODY of existing files, preserving
# current YAML frontmatter (including model assignments, permissions and modes).
# NEVER accesses/modifies the legacy V1 project.
$ErrorActionPreference = 'Stop'
$project = 'E:\HK1_2026_2027\PhotoboothDesktop_v2'
$agentDir = Join-Path $project '.opencode\agents'
$templateDir = Join-Path $project 'agent_templates'
$names = @(
 'orchestrator','legacy-auditor','architect','ui-designer',
 'frontend-coder','camera-engineer','printer-engineer',
 'backend-engineer','tester-reviewer'
)

if (-not (Test-Path -LiteralPath $agentDir -PathType Container)) {
  throw "Missing agent directory: $agentDir"
}
if (-not (Test-Path -LiteralPath $templateDir -PathType Container)) {
  throw "Missing templates: $templateDir. Extract the ZIP into V2 first."
}

# Validate all sources and destinations before creating backups or changing files.
$validated = @()
foreach ($name in $names) {
  $target = Join-Path $agentDir ($name + '.md')
  $source = Join-Path $templateDir ($name + '.md')
  if (-not (Test-Path -LiteralPath $target -PathType Leaf)) { throw "Missing existing agent: $target" }
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing agent template: $source" }
  $existing = [System.IO.File]::ReadAllText($target)
  $template = [System.IO.File]::ReadAllText($source)
  $regex = New-Object System.Text.RegularExpressions.Regex('(?s)\A---\r?\n.*?\r?\n---\r?\n')
  $oldMatch = $regex.Match($existing)
  $newMatch = $regex.Match($template)
  if (-not $oldMatch.Success) { throw "Invalid YAML frontmatter (existing): $target" }
  if (-not $newMatch.Success) { throw "Invalid YAML frontmatter (template): $source" }
  if ($template.Length -le $newMatch.Length) { throw "Empty agent prompt: $source" }
  $validated += [pscustomobject]@{
    Name = $name; Target = $target; Old = $existing
    NewText = $existing.Substring(0, $oldMatch.Length) + $template.Substring($newMatch.Length)
  }
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = Join-Path $project ('agent-prompts-backup-' + $stamp)
New-Item -ItemType Directory -Path $backup | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding($false)
foreach ($item in $validated) {
  Copy-Item -LiteralPath $item.Target -Destination (Join-Path $backup ($item.Name + '.md'))
}
foreach ($item in $validated) {
  [System.IO.File]::WriteAllText($item.Target, $item.NewText, $utf8)
  Write-Host ("Updated agent prompt: " + $item.Name) -ForegroundColor Green
}
Write-Host "`nCompleted: 9 agents. Existing model IDs and permissions were preserved." -ForegroundColor Cyan
Write-Host ("Backup: " + $backup)
Write-Host 'Legacy V1 was not accessed or changed by this script.'
Write-Host 'Restart OpenCode and run: opencode agent list'
