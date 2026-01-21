# 🚀 PLANO DE IMPLEMENTAÇÃO - MELHORIAS DO MÓDULO OPERACIONAL

**Data:** Janeiro 2026  
**Versão:** 1.0  
**Total de Melhorias:** 38 itens  
**Estimativa Total:** ~320-380 horas de desenvolvimento

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Sprint 1: Correções Técnicas Urgentes](#sprint-1-correções-técnicas-urgentes)
3. [Sprint 2: Sistema de SLA](#sprint-2-sistema-de-sla)
4. [Sprint 3: Melhorias de Fluxo](#sprint-3-melhorias-de-fluxo)
5. [Sprint 4: Sistema de Revisão](#sprint-4-sistema-de-revisão)
6. [Sprint 5: Relatórios e Analytics](#sprint-5-relatórios-e-analytics)
7. [Sprint 6: Automação e Melhorias de UX](#sprint-6-automação-e-melhorias-de-ux)
8. [Futuro: Melhorias Avançadas](#futuro-melhorias-avançadas)

---

## 🎯 VISÃO GERAL

### Objetivo
Transformar o módulo OPERACIONAL de nível **INTERMEDIÁRIO (6.5/10)** para **AVANÇADO (9.0+/10)**, justificando ticket comercial de **R$ 20.000**.

### Escopo
Implementar 38 melhorias organizadas em 6 sprints principais, focando em:
- **SLA e alertas automáticos** (crítico)
- **Relatórios e analytics** (crítico)
- **Automação de fluxos** (importante)
- **Sistema de revisão** (importante)
- **Melhorias de UX** (desejável)

### Cronograma Estimado
- **Sprint 1-3 (Alta Prioridade):** 4-6 semanas
- **Sprint 4-6 (Média Prioridade):** 8-10 semanas
- **Total:** 12-16 semanas (3-4 meses)

---

## 🔧 SPRINT 1: CORREÇÕES TÉCNICAS URGENTES

**Duração:** 1-2 semanas  
**Esforço:** ~40-60 horas  
**Prioridade:** 🔴 ALTA

### Objetivo
Corrigir problemas técnicos críticos que afetam usabilidade e escalabilidade.

---

### ✅ TEC-001: Unificar Sistemas de Checklist

**Descrição:** Remover sistema antigo ou migrar tudo para sistema novo de checklists diários

**Tarefas:**
- [ ] **Análise:** Verificar se há dados no sistema antigo que precisam ser migrados
- [ ] **Decisão:** Definir qual sistema manter (recomendado: novo sistema baseado em regras)
- [ ] **Migração de Dados:** Se necessário, migrar dados da tabela `checklists` (sistema antigo) para `daily_checklists`
- [ ] **Backend:**
  - [ ] Remover rotas antigas: `/operacional/checklist`, `/operacional/checklist/:id/atualizar`
  - [ ] Remover funções: `showChecklist()`, `updateChecklistItem()` do `operacionalController.js`
  - [ ] Remover lógica de checklist antigo do `operacionalService.js`
- [ ] **Frontend:**
  - [ ] Remover view `views/operacional/checklist.ejs` ou migrar para `checklists-diarios/list.ejs`
  - [ ] Atualizar links no dashboard para usar `/operacional/checklists-diarios`
  - [ ] Atualizar navegação/menu para remover link do sistema antigo
- [ ] **Testes:**
  - [ ] Testar criação de checklist no sistema novo
  - [ ] Testar execução de checklist
  - [ ] Testar upload de evidências
  - [ ] Verificar migração de dados (se houver)

**Arquivos Afetados:**
- `src/routes/operacionalRoutes.js`
- `src/controllers/operacionalController.js`
- `src/services/operacionalService.js`
- `views/operacional/dashboard.ejs`
- `views/partials/navbar.ejs` (se houver link)

**Entregáveis:**
- Sistema de checklist unificado funcionando
- Rotas antigas removidas
- Documentação de migração (se houver)

---

### ✅ TEC-002: Implementar Paginação em Listagens

**Descrição:** Adicionar paginação (10/20/50 por página) em todas as listas

**Tarefas:**
- [ ] **Backend - Tarefas:**
  - [ ] Atualizar `operacionalService.listTasks()` para aceitar `page` e `limit`
  - [ ] Adicionar cálculo de `offset` e `total` de registros
  - [ ] Atualizar SQL para usar `OFFSET` e `LIMIT`
  - [ ] Retornar `{ tasks, total, page, limit, totalPages }` no service
- [ ] **Backend - Ocorrências:**
  - [ ] Atualizar `operacionalService.listOccurrences()` para aceitar `page` e `limit`
  - [ ] Adicionar cálculo de `offset` e `total` de registros
  - [ ] Atualizar SQL para usar `OFFSET` e `LIMIT`
  - [ ] Retornar `{ occurrences, total, page, limit, totalPages }` no service
- [ ] **Controllers:**
  - [ ] Atualizar `operacionalController.showChecklist()` para processar `page` e `limit`
  - [ ] Atualizar `operacionalController.showOcorrencias()` para processar `page` e `limit`
- [ ] **Frontend - Tarefas:**
  - [ ] Adicionar controles de paginação em `views/operacional/checklist.ejs`
  - [ ] Adicionar seleção de itens por página (10/20/50)
  - [ ] Adicionar botões: Primeira, Anterior, Próxima, Última
  - [ ] Mostrar "Página X de Y" e "Total de Z registros"
- [ ] **Frontend - Ocorrências:**
  - [ ] Adicionar controles de paginação em `views/operacional/ocorrencias.ejs`
  - [ ] Adicionar seleção de itens por página (10/20/50)
  - [ ] Adicionar botões: Primeira, Anterior, Próxima, Última
  - [ ] Mostrar "Página X de Y" e "Total de Z registros"
- [ ] **Testes:**
  - [ ] Testar paginação com menos de 1 página
  - [ ] Testar paginação com múltiplas páginas
  - [ ] Testar mudança de itens por página
  - [ ] Testar navegação entre páginas

**Arquivos Afetados:**
- `src/services/operacionalService.js`
- `src/controllers/operacionalController.js`
- `views/operacional/checklist.ejs`
- `views/operacional/ocorrencias.ejs`

**Entregáveis:**
- Paginação funcionando em tarefas e ocorrências
- Controles de navegação implementados
- Testes passando

---

### ✅ TEC-003: Implementar Busca Textual

**Descrição:** Adicionar campo de busca em tarefas e ocorrências

**Tarefas:**
- [ ] **Backend - Tarefas:**
  - [ ] Atualizar `operacionalService.listTasks()` para aceitar parâmetro `search`
  - [ ] Adicionar query SQL com `LIKE` para buscar em `title`, `description`
  - [ ] Usar `ILIKE` para busca case-insensitive
- [ ] **Backend - Ocorrências:**
  - [ ] Atualizar `operacionalService.listOccurrences()` para aceitar parâmetro `search`
  - [ ] Adicionar query SQL com `LIKE` para buscar em `title`, `description`, `location`
  - [ ] Usar `ILIKE` para busca case-insensitive
- [ ] **Controllers:**
  - [ ] Atualizar controllers para passar `search` dos query params
- [ ] **Frontend - Tarefas:**
  - [ ] Adicionar campo de busca em `views/operacional/checklist.ejs`
  - [ ] Adicionar botão "Buscar" ou busca em tempo real
  - [ ] Manter parâmetro `search` na URL para compartilhamento
- [ ] **Frontend - Ocorrências:**
  - [ ] Adicionar campo de busca em `views/operacional/ocorrencias.ejs`
  - [ ] Adicionar botão "Buscar" ou busca em tempo real
  - [ ] Manter parâmetro `search` na URL para compartilhamento
- [ ] **Testes:**
  - [ ] Testar busca com termo existente
  - [ ] Testar busca com termo inexistente
  - [ ] Testar busca com termo parcial
  - [ ] Testar busca case-insensitive

**Arquivos Afetados:**
- `src/services/operacionalService.js`
- `src/controllers/operacionalController.js`
- `views/operacional/checklist.ejs`
- `views/operacional/ocorrencias.ejs`

**Entregáveis:**
- Busca textual funcionando em tarefas e ocorrências
- Interface de busca implementada
- Testes passando

---

### ✅ TEC-004: Implementar Filtros Avançados

**Descrição:** Adicionar filtros por data, prioridade, responsável

**Tarefas:**
- [ ] **Backend - Tarefas:**
  - [ ] Atualizar `operacionalService.listTasks()` para aceitar filtros: `dateFrom`, `dateTo`, `priority`, `assignedTo`
  - [ ] Adicionar condições SQL dinâmicas para cada filtro
- [ ] **Backend - Ocorrências:**
  - [ ] Atualizar `operacionalService.listOccurrences()` para aceitar filtros: `dateFrom`, `dateTo`, `priority`, `reportedBy`
  - [ ] Adicionar condições SQL dinâmicas para cada filtro
- [ ] **Controllers:**
  - [ ] Atualizar controllers para passar filtros dos query params
- [ ] **Frontend - Tarefas:**
  - [ ] Adicionar campos de filtro em `views/operacional/checklist.ejs`:
    - [ ] Filtro por data (datepicker: início e fim)
    - [ ] Filtro por prioridade (select: TODAS, BAIXA, NORMAL, ALTA, URGENTE)
    - [ ] Filtro por responsável (select com lista de usuários)
  - [ ] Adicionar botão "Aplicar Filtros"
  - [ ] Adicionar botão "Limpar Filtros"
- [ ] **Frontend - Ocorrências:**
  - [ ] Adicionar campos de filtro em `views/operacional/ocorrencias.ejs`:
    - [ ] Filtro por data (datepicker: início e fim)
    - [ ] Filtro por prioridade (select: TODAS, BAIXA, NORMAL, ALTA, URGENTE)
    - [ ] Filtro por quem reportou (select com lista de usuários)
  - [ ] Adicionar botão "Aplicar Filtros"
  - [ ] Adicionar botão "Limpar Filtros"
- [ ] **Testes:**
  - [ ] Testar cada filtro isoladamente
  - [ ] Testar combinação de filtros
  - [ ] Testar limpar filtros
  - [ ] Testar filtros com paginação

**Arquivos Afetados:**
- `src/services/operacionalService.js`
- `src/controllers/operacionalController.js`
- `views/operacional/checklist.ejs`
- `views/operacional/ocorrencias.ejs`

**Entregáveis:**
- Filtros avançados funcionando em tarefas e ocorrências
- Interface de filtros implementada
- Testes passando

---

### ✅ TEC-005: Validação de Evidências Obrigatórias

**Descrição:** Impedir conclusão de tarefa se `evidence_required = TRUE` e não houver foto

**Tarefas:**
- [ ] **Backend:**
  - [ ] Atualizar `operacionalService.completeTask()` para verificar evidências
  - [ ] Buscar evidências na tabela `task_evidences` para a tarefa
  - [ ] Se `evidence_required = TRUE` e não houver evidências, lançar erro: "Tarefa requer evidências (fotos). Por favor, anexe fotos antes de concluir."
- [ ] **Frontend:**
  - [ ] Atualizar `views/operacional/complete-task.ejs` para mostrar erro se evidências faltarem
  - [ ] Adicionar link para upload de evidências antes de concluir
- [ ] **Testes:**
  - [ ] Testar conclusão sem evidências quando `evidence_required = TRUE` (deve falhar)
  - [ ] Testar conclusão com evidências quando `evidence_required = TRUE` (deve passar)
  - [ ] Testar conclusão sem evidências quando `evidence_required = FALSE` (deve passar)

**Arquivos Afetados:**
- `src/services/operacionalService.js` (função `completeTask()`)
- `views/operacional/complete-task.ejs`

**Entregáveis:**
- Validação de evidências obrigatórias funcionando
- Mensagem de erro clara
- Testes passando

---

## ⏰ SPRINT 2: SISTEMA DE SLA

**Duração:** 1-2 semanas  
**Esforço:** ~40-60 horas  
**Prioridade:** 🔴 ALTA

### Objetivo
Implementar sistema de SLA (Service Level Agreement) completo com alertas automáticos.

---

### ✅ SLA-001: Tabela de Configuração de SLA

**Descrição:** Criar tabela para configurar SLA por tipo de tarefa/ocorrência

**Tarefas:**
- [ ] **Database:**
  - [ ] Criar script SQL: `src/database/extendTablesSLA.sql`
  - [ ] Criar tabela `sla_configurations` com campos:
    - `id` (SERIAL PRIMARY KEY)
    - `condominium_id` (INTEGER, FOREIGN KEY)
    - `entity_type` (VARCHAR: 'TASK', 'OCCURRENCE')
    - `task_type` (VARCHAR, nullable - tipo de tarefa: 'CHECKLIST', 'MANUTENCAO', etc.)
    - `occurrence_type` (VARCHAR, nullable - tipo de ocorrência: 'EMERGENCY', 'NON_ROUTINE', etc.)
    - `priority` (VARCHAR, nullable - 'BAIXA', 'NORMAL', 'ALTA', 'URGENTE')
    - `sla_hours` (INTEGER NOT NULL - prazo em horas)
    - `alert_before_hours` (INTEGER DEFAULT 24 - alertar X horas antes do prazo)
    - `is_active` (BOOLEAN DEFAULT TRUE)
    - `created_at`, `updated_at`
  - [ ] Criar índices apropriados
  - [ ] Executar script no banco
- [ ] **Backend - Service:**
  - [ ] Criar `src/services/slaService.js`
  - [ ] Implementar `getSLAConfiguration(entityType, taskType, occurrenceType, priority)`
  - [ ] Implementar `calculateSLADeadline(createdAt, slaHours)`
- [ ] **Backend - Controller:**
  - [ ] Criar `src/controllers/slaController.js`
  - [ ] Implementar rotas para configurar SLA (para administradores)
- [ ] **Frontend:**
  - [ ] Criar view de configuração de SLA (para master/admin)
- [ ] **Testes:**
  - [ ] Testar criação de configuração de SLA
  - [ ] Testar busca de configuração de SLA
  - [ ] Testar cálculo de deadline

**Arquivos Afetados:**
- `src/database/extendTablesSLA.sql` (novo)
- `src/services/slaService.js` (novo)
- `src/controllers/slaController.js` (novo)
- `src/routes/configRoutes.js` (adicionar rotas de SLA)

**Entregáveis:**
- Tabela de configuração de SLA criada
- Service e controller de SLA implementados
- Interface de configuração (opcional neste sprint)

---

### ✅ SLA-002: Cálculo de SLA em Tarefas

**Descrição:** Calcular prazo máximo de SLA para cada tarefa baseado em configuração

**Tarefas:**
- [ ] **Database:**
  - [ ] Adicionar campo `sla_deadline` (TIMESTAMP, nullable) na tabela `tasks`
  - [ ] Criar script de migração para adicionar campo
- [ ] **Backend - Service:**
  - [ ] Atualizar função de criação de tarefa (em `administrativoService.js` ou onde for criada)
  - [ ] Buscar configuração de SLA baseada em `task_type` e `priority`
  - [ ] Calcular `sla_deadline = createdAt + slaHours`
  - [ ] Salvar `sla_deadline` ao criar tarefa
- [ ] **Backend - Service Operacional:**
  - [ ] Atualizar `operacionalService.getTaskById()` para incluir `sla_deadline`
  - [ ] Atualizar `operacionalService.listTasks()` para incluir `sla_deadline`
- [ ] **Frontend:**
  - [ ] Atualizar `views/operacional/checklist.ejs` para exibir `sla_deadline`
  - [ ] Atualizar `views/operacional/task.ejs` para exibir `sla_deadline`
  - [ ] Destacar tarefas próximas do SLA (amarelo) ou violadas (vermelho)
- [ ] **Testes:**
  - [ ] Testar cálculo de SLA para diferentes tipos de tarefa
  - [ ] Testar exibição de `sla_deadline` nas views
  - [ ] Testar destaque visual de SLA

**Arquivos Afetados:**
- `src/database/extendTablesPhase6.sql` (adicionar campo)
- `src/services/administrativoService.js` (ou onde tarefas são criadas)
- `src/services/operacionalService.js`
- `views/operacional/checklist.ejs`
- `views/operacional/task.ejs`

**Entregáveis:**
- Campo `sla_deadline` adicionado em tarefas
- Cálculo de SLA funcionando na criação de tarefas
- Exibição de SLA nas views

---

### ✅ SLA-003: Cálculo de SLA em Ocorrências

**Descrição:** Calcular prazo máximo de SLA para cada ocorrência baseado em configuração

**Tarefas:**
- [ ] **Database:**
  - [ ] Adicionar campo `sla_deadline` (TIMESTAMP, nullable) na tabela `occurrences`
  - [ ] Criar script de migração para adicionar campo
- [ ] **Backend - Service:**
  - [ ] Atualizar `operacionalService.createOccurrence()` para calcular SLA
  - [ ] Buscar configuração de SLA baseada em `occurrence_type` e `priority`
  - [ ] Calcular `sla_deadline = createdAt + slaHours`
  - [ ] Salvar `sla_deadline` ao criar ocorrência
- [ ] **Frontend:**
  - [ ] Atualizar `views/operacional/ocorrencias.ejs` para exibir `sla_deadline`
  - [ ] Atualizar `views/operacional/ocorrencia-detail.ejs` para exibir `sla_deadline`
  - [ ] Destacar ocorrências próximas do SLA (amarelo) ou violadas (vermelho)
- [ ] **Testes:**
  - [ ] Testar cálculo de SLA para diferentes tipos de ocorrência
  - [ ] Testar exibição de `sla_deadline` nas views
  - [ ] Testar destaque visual de SLA

**Arquivos Afetados:**
- `src/database/extendTablesPhase6.sql` (adicionar campo)
- `src/services/operacionalService.js`
- `views/operacional/ocorrencias.ejs`
- `views/operacional/ocorrencia-detail.ejs`

**Entregáveis:**
- Campo `sla_deadline` adicionado em ocorrências
- Cálculo de SLA funcionando na criação de ocorrências
- Exibição de SLA nas views

---

### ✅ SLA-004: Job de Verificação de SLA

**Descrição:** Criar job/cron que verifica SLA e cria alertas quando próximo do prazo

**Tarefas:**
- [ ] **Backend - Service:**
  - [ ] Criar `src/services/slaCheckService.js`
  - [ ] Implementar `checkSLAForTasks()`:
    - [ ] Buscar tarefas com status PENDING ou IN_PROGRESS
    - [ ] Verificar se `sla_deadline` está próximo (usando `alert_before_hours`)
    - [ ] Verificar se `sla_deadline` foi violado (passou da data)
    - [ ] Criar alertas na tabela `alerts` quando necessário
  - [ ] Implementar `checkSLAForOccurrences()`:
    - [ ] Buscar ocorrências com status ABERTA ou EM_ATENDIMENTO
    - [ ] Verificar se `sla_deadline` está próximo (usando `alert_before_hours`)
    - [ ] Verificar se `sla_deadline` foi violado (passou da data)
    - [ ] Criar alertas na tabela `alerts` quando necessário
- [ ] **Backend - Job:**
  - [ ] Criar `src/jobs/slaCheckJob.js`
  - [ ] Implementar job que executa `checkSLAForTasks()` e `checkSLAForOccurrences()`
  - [ ] Configurar para executar a cada hora (ou intervalo configurável)
- [ ] **Configuração:**
  - [ ] Integrar job no `src/server.js` ou sistema de jobs existente
  - [ ] Configurar intervalo de execução
- [ ] **Testes:**
  - [ ] Testar verificação de SLA próximo do prazo
  - [ ] Testar verificação de SLA violado
  - [ ] Testar criação de alertas
  - [ ] Testar execução do job

**Arquivos Afetados:**
- `src/services/slaCheckService.js` (novo)
- `src/jobs/slaCheckJob.js` (novo)
- `src/server.js` (integrar job)

**Entregáveis:**
- Job de verificação de SLA funcionando
- Alertas criados automaticamente
- Executando periodicamente

---

### ✅ SLA-005: Notificações de SLA

**Descrição:** Enviar notificações por email/push quando SLA está próximo

**Tarefas:**
- [ ] **Backend - Service:**
  - [ ] Atualizar `src/services/notificationService.js` (ou criar)
  - [ ] Implementar função para enviar email de alerta de SLA
  - [ ] Criar templates de email para alertas de SLA:
    - [ ] Template: "SLA próximo do prazo" (warning)
    - [ ] Template: "SLA violado" (critical)
- [ ] **Integração:**
  - [ ] Integrar com serviço de email (nodemailer ou similar)
  - [ ] Configurar SMTP no `.env`
  - [ ] Atualizar `slaCheckService.js` para chamar notificação ao criar alerta
- [ ] **Frontend:**
  - [ ] Criar notificações in-app quando SLA está próximo (opcional)
- [ ] **Testes:**
  - [ ] Testar envio de email para SLA próximo
  - [ ] Testar envio de email para SLA violado
  - [ ] Testar notificações in-app (se implementado)

**Arquivos Afetados:**
- `src/services/notificationService.js`
- `src/services/slaCheckService.js`
- `src/jobs/slaCheckJob.js`
- Templates de email (novos arquivos)

**Entregáveis:**
- Notificações de SLA por email funcionando
- Templates de email criados
- Testes passando

---

### ✅ SLA-006: Relatório de SLA

**Descrição:** Criar relatório mostrando SLA cumprido/violado

**Tarefas:**
- [ ] **Backend - Service:**
  - [ ] Criar `src/services/slaReportService.js`
  - [ ] Implementar `getSLAReport(condominiumId, dateFrom, dateTo)`:
    - [ ] Calcular total de tarefas/ocorrências no período
    - [ ] Calcular quantas foram concluídas dentro do SLA
    - [ ] Calcular quantas violaram SLA
    - [ ] Calcular taxa de cumprimento de SLA (%)
    - [ ] Calcular tempo médio de resolução
    - [ ] Agrupar por tipo e prioridade
- [ ] **Backend - Controller:**
  - [ ] Criar rota `GET /operacional/relatorios/sla` (ou `/sindico/relatorios/sla`)
  - [ ] Implementar controller para buscar relatório
- [ ] **Frontend:**
  - [ ] Criar view `views/operacional/sla-report.ejs`
  - [ ] Exibir gráficos: taxa de cumprimento, violações por tipo, tempo médio
  - [ ] Adicionar filtros por período
  - [ ] Adicionar botão para exportar (PDF/Excel) - opcional
- [ ] **Testes:**
  - [ ] Testar cálculo de relatório de SLA
  - [ ] Testar exibição do relatório
  - [ ] Testar filtros por período

**Arquivos Afetados:**
- `src/services/slaReportService.js` (novo)
- `src/controllers/operacionalController.js` (ou `reportController.js`)
- `src/routes/operacionalRoutes.js`
- `views/operacional/sla-report.ejs` (novo)

**Entregáveis:**
- Relatório de SLA funcionando
- View de relatório implementada
- Métricas de SLA calculadas corretamente

---

**📝 RESUMO SPRINT 2:**
- Sistema de SLA completamente implementado
- Alertas automáticos funcionando
- Relatórios de SLA disponíveis
- Notificações por email configuradas

---

## 🔄 SPRINT 3: MELHORIAS DE FLUXO

**Duração:** 1-2 semanas  
**Esforço:** ~40-60 horas  
**Prioridade:** 🔴 ALTA

### Objetivo
Implementar integração automática entre ocorrências, tarefas, manutenções e orçamentos, reduzindo trabalho manual e melhorando rastreabilidade.

---

### ✅ FLU-001: Criação Automática de Tarefa a partir de Ocorrência

**Descrição:** Quando operacional cria ocorrência que requer ação, sistema cria tarefa automaticamente

**Tarefas:**
- [ ] **Database:**
  - [ ] Adicionar campo `occurrence_id` (INTEGER, nullable, FOREIGN KEY) na tabela `tasks`
  - [ ] Criar script de migração: `src/database/addTaskOccurrenceFK.sql`
  - [ ] Executar script no banco
- [ ] **Backend - Service:**
  - [ ] Atualizar `operacionalService.createOccurrence()`:
    - [ ] Verificar se ocorrência requer ação (flags: `requiresApproval`, `occurrenceType`, `priority`)
    - [ ] Se SIM, buscar configuração de tipo de tarefa para esse tipo de ocorrência
    - [ ] Criar tarefa automaticamente na tabela `tasks`:
      - [ ] `title`: Baseado no título da ocorrência
      - [ ] `description`: Descrição da ocorrência
      - [ ] `occurrence_id`: ID da ocorrência criada
      - [ ] `assigned_to`: Usuário administrativo ou baseado em regra
      - [ ] `task_type`: Baseado no tipo de ocorrência
      - [ ] `priority`: Mesma prioridade da ocorrência
      - [ ] `due_date`: Calcular baseado em SLA ou configuração
    - [ ] Notificar administrativo sobre nova tarefa criada
- [ ] **Frontend:**
  - [ ] Atualizar `views/operacional/ocorrencia-detail.ejs` para mostrar tarefa relacionada (se existir)
  - [ ] Adicionar link para a tarefa relacionada
- [ ] **Testes:**
  - [ ] Testar criação de ocorrência que gera tarefa
  - [ ] Testar criação de ocorrência que NÃO gera tarefa
  - [ ] Testar vinculação entre ocorrência e tarefa
  - [ ] Testar notificação ao administrativo

**Arquivos Afetados:**
- `src/database/addTaskOccurrenceFK.sql` (novo)
- `src/services/operacionalService.js` (função `createOccurrence()`)
- `views/operacional/ocorrencia-detail.ejs`

**Entregáveis:**
- Campo `occurrence_id` adicionado em `tasks`
- Criação automática de tarefa funcionando
- Vinculação entre ocorrência e tarefa

---

### ✅ FLU-002: Vinculação Ocorrência ↔ Tarefa Bidirecional

**Descrição:** Vincular ocorrências e tarefas bidirecionalmente (já implementado parcialmente em FLU-001)

**Tarefas:**
- [ ] **Database:**
  - [ ] Verificar se campo `task_id` já existe na tabela `occurrences`
  - [ ] Se não existir, adicionar `task_id` (INTEGER, nullable, FOREIGN KEY) na tabela `occurrences`
  - [ ] Criar script de migração se necessário
- [ ] **Backend - Service:**
  - [ ] Atualizar `operacionalService.createOccurrence()` para atualizar `task_id` quando tarefa for criada automaticamente
  - [ ] Atualizar função de criação de tarefa para atualizar `occurrence_id` quando tarefa é criada manualmente a partir de ocorrência
- [ ] **Frontend:**
  - [ ] Atualizar `views/operacional/ocorrencia-detail.ejs` para mostrar tarefa relacionada
  - [ ] Atualizar `views/operacional/task.ejs` para mostrar ocorrência relacionada (se houver)
  - [ ] Adicionar link bidirecional entre ocorrência e tarefa
- [ ] **Testes:**
  - [ ] Testar vinculação de ocorrência → tarefa
  - [ ] Testar vinculação de tarefa → ocorrência
  - [ ] Testar exibição de vínculos nas views

**Arquivos Afetados:**
- `src/database/extendTablesPhase6.sql` (adicionar campo se necessário)
- `src/services/operacionalService.js`
- `views/operacional/ocorrencia-detail.ejs`
- `views/operacional/task.ejs`

**Entregáveis:**
- Vinculação bidirecional funcionando
- Views atualizadas com vínculos

---

### ✅ FLU-003: Fechamento Automático de Tarefa ao Resolver Ocorrência

**Descrição:** Ocorrência resolvida fecha tarefas relacionadas automaticamente

**Tarefas:**
- [ ] **Backend - Service:**
  - [ ] Atualizar `operacionalService.resolveOccurrence()`:
    - [ ] Ao resolver ocorrência, buscar tarefas relacionadas (WHERE `occurrence_id = occurrenceId`)
    - [ ] Para cada tarefa relacionada com status PENDING ou IN_PROGRESS:
      - [ ] Atualizar `status = 'COMPLETED'`
      - [ ] Atualizar `completed_at = CURRENT_TIMESTAMP`
      - [ ] Atualizar `completion_notes = 'Tarefa fechada automaticamente ao resolver ocorrência relacionada'`
      - [ ] Registrar em `audit_logs`
    - [ ] Notificar operacional sobre tarefas fechadas automaticamente
- [ ] **Testes:**
  - [ ] Testar resolução de ocorrência com tarefa relacionada
  - [ ] Testar fechamento automático de tarefa
  - [ ] Testar log de auditoria

**Arquivos Afetados:**
- `src/services/operacionalService.js` (função `resolveOccurrence()`)

**Entregáveis:**
- Fechamento automático de tarefas funcionando
- Logs de auditoria registrados

---

### ✅ FLU-004: Fluxo de Execução de Orçamento

**Descrição:** Criar fluxo claro para operacional executar orçamento aprovado

**Tarefas:**
- [ ] **Database:**
  - [ ] Verificar se tabela `budget_requests` tem campo para rastrear execução
  - [ ] Adicionar campos se necessário: `execution_status` (PENDING, IN_PROGRESS, EXECUTED), `executed_by`, `executed_at`
- [ ] **Backend - Service:**
  - [ ] Criar `src/services/orcamentoService.js` (ou atualizar se existir):
    - [ ] Implementar `startExecution(budgetId, userId)`: Inicia execução de orçamento
    - [ ] Implementar `linkToMaintenance(budgetId, maintenanceId)`: Vincula orçamento a manutenção
    - [ ] Implementar `completeExecution(budgetId, userId, completionData)`: Finaliza execução
- [ ] **Backend - Controller:**
  - [ ] Adicionar rotas em `operacionalRoutes.js`:
    - [ ] `POST /operacional/orcamentos/:id/iniciar-execucao` - Inicia execução
    - [ ] `POST /operacional/orcamentos/:id/vincular-manutencao` - Vincula a manutenção
    - [ ] `POST /operacional/orcamentos/:id/finalizar-execucao` - Finaliza execução
- [ ] **Frontend:**
  - [ ] Atualizar `views/operacional/orcamentos.ejs`:
    - [ ] Adicionar botão "Iniciar Execução" para orçamentos LIBERATED
    - [ ] Adicionar botão "Vincular a Manutenção" para orçamentos em execução
    - [ ] Adicionar botão "Finalizar Execução" para orçamentos em execução
    - [ ] Mostrar status de execução do orçamento
  - [ ] Criar view `views/operacional/budget-execution.ejs` para formulário de execução
- [ ] **Testes:**
  - [ ] Testar início de execução de orçamento
  - [ ] Testar vinculação a manutenção
  - [ ] Testar finalização de execução

**Arquivos Afetados:**
- `src/database/` (adicionar campos se necessário)
- `src/services/orcamentoService.js`
- `src/controllers/operacionalController.js`
- `src/routes/operacionalRoutes.js`
- `views/operacional/orcamentos.ejs`
- `views/operacional/budget-execution.ejs` (novo)

**Entregáveis:**
- Fluxo de execução de orçamento funcionando
- Views atualizadas com ações de execução

---

### ✅ FLU-005: Vinculação Manutenção ↔ Ocorrência

**Descrição:** Vincular manutenções às ocorrências que as geraram

**Tarefas:**
- [ ] **Database:**
  - [ ] Verificar se tabela `maintenances` tem campo `occurrence_id`
  - [ ] Se não existir, adicionar `occurrence_id` (INTEGER, nullable, FOREIGN KEY) na tabela `maintenances`
  - [ ] Criar script de migração se necessário
- [ ] **Backend - Service:**
  - [ ] Atualizar função de criação de manutenção para aceitar `occurrence_id`
  - [ ] Quando manutenção é criada a partir de ocorrência, vincular automaticamente
- [ ] **Frontend:**
  - [ ] Atualizar views de manutenção para mostrar ocorrência relacionada (se houver)
  - [ ] Atualizar views de ocorrência para mostrar manutenções relacionadas (se houver)
- [ ] **Testes:**
  - [ ] Testar vinculação de manutenção → ocorrência
  - [ ] Testar exibição de vínculos nas views

**Arquivos Afetados:**
- `src/database/` (adicionar campo se necessário)
- `src/services/manutencaoService.js` (ou onde manutenções são criadas)
- Views de manutenção e ocorrência

**Entregáveis:**
- Vinculação manutenção ↔ ocorrência funcionando
- Views atualizadas

---

**📝 RESUMO SPRINT 3:**
- Integração automática entre ocorrências, tarefas, manutenções e orçamentos
- Fechamento automático de tarefas ao resolver ocorrências
- Fluxo de execução de orçamentos implementado

---

## ✅ SPRINT 4: SISTEMA DE REVISÃO

**Duração:** 1 semana  
**Esforço:** ~20-30 horas  
**Prioridade:** 🟡 MÉDIA

### Objetivo
Implementar sistema de revisão de trabalho concluído, permitindo controle de qualidade por supervisor.

---

### ✅ REV-001: Campos de Revisão na Tabela Tasks

**Descrição:** Adicionar campos para revisão de tarefas concluídas

**Tarefas:**
- [ ] **Database:**
  - [ ] Criar script SQL: `src/database/addTaskReviewFields.sql`
  - [ ] Adicionar campos na tabela `tasks`:
    - [ ] `review_status` (VARCHAR(20), nullable, DEFAULT NULL) - Valores: PENDING, APPROVED, REJECTED
    - [ ] `reviewed_by` (INTEGER, nullable, FOREIGN KEY → users.id)
    - [ ] `review_notes` (TEXT, nullable)
    - [ ] `reviewed_at` (TIMESTAMP, nullable)
  - [ ] Executar script no banco
- [ ] **Backend - Service:**
  - [ ] Atualizar `operacionalService.completeTask()` para definir `review_status = 'PENDING'` ao concluir tarefa
- [ ] **Testes:**
  - [ ] Testar criação de campos
  - [ ] Testar atualização de `review_status` ao concluir tarefa

**Arquivos Afetados:**
- `src/database/addTaskReviewFields.sql` (novo)
- `src/services/operacionalService.js`

**Entregáveis:**
- Campos de revisão adicionados na tabela `tasks`

---

### ✅ REV-002: Interface de Revisão para Supervisor

**Descrição:** Criar interface para supervisor revisar tarefas concluídas

**Tarefas:**
- [ ] **Backend - Service:**
  - [ ] Criar `src/services/reviewService.js`:
    - [ ] Implementar `listPendingReviews(condominiumId)`: Lista tarefas com `review_status = 'PENDING'`
    - [ ] Implementar `reviewTask(taskId, userId, reviewStatus, reviewNotes)`: Aprova ou rejeita tarefa
- [ ] **Backend - Controller:**
  - [ ] Criar rotas em `administrativoRoutes.js` (ou `sindicoRoutes.js`):
    - [ ] `GET /administrativo/revisoes` - Lista tarefas pendentes de revisão
    - [ ] `GET /administrativo/revisoes/:id` - Exibe formulário de revisão
    - [ ] `POST /administrativo/revisoes/:id/aprovar` - Aprova tarefa
    - [ ] `POST /administrativo/revisoes/:id/rejeitar` - Rejeita tarefa
- [ ] **Frontend:**
  - [ ] Criar view `views/administrativo/revisoes.ejs` - Lista de tarefas pendentes
  - [ ] Criar view `views/administrativo/review-task.ejs` - Formulário de revisão
  - [ ] Adicionar campos: `review_notes` (textarea), botões "Aprovar" e "Rejeitar"
- [ ] **Notificações:**
  - [ ] Notificar operacional quando tarefa é rejeitada
- [ ] **Testes:**
  - [ ] Testar listagem de tarefas pendentes de revisão
  - [ ] Testar aprovação de tarefa
  - [ ] Testar rejeição de tarefa
  - [ ] Testar notificação ao operacional

**Arquivos Afetados:**
- `src/services/reviewService.js` (novo)
- `src/controllers/administrativoController.js` (ou criar `reviewController.js`)
- `src/routes/administrativoRoutes.js`
- `views/administrativo/revisoes.ejs` (novo)
- `views/administrativo/review-task.ejs` (novo)

**Entregáveis:**
- Interface de revisão funcionando
- Aprovação/rejeição de tarefas implementada

---

### ✅ REV-003: Reabertura de Tarefa Rejeitada

**Descrição:** Permitir reabertura de tarefa quando rejeitada na revisão

**Tarefas:**
- [ ] **Backend - Service:**
  - [ ] Atualizar `operacionalService.completeTask()` (ou criar função `reopenTask()`):
    - [ ] Quando `review_status = 'REJECTED'`, permitir mudança de status de COMPLETED para PENDING
    - [ ] Validar que apenas o operacional que executou pode reabrir
    - [ ] Atualizar `review_status = NULL` ao reabrir
  - [ ] Criar rota `POST /operacional/tarefas/:id/reabrir` para reabrir tarefa
- [ ] **Frontend:**
  - [ ] Atualizar `views/operacional/task.ejs` para mostrar botão "Reabrir" quando tarefa foi rejeitada
  - [ ] Adicionar formulário de reabertura (campo para justificativa)
- [ ] **Testes:**
  - [ ] Testar rejeição de tarefa
  - [ ] Testar reabertura de tarefa rejeitada
  - [ ] Testar validação de permissão

**Arquivos Afetados:**
- `src/services/operacionalService.js`
- `src/controllers/operacionalController.js`
- `src/routes/operacionalRoutes.js`
- `views/operacional/task.ejs`

**Entregáveis:**
- Reabertura de tarefas rejeitadas funcionando

---

**📝 RESUMO SPRINT 4:**
- Sistema de revisão de tarefas implementado
- Aprovação/rejeição por supervisor funcionando
- Reabertura de tarefas rejeitadas implementada

---

## 📊 SPRINT 5: RELATÓRIOS E ANALYTICS

**Duração:** 1-2 semanas  
**Esforço:** ~40-60 horas  
**Prioridade:** 🟡 MÉDIA

### Objetivo
Implementar relatórios e analytics para análise de produtividade e performance do operacional.

---

### ✅ REP-001: Relatório de Produtividade do Operacional

**Descrição:** Relatório mostrando tarefas concluídas, tempo médio, qualidade

**Tarefas:**
- [ ] **Backend - Service:**
  - [ ] Criar `src/services/reportService.js`:
    - [ ] Implementar `getOperationalProductivityReport(condominiumId, userId, dateFrom, dateTo)`:
      - [ ] Total de tarefas concluídas no período
      - [ ] Tempo médio de conclusão (usar `completion_time_minutes` ou `completed_at - created_at`)
      - [ ] Taxa de sucesso (`completion_success = TRUE` / total)
      - [ ] Qualidade média (agregar `completion_quality`)
      - [ ] Tarefas por tipo
      - [ ] Tarefas por prioridade
- [ ] **Backend - Controller:**
  - [ ] Adicionar rota `GET /operacional/relatorios/produtividade`
  - [ ] Implementar controller para buscar relatório
- [ ] **Frontend:**
  - [ ] Criar view `views/operacional/productivity-report.ejs`:
    - [ ] Exibir métricas calculadas
    - [ ] Gráfico de tarefas concluídas ao longo do tempo (opcional)
    - [ ] Gráfico de distribuição por qualidade (opcional)
    - [ ] Filtros por período e usuário
    - [ ] Botão para exportar (PDF/Excel) - opcional
- [ ] **Testes:**
  - [ ] Testar cálculo de relatório
  - [ ] Testar filtros por período
  - [ ] Testar exibição de relatório

**Arquivos Afetados:**
- `src/services/reportService.js` (novo ou atualizar)
- `src/controllers/operacionalController.js`
- `src/routes/operacionalRoutes.js`
- `views/operacional/productivity-report.ejs` (novo)

**Entregáveis:**
- Relatório de produtividade funcionando
- Métricas calculadas corretamente

---

### ✅ REP-002: Análise de Ocorrências Recorrentes

**Descrição:** Identificar ocorrências que se repetem (mesmo local, mesmo tipo)

**Tarefas:**
- [ ] **Backend - Service:**
  - [ ] Implementar `getRecurringOccurrencesReport(condominiumId, dateFrom, dateTo)` em `reportService.js`:
    - [ ] Agrupar ocorrências por `location` e `occurrence_type`
    - [ ] Contar frequência de cada grupo
    - [ ] Ordenar por frequência (mais recorrentes primeiro)
    - [ ] Calcular tempo médio entre ocorrências recorrentes
    - [ ] Sugerir ações preventivas (opcional)
- [ ] **Backend - Controller:**
  - [ ] Adicionar rota `GET /operacional/relatorios/ocorrencias-recorrentes`
- [ ] **Frontend:**
  - [ ] Criar view `views/operacional/recurring-occurrences.ejs`:
    - [ ] Exibir tabela de ocorrências recorrentes
    - [ ] Mostrar localização, tipo, frequência
    - [ ] Gráfico de frequência (opcional)
    - [ ] Filtros por período
- [ ] **Testes:**
  - [ ] Testar agrupamento de ocorrências
  - [ ] Testar cálculo de frequência
  - [ ] Testar exibição de relatório

**Arquivos Afetados:**
- `src/services/reportService.js`
- `src/controllers/operacionalController.js`
- `src/routes/operacionalRoutes.js`
- `views/operacional/recurring-occurrences.ejs` (novo)

**Entregáveis:**
- Análise de ocorrências recorrentes funcionando

---

### ✅ REP-003: Métricas de Tempo Médio de Conclusão

**Descrição:** Calcular tempo médio de conclusão por tipo de tarefa

**Tarefas:**
- [ ] **Backend - Service:**
  - [ ] Atualizar `operacionalService.getDashboardStats()`:
    - [ ] Adicionar cálculo de tempo médio de conclusão por tipo de tarefa
    - [ ] Usar `completion_time_minutes` ou calcular `completed_at - created_at`
    - [ ] Agrupar por `task_type`
- [ ] **Frontend:**
  - [ ] Atualizar `views/operacional/dashboard.ejs`:
    - [ ] Exibir métricas de tempo médio no dashboard
    - [ ] Adicionar cards ou gráficos mostrando tempo médio por tipo
- [ ] **Testes:**
  - [ ] Testar cálculo de tempo médio
  - [ ] Testar exibição no dashboard

**Arquivos Afetados:**
- `src/services/operacionalService.js` (função `getDashboardStats()`)
- `views/operacional/dashboard.ejs`

**Entregáveis:**
- Métricas de tempo médio exibidas no dashboard

---

**📝 RESUMO SPRINT 5:**
- Relatórios de produtividade implementados
- Análise de ocorrências recorrentes funcionando
- Métricas de tempo médio no dashboard

---

## 🤖 SPRINT 6: AUTOMAÇÃO E MELHORIAS DE UX

**Duração:** 1 semana  
**Esforço:** ~20-30 horas  
**Prioridade:** 🟡 BAIXA

### Objetivo
Implementar melhorias de automação e experiência do usuário para aumentar produtividade e satisfação.

---

### ✅ AUT-001: Integração Completa de Checklists Diários

**Descrição:** Garantir que checklists diários estejam totalmente integrados ao workflow

**Tarefas:**
- [ ] **Verificação:**
  - [ ] Verificar se job de geração automática está rodando (ver `src/jobs/`)
  - [ ] Verificar se `generateDailyChecklists()` está sendo chamada diariamente
  - [ ] Testar geração manual de checklists diários
- [ ] **Backend - Job:**
  - [ ] Se necessário, criar ou atualizar `src/jobs/dailyChecklistJob.js`:
    - [ ] Implementar job que executa `dailyChecklistService.generateDailyChecklists()` diariamente
    - [ ] Configurar para executar às 00:00 (ou horário configurável)
  - [ ] Integrar job no `src/server.js`
- [ ] **Testes:**
  - [ ] Testar geração automática de checklists
  - [ ] Testar execução diária do job

**Arquivos Afetados:**
- `src/jobs/dailyChecklistJob.js` (verificar ou criar)
- `src/server.js`
- `src/services/dailyChecklistService.js`

**Entregáveis:**
- Checklists diários sendo gerados automaticamente todos os dias

---

### ✅ AUT-002: Escalonamento Automático de Ocorrências

**Descrição:** Escalar ocorrências para supervisor quando não resolvidas no prazo

**Tarefas:**
- [ ] **Backend - Service:**
  - [ ] Atualizar `slaCheckService.js`:
    - [ ] Ao verificar SLA violado de ocorrências, adicionar lógica de escalonamento
    - [ ] Identificar supervisor (role ADMINISTRATIVO ou SINDICO)
    - [ ] Notificar supervisor sobre ocorrência escalada
    - [ ] Opcionalmente, atualizar `assigned_to` da ocorrência para supervisor
    - [ ] Criar alerta na tabela `alerts` com severidade CRITICAL
- [ ] **Frontend:**
  - [ ] Atualizar views para mostrar ocorrências escaladas com destaque
- [ ] **Testes:**
  - [ ] Testar escalonamento automático de ocorrências com SLA violado
  - [ ] Testar notificação ao supervisor

**Arquivos Afetados:**
- `src/services/slaCheckService.js`
- `src/jobs/slaCheckJob.js`
- Views de ocorrências

**Entregáveis:**
- Escalonamento automático de ocorrências funcionando

---

### ✅ AUT-003: Criação Automática de Tarefa a partir de Ocorrência

**Descrição:** Já implementado em FLU-001 (verificar se completo)

**Tarefas:**
- [ ] Verificar se FLU-001 foi completado
- [ ] Se não, seguir tarefas de FLU-001

**Entregáveis:**
- Verificação de completude de FLU-001

---

### ✅ UX-001: Feedback Visual de Salvamento

**Descrição:** Adicionar indicador "salvando..." ao atualizar checklist

**Tarefas:**
- [ ] **Frontend:**
  - [ ] Atualizar `views/operacional/checklist.ejs`:
    - [ ] Adicionar spinner/loading ao enviar formulário
    - [ ] Desabilitar botões durante salvamento
    - [ ] Mostrar mensagem "Salvando..." durante processo
    - [ ] Mostrar mensagem de sucesso após salvar
- [ ] **JavaScript:**
  - [ ] Implementar JavaScript para mostrar/ocultar loading
  - [ ] Adicionar evento de submit nos formulários
- [ ] **Testes:**
  - [ ] Testar feedback visual ao salvar

**Arquivos Afetados:**
- `views/operacional/checklist.ejs`
- JavaScript inline ou arquivo separado

**Entregáveis:**
- Feedback visual de salvamento funcionando

---

### ✅ UX-002: Tooltips Explicativos

**Descrição:** Adicionar tooltips explicando campos e funcionalidades

**Tarefas:**
- [ ] **Frontend:**
  - [ ] Adicionar tooltips em campos importantes:
    - [ ] Tooltip em "Checklist" vs "Checklists Diários" explicando diferença
    - [ ] Tooltip em "Ocorrência" vs "Tarefa" explicando quando usar cada um
    - [ ] Tooltips em campos de formulários explicando o que é esperado
  - [ ] Usar atributo `title` ou tooltip library (Bootstrap, Popper.js)
- [ ] **Testes:**
  - [ ] Testar exibição de tooltips
  - [ ] Verificar se tooltips são úteis e claros

**Arquivos Afetados:**
- Todas as views do operacional (adicionar tooltips)

**Entregáveis:**
- Tooltips explicativos adicionados

---

### ✅ UX-003: Ordenação por Prioridade

**Descrição:** Mostrar tarefas URGENTE primeiro na lista

**Tarefas:**
- [ ] **Backend - Service:**
  - [ ] Atualizar `operacionalService.listTasks()`:
    - [ ] Atualizar ORDER BY para priorizar URGENTE: `ORDER BY priority DESC, due_date ASC`
    - [ ] Mapear prioridades: URGENTE = 4, ALTA = 3, NORMAL = 2, BAIXA = 1
- [ ] **Frontend:**
  - [ ] Adicionar destaque visual para tarefas URGENTE (borda vermelha, ícone)
- [ ] **Testes:**
  - [ ] Testar ordenação por prioridade
  - [ ] Verificar se tarefas URGENTE aparecem primeiro

**Arquivos Afetados:**
- `src/services/operacionalService.js` (função `listTasks()`)
- `views/operacional/checklist.ejs`

**Entregáveis:**
- Ordenação por prioridade funcionando
- Destaque visual para URGENTE

---

**📝 RESUMO SPRINT 6:**
- Automações implementadas
- Melhorias de UX adicionadas
- Checklist completo

---

## 🚀 FUTURO: MELHORIAS AVANÇADAS

**Prioridade:** 🟢 FUTURO  
**Estimativa:** 200+ horas

### Melhorias de Longo Prazo (Não incluídas no escopo atual):

1. **App Mobile (React Native / Flutter)**
   - App nativo para iOS e Android
   - Funcionalidade offline
   - Upload de fotos direto da câmera
   - Notificações push

2. **Geolocalização**
   - GPS nas ocorrências
   - Mapa de ocorrências no condomínio
   - Check-in em locais específicos

3. **Análise Preditiva**
   - ML para prever manutenções
   - Identificação de padrões
   - Alertas inteligentes

---

## 📊 STATUS GERAL DO PLANO

**Última Atualização:** Janeiro 2026

### Progresso por Sprint:
- [ ] Sprint 1: Correções Técnicas Urgentes (0/5 itens)
- [ ] Sprint 2: Sistema de SLA (0/6 itens)
- [ ] Sprint 3: Melhorias de Fluxo (0/5 itens)
- [ ] Sprint 4: Sistema de Revisão (0/3 itens)
- [ ] Sprint 5: Relatórios e Analytics (0/3 itens)
- [ ] Sprint 6: Automação e Melhorias de UX (0/6 itens)

### Total de Progresso:
**0/38 melhorias implementadas (0%)**

---

**Próximos Passos:**
1. Revisar e aprovar este plano
2. Priorizar sprints conforme necessidade comercial
3. Alocar recursos de desenvolvimento
4. Iniciar Sprint 1 (Correções Técnicas Urgentes)
