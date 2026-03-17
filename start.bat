@echo off

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed.
    echo.
    echo Downloading Node.js installer...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi' -OutFile '%TEMP%\node-installer.msi'"
    if %errorlevel% neq 0 (
        echo Failed to download. Please install Node.js manually from https://nodejs.org
        pause
        exit /b 1
    )
    echo Running Node.js installer...
    msiexec /i "%TEMP%\node-installer.msi" /passive
    del "%TEMP%\node-installer.msi"
    echo.
    echo Node.js installed. Please close this window and run start.bat again.
    pause
    exit /b 0
)

echo Pulling latest changes...
git pull || echo WARNING: git pull failed, continuing with local version...
echo.

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

if not exist .env (
    copy .env.example .env
    echo.
    echo Created .env from .env.example.
    echo Please edit .env and set your GROUP_INVITE_CODE before continuing.
    echo.
    pause
    exit /b 0
)

echo Starting bot...
node src/index.js
pause
