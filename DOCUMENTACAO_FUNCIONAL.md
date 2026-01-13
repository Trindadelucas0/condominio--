# DOCUMENTAÇÃO FUNCIONAL - SISTEMA DE GESTÃO CONDOMINIAL

## 1. VISÃO GERAL DO SISTEMA

### O que o sistema faz
Sistema web de gestão condominial que gerencia tarefas, ocorrências, finanças, patrimônio, estoque, manutenções, checklists diários, orçamentos, documentos e notificações para condomínios.

### Qual problema resolve
Centraliza a gestão operacional, financeira e administrativa de condomínios, automatizando processos, controlando permissões por perfil e mantendo auditoria completa.

### Quem usa
- **SUPER_MASTER**: Administrador do sistema (cria condomínios e usuários)
- **SINDICO/SUBSINDICO**: Aprova, analisa, visualiza relatórios
- **ADMINISTRATIVO**: Cria tarefas, documentos, tria ocorrências, solicita orçamentos
- **FINANCEIRO**: Gerencia entradas/saídas, contas, centros de custo, consumo, orçamentos
- **OPERACIONAL**: Executa checklists, tarefas, ocorrências, manutenções
- **LIMPEZA**: Executa checklists de limpeza, reporta ocorrências de limpeza
- **PATRIMONIO**: Gerencia ativos e depreciação
- **CONSELHO**: Apenas visualização

### O que o sistema NÃO faz
- Não envia emails
- Não gera relatórios em PDF
- Não tem integração com bancos
- Não tem app mobile
- Não tem chat/mensageria entre usuários

---

## 2. ESTRUTURA GERAL

### Backend
- **Framework**: Express.js (Node.js)
- **Banco de Dados**: PostgreSQL (SQL puro, sem ORM)
- **Autenticação**: JWT (access token + refresh token)
- **Arquitetura**: MVC (Models não existem, apenas Services)

### Frontend
- **Template Engine**: EJS
- **CSS**: Tailwind CSS (via CDN)
- **JavaScript**: Vanilla JS (sem frameworks)

### Banco de Dados
- **Tabelas principais**: condominiums, users, roles, user_roles, tasks, occurrences, financial_entries, financial_exits, maintenances, budget_requests, daily_checklists, notifications, audit_logs
- **Multi-tenant**: Todas as tabelas têm `condominium_id`
- **Soft delete**: Campos `deleted_at`, `deleted_by`, `delete_reason` (para financial_entries) ou `active` e `archived_at` (para outras entidades)

### Autenticação
- **JWT**: Access token (15min) + Refresh token (7 dias)
- **Cookies**: HttpOnly, Secure em produção
- **Middleware**: `authenticate` verifica token, `authorize` verifica perfil

### Controle de Acesso
- **RBAC**: Por perfil (role)
- **Permissões formais**: Tabela `permissions` + `role_permissions` (AÇÃO x ENTIDADE)
- **State Machines**: Transições de estado validadas por permissão

---

## 3. TELAS (VIEWS) - UMA POR UMA

### 3.1 AUTENTICAÇÃO

#### Tela: Login
- **URL**: `/auth/login`
- **Quem pode acessar**: Qualquer pessoa (pública)
- **Objetivo**: Autenticar usuário no sistema
- **Campos**:
  - `username` (text, obrigatório)
  - `password` (password, obrigatório)
- **Botões**:
  - **"Entrar"** (submit): Envia POST `/auth/login`
    - Valida campos
    - Chama `authService.login()`
    - Cria cookies (accessToken, refreshToken, token)
    - Redireciona conforme perfil:
      - SUPER_MASTER → `/master/dashboard`
      - SINDICO/SUBSINDICO → `/sindico/dashboard`
      - FINANCEIRO → `/financeiro/dashboard`
      - ADMINISTRATIVO → `/administrativo/dashboard`
      - OPERACIONAL → `/operacional/dashboard`
      - LIMPEZA → `/limpeza/dashboard`
      - CONSELHO → `/conselho/dashboard`
    - Se erro: mostra mensagem na tela
- **Mensagens de erro**:
  - "Credenciais inválidas" (usuário/senha incorretos)
  - "Usuário inativo" (usuário desativado)
  - "Preencha usuário e senha" (campos vazios)

---

### 3.2 SUPER_MASTER

#### Tela: Dashboard Master
- **URL**: `/master/dashboard`
- **Quem pode acessar**: SUPER_MASTER
- **Objetivo**: Visão geral do sistema (todos os condomínios)
- **Campos exibidos**:
  - Total de condomínios ativos
  - Total de condomínios inativos
  - Total de usuários ativos
  - Logs nas últimas 24h
- **Botões**: Links para outras telas do módulo

#### Tela: Lista de Condomínios
- **URL**: `/master/condominios`
- **Quem pode acessar**: SUPER_MASTER
- **Objetivo**: Listar todos os condomínios
- **Campos exibidos**: Nome, endereço, CNPJ, telefone, email, status (ativo/inativo)
- **Botões**:
  - **"Novo Condomínio"**: GET `/master/condominios/novo`
  - **"Editar"** (por linha): GET `/master/condominios/:id/editar`

#### Tela: Formulário de Condomínio
- **URL**: `/master/condominios/novo` ou `/master/condominios/:id/editar`
- **Quem pode acessar**: SUPER_MASTER
- **Objetivo**: Criar ou editar condomínio
- **Campos**:
  - `name` (text, obrigatório)
  - `address` (textarea, opcional)
  - `cnpj` (text, opcional, validado)
  - `phone` (text, opcional)
  - `email` (email, opcional, validado)
  - `active` (checkbox, padrão: true)
- **Botões**:
  - **"Salvar"**: POST `/master/condominios` ou POST `/master/condominios/:id`
    - Valida CNPJ (se preenchido)
    - Valida email (se preenchido)
    - Cria/atualiza no banco
    - Registra log de auditoria
    - Redireciona para lista com `?success=created` ou `?success=updated`
  - **"Cancelar"**: Volta para lista

