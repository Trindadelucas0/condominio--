# 📋 LÓGICA DE IMPLEMENTAÇÃO - NOVAS FUNCIONALIDADES

## 🎯 VISÃO GERAL

Este documento apresenta a lógica detalhada para implementação das novas funcionalidades solicitadas, adaptadas ao sistema existente.

---

## 1️⃣ SISTEMA DE NOTIFICAÇÕES

### 📊 **Situação Atual**
- Existe tabela `notifications` (criada na FASE 10)
- Existe tabela `alerts` (alertas do sistema)
- **NÃO existe** integração completa de notificações em tempo real
- **NÃO existe** sistema de notificações no dashboard

### 🔄 **Lógica Proposta**

#### **1.1 Estrutura de Notificações**

**Tabela `notifications` (já existe, pode precisar ajustes):**
```
- id
- user_id (destinatário)
- condominium_id
- title
- message
- notification_type (TASK_ASSIGNED, MAINTENANCE_CREATED, APPROVAL_PENDING, etc)
- entity_type (tasks, maintenances, approvals, etc)
- entity_id
- read (boolean)
- read_at
- created_at
```

**Novos tipos de notificação:**
- `MAINTENANCE_CREATED` - Manutenção criada pelo síndico
- `MAINTENANCE_ASSIGNED` - Manutenção atribuída ao operacional
- `MAINTENANCE_COMPLETED` - Manutenção concluída
- `ENTRY_PENDING_REVIEW` - Entrada financeira aguardando análise do síndico
- `ENTRY_APPROVED` - Entrada aprovada pelo síndico
- `ENTRY_REJECTED` - Entrada rejeitada (volta pro financeiro)
- `BUDGET_PENDING_FINANCEIRO` - Orçamento aguardando financeiro
- `BUDGET_PENDING_SINDICO` - Orçamento aguardando síndico
- `BUDGET_APPROVED` - Orçamento aprovado (libera valor)
- `OCCURRENCE_CREATED` - Ocorrência criada
- `OCCURRENCE_REQUIRES_APPROVAL` - Ocorrência precisa de aprovação

#### **1.2 Quando Criar Notificações**

**Regra Geral:** Criar notificação sempre que:
1. Uma ação requer atenção de outro usuário
2. Um status muda e alguém precisa ser avisado
3. Um prazo está próximo de vencer
4. Uma aprovação é necessária

**Pontos Específicos:**
- ✅ Manutenção criada → Notificar operacional atribuído
- ✅ Manutenção concluída → Notificar síndico
- ✅ Entrada financeira criada → Notificar síndico
- ✅ Entrada rejeitada → Notificar financeiro
- ✅ Orçamento criado → Notificar financeiro
- ✅ Orçamento aprovado → Notificar operacional
- ✅ Ocorrência criada → Notificar destinatário (se especificado)

#### **1.3 Dashboard - Exibição de Notificações**

**Para TODOS os usuários:**
- Badge no menu com contador de não lidas
- Seção no dashboard com últimas 5-10 notificações
- Link para ver todas as notificações
- Marcar como lida ao clicar

**Filtros no dashboard:**
- Notificações não lidas (prioridade)
- Notificações do dia
- Notificações da semana

---

## 2️⃣ MANUTENÇÃO CORRETIVA E PREVENTIVA

### 📊 **Situação Atual**
- Existe tabela `asset_maintenances` (manutenções de ativos)
- Existe campo `maintenance_type` (PREVENTIVA, CORRETIVA)
- **NÃO existe** sistema dedicado de manutenções independentes de ativos
- **NÃO existe** fluxo: Síndico cria → Operacional executa → Notifica

### 🔄 **Lógica Proposta**

#### **2.1 Nova Tabela: `maintenances`**

**Estrutura:**
```
- id
- condominium_id
- maintenance_type (PREVENTIVA, CORRETIVA)
- title
- description
- location (opcional - onde será feita)
- priority (BAIXA, NORMAL, ALTA, URGENTE)
- scheduled_date (data prevista - para preventivas)
- assigned_to (operacional responsável)
- status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- completed_at
- completed_by
- completion_notes
- cost (custo, se houver)
- asset_id (opcional - se vinculada a um ativo)
- created_by (síndico que criou)
- created_at
- updated_at
```

