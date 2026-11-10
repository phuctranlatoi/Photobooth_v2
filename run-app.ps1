# run-app.ps1 - Production-grade 1-click launcher for LE SOUVENIR Photobooth V2
$ErrorActionPreference = 'Stop'

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       LE SOUVENIR PHOTOBOOTH V2 - 1-CLICK LAUNCHER" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# ----------------------------------------------------------------------------
# 1. Environment Setup + fail-fast preflight (nothing is launched yet)
# ----------------------------------------------------------------------------
$env:V2_JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot"
$env:JAVA_HOME = $env:V2_JAVA_HOME
$env:V2_RUNTIME_MODE = "real"

Write-Host "[1/3] Environment configured:" -ForegroundColor Yellow
Write-Host "      JAVA_HOME:       $env:JAVA_HOME"
Write-Host "      V2_RUNTIME_MODE: $env:V2_RUNTIME_MODE"

if (-not (Test-Path "$env:V2_JAVA_HOME\bin\java.exe")) {
    Write-Host "[ERROR] Java 21 not found at $env:V2_JAVA_HOME\bin\java.exe. Please install Eclipse Adoptium JDK 21." -ForegroundColor Red
    exit 1
}

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }
$frontendDir = Join-Path $root "frontend"
$sidecarCmd = Join-Path $root "backend\build\install\backend\bin\backend.bat"
$exePath = Join-Path $root "src-tauri\target\debug\le-souvenir-v2.exe"
$rustSrcDir = Join-Path $root "src-tauri\src"

# Preflight A: the distributed Kotlin/JVM backend sidecar must exist.
if (-not (Test-Path -LiteralPath $sidecarCmd)) {
    Write-Host "[ERROR] Backend sidecar launcher not found at: $sidecarCmd" -ForegroundColor Red
    Write-Host "        Build the distributed JVM sidecar first:" -ForegroundColor Yellow
    Write-Host "            cd backend && .\gradlew.bat installDist" -ForegroundColor Yellow
    exit 1
}

# Preflight B: the desktop binary must exist AND be at least as new as every Rust source file.
if (-not (Test-Path -LiteralPath $exePath)) {
    Write-Host "[ERROR] Application binary not found at: $exePath" -ForegroundColor Red
    Write-Host "        Build the Tauri desktop shell first:" -ForegroundColor Yellow
    Write-Host "            cargo build --manifest-path src-tauri/Cargo.toml" -ForegroundColor Yellow
    exit 1
}

$exeItem = Get-Item -LiteralPath $exePath
$rustSources = @(Get-ChildItem -LiteralPath $rustSrcDir -Filter *.rs -File -ErrorAction SilentlyContinue)
if ($rustSources.Count -gt 0) {
    $newestSource = ($rustSources | Measure-Object -Property LastWriteTimeUtc -Maximum).Maximum
    if ($exeItem.LastWriteTimeUtc -lt $newestSource) {
        Write-Host "[ERROR] The desktop binary is older than one or more Rust source files in src-tauri\src:" -ForegroundColor Red
        Write-Host "        exe:      $($exeItem.LastWriteTimeUtc.ToString('u'))  ($exePath)" -ForegroundColor Red
        Write-Host "        newest rs: $($newestSource.ToString('u'))" -ForegroundColor Red
        Write-Host "        The running .exe would not match the current sources. Rebuild it:" -ForegroundColor Yellow
        Write-Host "            cargo build --manifest-path src-tauri/Cargo.toml" -ForegroundColor Yellow
        exit 1
    }
}

# ----------------------------------------------------------------------------
# Vite dev-server identity probe
# Ready only when BOTH hold:
#   - HTTP 200 on http://127.0.0.1:1420/ whose body contains "LE SOUVENIR Photobooth"
#   - HTTP 200 on http://127.0.0.1:1420/src/main.tsx
# ----------------------------------------------------------------------------
function Test-V2ViteReady {
    try {
        $index = Invoke-WebRequest -Uri 'http://127.0.0.1:1420/' -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($index.StatusCode -ne 200) { return $false }
        if ($index.Content -notmatch 'LE SOUVENIR Photobooth') { return $false }

        $entry = Invoke-WebRequest -Uri 'http://127.0.0.1:1420/src/main.tsx' -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($entry.StatusCode -ne 200) { return $false }
        return $true
    } catch {
        return $false
    }
}