#### Tela: Lista de Usuários
- **URL**: `/master/usuarios`
- **Quem pode acessar**: SUPER_MASTER
- **Objetivo**: Listar todos os usuários
- **Campos exibidos**: Username, email, nome completo, condomínio, perfis, status
- **Botões**:
  - **"Novo Usuário"**: GET `/master/usuarios/novo`
  - **"Editar"** (por linha): GET `/master/usuarios/:id/editar`

#### Tela: Formulário de Usuário
- **URL**: `/master/usuarios/novo` ou `/master/usuarios/:id/editar`
- **Quem pode acessar**: SUPER_MASTER
- **Objetivo**: Criar ou editar usuário
- **Campos**:
  - `username` (text, obrigatório, único)
  - `email` (email, obrigatório, único, validado)
  - `password` (password, obrigatório na criação, opcional na edição)
  - `full_name` (text, obrigatório)
  - `condominium_id` (select, opcional - NULL para SUPER_MASTER)
  - `active` (checkbox, padrão: true)
  - `roles[]` (checkboxes múltiplos: SUPER_MASTER, SINDICO, etc)
- **Botões**:
  - **"Salvar"**: POST `/master/usuarios` ou POST `/master/usuarios/:id`
    - Valida email
    - Hash da senha (bcrypt) se fornecida
    - Cria/atualiza usuário
    - Atualiza perfis (user_roles)
    - Registra log
    - Redireciona com sucesso
  - **"Cancelar"**: Volta para lista

---

### 3.3 SÍNDICO

#### Tela: Dashboard Síndico
- **URL**: `/sindico/dashboard`
- **Quem pode acessar**: SINDICO, SUBSINDICO
- **Objetivo**: Visão executiva do condomínio
- **Campos exibidos**:
  - Aprovações pendentes (contador + valor total)
  - Alertas críticos
  - Alertas de warning
  - Saldo financeiro
  - Tarefas atrasadas
  - Ocorrências abertas
  - Entradas pendentes de análise
  - Orçamentos aguardando aprovação
  - Manutenções concluídas
  - Ocorrências pendentes de aprovação
- **Botões**: Links para módulos específicos

#### Tela: Entradas Pendentes
- **URL**: `/sindico/entradas-pendentes`
- **Quem pode acessar**: SINDICO, SUBSINDICO
- **Objetivo**: Analisar entradas financeiras criadas pelo financeiro
- **Campos exibidos** (por entrada):
  - Descrição, valor, data, categoria, centro de custo
  - Criada em, criada por
- **Botões** (por entrada):
  - **"Aprovar"**: POST `/sindico/entradas/:id/aprovar`
    - Campo `reviewNotes` (textarea, opcional)
    - Atualiza `review_status = 'APPROVED'`
    - Preenche `reviewed_by`, `reviewed_at`, `review_notes`
    - Notifica financeiro
    - Registra log
    - Redireciona com `?success=approved`
  - **"Rejeitar"**: POST `/sindico/entradas/:id/rejeitar`
    - Campo `rejectionReason` (textarea, obrigatório)
    - Atualiza `review_status = 'REJECTED'`
    - Preenche `rejection_reason`
    - Notifica financeiro
    - Registra log
    - Redireciona com `?success=rejected`

#### Tela: Ocorrências Pendentes de Aprovação
- **URL**: `/sindico/ocorrencias-pendentes-aprovacao`
- **Quem pode acessar**: SINDICO, SUBSINDICO
- **Objetivo**: Aprovar ocorrências que requerem aprovação
- **Campos exibidos**: Título, descrição, localização, prioridade, tipo, criada por
- **Botões** (por ocorrência):
  - **"Aprovar"**: POST `/sindico/ocorrencias/:id/aprovar`
    - Atualiza `approval_status = 'APPROVED'`
    - Preenche `approved_by`, `approved_at`
    - Notifica operacional
    - Registra log
    - Redireciona com `?success=approved`
  - **"Rejeitar"**: POST `/sindico/ocorrencias/:id/rejeitar`
    - Campo `rejectionReason` (obrigatório)
    - Atualiza `approval_status = 'REJECTED'`
    - Preenche `approval_rejection_reason`
    - Notifica operacional
    - Registra log
    - Redireciona com `?success=rejected`

#### Tela: Modelos de Checklist
- **URL**: `/sindico/checklist-modelos`
- **Quem pode acessar**: SINDICO, SUBSINDICO
- **Objetivo**: Listar modelos de checklist (regras de geração automática)
- **Campos exibidos**: Nome, departamento, dias da semana, status (ativo/inativo)
- **Botões**:
  - **"Novo Modelo"**: GET `/sindico/checklist-modelos/novo`
  - **"Editar"**: GET `/sindico/checklist-modelos/:id/editar`
  - **"Ativar/Desativar"**: POST `/sindico/checklist-modelos/:id/toggle`

#### Tela: Formulário de Modelo de Checklist
- **URL**: `/sindico/checklist-modelos/novo` ou `/sindico/checklist-modelos/:id/editar`
- **Quem pode acessar**: SINDICO, SUBSINDICO
- **Objetivo**: Criar/editar modelo de checklist
- **Campos**:
  - `name` (text, obrigatório)
  - `description` (textarea, opcional)
  - `department` (select: ZELADORIA, LIMPEZA, obrigatório)
  - `monday`, `tuesday`, etc (checkboxes, pelo menos um obrigatório)
  - `isActive` (checkbox)
  - `requiresPhoto` (checkbox)
  - `requiresJustification` (checkbox)
  - `defaultAssignedRole` (select: OPERACIONAL, LIMPEZA)
  - `items[]` (array dinâmico: nome, ordem, requiresPhoto)
