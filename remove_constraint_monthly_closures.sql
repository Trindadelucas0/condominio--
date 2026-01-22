-- Script para remover a constraint de unicidade de monthly_closures
-- Execute este script diretamente no banco de dados PostgreSQL

-- Remove a constraint UNIQUE se existir
ALTER TABLE monthly_closures 
DROP CONSTRAINT IF EXISTS monthly_closures_condominium_id_month_year_key;

-- Verifica se foi removida
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'monthly_closures_condominium_id_month_year_key'
            AND table_name = 'monthly_closures'
        ) THEN 'ERRO: Constraint ainda existe!'
        ELSE 'SUCESSO: Constraint removida! Agora é possível criar múltiplas comandas do mesmo mês.'
    END AS resultado;