**Diferença entre Preventiva e Corretiva:**
- **PREVENTIVA:** Agendada, periódica, preventiva
- **CORRETIVA:** Reparo, correção de problema, urgente

#### **2.2 Fluxo Completo**

```
1. SÍNDICO cria manutenção
   └─> Preenche: tipo, título, descrição, localização, prioridade
   └─> Se PREVENTIVA: define scheduled_date
   └─> Atribui a operacional (assigned_to)
   └─> Status: PENDING
   └─> NOTIFICA operacional atribuído

2. OPERACIONAL recebe notificação
   └─> Vê no dashboard
   └─> Aceita/Inicia manutenção
   └─> Status: IN_PROGRESS
   └─> Executa trabalho
   └─> Preenche completion_notes
   └─> Se houver custo, preenche cost
   └─> Status: COMPLETED
   └─> NOTIFICA síndico

3. SÍNDICO recebe notificação de conclusão
   └─> Vê no dashboard
   └─> Pode revisar completion_notes
   └─> Se houver custo, pode aprovar/desaprovar
```

#### **2.3 Dashboard - Exibição**

**Síndico:**
- Manutenções criadas por ele (todas)
- Manutenções concluídas (aguardando revisão)
- Manutenções pendentes (não iniciadas)
- Manutenções em andamento

**Operacional:**
- Manutenções atribuídas a ele
- Manutenções pendentes (para iniciar)
- Manutenções em andamento (suas)
- Manutenções concluídas (histórico)

**Cards no Dashboard:**
- "Manutenções Pendentes" (contador)
- "Manutenções em Andamento" (contador)
- "Manutenções Concluídas Hoje" (contador)

---

## 3️⃣ ADM PASSA CHECKLIST/DEMANDA FIXA/TRABALHO DA SEMANA

### 📊 **Situação Atual**
- Existe sistema de tarefas (`tasks`)
- Existe sistema de checklists (`checklists`)
- Existe sistema de modelos de checklist (`checklist_models`) - FASE proposta
- **PARCIALMENTE IMPLEMENTADO** - precisa verificar se está completo

### 🔄 **Lógica Proposta**

#### **3.1 Verificação do Sistema Atual**

**O que já existe:**
- ✅ ADM pode criar tarefas (`tasks`)
- ✅ Tarefas podem ter checklists (`checklists`)
- ✅ Tarefas são atribuídas a operacionais (`assigned_to`)

**O que pode estar faltando:**
- ❓ Sistema de modelos/templates de checklist
- ❓ Sistema de recorrência (demanda fixa/semanal)
- ❓ Passagem automática para departamentos

#### **3.2 Fluxo Proposto**

**Cenário 1: Checklist Manual (Já existe)**
```
ADM cria tarefa → Define operacional → Adiciona checklist → Salva
Operacional recebe → Executa → Conclui
```

**Cenário 2: Demanda Fixa/Semanal (Novo)**
```
ADM cria modelo de checklist semanal
  └─> Define: nome, departamento, dias da semana, itens
  └─> Sistema gera automaticamente todo dia X
  └─> Atribui ao departamento (não pessoa específica)
  └─> Operacional do departamento vê e executa
```

**Cenário 3: Trabalho da Semana (Novo)**
```
ADM cria "Plano Semanal"
  └─> Define tarefas para a semana
  └─> Atribui a departamentos ou pessoas
  └─> Sistema distribui ao longo da semana
  └─> Operacional vê no dashboard
```

#### **3.3 Adaptação ao Sistema Existente**

**Se sistema de modelos já existe:**
- ✅ Usar `checklist_models` existente
- ✅ Verificar se job automático está funcionando
- ✅ Verificar se atribuição por departamento funciona

**Se sistema de modelos NÃO existe:**
- Implementar conforme `ANALISE_CHECKLIST_REGRA.md`
- Criar tabelas: `checklist_models`, `checklist_model_items`
- Criar job que gera checklists diários
- Adaptar dashboard operacional para mostrar checklists gerados

#### **3.4 Notificações**

- ✅ Quando ADM cria tarefa → Notificar operacional atribuído
- ✅ Quando checklist semanal é gerado → Notificar departamento
- ✅ Quando trabalho da semana é distribuído → Notificar operacionais

---

