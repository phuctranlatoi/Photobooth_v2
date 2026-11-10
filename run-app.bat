@echo off
setlocal enabledelayedexpansion

title LE SOUVENIR V2 - Photobooth Desktop Launcher

cd /d "%~dp0"

echo ========================================================
echo        LE SOUVENIR PHOTOBOOTH V2 - 1-CLICK LAUNCHER
echo ========================================================

:: ============================================================
:: 1. Environment + fail-fast preflight (nothing is launched yet)
:: ============================================================
set "V2_JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot"
set "JAVA_HOME=%V2_JAVA_HOME%"
set "V2_RUNTIME_MODE=real"

echo [1/3] Environment configured:
echo       JAVA_HOME:       %JAVA_HOME%
echo       V2_RUNTIME_MODE: %V2_RUNTIME_MODE%

if not exist "%V2_JAVA_HOME%\bin\java.exe" (
    echo [ERROR] Java 21 not found at: "%V2_JAVA_HOME%"
    echo Please verify Eclipse Adoptium JDK 21 installation.
    if not defined V2_NO_PAUSE pause
    exit /b 1
)

:: --- Preflight A: distributed Kotlin/JVM backend sidecar must exist ---
set "SIDECAR_CMD=%~dp0backend\build\install\backend\bin\backend.bat"
if not exist "%SIDECAR_CMD%" goto :err_sidecar_missing

:: --- Preflight B: desktop binary must exist AND be newer than every Rust source file ---
set "EXE_PATH=%~dp0src-tauri\target\debug\le-souvenir-v2.exe"
call :check_exe_freshness
if "!EXE_STATE!"=="missing" goto :err_exe_missing
if "!EXE_STATE!"=="stale" goto :err_exe_stale

:: ============================================================
:: 2. Vite dev server detection + readiness verification
:: ============================================================
echo.
echo [2/3] Checking frontend Vite dev server on port 1420...
set "SPAWNED_VITE=0"
set "VITE_LISTENING=0"

:: Only an actual LISTENING socket counts - never TIME_WAIT / ESTABLISHED / :14200.
netstat -ano | findstr /R /C:":1420 .*LISTENING" >nul 2>&1
if not errorlevel 1 set "VITE_LISTENING=1"

if "!VITE_LISTENING!"=="1" goto :vite_existing
goto :vite_spawn

:vite_existing
echo       Port 1420 is already listening. Verifying it is the LE SOUVENIR V2 Vite dev server...
call :probe_vite 0
if errorlevel 1 goto :err_foreign_server
echo       Verification passed: SPA index and /src/main.tsx both HTTP 200. Reusing it.
goto :launch_app

:vite_spawn
echo       Port 1420 is not listening. Launching Vite dev server in background...
set "SPAWNED_VITE=1"
start "Vite Dev Server" /B /MIN cmd /c "cd /d "%~dp0frontend" && npm run dev -- --port 1420 --strictPort"
echo       Waiting up to 30s for http://127.0.0.1:1420 to become ready...
:: Bounded wait runs inside ONE PowerShell process: spawning a new powershell per poll
:: iteration costs ~3s here, which turned a 30s budget into ~184s (measured).
call :probe_vite 30
if errorlevel 1 goto :err_vite_timeout
echo       Vite dev server is ready: SPA index and /src/main.tsx both HTTP 200.
goto :launch_app

:: ============================================================
:: 3. Launch desktop app
:: ============================================================
:launch_app
echo.
echo [3/3] Launching LE SOUVENIR V2 desktop app...
echo       %EXE_PATH%
echo       (Closing the app window will return here)
echo.

"%EXE_PATH%"

:: ============================================================
:: 4. On app exit, clean up Vite dev server if spawned by this script
:: ============================================================
echo.
echo Application closed.
if "%SPAWNED_VITE%"=="1" (
    echo Cleaning up background Vite dev server on port 1420...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":1420 .*LISTENING"') do (
        taskkill /F /T /PID %%a >nul 2>&1
    )
)

echo Done.
exit /b 0

:: ============================================================
:: Helpers
:: ============================================================