- **Botões**:
  - **"Salvar"**: POST `/sindico/checklist-modelos` ou POST `/sindico/checklist-modelos/:id`
    - Valida pelo menos um dia da semana
    - Cria/atualiza modelo e itens
    - Registra log
    - Redireciona com sucesso
  - **"Cancelar"**: Volta para lista

#### Tela: Manutenções
- **URL**: `/sindico/manutencoes`
- **Quem pode acessar**: SINDICO, SUBSINDICO
- **Objetivo**: Listar manutenções criadas
- **Campos exibidos**: Tipo, título, status, responsável, data prevista
- **Botões**:
  - **"Nova Manutenção"**: GET `/sindico/manutencoes/novo`
  - **"Ver Detalhes"**: GET `/sindico/manutencoes/:id`

#### Tela: Formulário de Manutenção
- **URL**: `/sindico/manutencoes/novo`
- **Quem pode acessar**: SINDICO, SUBSINDICO
- **Objetivo**: Criar manutenção preventiva ou corretiva
- **Campos**:
  - `maintenanceType` (select: PREVENTIVA, CORRETIVA, obrigatório)
  - `title` (text, obrigatório)
  - `description` (textarea, obrigatório)
  - `location` (text, opcional)
  - `priority` (select: BAIXA, NORMAL, ALTA, URGENTE)
  - `scheduledDate` (date, opcional)
  - `assignedTo` (select: operacionais do condomínio, obrigatório)
  - `assetId` (select: ativos, opcional)
- **Botões**:
  - **"Criar"**: POST `/sindico/manutencoes`
    - Valida tipo, título, descrição, responsável
    - Cria manutenção com status PENDING
    - Notifica operacional atribuído
    - Registra log
    - Redireciona com `?success=created`
  - **"Cancelar"**: Volta para lista

---

### 3.4 FINANCEIRO

#### Tela: Dashboard Financeiro
- **URL**: `/financeiro/dashboard`
- **Quem pode acessar**: FINANCEIRO
- **Objetivo**: Visão financeira do condomínio
- **Campos exibidos**:
  - Entradas pendentes de análise
  - Saídas pendentes
  - Orçamentos aguardando análise
  - Saldo atual
  - Contas vencendo

#### Tela: Lista de Entradas
- **URL**: `/financeiro/entradas`
- **Quem pode acessar**: FINANCEIRO
- **Objetivo**: Listar entradas financeiras
- **Campos exibidos**: Descrição, valor, data, categoria, status de análise
- **Botões**:
  - **"Nova Entrada"**: GET `/financeiro/entradas/nova`
  - **"Editar"** (se rejeitada): GET `/financeiro/entradas/:id/editar`
  - **"Excluir"** (se rejeitada): POST `/financeiro/entradas/:id/excluir`

#### Tela: Formulário de Entrada
- **URL**: `/financeiro/entradas/nova` ou `/financeiro/entradas/:id/editar`
- **Quem pode acessar**: FINANCEIRO
- **Objetivo**: Criar ou editar entrada financeira
- **Campos**:
  - `description` (text, obrigatório)
  - `amount` (number, obrigatório, > 0)
  - `entry_date` (date, obrigatório)
  - `cost_center_id` (select: centros de custo, opcional)
  - `category` (select: TAXA, RECEITA, OUTRA)
  - `linked_to_id` (select: outras entradas/saídas, opcional)
  - `linked_to_type` (select: ENTRY, EXIT, se linked_to_id preenchido)
- **Botões**:
  - **"Salvar"**: POST `/financeiro/entradas` ou POST `/financeiro/entradas/:id`
    - Valida campos obrigatórios
    - Valida valor > 0
    - Cria entrada com `review_status = 'PENDING_REVIEW'`
    - Se edição de rejeitada, reseta status para PENDING_REVIEW
    - Notifica síndico
    - Registra log
    - Redireciona (criação: lista, edição: entradas rejeitadas)
  - **"Cancelar"**: Volta para lista

#### Tela: Entradas Rejeitadas
- **URL**: `/financeiro/entradas-rejeitadas`
- **Quem pode acessar**: FINANCEIRO
- **Objetivo**: Listar entradas rejeitadas pelo síndico para correção
- **Campos exibidos**: Descrição, valor, motivo da rejeição, data
- **Botões** (por entrada):
  - **"Editar"**: GET `/financeiro/entradas/:id/editar`
  - **"Excluir"**: POST `/financeiro/entradas/:id/excluir`
    - Só permite se status PENDING ou REJECTED
    - Deleta entrada
    - Registra log
    - Redireciona com sucesso

#### Tela: Lista de Saídas
- **URL**: `/financeiro/saidas`
- **Quem pode acessar**: FINANCEIRO
- **Objetivo**: Listar saídas financeiras
- **Campos exibidos**: Descrição, valor, data, status de pagamento
- **Botões**:
  - **"Nova Saída"**: GET `/financeiro/saidas/nova`
  - **"Pagar"** (se aprovada): GET `/financeiro/saidas/:id/pagar`

#### Tela: Formulário de Saída
- **URL**: `/financeiro/saidas/nova`
- **Quem pode acessar**: FINANCEIRO
- **Objetivo**: Criar saída financeira
- **Campos**:
  - `description` (text, obrigatório)
  - `amount` (number, obrigatório, > 0)
  - `exit_date` (date, obrigatório)
  - `cost_center_id` (select, opcional)
  - `category` (select: MANUTENCAO, CONTA, CONTRATO, OUTRA)
  - `bill_id` (select: contas cadastradas, opcional)
  - `requires_approval` (checkbox)
  - `approval_limit` (number, padrão: 1000.00)
  - `is_recurring` (checkbox)
  - `recurrence_type` (select, se recorrente)
  - `is_variable` (checkbox, se recorrente)
  - `average_amount` (number, se variável)
