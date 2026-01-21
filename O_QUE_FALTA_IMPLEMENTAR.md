# 📋 O QUE FALTA IMPLEMENTAR - MÓDULO OPERACIONAL

**Data:** Janeiro 2026  
**Status Atual:** 5/38 implementadas (13.2%)  
**Restante:** 33/38 (86.8%)

---

## ✅ IMPLEMENTAÇÕES CONCLUÍDAS (5)

1. ✅ **TEC-005:** Validação de Evidências Obrigatórias
2. ✅ **UX-003:** Ordenação por Prioridade (URGENTE primeiro)
3. ✅ **TEC-003:** Busca Textual (Backend + Frontend)
4. ✅ **TEC-002:** Paginação (Backend + Frontend)
5. ✅ **TEC-004:** Filtros Avançados (Data, Prioridade, Status)

---

## 🔴 SPRINT 1: CORREÇÕES TÉCNICAS URGENTES (1 pendente)

### ⏳ TEC-001: Unificar Sistemas de Checklist
**Status:** Pendente  
**Prioridade:** 🔴 ALTA  
**Descrição:** Remover sistema antigo (`/operacional/checklist`) ou migrar para novo (`/operacional/checklists-diarios`)

**Tarefas:**
- [ ] Analisar dados no sistema antigo que precisam ser migrados
- [ ] Decidir qual sistema manter (recomendado: novo)
- [ ] Migrar dados se necessário
- [ ] **Backend:**
  - [ ] Remover rotas antigas: `/operacional/checklist`, `/operacional/checklist/:id/atualizar`
  - [ ] Remover funções: `showChecklist()`, `updateChecklistItem()` do controller
  - [ ] Remover lógica de checklist antigo do service
- [ ] **Frontend:**
  - [ ] Remover ou migrar view `views/operacional/checklist.ejs`
  - [ ] Atualizar links no dashboard para usar `/operacional/checklists-diarios`
  - [ ] Atualizar navegação/menu

**Arquivos Afetados:**
- `src/routes/operacionalRoutes.js`
- `src/controllers/operacionalController.js`
- `src/services/operacionalService.js`
- `views/operacional/dashboard.ejs`
- `views/partials/navbar.ejs`

---

## ⏰ SPRINT 2: SISTEMA DE SLA (6 itens - 80% backend pronto)

### 🚧 SLA-001: Campos SLA nas Tabelas
**Status:** 🟡 Parcial (Backend pronto, SQL não executado)  
**Prioridade:** 🔴 ALTA  
**O que falta:**
- [ ] Executar script `src/database/extendTablesSLA.sql` no banco PostgreSQL
- [ ] Verificar se colunas foram criadas corretamente

**Nota:** Código já está pronto e calcula SLA automaticamente. Só falta executar SQL.

---

### ⏳ SLA-002: Exibir SLA nas Views
**Status:** Pendente  
**Prioridade:** 🔴 ALTA  
**Descrição:** Adicionar indicadores visuais de SLA nas views

**Tarefas:**
- [ ] **Frontend - Tarefas (`checklist.ejs`):**
  - [ ] Exibir badge de status SLA (OK/WARNING/VIOLATED)
  - [ ] Mostrar horas restantes/atrasadas
  - [ ] Indicador visual (verde/amarelo/vermelho)
- [ ] **Frontend - Ocorrências (`ocorrencias.ejs`):**
  - [ ] Exibir badge de status SLA
  - [ ] Mostrar horas restantes/atrasadas
  - [ ] Indicador visual

**Arquivos Afetados:**
- `views/operacional/checklist.ejs`
- `views/operacional/ocorrencias.ejs`

---

### ⏳ SLA-003: Alertas Automáticos de SLA
**Status:** Pendente  
**Prioridade:** 🔴 ALTA  
**Descrição:** Criar job/cron para verificar SLA e enviar notificações

**Tarefas:**
- [ ] Criar job/cron (usar `node-cron` ou similar)
- [ ] Verificar tarefas com SLA próximo do vencimento (ex: 6 horas antes)
- [ ] Verificar tarefas com SLA violado
- [ ] Criar notificações automáticas para gestores
- [ ] Marcar `sla_alert_sent = TRUE` após enviar

**Arquivos Afetados:**
- Criar: `src/jobs/slaChecker.js`
- Atualizar: `src/app.js` (registrar job)

---

