# Starts ONLY the existing V2 Vite frontend in a separate Windows process.
# It does not execute camera, printer, payment, database, or Tauri native commands.
$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
if ((Split-Path -Leaf $project) -ne 'PhotoboothDesktop_v2') { throw 'Expected V2 project.' }
$frontend = Join-Path $project 'frontend'
$package = Join-Path $frontend 'package.json'
if (-not (Test-Path -LiteralPath $package)) { throw "Missing $package" }
$pkg = Get-Content -LiteralPath $package -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $pkg.scripts.dev) { throw 'frontend/package.json has no dev script; inspect the actual startup flow.' }
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'npm.cmd is missing; install Node.js and run npm install in frontend with approval.' }
$folder = Join-Path $project 'artifacts\ui-qa'
New-Item -ItemType Directory -Path $folder -Force | Out-Null
$out = Join-Path $folder 'vite-stdout.log'
$err = Join-Path $folder 'vite-stderr.log'
$process = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/d','/s','/c','npm run dev') -WorkingDirectory $frontend -RedirectStandardOutput $out -RedirectStandardError $err -PassThru -WindowStyle Hidden
Write-Host "Started npm run dev PID=$($process.Id)" -ForegroundColor Green
Write-Host "stdout=$out"
Write-Host "stderr=$err"
Start-Sleep -Seconds 3
if (Test-Path -LiteralPath $out) { Get-Content -LiteralPath $out -Tail 20 }
if (Test-Path -LiteralPath $err) { Get-Content -LiteralPath $err -Tail 20 }
Write-Host 'Inspect the actual ready URL in stdout; do not assume it is localhost:1420.'