function Get-ViteListenerPids {
    $conns = @(Get-NetTCPConnection -LocalPort 1420 -State Listen -ErrorAction SilentlyContinue)
    return @($conns | ForEach-Object { $_.OwningProcess } | Where-Object { $_ -and $_ -gt 0 } | Select-Object -Unique)
}

$spawnedVite = $false
$viteProcess = $null
$appProcess = $null

# The try/finally spans Vite startup so that a failed readiness wait still tears
# down the Vite process tree it spawned - and never launches the app anyway.
try {
    # ------------------------------------------------------------------------
    # 2. Check and start Vite dev server on port 1420
    # ------------------------------------------------------------------------
    Write-Host "`n[2/3] Checking frontend Vite dev server (port 1420)..." -ForegroundColor Yellow
    $listenerPids = Get-ViteListenerPids

    if ($listenerPids.Count -gt 0) {
        Write-Host "      Port 1420 is already listening (PID: $($listenerPids -join ', ')). Verifying it is the LE SOUVENIR V2 Vite dev server..." -ForegroundColor Gray
        if (-not (Test-V2ViteReady)) {
            Write-Host "[ERROR] Port 1420 is occupied by another process (not LE SOUVENIR V2 Vite dev server)." -ForegroundColor Red
            Write-Host "        The SPA probe (HTTP 200 + 'LE SOUVENIR Photobooth' on /) and the module probe" -ForegroundColor Red
            Write-Host "        (HTTP 200 on /src/main.tsx) did not both pass, so the app was NOT launched." -ForegroundColor Red
            Write-Host "        Stop the process holding port 1420 and run this launcher again." -ForegroundColor Yellow
            exit 1
        }
        Write-Host "      Verification passed: SPA index and /src/main.tsx both HTTP 200. Reusing it." -ForegroundColor Green
    } else {
        Write-Host "      Port 1420 is not listening. Launching Vite dev server in background..." -ForegroundColor Gray
        $spawnedVite = $true
        $viteProcess = Start-Process -FilePath "cmd.exe" `
            -ArgumentList "/c", "npm run dev -- --port 1420 --strictPort" `
            -WorkingDirectory $frontendDir `
            -WindowStyle Hidden `
            -PassThru

        Write-Host "      Waiting up to 30s for Vite at http://127.0.0.1:1420 to become ready..." -ForegroundColor Gray
        $ready = $false
        $deadline = (Get-Date).AddSeconds(30)
        while ((Get-Date) -lt $deadline) {
            if (Test-V2ViteReady) {
                $ready = $true
                break
            }
            Start-Sleep -Milliseconds 500
        }

        if (-not $ready) {
            Write-Host "[ERROR] Vite dev server did not become ready within 30 seconds." -ForegroundColor Red
            Write-Host "        Expected HTTP 200 on http://127.0.0.1:1420/ containing 'LE SOUVENIR Photobooth'" -ForegroundColor Red
            Write-Host "        and HTTP 200 on http://127.0.0.1:1420/src/main.tsx." -ForegroundColor Red
            Write-Host "        The app was NOT launched. Check 'npm run dev' output in frontend\. The spawned" -ForegroundColor Yellow
            Write-Host "        Vite process tree is being cleaned up now." -ForegroundColor Yellow
            exit 1
        }
        Write-Host "      Vite dev server is ready: SPA index and /src/main.tsx both HTTP 200." -ForegroundColor Green
    }

    # ------------------------------------------------------------------------
    # 3. Start Tauri Desktop App and wait for exit
    # ------------------------------------------------------------------------
    Write-Host "`n[3/3] Starting LE SOUVENIR V2 desktop app..." -ForegroundColor Yellow
    Write-Host "      $exePath" -ForegroundColor Gray

    $appProcess = Start-Process -FilePath $exePath -WorkingDirectory $root -PassThru
    Write-Host "      App running with PID: $($appProcess.Id). Waiting for exit..." -ForegroundColor Green
    $appProcess.WaitForExit()
    Write-Host "`nApp exited with code: $($appProcess.ExitCode)." -ForegroundColor Yellow
} finally {
    if ($spawnedVite) {
        Write-Host "Cleaning up background Vite process tree..." -ForegroundColor Gray
        if ($viteProcess -and -not $viteProcess.HasExited) {
            & taskkill.exe /PID $viteProcess.Id /T /F 2>$null | Out-Null
        }
        foreach ($pid1420 in (Get-ViteListenerPids)) {
            & taskkill.exe /PID $pid1420 /T /F 2>$null | Out-Null
        }
    }
    Write-Host "Launcher finished." -ForegroundColor Cyan
}
