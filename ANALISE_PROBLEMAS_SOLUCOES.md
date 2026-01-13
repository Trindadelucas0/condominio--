# 🔍 ANÁLISE DE PROBLEMAS E SOLUÇÕES PROPOSTAS

Este documento analisa os problemas identificados no sistema e propõe soluções claras e consistentes.

---

## 📋 PROBLEMAS IDENTIFICADOS

### 1. ❌ Limpeza cria ocorrência de zeladoria automaticamente (PROBLEMA CRÍTICO)

**Situação Atual:**
- Quando `limpezaType = EQUIPAMENTO_DEFEITO`, o sistema cria automaticamente uma ocorrência de ZELADORIA
- **Código atual:** `src/services/limpezaService.js` (linhas 57-98)
- A ocorrência de zeladoria é criada com:
  - `reported_by = userId` (usuário de LIMPEZA que reportou)
  - `auto_converted = TRUE`
  - `status = 'ABERTA'`
  - `priority = 'ALTA'`
  - `assigned_to` = primeiro operacional encontrado (ou NULL)

**Problemas Identificados:**
1. **Quem é o "autor" da ocorrência criada?** 
   - Hoje: `reported_by` = usuário LIMPEZA
   - Problema: Não fica claro que foi criação automática
   
2. **Ela exige aprovação?**
   - Hoje: Não há validação de `requires_approval` ou `approval_status`
   - Problema: Ocorrência automática pode gerar custo sem triagem
   
3. **Pode virar manutenção automática?**
   - Hoje: Não há controle explícito
   - Problema: Pode gerar manutenção sem aprovação administrativa
   
4. **Pode gerar custo sem triagem ADM?**
   - Hoje: Não há bloqueio de custos
   - Problema: Manutenção/custo pode ser criado sem passar pelo ADMINISTRATIVO

**Riscos:**
- ❌ Ocorrência duplicada (se limpeza reportar manualmente também)
- ❌ Manutenção sem controle
- ❌ Gasto não rastreável
- ❌ Bypass do fluxo de aprovação

---

### 2. ❌ Soft Delete × Delete Físico (CONTRADIÇÃO GRAVE)

**Situação Atual:**
- **Documentação diz:** "Soft delete: campos `active` e `archived_at`" (linha 46 da DOCUMENTACAO_FUNCIONAL.md)
- **Código faz:** DELETE físico em `src/services/financeiroService.js` (linha 1076-1079)
- Fluxo de exclusão de entrada rejeitada faz DELETE físico

**Problema:**
- ❌ Contradição direta: documentação diz soft delete, código faz delete físico
- ❌ Auditoria fica furada (log existe, mas registro não)
- ❌ Não há rastreabilidade completa

**Decisão Necessária:**
- Opção A: Tudo é soft delete (mais seguro para auditoria)
- Opção B: Entradas rejeitadas são exceção (mas precisa ser explícito e justificado)

---

### 3. ❌ Estados de financial_entries estão errados/confusos

**Situação Atual:**
- **Documentação funcional (linha 963):** `financial_entries: PENDING → RECEIVED`
- **Código real:** Usa `review_status` com valores: `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `RECEIVED`
- **State Machine (MATRIZ_PERMISSOES_E_STATES.md):** Define `PENDING → RECEIVED`

**Problema:**
- ❌ São dois modelos de estado diferentes:
  - Modelo 1: `PENDING → RECEIVED` (simples, recebimento)
  - Modelo 2: `PENDING_REVIEW → APPROVED → RECEIVED` ou `→ REJECTED` (com aprovação)
- ❌ Dashboard pode somar coisa errada
- ❌ Auditoria fica inconsistente

**Estado Real (verificado no código):**
```
PENDING_REVIEW → APPROVED → RECEIVED
             → REJECTED