## 4️⃣ FINANCEIRO - CRIAR CONTA ENTRADA COM FLUXO DE APROVAÇÃO

### 📊 **Situação Atual**
- Existe tabela `financial_entries` (entradas)
- Existe campo `received` (boolean)
- Existe campo `received_at`
- **NÃO existe** fluxo de aprovação do síndico
- **NÃO existe** sistema de observações/rejeição

### 🔄 **Lógica Proposta**

#### **4.1 Nova Estrutura para Entradas**

**Campos a adicionar em `financial_entries`:**
```
- status (PENDING_REVIEW, APPROVED, REJECTED, RECEIVED)
- reviewed_by (síndico que analisou)
- reviewed_at (data da análise)
- review_notes (observações do síndico)
- rejection_reason (motivo da rejeição, se rejeitada)
- linked_to (opcional - vincular a outra entrada/saída)
```

**OU usar State Machine existente:**
- Adicionar estados: `PENDING_REVIEW`, `APPROVED`, `REJECTED`
- Manter `RECEIVED` como estado final

#### **4.2 Fluxo Completo**

```
1. FINANCEIRO cria entrada
   └─> Preenche: descrição, valor, data, categoria, centro de custo
   └─> Opcional: vincular a outra entrada/saída (linked_to)
   └─> Status: PENDING_REVIEW
   └─> NOTIFICA síndico

2. SÍNDICO recebe notificação
   └─> Vê no dashboard: "Entradas aguardando análise"
   └─> Acessa lista de entradas pendentes
   └─> Analisa cada entrada
   └─> Opções:
       a) APROVAR (sem observações)
          └─> Status: APPROVED
          └─> Entrada entra no cálculo de entradas
          └─> NOTIFICA financeiro
       b) APROVAR (com observações)
          └─> Status: APPROVED
          └─> Adiciona review_notes
          └─> Entrada entra no cálculo de entradas
          └─> NOTIFICA financeiro (com observações)
       c) REJEITAR
          └─> Status: REJECTED
          └─> Adiciona rejection_reason (obrigatório)
          └─> NOTIFICA financeiro

3. FINANCEIRO recebe notificação
   └─> Se APROVADA:
       └─> Pode ver observações (se houver)
       └─> Quando receber dinheiro, marca como RECEIVED
   └─> Se REJEITADA:
       └─> Vê motivo da rejeição
       └─> Pode: EDITAR, ALTERAR ou EXCLUIR
       └─> Se editar/alterar:
           └─> Status volta para PENDING_REVIEW
           └─> NOTIFICA síndico novamente
       └─> Se excluir:
           └─> Entrada é deletada (ou arquivada)

4. Cálculo de Entradas
   └─> Só considera entradas com status APPROVED ou RECEIVED
   └─> Entradas PENDING_REVIEW ou REJECTED não entram no cálculo
```

#### **4.3 Mesma Lógica para Saídas**

**Fluxo similar:**
```
FINANCEIRO cria saída → Status: PENDING_REVIEW → NOTIFICA síndico
SÍNDICO analisa → APROVA/REJEITA → NOTIFICA financeiro
FINANCEIRO recebe → Se rejeitada, pode editar/excluir
```

**Diferença:** Saídas já têm sistema de aprovação, mas pode precisar ajustar para incluir observações e rejeição com motivo.

#### **4.4 Dashboard**

**Síndico:**
- Card: "Entradas aguardando análise" (contador)
- Card: "Saídas aguardando análise" (contador)
- Lista de entradas/saídas pendentes

**Financeiro:**
- Card: "Entradas rejeitadas" (contador)
- Card: "Saídas rejeitadas" (contador)
- Lista de entradas/saídas rejeitadas (para corrigir)

---

## 5️⃣ FLUXO DE ORÇAMENTO - OPERACIONAL CRIA COM VALOR

### 📊 **Situação Atual**
- Existe tabela `budget_requests` (solicitações de orçamento)
- Existe fluxo básico de aprovação
- **NÃO existe** fluxo completo: Operacional → Financeiro → Síndico → Financeiro → Operacional

### 🔄 **Lógica Proposta**

#### **5.1 Estrutura Existente vs Necessária**

**Tabela `budget_requests` (verificar campos):**
```
- id
- condominium_id
- requested_by (operacional que criou)
- description
- amount (valor estimado)
- status (PENDING, APPROVED, REJECTED, PURCHASED)
- approved_by
- approved_at
```

