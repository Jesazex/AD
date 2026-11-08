@echo off
setlocal enabledelayedexpansion
title Авторская резьба - Kiosk
chcp 65001 >nul 2>nul

cd /d "%~dp0" || (
    echo [ERROR] Не удалось перейти в папку скрипта.
    pause
    exit /b 1
)

set "NODE="
if exist "%~dp0runtime\node.exe" set "NODE=%~dp0runtime\node.exe"
if not defined NODE if exist "%~dp0node.exe" set "NODE=%~dp0node.exe"
if not defined NODE call :resolve_node

if exist "package.json" (
    if not defined NODE (
        echo [ERROR] Для сборки из исходников нужен Node.js.
        echo Установите Node.js с https://nodejs.org/ и запустите этот файл снова.
        pause
        exit /b 1
    )
    echo Собираю киоск...
    for %%D in ("!NODE!") do set "NODEDIR=%%~dpD"
    if exist "!NODEDIR!npm.cmd" (
        set "NPM=!NODEDIR!npm.cmd"
    ) else (
        set "NPM=npm.cmd"
    )
    if not exist "node_modules" (
        echo Устанавливаю зависимости...
        call "!NPM!" install
        if !ERRORLEVEL! NEQ 0 (
            echo [ERROR] npm install не удался.
            pause
            exit /b !ERRORLEVEL!
        )
    )
    call "!NPM!" run build
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Сборка не удалась.
        pause
        exit /b !ERRORLEVEL!
    )
    echo Сборка готова.
    echo.
) else if not exist "dist\index.html" (
    echo [ERROR] Не найден dist\index.html рядом с этим файлом.
    pause
    exit /b 1
)

if not exist "dist\index.html" (
    echo [ERROR] Не найден dist\index.html рядом с этим файлом.
    pause
    exit /b 1
)

set PORT=4178

:check_port
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Порт %PORT% занят, пробую следующий...
    set /a PORT+=1
    if !PORT! GEQ 4198 (
        echo [ERROR] Не найден свободный порт в диапазоне 4178-4197.
        pause
        exit /b 1
    )
    goto check_port
)

set "URL=http://127.0.0.1:!PORT!"

set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME (
    set "PF86=%ProgramFiles(x86)%"
    if exist "!PF86!\Google\Chrome\Application\chrome.exe" set "CHROME=!PF86!\Google\Chrome\Application\chrome.exe"
)
if not defined CHROME if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined CHROME (
    for /f "tokens=2,*" %%A in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" /ve 2^>nul') do set "CHROME=%%B"
)
if not defined CHROME (
    for /f "tokens=2,*" %%A in ('reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" /ve 2^>nul') do set "CHROME=%%B"
)
if not defined CHROME (
    echo [ERROR] Google Chrome не найден.
    echo Установите Chrome и запустите этот файл снова.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Авторская резьба  -  !URL!
echo ============================================
echo.
echo Chrome откроется в режиме киоска, когда сервер ответит.
echo Закройте это окно, чтобы остановить сервер.
echo.

start "open-kiosk" /min cmd /c "for /l %%I in (1,1,40) do (%SystemRoot%\System32\curl.exe -fsS -o nul --max-time 1 "!URL!" >nul 2>&1 && (start "" "!CHROME!" --kiosk --user-data-dir="%TEMP%\icons-ad-kiosk-profile" --no-first-run --noerrdialogs --disable-session-crashed-bubble --hide-crash-restore-bubble --autoplay-policy=no-user-gesture-required --disable-features=TranslateUI,Translate --check-for-update-interval=31536000 --disable-pinch --overscroll-history-navigation=0 --pull-to-refresh=0 "!URL!" & exit /b 0) & timeout /t 1 /nobreak >nul)"

if defined NODE (
    if exist "%~dp0server.mjs" (
        echo Сервер: !NODE!
        set "PORT=!PORT!"
        "!NODE!" "%~dp0server.mjs"
        exit /b !ERRORLEVEL!
    )
)

echo [ERROR] Node.js не найден. Положите node.exe в папку runtime\ или установите Node.js.
pause
exit /b 1

:resolve_node
for /f "tokens=2*" %%A in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%B"
for /f "tokens=2*" %%A in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USR_PATH=%%B"
if defined SYS_PATH set "PATH=!SYS_PATH!;!PATH!"
if defined USR_PATH set "PATH=!USR_PATH!;!PATH!"
for /f "delims=" %%N in ('where node 2^>nul') do (
    if not defined NODE set "NODE=%%N"
)
if not defined NODE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE=%ProgramFiles(x86)%\nodejs\node.exe"
if not defined NODE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE=%LocalAppData%\Programs\nodejs\node.exe"
if not defined NODE (
    for /f "tokens=2*" %%A in ('reg query "HKLM\SOFTWARE\Node.js" /v InstallPath 2^>nul') do (
        if exist "%%B\node.exe" set "NODE=%%B\node.exe"
    )
)
if not defined NODE (
    for /f "tokens=2*" %%A in ('reg query "HKLM\SOFTWARE\WOW6432Node\Node.js" /v InstallPath 2^>nul') do (
        if exist "%%B\node.exe" set "NODE=%%B\node.exe"
    )
)
if not defined NODE (
    for /f "tokens=2*" %%A in ('reg query "HKCU\SOFTWARE\Node.js" /v InstallPath 2^>nul') do (
        if exist "%%B\node.exe" set "NODE=%%B\node.exe"
    )
)
if not defined NODE (
    for /f "tokens=2,*" %%A in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\node.exe" /ve 2^>nul') do (
        if exist "%%B" set "NODE=%%B"
    )
)
exit /b 0