```

**Decisão Necessária:**
- Padronizar: usar `review_status` com estados corretos
- Atualizar state machine
- Atualizar documentação

---

### 4. ⚠️ Falta Auditoria Cruzada Patrimônio × Financeiro

**Situação Atual:**
- Tabelas existem: `assets`, `maintenances`, `financial_exits`
- **NÃO existe:** `financial_exits.asset_id` ou tabela `asset_costs`

**Problema:**
- ❌ Não consegue responder: "quanto esse elevador já custou?"
- ❌ Não há rastreabilidade de custos por ativo
- ❌ Histórico financeiro de patrimônio não existe

**Solução Necessária:**
- Adicionar `asset_id` em `financial_exits` (opcional)
- OU criar tabela `asset_costs` (mais flexível)
- Documentar relação claramente

---

### 5. ⚠️ Falta SLA Automático + Violação de SLA

**Situação Atual:**
- Campo `sla_hours` existe em `occurrences` e `tasks`
- Campo `sla_due_date` é calculado
- **NÃO existe:**
  - Job que marca atraso automaticamente
  - Status `LATE` (atrasado)
  - Notificação automática por SLA violado

**Problema:**
- ❌ SLA está implícito, mas não é executado automaticamente
- ❌ Não há marcação automática de atraso
- ❌ Notificações dependem de verificação manual

**Solução Necessária:**
- Job/cron que verifica SLAs
- Adicionar status `LATE` nas state machines
- Notificações automáticas

---

### 6. ⚠️ Estoque está citado, mas não existe (FALSO POSITIVO)

**Situação Atual:**
- **Documentação funcional (linha 6):** Menciona "estoque"
- **Código:** Existe módulo completo de estoque (`src/services/estoqueService.js`, `src/controllers/estoqueController.js`)
- **Tabelas:** `inventory_items`, `inventory_movements`

**Análise:**
- ✅ Estoque EXISTE e está implementado
- ⚠️ Problema é apenas de documentação: não está claro na DOCUMENTACAO_FUNCIONAL.md

**Solução:**
- Adicionar seção de Estoque na documentação funcional
- Ou remover menção se não for usar

---

### 7. ⚠️ Conselho vê logs — mas até onde? (LGPD/COMPLIANCE)

**Situação Atual:**
- **Documentação:** "CONSELHO: visualiza logs" (genérico)
- **Código:** CONSELHO tem apenas dashboard básico (`src/controllers/conselhoController.js`)
- **SINDICO:** Tem acesso completo a logs (`/sindico/logs`)
- **CONSELHO:** Não tem rota específica de logs

**Problemas:**
- ❌ Não está claro o que CONSELHO pode ver
- ❌ Logs financeiros? IP? Before/After? Dados pessoais?
- ❌ Risco de violação de LGPD/compliance

**Decisão Necessária:**
- Definir escopo de logs para CONSELHO
- Implementar filtros específicos
- Documentar claramente o que é visível

---

## ✅ SOLUÇÕES PROPOSTAS

### 1. ✅ SOLUÇÃO: Limpeza cria ocorrência de zeladoria (REGRAS EXPLÍCITAS)

**DECISÃO: NÃO CRIAR AUTOMATICAMENTE - CRIAR NOTIFICAÇÃO COM OPÇÃO DE CRIAÇÃO**

**Nova Regra:**
1. Limpeza reporta `EQUIPAMENTO_DEFEITO`
2. Sistema cria ocorrência de LIMPEZA normalmente
3. Sistema NOTIFICA ADMINISTRATIVO (não cria zeladoria automaticamente)
4. ADMINISTRATIVO decide se cria ocorrência de ZELADORIA
5. Se criar, vincula à ocorrência de limpeza original

**Vantagens:**
- ✅ Controle administrativo mantido
- ✅ Não bypassa aprovações
- ✅ Rastreabilidade completa
- ✅ Sem duplicação

**Alternativa (se precisar manter automático):**
1. Ocorrência de zeladoria criada com:
   - `reported_by = userId` (limpeza) + flag `auto_created_by_system = TRUE`
   - `requires_approval = TRUE` (obrigatório)
   - `approval_required_from = 'ADMINISTRATIVO'`
   - `status = 'ABERTA'` (aguardando aprovação)
   - `cannot_create_maintenance = TRUE` (bloqueio até aprovar)
   - `cannot_link_cost = TRUE` (bloqueio até aprovar)
2. ADMINISTRATIVO aprova antes de poder:
   - Criar manutenção
   - Vincular custos
   - Atribuir operacional

---

### 2. ✅ SOLUÇÃO: Soft Delete × Delete Físico (DECISÃO CLARA)

**DECISÃO: ENTRADAS REJEITADAS USAM SOFT DELETE COM FLAG**

**Nova Regra:**
1. Todas as entidades usam soft delete (padrão)
2. Entradas rejeitadas também usam soft delete
3. Adicionar campos:
   - `deleted_at TIMESTAMP NULL`
   - `deleted_by INTEGER REFERENCES users(id)`
   - `delete_reason TEXT` (obrigatório para entradas rejeitadas)
4. Query padrão: `WHERE deleted_at IS NULL` (exceto tela específica)
5. Tela "Entradas Rejeitadas" mostra: `review_status = 'REJECTED' AND deleted_at IS NULL`
6. "Excluir" marca `deleted_at`, não faz DELETE físico

**Vantagens:**
- ✅ Auditoria completa
- ✅ Rastreabilidade
- ✅ Possibilidade de restaurar
- ✅ Consistência com resto do sistema

**Exceção (se precisar delete físico):**
- Apenas se houver requisito legal/regulatório explícito
- Nesse caso: documentar exceção claramente
- Fazer snapshot antes de deletar (salvar em `before_data` do log)

---

### 3. ✅ SOLUÇÃO: Estados de financial_entries (PADRONIZAR)

**DECISÃO: USAR MODELO COM APROVAÇÃO (CORRIGIR STATE MACHINE)**

**Estados Corretos:**
```
PENDING_REVIEW → APPROVED → RECEIVED
              → REJECTED