**Campos que podem precisar adicionar:**
```
- financeiro_reviewed (boolean)
- financeiro_reviewed_by
- financeiro_reviewed_at
- financeiro_notes (observações do financeiro)
- sindico_notes (observações do síndico)
- budget_approved_amount (valor aprovado - pode ser diferente do solicitado)
- released_to_operational (boolean) - se valor foi liberado
```

#### **5.2 Fluxo Completo**

```
1. OPERACIONAL cria ocorrência/tarefa com valor
   └─> Preenche: descrição, valor estimado, localização
   └─> Sistema cria budget_request automaticamente
   └─> Status: PENDING_FINANCEIRO
   └─> NOTIFICA financeiro

2. FINANCEIRO recebe notificação
   └─> Vê no dashboard: "Orçamentos aguardando análise"
   └─> Acessa orçamento
   └─> Preenche campos obrigatórios:
       - Verifica valor
       - Adiciona centro de custo (se necessário)
       - Adiciona observações (financeiro_notes)
   └─> Envia para síndico
   └─> Status: PENDING_SINDICO
   └─> NOTIFICA síndico

3. SÍNDICO recebe notificação
   └─> Vê no dashboard: "Orçamentos aguardando aprovação"
   └─> Acessa orçamento
   └─> Vê informações do financeiro
   └─> Preenche campos obrigatórios:
       - Valor aprovado (pode ser diferente do solicitado)
       - Observações (sindico_notes)
   └─> Opções:
       a) APROVAR
          └─> Status: APPROVED
          └─> budget_approved_amount = valor aprovado
          └─> NOTIFICA financeiro
       b) REJEITAR
          └─> Status: REJECTED
          └─> Adiciona motivo
          └─> NOTIFICA financeiro

4. FINANCEIRO recebe notificação
   └─> Se APROVADA:
       └─> Analisa e confere tudo
       └─> Opções:
           a) Tudo OK → Libera para operacional
              └─> released_to_operational = TRUE
              └─> Status: PURCHASED (ou novo status LIBERATED)
              └─> NOTIFICA operacional
           b) Precisa ajustar → Retorna para síndico
              └─> Status: PENDING_SINDICO
              └─> Adiciona observações
              └─> NOTIFICA síndico
   └─> Se REJEITADA:
       └─> Pode editar orçamento
       └─> Status volta para PENDING_SINDICO
       └─> NOTIFICA síndico

5. OPERACIONAL recebe notificação
   └─> Orçamento liberado
   └─> Vê valor aprovado
   └─> Pode executar trabalho
   └─> Quando concluir, pode registrar custo real
```

#### **5.3 Campos Obrigatórios por Etapa**

**Financeiro (ao receber):**
- ✅ Centro de custo (se aplicável)
- ✅ Verificação de valor
- ✅ Observações (opcional, mas recomendado)

**Síndico (ao receber):**
- ✅ Valor aprovado (obrigatório se aprovar)
- ✅ Observações (opcional)

**Financeiro (após aprovação):**
- ✅ Conferência final
- ✅ Decisão: Liberar ou retornar

#### **5.4 Dashboard**

**Operacional:**
- Card: "Orçamentos pendentes" (aguardando aprovação)
- Card: "Orçamentos liberados" (pode executar)

**Financeiro:**
- Card: "Orçamentos aguardando análise" (novos)
- Card: "Orçamentos aprovados" (para conferir e liberar)
- Card: "Orçamentos rejeitados" (para ajustar)

**Síndico:**
- Card: "Orçamentos aguardando aprovação"
- Lista de orçamentos com valores

---

## 6️⃣ OCORRÊNCIAS COM OPÇÃO DE APROVAÇÃO

### 📊 **Situação Atual**
- Existe tabela `occurrences` (ocorrências)
- Existe campo `status` (ABERTA, EM_ATENDIMENTO, etc)
- Existe campo `assigned_to` (responsável)
- **NÃO existe** campo para especificar destinatário
- **NÃO existe** sistema de aprovação para ocorrências
- **NÃO existe** distinção entre ocorrências que precisam/não precisam de aprovação

### 🔄 **Lógica Proposta**

#### **6.1 Nova Estrutura para Ocorrências**

