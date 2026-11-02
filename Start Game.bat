@echo off
setlocal
title The Labyrinth of Catlantis
cd /d "%~dp0"

echo ============================================
echo   The Labyrinth of Catlantis
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js was not found on PATH.
    echo Install Node.js from https://nodejs.org and try again.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo ERROR: npm was not found on PATH.
    echo Reinstall Node.js from https://nodejs.org and try again.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\react-scripts\package.json" (
    echo Dependencies are missing. Running npm install...
    echo This can take a few minutes the first time.
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: npm install failed. See the messages above.
        pause
        exit /b 1
    )
)

echo Starting the development server...
echo The game should open automatically in your browser.
echo If it does not, use the URL printed by the dev server below.
echo Press Ctrl+C in this window to stop the server.
echo.
call npm start

echo.
echo The server has stopped.
pause
endlocal
