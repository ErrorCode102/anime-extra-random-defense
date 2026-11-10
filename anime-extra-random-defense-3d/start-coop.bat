@echo off
title Anime Extra Random Defence - Co-op Server
color 0B

echo.
echo  =========================================
echo   Anime Extra Random Defence - Co-op
echo  =========================================
echo.

:: Start game server in background
start "Game Server" cmd /c "node server.js 8765 & pause"

:: Wait for server to start
timeout /t 2 /nobreak >nul

:: Try cloudflared for HTTPS tunnel (needed for Vercel)
where cloudflared >nul 2>&1
if %errorlevel%==0 (
    echo [+] Starting Cloudflare Tunnel ^(for Vercel/HTTPS^)...
    echo.
    cloudflared tunnel --url http://localhost:8765
    goto :done
)

:: Try ngrok
where ngrok >nul 2>&1
if %errorlevel%==0 (
    echo [+] Starting ngrok tunnel ^(for Vercel/HTTPS^)...
    echo.
    ngrok http 8765
    goto :done
)

:: No tunnel tool found - local play only
echo.
echo  [!] No tunnel tool found.
echo.
echo  For LOCAL play ^(same network^):
echo    Share your IP address with friends
echo    They open: http://[YOUR-IP]:8765
echo.
echo  For INTERNET play:
echo    Download cloudflared.exe from:
echo    https://github.com/cloudflare/cloudflared/releases/latest
echo    Put cloudflared.exe next to this file, then run again.
echo.
echo  Press any key to open http://localhost:8765 ...
pause >nul
start http://localhost:8765

:done
pause