### ⏳ SLA-004: Relatório de SLA
**Status:** Pendente  
**Prioridade:** 🟡 MÉDIA  
**Descrição:** Dashboard e relatórios de compliance de SLA

**Tarefas:**
- [ ] Criar endpoint: `GET /operacional/sla/relatorio`
- [ ] Calcular métricas:
  - Taxa de SLA cumprido (%)
  - SLA violado por tipo/prioridade
  - Tempo médio de conclusão vs SLA
- [ ] Criar view com gráficos e tabelas
- [ ] Filtrar por período (mês/trimestre/ano)

**Arquivos Afetados:**
- Criar: `src/services/slaReportService.js`
- Criar: `src/controllers/slaReportController.js`
- Criar: `views/operacional/sla-relatorio.ejs`
- Atualizar: `src/routes/operacionalRoutes.js`

---

### ⏳ SLA-005: Configuração de SLA Personalizada
**Status:** Pendente  
**Prioridade:** 🟡 MÉDIA  
**Descrição:** Permitir configurar SLA por tipo/prioridade/condomínio

**Tarefas:**
- [ ] Criar tabela `sla_configurations` (se não existir)
- [ ] CRUD de configurações SLA (apenas para ADMINISTRATIVO/SINDICO)
- [ ] Interface para configurar SLA por prioridade
- [ ] Usar configuração customizada no cálculo de SLA

**Arquivos Afetados:**
- Criar: `src/services/slaConfigService.js`
- Criar: `src/controllers/slaConfigController.js`
- Criar: `views/administrativo/sla-config.ejs` (ou similar)

---

### ⏳ SLA-006: Histórico de Violações de SLA
**Status:** Pendente  
**Prioridade:** 🟡 MÉDIA  
**Descrição:** Log e análise de padrões de violações

**Tarefas:**
- [ ] Registrar histórico de violações (pode usar `audit_logs` existente)
- [ ] Criar relatório de violações frequentes
- [ ] Identificar padrões (tipo, prioridade, horário)
- [ ] Sugestões de melhoria baseadas em histórico

---

## 🔄 SPRINT 3: MELHORIAS DE FLUXO (5 itens)

### ⏳ FLU-001: Operacional Pode Criar Tarefas
**Status:** Pendente  
**Prioridade:** 🔴 ALTA  
**Descrição:** Permitir operacional criar tarefas para si mesmo

**Tarefas:**
- [ ] **Backend:**
  - [ ] Criar função `operacionalService.createTaskForSelf()`
  - [ ] Validar que `assigned_to = userId` (só pode criar para si)
  - [ ] Permitir criação apenas se usuário é OPERACIONAL
- [ ] **Frontend:**
  - [ ] Adicionar botão "Nova Tarefa" em dashboard/checklist
  - [ ] Criar form de criação de tarefa (similar ao administrativo)
  - [ ] Auto-selecionar usuário atual como responsável

**Arquivos Afetados:**
- `src/services/operacionalService.js`
- `src/controllers/operacionalController.js`
- `views/operacional/checklist.ejs`
- `src/routes/operacionalRoutes.js`

---

### ⏳ FLU-002: Ocorrência Gerar Tarefa Automaticamente
**Status:** Pendente  
**Prioridade:** 🔴 ALTA  
**Descrição:** Quando operacional cria ocorrência, criar tarefa automaticamente

**Tarefas:**
- [ ] **Backend:**
  - [ ] Atualizar `createOccurrence()` para criar tarefa automaticamente
  - [ ] Vincular tarefa à ocorrência (`related_occurrence_id` ou campo na `occurrences`)
  - [ ] Usar prioridade da ocorrência para a tarefa
  - [ ] Calcular `due_date` baseado no SLA da ocorrência
- [ ] **Frontend:**
  - [ ] Mostrar tarefa criada após criar ocorrência
  - [ ] Link para tarefa na view de ocorrência

**Arquivos Afetados:**
- `src/services/operacionalService.js` (função `createOccurrence()`)

---

### ⏳ FLU-003: Resolução de Ocorrência Fechar Tarefas Relacionadas
**Status:** Pendente  
**Prioridade:** 🟡 MÉDIA  
**Descrição:** Ao resolver ocorrência, fechar tarefas vinculadas automaticamente

**Tarefas:**
- [ ] **Backend:**
  - [ ] Atualizar `resolveOccurrence()` para buscar tarefas relacionadas
  - [ ] Fechar tarefas vinculadas (`status = 'COMPLETED'`)
  - [ ] Registrar quem fechou (usuário que resolveu ocorrência)
