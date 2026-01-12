#!/bin/bash
echo "Encerrando processos na porta 3000..."
PIDS=$(netstat -ano | grep ":3000" | grep LISTENING | awk '{print $NF}' | sort -u)
if [ -z "$PIDS" ]; then
    echo "Nenhum processo encontrado na porta 3000"
else
    for PID in $PIDS; do
        echo "Processo encontrado: PID $PID"
        cmd.exe //c "taskkill //PID $PID //F"
    done
    sleep 2
    echo "Verificando se a porta 3000 esta livre..."
    netstat -ano | grep ":3000"
    if [ $? -eq 0 ]; then
        echo "A porta 3000 ainda esta em uso."
    else
        echo "Porta 3000 esta livre!"
    fi
fi
