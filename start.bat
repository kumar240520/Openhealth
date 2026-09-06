@echo off
title OpenHealth Full-Stack Development Server
echo =================================================================
echo   OpenHealth Unified Full-Stack Server
echo =================================================================
echo   Starting Backend (port 5000) and Frontend (port 3000)...
echo =================================================================
node "%~dp0start-dev.js"
pause