**Campos a adicionar em `occurrences`:**
```
- requires_approval (boolean) - se precisa de aprovação
- approval_required_from (SINDICO, ADMINISTRATIVO, FINANCEIRO) - quem deve aprovar
- approval_status (PENDING, APPROVED, REJECTED) - status da aprovação
- approved_by (user_id)
- approved_at
- rejection_reason
- sent_to (user_id ou role) - para quem foi enviada
- occurrence_type (ROUTINE, NON_ROUTINE, EMERGENCY) - tipo de ocorrência
- is_in_checklist (boolean) - se está no checklist diário
- is_routine_task (boolean) - se é tarefa de rotina
```

#### **6.2 Lógica de Classificação**

**Ocorrência é para mostrar:**
- ✅ Algo que foi feito **fora de rotina**
- ✅ Algo que **não está** no checklist diário
- ✅ Algo que **não está** na rotina normal

**Tipos de Ocorrência:**

**1. ROUTINE (Rotina)**
- Está no checklist diário
- Não precisa aprovação
- Apenas registro do que foi feito

**2. NON_ROUTINE (Fora de Rotina)**
- Não está no checklist
- Não está na rotina
- Pode precisar aprovação (depende do caso)
- Exemplo: "Consertei a porta do elevador que não estava no checklist"

**3. EMERGENCY (Emergência)**
- Situação urgente
- Geralmente precisa aprovação (para custos)
- Exemplo: "Bomba quebrou, chamei técnico"

#### **6.3 Fluxo Completo**

```
1. OPERACIONAL cria ocorrência
   └─> Preenche: título, descrição, localização
   └─> Define:
       - occurrence_type (ROUTINE, NON_ROUTINE, EMERGENCY)
       - is_in_checklist (se está no checklist)
       - is_routine_task (se é rotina)
       - requires_approval (se precisa aprovação)
       - Se requires_approval = TRUE:
           └─> Define approval_required_from (SINDICO, ADMINISTRATIVO, FINANCEIRO)
           └─> Define sent_to (para quem enviar)
   └─> Status: ABERTA
   └─> Se requires_approval = TRUE:
       └─> approval_status: PENDING
       └─> NOTIFICA destinatário (sent_to)

2. DESTINATÁRIO recebe notificação
   └─> Vê no dashboard: "Ocorrências aguardando aprovação"
   └─> Acessa ocorrência
   └─> Opções:
       a) APROVAR
          └─> approval_status: APPROVED
          └─> Se houver custo, pode criar orçamento
          └─> NOTIFICA operacional
       b) REJEITAR
          └─> approval_status: REJECTED
          └─> Adiciona rejection_reason
          └─> NOTIFICA operacional

3. OPERACIONAL recebe notificação
   └─> Se APROVADA:
       └─> Pode prosseguir com trabalho
       └─> Se houver custo, cria orçamento (fluxo item 5)
   └─> Se REJEITADA:
       └─> Vê motivo da rejeição
       └─> Pode editar ocorrência e reenviar
```

#### **6.4 Quando Precisa Aprovação?**

**Regras:**
- ✅ Se `occurrence_type = EMERGENCY` → **SEMPRE** precisa aprovação
- ✅ Se `occurrence_type = NON_ROUTINE` e tem custo → Precisa aprovação
- ✅ Se `occurrence_type = NON_ROUTINE` e não tem custo → Pode não precisar
- ✅ Se `occurrence_type = ROUTINE` → **NÃO** precisa aprovação

**Quem aprova:**
- Se tem custo alto → SINDICO
- Se tem custo baixo → ADMINISTRATIVO
- Se é financeiro → FINANCEIRO

#### **6.5 Integração com Sistema Existente**

**Verificação:**
- ✅ Ocorrência está no checklist diário? (`is_in_checklist`)
- ✅ Ocorrência é tarefa de rotina? (`is_routine_task`)
- ✅ Se ambas são FALSE → É ocorrência fora de rotina

**Dashboard:**
- Mostrar ocorrências por tipo
- Filtrar por: precisa aprovação, não precisa aprovação
- Mostrar ocorrências pendentes de aprovação

---

## 7️⃣ ADAPTAÇÕES NECESSÁRIAS NO SISTEMA

### **7.1 Tabelas a Criar/Modificar**