```

**Correções Necessárias:**
1. Atualizar State Machine (`MATRIZ_PERMISSOES_E_STATES.md`):
   - Estados: `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `RECEIVED`
   - Transições: `PENDING_REVIEW → APPROVED`, `PENDING_REVIEW → REJECTED`, `APPROVED → RECEIVED`
2. Atualizar Documentação Funcional:
   - Trocar "PENDING → RECEIVED" por "PENDING_REVIEW → APPROVED → RECEIVED"
3. Atualizar código se necessário:
   - Verificar se há uso de `PENDING` (deve ser `PENDING_REVIEW`)

**Fluxo Padronizado:**
```
1. FINANCEIRO cria → review_status = 'PENDING_REVIEW'
2. SINDICO aprova → review_status = 'APPROVED'
3. SINDICO rejeita → review_status = 'REJECTED'
4. FINANCEIRO marca recebida (se APPROVED) → review_status = 'RECEIVED'
```

---

### 4. ✅ SOLUÇÃO: Auditoria Cruzada Patrimônio × Financeiro

**DECISÃO: ADICIONAR asset_id EM financial_exits (OPCIONAL)**

**Implementação:**
1. Adicionar coluna em `financial_exits`:
   ```sql
   ALTER TABLE financial_exits 
   ADD COLUMN asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL;
   ```
2. Documentar:
   - Campo é opcional (não todas as saídas são de patrimônio)
   - Quando preenchido, permite rastrear custos por ativo
   - Query: "quanto esse elevador custou?" → `SELECT SUM(amount) FROM financial_exits WHERE asset_id = X`
3. Atualizar formulário de saída:
   - Campo opcional `assetId` (select de ativos)
4. Atualizar detalhes do ativo:
   - Mostrar histórico financeiro vinculado

**Alternativa (mais complexa, mas mais flexível):**
- Tabela `asset_costs` (junction table)
- Permite vincular múltiplos custos a múltiplos ativos
- Permite porcentagem de distribuição

**Recomendação:** Começar com `asset_id` (simples), evoluir se necessário.

---

### 5. ✅ SOLUÇÃO: SLA Automático + Violação

**DECISÃO: IMPLEMENTAR JOB AUTOMÁTICO + STATUS LATE**

**Implementação:**
1. **Adicionar status `LATE` nas state machines:**
   - `tasks`: Adicionar `LATE` (final)
   - `occurrences`: Adicionar `LATE` (não-final, pode continuar)
   
2. **Criar job/cron (`src/jobs/slaChecker.js`):**
   ```javascript
   // Executa a cada hora
   // 1. Busca tarefas/ocorrências com sla_due_date < NOW() e status != LATE/COMPLETED/RESOLVIDA
   // 2. Atualiza status = 'LATE'
   // 3. Cria notificação para responsável
   // 4. Cria notificação para síndico (escalonamento)
   // 5. Cria log de auditoria
   ```

3. **Adicionar campo `sla_violated_at` (opcional):**
   - Timestamp de quando violou SLA
   
4. **Notificações:**
   - Para responsável: "Tarefa/Ocorrência atrasada"
   - Para síndico: "SLA violado - [tarefa/ocorrência]"
   
5. **Atualizar queries:**
   - Dashboard: contar `status = 'LATE'`
   - Filtros: permitir filtrar por `LATE`

---

### 6. ✅ SOLUÇÃO: Estoque (DOCUMENTAR OU REMOVER MENÇÃO)

**DECISÃO: DOCUMENTAR CORRETAMENTE**

**Ação:**
1. Verificar se estoque está completo e funcional
2. Se SIM: Adicionar seção completa na DOCUMENTACAO_FUNCIONAL.md
3. Se NÃO: Remover menção da visão geral

**Se documentar:**
- Adicionar seção 3.X sobre Estoque
- Listar telas, fluxos, permissões
- Documentar tabelas e relacionamentos

---

### 7. ✅ SOLUÇÃO: Conselho vê logs (DEFINIR ESCOPO CLARO)

**DECISÃO: CONSELHO VÊ LOGS COM FILTROS DE PRIVACIDADE**

