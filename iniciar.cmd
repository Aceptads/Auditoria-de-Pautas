@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Auditoria de Pautas
echo.
echo   Abriendo Auditoria de Pautas...
echo.
start "" http://localhost:4321
node servidor.mjs
pause