**Novas tabelas:**
1. `maintenances` - Manutenções corretivas/preventivas
2. (Verificar se `notifications` precisa ajustes)

**Tabelas a modificar:**
1. `financial_entries` - Adicionar campos de aprovação
2. `financial_exits` - Adicionar campos de observações/rejeição
3. `budget_requests` - Adicionar campos de fluxo completo
4. `occurrences` - Adicionar campos de aprovação e tipo

### **7.2 State Machines**

**Adicionar estados:**
- `financial_entries`: PENDING_REVIEW, APPROVED, REJECTED
- `maintenances`: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- `budget_requests`: PENDING_FINANCEIRO, PENDING_SINDICO, APPROVED, REJECTED, LIBERATED
- `occurrences`: (manter existentes) + adicionar approval_status

### **7.3 Permissões**

**Novas permissões:**
- `maintenances:create` → SINDICO
- `maintenances:complete` → OPERACIONAL
- `financial_entries:review` → SINDICO
- `financial_entries:approve` → SINDICO
- `budget_requests:review_financeiro` → FINANCEIRO
- `budget_requests:approve` → SINDICO
- `budget_requests:release` → FINANCEIRO
- `occurrences:approve` → SINDICO, ADMINISTRATIVO, FINANCEIRO (depende)

### **7.4 Notificações**

**Sistema de notificações deve:**
- Criar notificação automaticamente em cada mudança de status
- Enviar para usuário correto baseado em role/destinatário
- Exibir no dashboard de cada usuário
- Marcar como lida quando visualizada

---

## 8️⃣ RESUMO DOS FLUXOS

### **Fluxo 1: Manutenção**
```
SÍNDICO cria → NOTIFICA operacional → OPERACIONAL executa → NOTIFICA síndico
```

### **Fluxo 2: Entrada Financeira**
```
FINANCEIRO cria → NOTIFICA síndico → SÍNDICO analisa → APROVA/REJEITA → NOTIFICA financeiro
Se rejeitada: FINANCEIRO edita → NOTIFICA síndico novamente
```

### **Fluxo 3: Orçamento**
```
OPERACIONAL cria → NOTIFICA financeiro → FINANCEIRO preenche → NOTIFICA síndico
SÍNDICO aprova → NOTIFICA financeiro → FINANCEIRO confere → LIBERA → NOTIFICA operacional
```

### **Fluxo 4: Ocorrência com Aprovação**
```
OPERACIONAL cria → Define se precisa aprovação → Se sim, NOTIFICA destinatário
DESTINATÁRIO aprova/rejeita → NOTIFICA operacional
```

---

## 9️⃣ PONTOS DE ATENÇÃO

### **9.1 Notificações**
- ⚠️ Evitar spam de notificações
- ⚠️ Agrupar notificações similares quando possível
- ⚠️ Permitir desabilitar notificações por tipo

### **9.2 Performance**
- ⚠️ Dashboard pode ficar lento com muitas notificações
- ⚠️ Implementar paginação
- ⚠️ Limitar número de notificações exibidas

### **9.3 Auditoria**
- ⚠️ Todas as ações devem gerar log
- ⚠️ Histórico de aprovações/rejeições
- ⚠️ Rastreabilidade completa

### **9.4 Validações**
- ⚠️ Campos obrigatórios em cada etapa
- ⚠️ Validação de valores/permissões
- ⚠️ Prevenir estados inválidos

---

## 🔟 PRÓXIMOS PASSOS

1. ✅ **Revisar este documento** - Validar lógica proposta
2. ⏳ **Verificar sistema atual** - Confirmar o que já existe
3. ⏳ **Criar/Modificar tabelas** - Implementar estrutura de dados
4. ⏳ **Implementar State Machines** - Adicionar novos estados
5. ⏳ **Criar Services** - Lógica de negócio
6. ⏳ **Criar Controllers** - Endpoints da API
7. ⏳ **Criar Views** - Interface do usuário
8. ⏳ **Implementar Notificações** - Sistema completo
9. ⏳ **Atualizar Dashboards** - Exibir novas informações
10. ⏳ **Testes** - Validar todos os fluxos

---

**Última atualização:** Janeiro 2025
**Status:** 📋 Proposta de Lógica - Aguardando validação antes de implementação
