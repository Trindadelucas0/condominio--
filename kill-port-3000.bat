@echo off
echo Encerrando processos na porta 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Processo encontrado: PID %%a
    taskkill /PID %%a /F
)
echo Verificando se a porta 3000 esta livre...
timeout /t 2 /nobreak >nul
netstat -ano | findstr :3000
if %errorlevel% equ 0 (
    echo A porta 3000 ainda esta em uso. Tente novamente.
) else (
    echo Porta 3000 esta livre!
)
pause
