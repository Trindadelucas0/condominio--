-- FASE 38: Flags para Fundo de Reserva como conta (entradas/saídas movimentam o saldo)
-- Adiciona reserve_fund_credited em financial_entries e reserve_fund_debited em financial_exits

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'financial_entries' AND column_name = 'reserve_fund_credited') THEN
    ALTER TABLE financial_entries ADD COLUMN reserve_fund_credited BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN financial_entries.reserve_fund_credited IS 'Se true, o valor desta entrada (RECEITAS_FUNDO_RESERVA) já foi creditado no fundo de reserva';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'financial_exits' AND column_name = 'reserve_fund_debited') THEN
    ALTER TABLE financial_exits ADD COLUMN reserve_fund_debited BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN financial_exits.reserve_fund_debited IS 'Se true, o valor desta saída (DESPESAS_FUNDO_RESERVA) já foi debitado do fundo de reserva';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_entries_reserve_fund_credited ON financial_entries(reserve_fund_credited) WHERE reserve_fund_credited = TRUE;
CREATE INDEX IF NOT EXISTS idx_financial_exits_reserve_fund_debited ON financial_exits(reserve_fund_debited) WHERE reserve_fund_debited = TRUE;
