@echo off

title PiacTer Szerver Indito

echo.
echo =================================
echo  PiacTer Szerver inditasa...
echo =================================
echo.



start "PiacTer Szerver" node server.js



timeout /t 2 /nobreak >nul


echo Projekt megnyitasa a bongeszoben: http://localhost:3000
start http://localhost:3000


echo.
echo A folyamat elindult. Ez az ablak bezarhato.
echo.
exit
