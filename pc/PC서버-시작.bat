@echo off
chcp 65001 >nul
title 가챠 게임 메이커 PC 서버
where python >nul 2>nul
if errorlevel 1 (
  where py >nul 2>nul
  if errorlevel 1 (
    echo Python이 필요해요. https://www.python.org/downloads/ 에서 설치해 주세요.
    echo 설치할 때 "Add python.exe to PATH"에 꼭 체크하세요.
    pause
    exit /b
  )
  py "%~dp0ggm-server.py" %*
) else (
  python "%~dp0ggm-server.py" %*
)
pause