**Regras:**
1. **CONSELHO pode ver:**
   - ✅ Logs de ações (CREATE, UPDATE, APPROVE, etc)
   - ✅ Módulo, ação, data, usuário (nome apenas)
   - ✅ Entidade (tipo e ID)
   - ❌ **NÃO pode ver:**
     - `ip_address` (dados pessoais)
     - `user_agent` (dados técnicos)
     - `before_data` / `after_data` completos (pode conter dados sensíveis)
     - Logs de LOGIN (privacidade)
     - Logs financeiros detalhados (valores, etc)

2. **Implementação:**
   - Criar rota `/conselho/logs`
   - Criar view/serviço filtrado
   - Query: `SELECT action, module, entity_type, entity_id, created_at, user_name FROM audit_logs WHERE action != 'LOGIN' AND module != 'AUTH'`
   - **NÃO retornar:** `ip_address`, `user_agent`, `before_data`, `after_data`
   - Se precisar de detalhes, mostrar resumo (ex: "Valor alterado", não mostrar valores)

3. **Documentar:**
   - Seção específica na documentação funcional
   - Matriz de acesso por perfil
   - Justificativa de privacidade (LGPD)

**Alternativa mais restritiva:**
- CONSELHO só vê logs de aprovações e decisões (APPROVE, REJECT)
- Não vê logs operacionais (CREATE, UPDATE)

---

## 📊 PRIORIZAÇÃO DAS SOLUÇÕES

### 🔴 CRÍTICO (Fazer primeiro)
1. **Estados de financial_entries** (bug lógico)
2. **Soft delete × Delete físico** (inconsistência grave)
3. **Limpeza cria zeladoria** (risco de bypass)

### 🟠 ALTO (Fazer em seguida)
4. **Auditoria Patrimônio × Financeiro** (funcionalidade faltante)
5. **SLA automático** (funcionalidade parcial)

### 🟡 MÉDIO (Fazer depois)
6. **Conselho vê logs** (compliance/LGPD)
7. **Estoque documentação** (melhoria de documentação)

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### 1. Estados financial_entries
- [ ] Atualizar `MATRIZ_PERMISSOES_E_STATES.md`
- [ ] Atualizar `DOCUMENTACAO_FUNCIONAL.md`
- [ ] Verificar código (buscar por `PENDING` sem `REVIEW`)
- [ ] Atualizar state machine no banco
- [ ] Testar fluxo completo

### 2. Soft delete
- [ ] Adicionar campos `deleted_at`, `deleted_by`, `delete_reason` em `financial_entries`
- [ ] Atualizar `deleteEntry` para usar soft delete
- [ ] Atualizar queries para filtrar `deleted_at IS NULL`
- [ ] Atualizar documentação
- [ ] Criar tela de "entradas deletadas" (opcional)

### 3. Limpeza cria zeladoria
- [ ] **Opção A:** Remover criação automática, adicionar notificação
- [ ] **Opção B:** Manter criação, adicionar `requires_approval = TRUE` e bloqueios
- [ ] Atualizar código em `limpezaService.js`
- [ ] Atualizar documentação
- [ ] Testar fluxo

### 4. Auditoria Patrimônio × Financeiro
- [ ] Adicionar `asset_id` em `financial_exits`
- [ ] Atualizar formulário de saída
- [ ] Atualizar detalhes do ativo
- [ ] Documentar
- [ ] Criar query de relatório

### 5. SLA automático
- [ ] Adicionar status `LATE` nas state machines
- [ ] Criar job `slaChecker.js`
- [ ] Configurar cron (a cada hora)
- [ ] Implementar notificações
- [ ] Atualizar dashboards
- [ ] Documentar

### 6. Conselho logs
- [ ] Criar rota `/conselho/logs`
- [ ] Criar serviço filtrado
- [ ] Implementar filtros de privacidade
- [ ] Criar view
- [ ] Documentar escopo

### 7. Estoque documentação
- [ ] Verificar se está completo
- [ ] Adicionar seção na documentação funcional
- [ ] Ou remover menção

---

## 🎯 DECISÕES TOMADAS

1. **Limpeza → Zeladoria:** Notificar ADMINISTRATIVO (não criar automaticamente) ✅
2. **Soft Delete:** Tudo usa soft delete (incluindo entradas rejeitadas) ✅
3. **Estados financial_entries:** Usar `PENDING_REVIEW → APPROVED → RECEIVED` ✅
4. **Patrimônio × Financeiro:** Adicionar `asset_id` opcional em `financial_exits` ✅
5. **SLA:** Implementar job automático + status LATE ✅
6. **Conselho logs:** Acesso com filtros de privacidade (sem IP, sem before/after completo) ✅
7. **Estoque:** Documentar corretamente ✅

---

**Última atualização:** Janeiro 2025