- **Botões**:
  - **"Salvar"**: POST `/financeiro/saidas`
    - Valida campos
    - Se `requires_approval = true` e `amount > approval_limit`, cria com `payment_status = 'PENDING'`
    - Senão, cria com `payment_status = 'APPROVED'`
    - Se PENDING, cria registro em `approvals`
    - Notifica síndico (se requer aprovação)
    - Registra log
    - Redireciona para lista
  - **"Cancelar"**: Volta para lista

#### Tela: Orçamentos Pendentes
- **URL**: `/financeiro/orcamentos-pendentes`
- **Quem pode acessar**: FINANCEIRO
- **Objetivo**: Revisar orçamentos criados pelo administrativo
- **Campos exibidos** (por orçamento): Título, descrição, valor estimado, criado por, data
- **Botões** (por orçamento):
  - **"Revisar e Enviar para Síndico"**: POST `/financeiro/orcamentos/:id/revisar`
    - Campos: `financeiroNotes` (textarea, obrigatório), `costCenterId` (select, opcional)
    - Atualiza `financeiro_reviewed = true`, `financeiro_reviewed_by`, `financeiro_reviewed_at`, `financeiro_notes`
    - Atualiza `status = 'PENDING_SINDICO'`
    - Notifica síndico
    - Registra log
    - Redireciona com `?success=reviewed`

#### Tela: Orçamentos Aprovados
- **URL**: `/financeiro/orcamentos-aprovados`
- **Quem pode acessar**: FINANCEIRO
- **Objetivo**: Liberar ou retornar orçamentos aprovados pelo síndico
- **Campos exibidos**: Título, valor aprovado, observações do síndico
- **Botões** (por orçamento):
  - **"Liberar para Operacional"**: POST `/financeiro/orcamentos/:id/liberar`
    - Campo: `financeiroNotes` (textarea, opcional)
    - Atualiza `released_to_operational = true`, `released_at`, `released_by`
    - Atualiza `status = 'LIBERATED'`
    - Notifica operacional
    - Registra log
    - Redireciona com `?success=released`
  - **"Retornar para Síndico"**: POST `/financeiro/orcamentos/:id/retornar`
    - Campo: `financeiroNotes` (textarea, obrigatório)
    - Atualiza `status = 'PENDING_SINDICO'`
    - Notifica síndico
    - Registra log
    - Redireciona com `?success=returned`

#### Tela: Lista de Contas
- **URL**: `/financeiro/contas`
- **Quem pode acessar**: FINANCEIRO
- **Objetivo**: Listar contas recorrentes (água, luz, gás)
- **Campos exibidos**: Nome, tipo, fornecedor, número da conta, status
- **Botões**:
  - **"Nova Conta"**: GET `/financeiro/contas/nova`
  - **"Editar"**: GET `/financeiro/contas/:id/editar`

#### Tela: Centros de Custo
- **URL**: `/financeiro/centros-custo`
- **Quem pode acessar**: FINANCEIRO
- **Objetivo**: Listar centros de custo
- **Campos exibidos**: Nome, descrição, status
- **Botões**:
  - **"Novo Centro de Custo"**: GET `/financeiro/centros-custo/novo`
  - **"Salvar"**: POST `/financeiro/centros-custo` (implementação básica)

#### Tela: Registro de Consumo
- **URL**: `/financeiro/consumo/novo`
- **Quem pode acessar**: FINANCEIRO
- **Objetivo**: Registrar consumo mensal de contas
- **Campos**:
  - `bill_id` (select: contas, obrigatório)
  - `consumption_value` (number, obrigatório)
  - `consumption_date` (date, obrigatório)
  - `amount` (number, obrigatório)
- **Botões**:
  - **"Registrar"**: POST `/financeiro/consumo`
    - Cria registro de consumo
    - Pode criar saída financeira automaticamente
    - Registra log
    - Redireciona
  - **"Cancelar"**: Volta para dashboard

---

### 3.5 ADMINISTRATIVO

#### Tela: Dashboard Administrativo
- **URL**: `/administrativo/dashboard`
- **Quem pode acessar**: ADMINISTRATIVO
- **Objetivo**: Visão administrativa
- **Campos exibidos**: Tarefas pendentes, ocorrências não triadas, documentos, orçamentos

#### Tela: Lista de Tarefas
- **URL**: `/administrativo/tarefas`
- **Quem pode acessar**: ADMINISTRATIVO
- **Objetivo**: Listar tarefas criadas
- **Campos exibidos**: Título, responsável, vencimento, prioridade, status
- **Botões**:
  - **"Nova Tarefa"**: GET `/administrativo/tarefas/nova`
  - **"Reabrir"** (se concluída): POST `/administrativo/tarefas/:id/reabrir`

#### Tela: Formulário de Tarefa
- **URL**: `/administrativo/tarefas/nova`
- **Quem pode acessar**: ADMINISTRATIVO
- **Objetivo**: Criar tarefa para operacional
- **Campos**:
  - `title` (text, obrigatório)
  - `description` (textarea, opcional)
  - `assignedTo` (select: operacionais, obrigatório)
  - `dueDate` (date, obrigatório)
  - `priority` (select: BAIXA, NORMAL, ALTA, URGENTE)
  - `checklistItems[]` (array dinâmico: nome do item)
- **Botões**:
  - **"Criar"**: POST `/administrativo/tarefas`
    - Cria tarefa com status PENDING
    - Cria itens de checklist (se fornecidos)
    - Notifica operacional
    - Registra log
    - Redireciona com `?success=created`
  - **"Cancelar"**: Volta para lista

#### Tela: Triagem de Ocorrências
- **URL**: `/administrativo/ocorrencias/:id/triar`
- **Quem pode acessar**: ADMINISTRATIVO
- **Objetivo**: Triar ocorrência (atribuir, classificar, definir SLA)
- **Campos**:
  - `assigned_to` (select: operacionais, opcional)
  - `classification` (select, opcional)
  - `sla_hours` (number, opcional)
  - `converted_to_task` (checkbox)
