# run-app.ps1 - Production-grade 1-click launcher for LE SOUVENIR Photobooth V2
$ErrorActionPreference = 'Stop'

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       LE SOUVENIR PHOTOBOOTH V2 - 1-CLICK LAUNCHER" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Environment Setup
$env:V2_JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot"
$env:JAVA_HOME = $env:V2_JAVA_HOME
$env:V2_RUNTIME_MODE = "real"

Write-Host "[1/3] Environment configured:" -ForegroundColor Yellow
Write-Host "      JAVA_HOME:       $env:JAVA_HOME"
Write-Host "      V2_RUNTIME_MODE: $env:V2_RUNTIME_MODE"

if (-not (Test-Path "$env:V2_JAVA_HOME\bin\java.exe")) {
    Write-Error "Java 21 not found at $env:V2_JAVA_HOME\bin\java.exe. Please install Eclipse Adoptium JDK 21."
    exit 1
}

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }
$frontendDir = Join-Path $root "frontend"
$exePath = Join-Path $root "src-tauri\target\debug\le-souvenir-v2.exe"

if (-not (Test-Path $exePath)) {
    Write-Error "Application binary not found at: $exePath"
    exit 1
}

# 2. Check and start Vite dev server on port 1420
Write-Host "`n[2/3] Checking frontend Vite dev server (port 1420)..." -ForegroundColor Yellow
$activeConn = Get-NetTCPConnection -LocalPort 1420 -State Listen -ErrorAction SilentlyContinue

$spawnedVite = $false
$viteProcess = $null

if (-not $activeConn) {
    Write-Host "      Port 1420 is not listening. Launching Vite dev server in background..." -ForegroundColor Gray
    $spawnedVite = $true
    $viteProcess = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c", "npm run dev -- --port 1420 --strictPort" `
        -WorkingDirectory $frontendDir `
        -WindowStyle Hidden `
        -PassThru

    Write-Host "      Waiting for http://127.0.0.1:1420 to respond..." -ForegroundColor Gray
    $ready = $false
    $deadline = (Get-Date).AddSeconds(30)
    while ((Get-Date) -lt $deadline) {
        try {
            $resp = Invoke-WebRequest -Uri "http://127.0.0.1:1420" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($resp.StatusCode -eq 200) {
                $ready = $true
                break
            }
        } catch {
            Start-Sleep -Milliseconds 500
        }
    }

    if (-not $ready) {
        Write-Warning "Vite dev server did not respond with HTTP 200 within 30s. Launching application anyway..."
    } else {
        Write-Host "      Vite dev server is ready and responding (HTTP 200)." -ForegroundColor Green
    }
} else {
    Write-Host "      Vite dev server is already listening on port 1420 (PID: $($activeConn.OwningProcess))." -ForegroundColor Green
}

# 3. Start Tauri Desktop App and wait for exit
Write-Host "`n[3/3] Starting LE SOUVENIR V2 desktop app..." -ForegroundColor Yellow
Write-Host "      $exePath" -ForegroundColor Gray

try {
    $appProcess = Start-Process -FilePath $exePath -WorkingDirectory (Split-Path $exePath) -PassThru
    Write-Host "      App running with PID: $($appProcess.Id). Waiting for exit..." -ForegroundColor Green
    $appProcess.WaitForExit()
    Write-Host "`nApp exited with code: $($appProcess.ExitCode)." -ForegroundColor Yellow
} finally {
    if ($spawnedVite) {
        Write-Host "Cleaning up background Vite process..." -ForegroundColor Gray
        if ($viteProcess -and -not $viteProcess.HasExited) {
            Stop-Process -Id $viteProcess.Id -Force -ErrorAction SilentlyContinue
        }
        $connAfter = Get-NetTCPConnection -LocalPort 1420 -State Listen -ErrorAction SilentlyContinue
        if ($connAfter) {
            Stop-Process -Id $connAfter.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "Launcher finished." -ForegroundColor Cyan
}
