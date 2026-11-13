@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "REPORT=%~dp0MIRRORWORK-QA-RESULTS.txt"
> "%REPORT%" echo MIRRORWORK - REAL OFFLINE BROWSER QA
>> "%REPORT%" echo Run date: %DATE% %TIME%
>> "%REPORT%" echo No GitHub Actions, merge, deployment or game-data changes.
where node >nul 2>&1
if errorlevel 1 goto :no_node
where npm >nul 2>&1
if errorlevel 1 goto :no_npm
echo Installing browser test software...
call npm install --no-save --no-package-lock --no-audit --no-fund playwright@1.56.1 >> "%REPORT%" 2>&1
if errorlevel 1 goto :fail
echo Installing local Chromium...
call npx playwright install chromium >> "%REPORT%" 2>&1
if errorlevel 1 goto :fail
echo Testing MIRRORWORK...
node tools\qa-browser.js >> "%REPORT%" 2>&1
if errorlevel 1 goto :fail
>> "%REPORT%" echo RESULT: ALL AUTOMATED QA STAGES PASSED.
echo PASS - upload MIRRORWORK-QA-RESULTS.txt to ChatGPT.
pause
exit /b 0
:no_node
>> "%REPORT%" echo FAIL: Node.js is not installed.
goto :fail
:no_npm
>> "%REPORT%" echo FAIL: npm is not installed.
:fail
>> "%REPORT%" echo RESULT: FAIL. See errors above.
echo FAIL - upload MIRRORWORK-QA-RESULTS.txt to ChatGPT.
pause
exit /b 1
