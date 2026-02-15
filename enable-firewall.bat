@echo off
echo ================================
echo HealthQueue Firewall Setup
echo ================================
echo.
echo Adding firewall rule for port 8080...
echo.

netsh advfirewall firewall add rule name="HealthQueue Port 8080" dir=in action=allow protocol=TCP localport=8080

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Firewall rule added.
    echo.
    echo Your Smart TV can now access:
    echo http://192.168.1.8:8080/tv
    echo.
) else (
    echo.
    echo FAILED! You need to run this as Administrator.
    echo.
    echo Right-click enable-firewall.bat and select "Run as administrator"
    echo.
)

echo.
pause
