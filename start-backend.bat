@echo off
REM Sistem Informasi Desa Kasomalang Kulon - Windows Startup Script

cls
echo.
echo ========================================================
echo   Sistem Informasi Desa Kasomalang Kulon - Setup Script
echo ========================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    color 4F
    echo.
    echo [ERROR] Node.js tidak ditemukan!
    echo Silakan download dan install Node.js dari: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js terdeteksi: %NODE_VERSION%
echo.

REM Check if npm is installed
where npm >nul 2>nul
if errorlevel 1 (
    color 4F
    echo [ERROR] npm tidak ditemukan!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm terdeteksi: %NPM_VERSION%
echo.

REM Install dependencies
echo [INFO] Installing backend dependencies...
cd backend
call npm install

if errorlevel 1 (
    color 4F
    echo [ERROR] Gagal menginstall dependencies
    pause
    exit /b 1
)

color 2F
echo [OK] Dependencies installed successfully
echo.
cd ..

REM Start backend
echo [INFO] Starting Backend Server...
echo Backend akan berjalan di: http://localhost:3000
echo Tekan Ctrl+C untuk stop server
echo.

cd backend
call npm start
pause