- [ ] **Testes:**
  - [ ] Testar resolução de ocorrência com múltiplas tarefas vinculadas

**Arquivos Afetados:**
- `src/services/operacionalService.js` (função `resolveOccurrence()`)

---

### ⏳ FLU-004: Fluxo de Execução de Orçamento
**Status:** Pendente  
**Prioridade:** 🟡 MÉDIA  
**Descrição:** Vincular orçamento aprovado à execução prática (tarefa/manutenção)

**Tarefas:**
- [ ] **Backend:**
  - [ ] Adicionar campo `budget_request_id` na tabela `tasks` ou `maintenances`
  - [ ] Ao criar tarefa/manutenção a partir de orçamento, vincular
- [ ] **Frontend:**
  - [ ] Mostrar orçamento relacionado na view de tarefa/manutenção
  - [ ] Botão "Executar Orçamento" na view de orçamentos liberados

**Arquivos Afetados:**
- `src/database/extendTablesPhase6.sql` (ou novo script)
- `src/services/orcamentoService.js`
- Views de tarefas/manutenções

---

### ⏳ FLU-005: Vinculação Manutenção ↔ Ocorrência
**Status:** Pendente  
**Prioridade:** 🟡 MÉDIA  
**Descrição:** Vincular manutenção com ocorrência que a gerou

**Tarefas:**
- [ ] **Backend:**
  - [ ] Adicionar campo `related_occurrence_id` na tabela `maintenances` (se não existir)
  - [ ] Ao criar manutenção a partir de ocorrência, vincular
- [ ] **Frontend:**
  - [ ] Mostrar ocorrência relacionada na view de manutenção
  - [ ] Mostrar manutenções relacionadas na view de ocorrência

---

## ✅ SPRINT 4: SISTEMA DE REVISÃO (3 itens)

### ⏳ REV-001: Campos de Revisão na Tabela Tasks
**Status:** Pendente  
**Prioridade:** 🟡 MÉDIA  
**Descrição:** Adicionar campos para revisão/validação de trabalho

**Tarefas:**
- [ ] Criar script SQL para adicionar colunas:
  - `reviewed_by` (INTEGER, FOREIGN KEY users)
  - `reviewed_at` (TIMESTAMP)
  - `review_status` (VARCHAR: 'PENDING', 'APPROVED', 'REJECTED')
  - `review_notes` (TEXT)
- [ ] Executar script no banco

---

### ⏳ REV-002: Interface de Revisão para Supervisor
**Status:** Pendente  
**Prioridade:** 🟡 MÉDIA  
**Descrição:** Permitir supervisor (ADMINISTRATIVO/SINDICO) revisar tarefas concluídas

**Tarefas:**
- [ ] Criar endpoint: `POST /administrativo/tarefas/:id/revisar`
- [ ] Criar view para revisar tarefa (mostrar evidências, notas, etc.)
- [ ] Permitir aprovar ou rejeitar
- [ ] Notificar operacional quando rejeitada

**Arquivos Afetados:**
- `src/services/administrativoService.js`
- `src/controllers/administrativoController.js`
- Criar: `views/administrativo/revisar-tarefa.ejs`

---

### ⏳ REV-003: Reabertura de Tarefa Rejeitada
**Status:** Pendente  
**Prioridade:** 🟡 MÉDIA  
**Descrição:** Permitir reabrir tarefa rejeitada na revisão

**Tarefas:**
- [ ] Adicionar endpoint: `POST /operacional/tarefas/:id/reabrir`
- [ ] Validar que tarefa foi rejeitada
- [ ] Mudar status para `IN_PROGRESS`
- [ ] Notificar supervisor

---

## 📊 SPRINT 5: RELATÓRIOS E ANALYTICS (3 itens)

### ⏳ REP-001: Relatório de Produtividade do Operacional
**Status:** Pendente  
**Prioridade:** 🟡 MÉDIA  
**Descrição:** Dashboard com métricas de produtividade

**Tarefas:**
- [ ] Calcular métricas:
  - Tarefas concluídas por dia/semana/mês
  - Taxa de conclusão no prazo
  - Tempo médio de conclusão
  - Ocorrências resolvidas
- [ ] Criar view com gráficos
- [ ] Filtrar por período

**Arquivos Afetados:**
- Criar: `src/services/operacionalReportService.js`
- Criar: `views/operacional/relatorio-produtividade.ejs`

