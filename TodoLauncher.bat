@echo off
setlocal
set "FILE_PATH=%~dp0index.html"

echo To-do List를 실행하는 중...

:: Try to launch with Chrome in app mode (standalone window)
where chrome >nul 2>&1
if %errorlevel% equ 0 (
    start chrome --app="file:///%FILE_PATH%"
    exit
)

:: Try to launch with Microsoft Edge in app mode (standalone window)
where msedge >nul 2>&1
if %errorlevel% equ 0 (
    start msedge --app="file:///%FILE_PATH%"
    exit
)

:: Fallback to default browser if app mode is not possible
start "" "file:///%FILE_PATH%"
exit