:: Sets EXE_STATE to ok | stale | missing.
::   exit 3 => binary missing, exit 2 (or any other failure) => stale/failed, exit 0 => ok.
:check_exe_freshness
set "EXE_STATE=ok"
powershell -NoProfile -Command "$ErrorActionPreference = 'Stop'; $exePath = '%~dp0src-tauri\target\debug\le-souvenir-v2.exe'; if (-not (Test-Path -LiteralPath $exePath)) { exit 3 }; $exe = Get-Item -LiteralPath $exePath; $srcDir = '%~dp0src-tauri\src'; $newest = [datetime]::MinValue; if (Test-Path -LiteralPath $srcDir) { foreach ($f in @(Get-ChildItem -LiteralPath $srcDir -Filter '*.rs' -File -ErrorAction SilentlyContinue)) { if ($f.LastWriteTimeUtc -gt $newest) { $newest = $f.LastWriteTimeUtc } } }; if ($newest -ne [datetime]::MinValue -and $exe.LastWriteTimeUtc -lt $newest) { exit 2 }; exit 0" >nul 2>&1
if errorlevel 3 goto :cef_missing
if errorlevel 1 goto :cef_stale
exit /b 0

:cef_missing
set "EXE_STATE=missing"
exit /b 0

:cef_stale
set "EXE_STATE=stale"
exit /b 0

:: Verifies that port 1420 serves the V2 Vite dev server:
::   HTTP 200 on "/" AND body contains "LE SOUVENIR Photobooth", plus HTTP 200 on "/src/main.tsx".
:: %1 = seconds to keep retrying after the first probe (0 = probe exactly once).
:: Returns errorlevel 0 when ready, 1 otherwise. Never uses `timeout` (fails with redirected stdin).
:probe_vite
powershell -NoProfile -Command "$limit = %~1; $deadline = (Get-Date).AddSeconds($limit); $ok = $false; do { try { $index = Invoke-WebRequest -Uri 'http://127.0.0.1:1420/' -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop; if ($index.StatusCode -eq 200 -and $index.Content -match 'LE SOUVENIR Photobooth') { $entry = Invoke-WebRequest -Uri 'http://127.0.0.1:1420/src/main.tsx' -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop; if ($entry.StatusCode -eq 200) { $ok = $true } } } catch { $ok = $false }; if ($ok) { break }; if ((Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 400 } } while ((Get-Date) -lt $deadline); if ($ok) { exit 0 } else { exit 1 }" >nul 2>&1
if errorlevel 1 exit /b 1
exit /b 0

:: ============================================================
:: Error exits (fail fast, never launch against a broken setup)
:: ============================================================

:err_sidecar_missing
echo.
echo [ERROR] Backend sidecar launcher not found at:
echo         %SIDECAR_CMD%
echo.
echo         Build the distributed JVM sidecar first:
echo             cd backend ^&^& .\gradlew.bat installDist
echo.
if not defined V2_NO_PAUSE pause
exit /b 1

:err_exe_missing
echo.
echo [ERROR] Application binary not found at:
echo         %EXE_PATH%
echo.
echo         Build the Tauri desktop shell first:
echo             cargo build --manifest-path src-tauri/Cargo.toml
echo.
if not defined V2_NO_PAUSE pause
exit /b 1

:err_exe_stale
echo.
echo [ERROR] The desktop binary is older than one or more Rust source files in src-tauri\src:
echo         %EXE_PATH%
echo.
echo         The running .exe would not match the current sources. Rebuild it:
echo             cargo build --manifest-path src-tauri/Cargo.toml
echo.
if not defined V2_NO_PAUSE pause
exit /b 1

:err_foreign_server
echo.
echo [ERROR] Port 1420 is occupied by another process (not LE SOUVENIR V2 Vite dev server).
echo         The SPA probe (HTTP 200 + "LE SOUVENIR Photobooth" on /) and the module probe
echo         (HTTP 200 on /src/main.tsx) did not both pass, so the app was NOT launched.
echo         Stop the process holding port 1420 and run this launcher again.
echo.
if not defined V2_NO_PAUSE pause
exit /b 1

:err_vite_timeout
echo.
echo [ERROR] Vite dev server did not become ready within 30 seconds.
echo         Expected HTTP 200 on http://127.0.0.1:1420/ containing "LE SOUVENIR Photobooth"
echo         and HTTP 200 on http://127.0.0.1:1420/src/main.tsx.
echo         The app was NOT launched. Check "npm run dev" output in frontend\.
echo         Cleaning up the half-started Vite process tree...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":1420 .*LISTENING"') do (
    taskkill /F /T /PID %%a >nul 2>&1
)
echo.
if not defined V2_NO_PAUSE pause
exit /b 1