- **Botões**:
  - **"Triar"**: POST `/administrativo/ocorrencias/:id/triar`
    - Atualiza `triaged = true`, `triaged_by`, `triaged_at`
    - Atualiza campos fornecidos
    - Se `converted_to_task = true`, cria tarefa vinculada
    - Atualiza status para EM_ATENDIMENTO (se atribuído)
    - Notifica operacional (se atribuído)
    - Registra log
    - Redireciona para lista de ocorrências pendentes

#### Tela: Solicitação de Orçamento
- **URL**: `/administrativo/orcamentos/novo`
- **Quem pode acessar**: ADMINISTRATIVO
- **Objetivo**: Solicitar orçamento (vai para financeiro → síndico)
- **Campos**:
  - `title` (text, obrigatório)
  - `description` (textarea, obrigatório)
  - `estimatedValue` (number, opcional)
  - `priority` (select)
  - `relatedOccurrenceId` (select, opcional)
  - `relatedTaskId` (select, opcional)
  - `contractFiles[]` (file upload, PDFs, máximo 10, até 50MB cada)
- **Botões**:
  - **"Solicitar"**: POST `/administrativo/orcamentos`
    - Cria orçamento com `status = 'PENDING_FINANCEIRO'`
    - Faz upload de arquivos (se fornecidos)
    - Notifica financeiro
    - Registra log
    - Redireciona com sucesso
  - **"Cancelar"**: Volta para lista

---

### 3.6 OPERACIONAL

#### Tela: Dashboard Operacional
- **URL**: `/operacional/dashboard`
- **Quem pode acessar**: OPERACIONAL
- **Objetivo**: Visão operacional
- **Campos exibidos**: Tarefas pendentes, tarefas atrasadas, ocorrências abertas, manutenções pendentes, orçamentos liberados

#### Tela: Checklists Diários
- **URL**: `/operacional/checklists-diarios`
- **Quem pode acessar**: OPERACIONAL, LIMPEZA
- **Objetivo**: Listar checklists gerados automaticamente
- **Campos exibidos**: Modelo, data, status, progresso
- **Filtros**: Data (padrão: hoje)
- **Botões**:
  - **"Executar"**: GET `/operacional/checklists-diarios/:id`
  - **"Filtrar"**: GET com parâmetro `date`

#### Tela: Execução de Checklist
- **URL**: `/operacional/checklists-diarios/:id`
- **Quem pode acessar**: OPERACIONAL, LIMPEZA
- **Objetivo**: Executar checklist do dia
- **Campos exibidos**:
  - Status do checklist (PENDING, IN_PROGRESS, COMPLETED, LATE)
  - Progresso (%)
  - Lista de itens (nome, status: PENDING/DONE/NOT_DONE, comentário, foto)
- **Botões**:
  - **"Iniciar Checklist"** (se PENDING): POST `/operacional/checklists-diarios/:id/iniciar`
    - Atualiza `status = 'IN_PROGRESS'`, `started_at`
    - Registra log
    - Redireciona com `?success=started`
  - **"Atualizar Item"**: POST `/operacional/checklists-diarios/:checklistId/items/:itemId`
    - Campos: `status` (DONE/NOT_DONE), `comment` (se NOT_DONE e requires_justification)
    - Atualiza item
    - Registra log
    - Redireciona com `?success=updated`
  - **"Adicionar Foto"**: POST `/operacional/checklists-diarios/:id/evidencias`
    - Upload de imagem (máximo 10MB)
    - Salva em `uploads/checklists/`
    - Cria registro em `checklist_evidences`
    - Redireciona com `?success=evidence_added`
  - **"Finalizar Checklist"**: POST `/operacional/checklists-diarios/:id/finalizar`
    - Valida se todos os itens têm status
    - Atualiza `status = 'COMPLETED'`, `completed_at`, `completed_by`
    - Registra log
    - Redireciona com `?success=completed`

#### Tela: Checklist Antigo (Compatibilidade)
- **URL**: `/operacional/checklist`
- **Quem pode acessar**: OPERACIONAL, LIMPEZA
- **Objetivo**: Listar tarefas com checklist (sistema antigo)
- **Campos exibidos**: Tarefa, itens de checklist, status
- **Botões**:
  - **"Atualizar Item"**: POST `/operacional/checklist/:id/atualizar`
  - **"Completar Tarefa"**: POST `/operacional/checklist/:id/completar`

#### Tela: Lista de Ocorrências
- **URL**: `/operacional/ocorrencias`
- **Quem pode acessar**: OPERACIONAL
- **Objetivo**: Listar ocorrências reportadas
- **Campos exibidos**: Título, status, prioridade, localização
- **Botões**:
  - **"Nova Ocorrência"**: GET `/operacional/ocorrencias/nova`
  - **"Ver Detalhes"**: GET `/operacional/ocorrencias/:id`
  - **"Resolver"**: GET `/operacional/ocorrencias/:id/resolver`

#### Tela: Formulário de Ocorrência
- **URL**: `/operacional/ocorrencias/nova`
- **Quem pode acessar**: OPERACIONAL
- **Objetivo**: Criar ocorrência
- **Campos**:
  - `title` (text, obrigatório)
  - `description` (textarea, obrigatório)
  - `location` (text, opcional)
  - `priority` (select: BAIXA, NORMAL, ALTA, URGENTE)
  - `occurrenceType` (select: ROUTINE, NON_ROUTINE, EMERGENCY)
  - `requiresApproval` (checkbox, aparece se NON_ROUTINE ou EMERGENCY)
  - `approvalRequiredFrom` (select: SINDICO, ADMINISTRATIVO, FINANCEIRO, se requiresApproval)
  - `sentToUserId` (select: usuários, opcional)
  - `sentToRole` (select: perfis, opcional)
- **Botões**:
  - **"Criar"**: POST `/operacional/ocorrencias`
    - Cria ocorrência com status ABERTA
    - Se `requiresApproval = true`, cria com `approval_status = 'PENDING'`
    - Notifica destinatário (se especificado)
    - Notifica perfil (se especificado)
    - Se requer aprovação, notifica aprovador
    - Registra log
    - Redireciona para lista
  - **"Cancelar"**: Volta para lista

