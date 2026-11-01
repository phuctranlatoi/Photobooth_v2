@echo off
setlocal enabledelayedexpansion

title LE SOUVENIR V2 - Photobooth Desktop Launcher

cd /d "%~dp0"

echo ========================================================
echo        LE SOUVENIR PHOTOBOOTH V2 - 1-CLICK LAUNCHER
echo ========================================================

:: 1. Setup Java 21 environment
set "V2_JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot"
set "JAVA_HOME=%V2_JAVA_HOME%"
set "V2_RUNTIME_MODE=real"

echo [1/3] Environment configured:
echo       JAVA_HOME:       %JAVA_HOME%
echo       V2_RUNTIME_MODE: %V2_RUNTIME_MODE%

if not exist "%V2_JAVA_HOME%\bin\java.exe" (
    echo [ERROR] Java 21 not found at: "%V2_JAVA_HOME%"
    echo Please verify Eclipse Adoptium JDK 21 installation.
    pause
    exit /b 1
)

set "EXE_PATH=%~dp0src-tauri\target\debug\le-souvenir-v2.exe"
if not exist "%EXE_PATH%" (
    echo [ERROR] Application binary not found at: "%EXE_PATH%"
    pause
    exit /b 1
)

:: 2. Check if Vite dev server is already running on port 1420
echo.
echo [2/3] Checking frontend Vite dev server on port 1420...
set "SPAWNED_VITE=0"
netstat -ano | findstr :1420 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo       Port 1420 is not running. Launching Vite dev server in background...
    set "SPAWNED_VITE=1"
    start "Vite Dev Server" /B /MIN cmd /c "cd /d "%~dp0frontend" && npm run dev -- --port 1420 --strictPort"
    echo       Waiting 3 seconds for Vite to initialize...
    timeout /t 3 /nobreak >nul
) else (
    echo       Vite dev server is already running on port 1420.
)

:: 3. Launch desktop app
echo.
echo [3/3] Launching LE SOUVENIR V2 desktop app...
echo       %EXE_PATH%
echo       (Closing the app window will return here)
echo.

"%EXE_PATH%"

:: 4. On app exit, clean up Vite dev server if spawned by this script
echo.
echo Application closed.
if "%SPAWNED_VITE%"=="1" (
    echo Cleaning up background Vite dev server on port 1420...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :1420 ^| findstr LISTENING') do (
        taskkill /F /T /PID %%a >nul 2>&1
    )
)

echo Done.