---

### ⏳ REP-002: Análise de Ocorrências Recorrentes
**Status:** Pendente  
**Prioridade:** 🟡 MÉDIA  
**Descrição:** Identificar padrões de ocorrências recorrentes

**Tarefas:**
- [ ] Buscar ocorrências com mesmo `location` ou `title` similar
- [ ] Agrupar por localização/tipo
- [ ] Calcular frequência
- [ ] Sugerir ações preventivas

---

### ⏳ REP-003: Métricas de Tempo Médio de Conclusão
**Status:** Pendente  
**Prioridade:** 🟡 MÉDIA  
**Descrição:** Análise de performance e tempo de resolução

**Tarefas:**
- [ ] Calcular tempo médio de conclusão por tipo/prioridade
- [ ] Comparar com SLA definido
- [ ] Identificar gargalos
- [ ] Gráficos de tendência temporal

---

## 🤖 SPRINT 6: AUTOMAÇÃO E MELHORIAS DE UX (6 itens)

### ⏳ AUT-001: Integração Completa de Checklists Diários
**Status:** Pendente  
**Prioridade:** 🟡 MÉDIA  
**Descrição:** Garantir que checklists diários estejam totalmente integrados

**Tarefas:**
- [ ] Verificar geração automática de checklists
- [ ] Garantir que job roda diariamente
- [ ] Notificações quando checklist disponível

---

### ⏳ AUT-002: Escalonamento Automático de Ocorrências
**Status:** Pendente  
**Prioridade:** 🟡 MÉDIA  
**Descrição:** Escalonar ocorrências após X horas sem resolução

**Tarefas:**
- [ ] Job para verificar ocorrências antigas
- [ ] Escalonar para ADMINISTRATIVO após SLA violado
- [ ] Notificar escalonamento

---

### ⏳ AUT-003: Criação Automática de Tarefa a partir de Ocorrência
**Status:** Parcial (já mencionado em FLU-002)  
**Prioridade:** 🔴 ALTA  
**Descrição:** Já listado em FLU-002

---

### ⏳ UX-001: Feedback Visual de Salvamento
**Status:** Pendente  
**Prioridade:** 🟢 BAIXA  
**Descrição:** Mostrar "Salvando..." ao atualizar checklist

**Tarefas:**
- [ ] Adicionar spinner/loading ao clicar em salvar
- [ ] Mensagem de sucesso após salvar
- [ ] Usar JavaScript/Toast notifications

---

### ⏳ UX-002: Tooltips Explicativos
**Status:** Pendente  
**Prioridade:** 🟢 BAIXA  
**Descrição:** Adicionar tooltips explicando campos/termos

**Tarefas:**
- [ ] Tooltip em "Ocorrência" vs "Tarefa"
- [ ] Tooltip explicando campos de formulário
- [ ] Tooltip sobre SLA
- [ ] Usar biblioteca tooltip (ex: Tippy.js) ou CSS puro

---

### ✅ UX-003: Ordenação por Prioridade
**Status:** ✅ **CONCLUÍDO**  
**Prioridade:** ✅ Implementado

---

## 📊 RESUMO POR PRIORIDADE

### 🔴 ALTA PRIORIDADE (7 itens)
1. TEC-001: Unificar Sistemas de Checklist
2. SLA-002: Exibir SLA nas Views
3. SLA-003: Alertas Automáticos de SLA
4. FLU-001: Operacional Pode Criar Tarefas
5. FLU-002: Ocorrência Gerar Tarefa Automaticamente
6. SLA-001: Executar SQL no banco (crítico para SLA funcionar)

### 🟡 MÉDIA PRIORIDADE (18 itens)
- SLA-004, SLA-005, SLA-006
- FLU-003, FLU-004, FLU-005
- REV-001, REV-002, REV-003
- REP-001, REP-002, REP-003
- AUT-001, AUT-002

### 🟢 BAIXA PRIORIDADE (2 itens)
- UX-001, UX-002

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

1. **CRÍTICO:** Executar `extendTablesSLA.sql` no banco
2. **ALTA:** Implementar SLA-002 (exibir SLA nas views)
3. **ALTA:** Implementar SLA-003 (alertas automáticos)
4. **ALTA:** Implementar FLU-002 (ocorrência gerar tarefa)
5. **ALTA:** Implementar FLU-001 (operacional criar tarefas)

---

**Total Pendente:** 33 itens  
**Progresso:** 5/38 (13.2%)
