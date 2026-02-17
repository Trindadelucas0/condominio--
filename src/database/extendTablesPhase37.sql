-- FASE 37: Controle de notificação de contas vencidas (payable_items)
-- Coluna overdue_notified_at: marca quando o item vencido foi notificado para evitar duplicatas

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payable_items' AND column_name = 'overdue_notified_at') THEN
    ALTER TABLE payable_items ADD COLUMN overdue_notified_at TIMESTAMP NULL;
  END IF;
END $$;

COMMENT ON COLUMN payable_items.overdue_notified_at IS 'Data/hora em que foi enviada notificação de vencimento para a role FINANCEIRO; evita notificar múltiplas vezes o mesmo item.';