#### Tela: Resolver Ocorrência
- **URL**: `/operacional/ocorrencias/:id/resolver`
- **Quem pode acessar**: OPERACIONAL
- **Objetivo**: Marcar ocorrência como resolvida
- **Campos**:
  - `resolutionNotes` (textarea, obrigatório)
- **Botões**:
  - **"Resolver"**: POST `/operacional/ocorrencias/:id/resolver`
    - Valida transição de estado (via `stateValidator`)
    - Atualiza `status = 'RESOLVIDA'`, `resolved_at`, `resolved_by`, `resolution_notes`
    - Notifica síndico
    - Registra log
    - Redireciona para detalhes da ocorrência

#### Tela: Lista de Manutenções
- **URL**: `/operacional/manutencoes`
- **Quem pode acessar**: OPERACIONAL
- **Objetivo**: Listar manutenções atribuídas
- **Campos exibidos**: Tipo, título, status, data prevista
- **Botões**:
  - **"Ver Detalhes"**: GET `/operacional/manutencoes/:id`
  - **"Iniciar"** (se PENDING): POST `/operacional/manutencoes/:id/iniciar`
  - **"Concluir"** (se IN_PROGRESS): GET `/operacional/manutencoes/:id/concluir`

#### Tela: Concluir Manutenção
- **URL**: `/operacional/manutencoes/:id/concluir`
- **Quem pode acessar**: OPERACIONAL
- **Objetivo**: Finalizar manutenção
- **Campos**:
  - `completionNotes` (textarea, obrigatório)
  - `cost` (number, opcional)
- **Botões**:
  - **"Concluir"**: POST `/operacional/manutencoes/:id/concluir`
    - Atualiza `status = 'COMPLETED'`, `completed_at`, `completed_by`, `completion_notes`, `cost`
    - Notifica síndico
    - Registra log
    - Redireciona para detalhes

---

### 3.7 LIMPEZA

#### Tela: Dashboard Limpeza
- **URL**: `/limpeza/dashboard`
- **Quem pode acessar**: LIMPEZA
- **Objetivo**: Visão da equipe de limpeza
- **Campos exibidos**: Checklists pendentes, ocorrências de limpeza

#### Tela: Ocorrências de Limpeza
- **URL**: `/limpeza/ocorrencias`
- **Quem pode acessar**: LIMPEZA
- **Objetivo**: Listar ocorrências de limpeza
- **Campos exibidos**: Título, tipo, status
- **Botões**:
  - **"Nova Ocorrência"**: GET `/limpeza/ocorrencias/nova`
  - **"Ver Detalhes"**: GET `/limpeza/ocorrencias/:id`

#### Tela: Formulário de Ocorrência de Limpeza
- **URL**: `/limpeza/ocorrencias/nova`
- **Quem pode acessar**: LIMPEZA
- **Objetivo**: Criar ocorrência de limpeza
- **Campos**:
  - `title` (text, obrigatório)
  - `description` (textarea, obrigatório)
  - `location` (text, opcional)
  - `limpezaType` (select: AREA_IMPROPRIA, SUJEIRA_EXCESSIVA, FALTA_MATERIAL, EQUIPAMENTO_DEFEITO)
- **Botões**:
  - **"Criar"**: POST `/limpeza/ocorrencias`
    - Cria ocorrência com `occurrence_type = 'LIMPEZA'`
    - Se `limpezaType = EQUIPAMENTO_DEFEITO`, NOTIFICA ADMINISTRATIVO (não cria zeladoria automaticamente)
    - ADMINISTRATIVO decide se cria ocorrência de ZELADORIA
    - Registra log
    - Redireciona

---

### 3.8 NOTIFICAÇÕES

#### Tela: Lista de Notificações
- **URL**: `/notifications`
- **Quem pode acessar**: Qualquer usuário autenticado
- **Objetivo**: Ver notificações do usuário
- **Campos exibidos**: Título, mensagem, tipo, data, lida/não lida
- **Filtros**: `read` (true/false)
- **Botões**:
  - **"Marcar como Lida"** (por notificação): POST `/notifications/:id/read`
    - Atualiza `read = true`, `read_at`
    - Retorna JSON `{success: true}` (AJAX) ou redireciona
  - **"Marcar Todas como Lidas"**: POST `/notifications/read-all`
    - Atualiza todas não lidas
    - Retorna JSON ou redireciona
  - **Link para Detalhes** (se `entity_type` e `entity_id` preenchidos):
    - Redireciona para tela específica da entidade

#### API: Contador de Não Lidas
- **URL**: `/notifications/unread-count`
- **Método**: GET
- **Quem pode acessar**: Qualquer usuário autenticado
- **Retorno**: JSON `{count: number}`

---

## 4. FLUXOS DO SISTEMA

### 4.1 Fluxo de Login
1. Usuário acessa `/auth/login`
2. Preenche username e senha
3. Submete formulário (POST `/auth/login`)
4. `authController.processLogin()` chama `authService.login()`
5. Service valida credenciais (busca usuário, compara senha com bcrypt)
6. Se válido:
   - Busca perfis do usuário
   - Atualiza `last_login`
   - Gera access token (15min) e refresh token (7 dias)
   - Cria cookies (accessToken, refreshToken, token)
   - Registra log de auditoria (LOGIN)
   - Redireciona conforme perfil
7. Se inválido: renderiza login com mensagem de erro

### 4.2 Fluxo de Criação de Entrada Financeira
1. Financeiro acessa `/financeiro/entradas/nova`
2. Preenche formulário (descrição, valor, data, categoria, centro de custo)
3. Submete (POST `/financeiro/entradas`)
4. `financeiroController.createEntry()` chama `financeiroService.createEntry()`
5. Service valida:
   - Campos obrigatórios
   - Valor > 0
   - Data válida
   - Usuário pertence ao condomínio
6. Cria entrada com `review_status = 'PENDING_REVIEW'`
7. Notifica síndico (via `notificationService.createNotificationForRole()`)
8. Registra log de auditoria
9. Redireciona para lista de entradas

### 4.3 Fluxo de Aprovação de Entrada
1. Síndico acessa `/sindico/entradas-pendentes`
2. Vê lista de entradas com `review_status = 'PENDING_REVIEW'`
3. Clica em "Aprovar" ou "Rejeitar"
4. Se aprovar:
   - POST `/sindico/entradas/:id/aprovar`
   - `financeiroService.approveEntry()` atualiza:
     - `review_status = 'APPROVED'`
     - `reviewed_by`, `reviewed_at`, `review_notes`
   - Notifica financeiro
   - Registra log
   - Entrada entra no cálculo financeiro
5. Se rejeitar:
   - POST `/sindico/entradas/:id/rejeitar`
   - `financeiroService.rejectEntry()` atualiza:
     - `review_status = 'REJECTED'`
     - `rejection_reason`
   - Notifica financeiro
   - Registra log
   - Financeiro pode editar/excluir entrada rejeitada

### 4.4 Fluxo de Orçamento (ADM → Financeiro → Síndico → Financeiro → Operacional)
1. Administrativo cria orçamento (POST `/administrativo/orcamentos`)
   - Status: `PENDING_FINANCEIRO`
   - Notifica financeiro
2. Financeiro revisa (POST `/financeiro/orcamentos/:id/revisar`)
   - Preenche `financeiro_notes`, `cost_center_id`
   - Atualiza `financeiro_reviewed = true`
   - Status: `PENDING_SINDICO`
   - Notifica síndico
3. Síndico aprova (POST `/sindico/orcamentos/:id/aprovar`)
   - Preenche `sindico_notes`, `budget_approved_amount`
   - Status: `APPROVED`
   - Notifica financeiro
4. Financeiro libera (POST `/financeiro/orcamentos/:id/liberar`)
   - Atualiza `released_to_operational = true`
   - Status: `LIBERATED`
   - Notifica operacional
5. Operacional vê orçamento liberado no dashboard

### 4.5 Fluxo de Checklist Diário (Geração Automática)
1. Job diário (`dailyChecklistJob.js`) executa (via cron ou manualmente)
2. Para cada modelo ativo (`is_active = true`):
   - Verifica se hoje é um dos dias da semana configurados
   - Se sim, verifica se já existe checklist para hoje
   - Se não existe, cria `daily_checklist` com:
     - `scheduled_date = hoje`
     - `status = 'PENDING'`
     - `assigned_role` do modelo
   - Copia itens do modelo para `daily_checklist_items`
3. Notifica operacionais/limpeza (conforme `assigned_role`)
4. Operacional vê checklist em `/operacional/checklists-diarios`
5. Operacional executa checklist (inicia, atualiza itens, adiciona fotos, finaliza)

### 4.6 Fluxo de Ocorrência com Aprovação
1. Operacional cria ocorrência (POST `/operacional/ocorrencias`)
   - Se `requiresApproval = true`:
     - `approval_status = 'PENDING'`
     - `approval_required_from` = perfil especificado
     - Notifica aprovador (SINDICO, ADMINISTRATIVO ou FINANCEIRO)
2. Aprovador vê em tela específica (ex: `/sindico/ocorrencias-pendentes-aprovacao`)
3. Aprovador aprova ou rejeita
4. Se aprovada: `approval_status = 'APPROVED'`, operacional pode resolver
5. Se rejeitada: `approval_status = 'REJECTED'`, operacional é notificado

### 4.7 Fluxo de Manutenção
1. Síndico cria manutenção (POST `/sindico/manutencoes`)
   - Tipo: PREVENTIVA ou CORRETIVA
   - Atribui a operacional
   - Status: `PENDING`
   - Notifica operacional
2. Operacional vê em `/operacional/manutencoes`
3. Operacional inicia (POST `/operacional/manutencoes/:id/iniciar`)
   - Status: `IN_PROGRESS`
   - `started_at` = agora
4. Operacional conclui (POST `/operacional/manutencoes/:id/concluir`)
   - Status: `COMPLETED`
   - Preenche `completion_notes`, `cost` (opcional)
   - Notifica síndico
   - Registra log

### 4.8 Fluxo de Exclusão de Entrada Rejeitada
1. Financeiro acessa `/financeiro/entradas-rejeitadas`
2. Vê entrada com `review_status = 'REJECTED' AND deleted_at IS NULL`
3. Clica em "Excluir"
4. POST `/financeiro/entradas/:id/excluir`
5. `financeiroController.deleteEntry()` chama `financeiroService.deleteEntry()`
6. Service valida:
   - Status é PENDING_REVIEW ou REJECTED
   - Entrada pertence ao condomínio
   - Não está já deletada (deleted_at IS NULL)
7. Soft delete: marca `deleted_at = CURRENT_TIMESTAMP`, `deleted_by = userId`, `delete_reason`
8. Registra log (com beforeData e afterData)
9. Redireciona com sucesso

---

## 5. VALIDAÇÕES

### 5.1 Validações de Campos
- **CNPJ**: Formato e dígitos verificadores (se preenchido)
- **Email**: Formato válido, máximo 255 caracteres, sem ".." ou pontos nas extremidades
- **Valor Financeiro**: > 0, não negativo, máximo R$ 10 milhões (configurável)
- **Data**: Não pode ser mais de 365 dias no futuro (configurável)

### 5.2 Validações de Negócio
- **Usuário pertence ao condomínio**: Validado em todas as operações críticas
- **Transições de estado**: Validadas via `stateValidator.validateAndTransition()`
- **Permissões**: Verificadas via `permissionService.hasPermission()` ou `authorizeAction()` middleware
- **Ownership**: Registros só podem ser alterados por usuários do mesmo condomínio

### 5.3 Validações de Segurança
- **Autenticação obrigatória**: Todas as rotas (exceto `/auth/login`) exigem `authenticate` middleware
- **Autorização por perfil**: Rotas específicas exigem `authorize('PERFIL')`
- **Autorização por ação**: Rotas críticas usam `authorizeAction('entity', 'action')`
- **Multi-tenant**: Queries sempre filtram por `condominium_id`
- **SQL Injection**: Uso de parâmetros ($1, $2, ...) em todas as queries

---

## 6. TRATAMENTO DE ERROS

### 6.1 Erros de Validação
- Renderiza formulário novamente com mensagem de erro
- Campos preenchidos são mantidos (exceto senha)

### 6.2 Erros de Permissão
- Retorna 403 (Forbidden) com mensagem detalhada
- Loga tentativa de acesso não autorizado

### 6.3 Erros de Banco de Dados
- Loga erro no console
- Retorna 500 (Internal Server Error)
- Em desenvolvimento, mostra stack trace na tela de erro
- Em produção, mostra mensagem genérica

### 6.4 Erros de Autenticação
- Token expirado: Tenta renovar com refresh token
- Se refresh token inválido: Redireciona para login
- Cookie inválido: Redireciona para login

---

## 7. LOGS DE AUDITORIA

### 7.1 O que é registrado
- **Ações**: CREATE, UPDATE, DELETE, LOGIN, APPROVE, REJECT, COMPLETE, etc
- **Módulos**: AUTH, FINANCIAL, MAINTENANCE, TASK, OCCURRENCE, etc
- **Entidades**: users, condominiums, tasks, financial_entries, etc
- **Dados**: Estado ANTES (before_data) e DEPOIS (after_data) em JSONB
- **Metadados**: user_id, condominium_id, ip_address, user_agent, created_at

### 7.2 Onde é registrado
- Tabela `audit_logs` (imutável, nunca deletada)
- Função `logAction()` em `src/utils/logger.js`

### 7.3 Quem pode ver
- Síndico: `/sindico/logs` (filtrado por condomínio)
- Super Master: Dashboard master (todos os logs)

---

## 8. NOTIFICAÇÕES

### 8.1 Tipos de Notificação
- `TASK_OVERDUE`: Tarefa atrasada
- `OCCURRENCE_OVERDUE`: Ocorrência atrasada
- `APPROVAL_PENDING`: Aprovação pendente
- `MAINTENANCE_ASSIGNED`: Manutenção atribuída
- `BUDGET_PENDING_FINANCEIRO`: Orçamento aguardando financeiro
- `BUDGET_PENDING_SINDICO`: Orçamento aguardando síndico
- `ENTRY_REJECTED`: Entrada rejeitada
- E outros...

### 8.2 Como são criadas
- Via `notificationService.createNotification()` (usuário específico)
- Via `notificationService.createNotificationForRole()` (todos os usuários de um perfil)

### 8.3 Como são exibidas
- Badge no navbar (contador de não lidas)
- Tela `/notifications` (lista completa)
- Links para entidades relacionadas (se `entity_type` e `entity_id` preenchidos)

### 8.4 Regras
- Notificação não pode ser deletada (apenas marcada como lida)
- Notificação pode ser justificada (se aplicável)

---

## 9. ESTADOS E TRANSIÇÕES

### 9.1 State Machines
- Tabela `state_machines`: Define estados válidos por entidade
- Tabela `state_transitions`: Define transições permitidas (de → para) e permissão necessária

### 9.2 Entidades com State Machine
- **tasks**: PENDING → IN_PROGRESS → COMPLETED / CANCELLED
- **occurrences**: ABERTA → EM_ATENDIMENTO → RESOLVIDA → ENCERRADA
- **financial_exits**: PENDING → APPROVED → PAID / REJECTED
- **financial_entries**: PENDING_REVIEW → APPROVED → RECEIVED / → REJECTED
- **checklists**: PENDING → DONE / NOT_DONE
- **assets**: ACTIVE → INACTIVE / MAINTENANCE / DISPOSED

### 9.3 Validação de Transições
- `stateValidator.validateAndTransition()` verifica:
  - Se transição existe na tabela `state_transitions`
  - Se usuário tem permissão necessária (`required_permission`)
  - Retorna `{valid: boolean, error: string}`

---

## 10. CONCLUSÃO FINAL

### O que o sistema garante hoje
- Isolamento multi-tenant (condomínios separados)
- Controle de acesso por perfil e permissões formais
- Auditoria completa de ações
- Validação de transições de estado
- Notificações automáticas
- Geração automática de checklists diários
- Fluxos de aprovação (entradas, orçamentos, ocorrências)
- Soft delete (registros não são deletados fisicamente)

### O que o sistema NÃO garante hoje
- Envio de emails
- Geração de relatórios em PDF
- Integração com bancos
- Backup automático
- Recuperação de senha (esqueci minha senha)
- Duas etapas de autenticação (2FA)
- Rate limiting (proteção contra brute force)
- Validação de arquivos maliciosos (apenas valida tipo e tamanho)

### Onde o usuário pode errar
- Criar entrada/saída com valor incorreto (validação apenas no backend)
- Não preencher campos obrigatórios (validação HTML5 + backend)
- Tentar acessar URL diretamente sem permissão (retorna 403)
- Deletar entrada rejeitada sem revisar motivo (pode perder informação)

### Onde o sistema pode quebrar se mal utilizado
- Muitos checklists gerados simultaneamente (sem limite de concorrência)
- Muitas notificações para o mesmo usuário (sem agrupamento)
- Queries sem índice em tabelas grandes (pode ficar lento)
- Upload de arquivos muito grandes (limite de 50MB, mas pode sobrecarregar servidor)
- Refresh token não expira (7 dias, risco se comprometido)

---

**FIM DA DOCUMENTAÇÃO FUNCIONAL**
