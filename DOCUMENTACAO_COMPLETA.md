# 📚 DOCUMENTAÇÃO COMPLETA DO SISTEMA DE GESTÃO CONDOMINIAL

**Versão:** 1.0.0  
**Data:** Janeiro 2025  
**Status:** Sistema em Produção

---

## 📋 ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura e Tecnologias](#2-arquitetura-e-tecnologias)
3. [Estrutura do Projeto](#3-estrutura-do-projeto)
4. [Banco de Dados](#4-banco-de-dados)
5. [Perfis e Permissões (RBAC)](#5-perfis-e-permissões-rbac)
6. [Módulos e Funcionalidades](#6-módulos-e-funcionalidades)
7. [Fluxos Principais](#7-fluxos-principais)
8. [Rotas e Endpoints](#8-rotas-e-endpoints)
9. [Regras de Negócio](#9-regras-de-negócio)
10. [Automações e Alertas](#10-automações-e-alertas)
11. [Uploads e Arquivos](#11-uploads-e-arquivos)
12. [KPIs e Dashboards](#12-kpis-e-dashboards)
13. [Checklist de Verificação](#13-checklist-de-verificação)

---

## 1. VISÃO GERAL

### 1.1 Propósito
Sistema completo de gestão condominial com controle rigoroso de permissões, auditoria completa e automações inteligentes.

### 1.2 Princípios Fundamentais
- **Quem executa não decide** - Operacional executa, não aprova
- **Quem decide não executa** - Síndico aprova, não executa tarefas
- **Quem governa o sistema não governa o condomínio** - SUPER_MASTER gerencia sistema, não condomínio

### 1.3 Características Principais
- ✅ RBAC rigoroso (Role-Based Access Control)
- ✅ Auditoria completa (logs imutáveis)
- ✅ Automações inteligentes (SLA, alertas, escalonamento)
- ✅ Projeções financeiras baseadas em recorrências
- ✅ Gestão completa de patrimônio com depreciação
- ✅ Controle de estoque com alertas
- ✅ Sistema de aprovações hierárquico

---

## 2. ARQUITETURA E TECNOLOGIAS

### 2.1 Stack Tecnológica
- **Backend:** Node.js + Express.js
- **Banco de Dados:** PostgreSQL (SQL puro, sem ORM)
- **Autenticação:** JWT (JSON Web Tokens)
- **Senhas:** bcrypt (hash)
- **Frontend:** EJS (templates)
- **Estilização:** Tailwind CSS
- **Uploads:** Multer
- **Gráficos:** Chart.js

### 2.2 Arquitetura
- **Padrão:** MVC (Model-View-Controller)
- **Services:** Lógica de negócio isolada
- **Controllers:** Gerenciamento de requisições
- **Routes:** Definição de endpoints
- **Middlewares:** Autenticação e autorização

---

## 3. ESTRUTURA DO PROJETO

```
condominio/
├── src/
│   ├── app.js                    # Configuração Express
│   ├── server.js                 # Inicialização do servidor
│   ├── config/
│   │   └── database.js           # Conexão PostgreSQL
│   ├── controllers/              # Controladores (13 arquivos)
│   ├── services/                 # Lógica de negócio (15 arquivos)
│   ├── routes/                   # Rotas (13 arquivos)
│   ├── middlewares/
│   │   ├── auth.js               # Autenticação JWT
│   │   └── upload.js             # Upload de arquivos
│   ├── database/
│   │   ├── init.js               # Inicialização automática
│   │   ├── init.sql              # Tabelas base
│   │   ├── initRoles.sql         # Perfis padrão
│   │   └── extendTablesPhase*.sql # Extensões (19 fases)
│   └── utils/
│       ├── logger.js             # Logger de auditoria
│       └── generateJwtSecret.js  # Geração de secret
├── views/                        # Templates EJS
├── public/                       # Arquivos estáticos
├── uploads/                      # Arquivos enviados
│   ├── receipts/                 # Comprovantes de entrada
│   ├── payments/                 # Comprovantes de pagamento
│   └── contracts/                # Contratos/documentos
└── package.json                  # Dependências
```

---

## 4. BANCO DE DADOS

### 4.1 Tabelas Base (init.sql)
| Tabela | Descrição | Campos Principais |
|--------|-----------|-------------------|
| `condominiums` | Condomínios | id, name, address, cnpj, active |
| `users` | Usuários | id, username, email, password_hash, condominium_id |
| `roles` | Perfis | id, name (SUPER_MASTER, SINDICO, etc) |
| `user_roles` | Relação usuário-perfil | user_id, role_id |
| `audit_logs` | Logs de auditoria | user_id, action, module, before_data, after_data |

### 4.2 Tabelas por Módulo

#### **FASE 6 - OPERACIONAL**
- `occurrences` - Ocorrências reportadas
- `tasks` - Tarefas criadas pelo administrativo
- `checklists` - Itens de checklist
- `task_evidences` - Evidências/fotos de tarefas

#### **FASE 7 - ADMINISTRATIVO**
- `documents` - Documentos do condomínio
- `document_categories` - Categorias de documentos

#### **FASE 8 - FINANCEIRO**
- `financial_entries` - Entradas financeiras
- `financial_exits` - Saídas financeiras
- `cost_centers` - Centros de custo
- `bills` - Contas recorrentes (água, luz, gás)

#### **FASE 9 - PATRIMÔNIO**
- `assets` - Ativos do condomínio
- `asset_maintenances` - Manutenções de ativos
- `asset_depreciation` - Histórico de depreciação

#### **FASE 10 - AUTOMAÇÕES**
- `notifications` - Notificações para usuários
- `slas` - Configurações de SLA
- `escalation_rules` - Regras de escalonamento

#### **FASE 11 - CONFIGURAÇÕES**
- `condominium_settings` - Configurações por condomínio

#### **FASE 12 - ESTOQUE**
- `inventory_items` - Itens de estoque
- `inventory_movements` - Movimentações de estoque

#### **FASE 13 - REABERTURA**
- Campos `reopened`, `reopened_at`, `reopened_by` em:
  - `occurrences`
  - `tasks`
  - `financial_exits`

#### **FASE 14 - LIMPEZA**
- Campos `occurrence_type`, `limpeza_type` em `occurrences`

#### **FASE 15 - TRIAGEM**
- Campos de triagem em `occurrences`:
  - `triaged`, `triaged_by`, `triaged_at`
  - `classification` (PREVENTIVA, CORRETIVA, etc)
  - `sla_hours`, `sla_due_date`
  - `converted_to_task`, `related_task_id`
  - `related_asset_id`
  - `sindico_observation`, `sindico_observation_by`
- `budget_requests` - Solicitações de orçamento
- `budget_request_attachments` - Anexos de orçamentos
- `operational_communications` - Comunicados operacionais

#### **FASE 16 - COMPROVANTES ENTRADA**
- Campos em `financial_entries`:
  - `receipt_pdf_path`, `receipt_details`, `receipt_method`, `receipt_notes`

#### **FASE 17 - COMPROVANTES SAÍDA**
- Campos em `financial_exits`:
  - `payment_receipt_pdf_path`, `payment_details`, `payment_method`, `payment_notes`

#### **FASE 18 - CONSUMO MENSAL**
- `monthly_consumption` - Registro de consumo mensal (água, energia)

#### **FASE 19 - RECORRÊNCIA**
- Campos em `financial_entries` e `financial_exits`:
  - `is_recurring`, `recurrence_type` (MONTHLY, QUARTERLY, YEARLY, UNIQUE)
  - `is_variable`, `average_amount`

### 4.3 Tabelas Auxiliares (extendTables.sql)
- `approvals` - Aprovações pendentes
- `alerts` - Alertas do sistema

---

## 5. PERFIS E PERMISSÕES (RBAC)

### 5.1 Perfis Disponíveis

| Perfil | Descrição | Acesso |
|--------|-----------|--------|
| **SUPER_MASTER** | Administrador do sistema | Todos os condomínios, CRUD usuários/condomínios |
| **SINDICO** | Síndico/Subsíndico | Aprovações, dashboards, visualização completa |
| **ADMINISTRATIVO** | Administrativo | Tarefas, documentos, triagem, orçamentos |
| **FINANCEIRO** | Financeiro | Entradas/saídas, contas, consumo, projeções |
| **PATRIMONIO** | Patrimônio | Ativos, manutenções, depreciação |
| **OPERACIONAL** | Operacional/Zeladoria | Checklist, tarefas, ocorrências |
| **LIMPEZA** | Limpeza | Ocorrências de limpeza específicas |
| **CONSELHO** | Conselho | Apenas visualização (read-only) |

### 5.2 Regras de Permissão

#### **SUPER_MASTER**
- ✅ CRUD completo de condomínios
- ✅ CRUD completo de usuários
- ✅ Atribuição de perfis
- ✅ Visualização de todos os condomínios
- ❌ Não gerencia dia a dia do condomínio

#### **SINDICO**
- ✅ Aprovar/rejeitar despesas acima do limite
- ✅ Visualizar dashboards executivos
- ✅ Ver todos os logs
- ✅ Adicionar observações em tarefas/ocorrências
- ✅ Reabrir tarefas/ocorrências/saídas
- ❌ Não cria tarefas
- ❌ Não executa tarefas
- ❌ Não cria usuários

#### **ADMINISTRATIVO**
- ✅ Criar tarefas (com prazo obrigatório)
- ✅ Triar ocorrências (classificação, SLA, atribuição)
- ✅ Gerenciar documentos e categorias
- ✅ Criar solicitações de orçamento
- ✅ Criar comunicados operacionais
- ✅ Aprovar despesas até limite configurado
- ❌ Não executa tarefas
- ❌ Não aprova despesas acima do limite

#### **FINANCEIRO**
- ✅ CRUD entradas financeiras
- ✅ CRUD saídas financeiras
- ✅ Marcar entrada como recebida (com comprovante PDF)
- ✅ Marcar saída como paga (com comprovante PDF)
- ✅ Gerenciar contas (bills)
- ✅ Gerenciar centros de custo
- ✅ Registrar consumo mensal
- ✅ Ver projeções financeiras
- ✅ Ver KPIs e gráficos
- ❌ Não aprova despesas (isso é do síndico)

#### **PATRIMONIO**
- ✅ CRUD ativos
- ✅ Registrar manutenções
- ✅ Calcular depreciação
- ✅ Ver histórico de ativos

#### **OPERACIONAL**
- ✅ Preencher checklist diário
- ✅ Marcar tarefas como concluídas (com formulário estruturado)
- ✅ Criar ocorrências
- ✅ Resolver ocorrências (com formulário estruturado)
- ✅ Ver apenas suas tarefas
- ❌ Não vê informações financeiras
- ❌ Não aprova nada
- ❌ Não cria tarefas

#### **LIMPEZA**
- ✅ Criar ocorrências de limpeza
- ✅ Ver ocorrências de limpeza
- ❌ Não cria ocorrências de zeladoria

#### **CONSELHO**
- ✅ Visualizar dashboards
- ✅ Ver informações gerais
- ❌ Não pode criar, editar ou aprovar nada

---

## 6. MÓDULOS E FUNCIONALIDADES

### 6.1 Módulo de Autenticação (`/auth`)
**Rotas:**
- `GET /auth/login` - Tela de login
- `POST /auth/login` - Processar login
- `POST /auth/logout` - Logout

**Funcionalidades:**
- Login com username/email e senha
- Geração de JWT armazenado em cookie
- Redirecionamento baseado em perfil
- Log de tentativas de login

### 6.2 Módulo Master (`/master`)
**Acesso:** SUPER_MASTER

**Funcionalidades:**
- Dashboard com visão global
- CRUD condomínios
- CRUD usuários
- Atribuição de perfis
- Ativação/desativação de usuários

**Rotas Principais:**
- `/master/dashboard`
- `/master/condominios` (list, novo, editar)
- `/master/usuarios` (list, novo, editar)

### 6.3 Módulo Síndico (`/sindico`)
**Acesso:** SINDICO, SUBSINDICO

**Funcionalidades:**
- Dashboard executivo com KPIs
- Aprovações pendentes (aprovar/rejeitar)
- Alertas críticos e avisos
- Visualização de logs
- Visualização de tarefas e ocorrências
- Adicionar observações
- Reabrir tarefas/ocorrências/saídas

**Rotas Principais:**
- `/sindico/dashboard`
- `/sindico/aprovacoes`
- `/sindico/alertas`
- `/sindico/logs`
- `/sindico/tarefas` (visualização)
- `/sindico/ocorrencias` (visualização)

### 6.4 Módulo Administrativo (`/administrativo`)
**Acesso:** ADMINISTRATIVO

**Funcionalidades:**
- Dashboard administrativo
- CRUD tarefas (com prazo obrigatório)
- Triagem de ocorrências (classificação, SLA, atribuição)
- CRUD documentos e categorias
- Solicitações de orçamento (ADM → Síndico)
- Comunicados operacionais
- Reabertura de tarefas

**Rotas Principais:**
- `/administrativo/dashboard`
- `/administrativo/tarefas` (list, nova, criar)
- `/administrativo/ocorrencias` (list, pendentes, triar)
- `/administrativo/documentos` (list, novo, categorias)
- `/administrativo/orcamentos` (list, novo)
- `/administrativo/comunicados` (list, novo)

### 6.5 Módulo Financeiro (`/financeiro`)
**Acesso:** FINANCEIRO

**Funcionalidades:**
- Dashboard financeiro com KPIs e gráficos
- CRUD entradas financeiras
- CRUD saídas financeiras
- Marcar entrada como recebida (com PDF)
- Marcar saída como paga (com PDF)
- CRUD contas (bills)
- CRUD centros de custo
- Registro de consumo mensal
- Projeções financeiras (próximos 3 meses)
- Comparação de consumo (água/energia)
- Reabertura de saídas

**Recorrência:**
- Entradas/saídas podem ser marcadas como recorrentes
- Tipos: MONTHLY, QUARTERLY, YEARLY, UNIQUE
- Valores variáveis com média para projeções

**Rotas Principais:**
- `/financeiro/dashboard`
- `/financeiro/entradas` (list, nova, receber, comprovante)
- `/financeiro/saidas` (list, nova, pagar, comprovante)
- `/financeiro/contas` (list, nova)
- `/financeiro/centros-custo` (list, novo)
- `/financeiro/consumo` (list, novo)
- `/financeiro/api/consumption-comparison`
- `/financeiro/api/projections`

### 6.6 Módulo Patrimônio (`/patrimonio`)
**Acesso:** PATRIMONIO

**Funcionalidades:**
- Dashboard patrimonial
- CRUD ativos
- Registrar manutenções (preventiva/corretiva)
- Calcular depreciação automática
- Histórico completo de ativos

**Rotas Principais:**
- `/patrimonio/dashboard`
- `/patrimonio/ativos` (list, novo, editar, detalhes)
- `/patrimonio/ativos/:id/manutencao/nova`
- `/patrimonio/ativos/:id/calcular-depreciacao`

### 6.7 Módulo Operacional (`/operacional`)
**Acesso:** OPERACIONAL

**Funcionalidades:**
- Dashboard operacional
- Checklist diário (marcar feito/não feito)
- Visualizar tarefas atribuídas
- Concluir tarefas (formulário estruturado):
  - Sucesso (sim/não)
  - Contratempos
  - Tempo gasto (minutos)
  - Qualidade (EXCELENTE, BOM, REGULAR, RUIM)
  - Notas
- Criar ocorrências
- Resolver ocorrências (formulário estruturado):
  - Método de resolução
  - Custo
  - Complicações
  - Medidas preventivas
  - Tempo gasto
  - Notas

**Rotas Principais:**
- `/operacional/dashboard`
- `/operacional/checklist`
- `/operacional/tarefas/:id`
- `/operacional/tarefas/:id/concluir`
- `/operacional/ocorrencias` (list, nova, resolver)

### 6.8 Módulo Limpeza (`/limpeza`)
**Acesso:** LIMPEZA

**Funcionalidades:**
- Dashboard de limpeza
- Criar ocorrências de limpeza
- Ver ocorrências de limpeza

**Rotas Principais:**
- `/limpeza/dashboard`
- `/limpeza/ocorrencias` (list, nova)

### 6.9 Módulo Conselho (`/conselho`)
**Acesso:** CONSELHO

**Funcionalidades:**
- Dashboard de visualização
- Apenas leitura (read-only)

**Rotas Principais:**
- `/conselho/dashboard`

### 6.10 Módulo Estoque (`/estoque`)
**Acesso:** ADMINISTRATIVO

**Funcionalidades:**
- Dashboard de estoque
- CRUD itens de estoque
- Movimentações (entrada/saída/ajuste)
- Alertas de estoque mínimo

**Rotas Principais:**
- `/estoque/`
- `/estoque/items` (list, novo, editar, movimentação)

### 6.11 Módulo Configurações (`/config`)
**Acesso:** ADMINISTRATIVO

**Funcionalidades:**
- Configurações do condomínio
- Parâmetros personalizáveis

**Rotas Principais:**
- `/config/` (list, nova, editar)

### 6.12 Módulo Notificações (`/notifications`)
**Acesso:** Todos (autenticados)

**Funcionalidades:**
- Listar notificações
- Marcar como lida
- Resolver notificação
- Justificar notificação

**Rotas Principais:**
- `/notifications/`
- `/notifications/:id/read`
- `/notifications/:id/resolve`
- `/notifications/:id/justify`

### 6.13 Módulo Automações (`/automation`)
**Acesso:** ADMINISTRATIVO

**Funcionalidades:**
- Executar automações manualmente
- Verificar notificações pendentes

**Rotas Principais:**
- `/automation/run`
- `/automation/notifications`

---

## 7. FLUXOS PRINCIPAIS

### 7.1 Fluxo de Tarefa Completo

```
1. ADMINISTRATIVO cria tarefa
   └─> Define: título, descrição, responsável, prazo (obrigatório), prioridade
   └─> Sistema cria registro em `tasks`
   └─> Sistema cria itens de checklist (se houver)
   └─> Sistema registra em audit_logs

2. OPERACIONAL recebe notificação
   └─> Sistema cria notificação automática
   └─> Aparece no dashboard do operacional

3. OPERACIONAL executa tarefa
   └─> Marca itens do checklist (feito/não feito)
   └─> Se não feito, comentário obrigatório
   └─> Conclui tarefa com formulário estruturado:
       • Sucesso (sim/não)
       • Contratempos (se houver)
       • Tempo gasto (minutos)
       • Qualidade (EXCELENTE, BOM, REGULAR, RUIM)
       • Notas adicionais
   └─> Sistema atualiza `tasks.status = COMPLETED`
   └─> Sistema registra em audit_logs

4. Se tarefa atrasar:
   └─> Sistema cria alerta automático
   └─> Se > 48h: alerta CRÍTICO para síndico
   └─> Se < 48h: alerta AVISO para responsável
```

### 7.2 Fluxo de Ocorrência Completo

```
1. OPERACIONAL cria ocorrência
   └─> Define: título, descrição, localização, tipo (ZELADORIA/LIMPEZA)
   └─> Sistema cria registro em `occurrences` com status ABERTA
   └─> Sistema registra em audit_logs

2. ADMINISTRATIVO faz triagem
   └─> Acessa ocorrências pendentes
   └─> Define:
       • Prioridade (BAIXA, NORMAL, ALTA, URGENTE)
       • Classificação (PREVENTIVA, CORRETIVA, EMERGENCIA, etc)
       • SLA (horas para resolução)
       • Responsável (assignTo)
       • Converter para tarefa? (opcional)
   └─> Sistema atualiza `occurrences`:
       • triaged = TRUE
       • triaged_by = userId
       • triaged_at = CURRENT_TIMESTAMP
       • classification = valor selecionado
       • sla_hours = valor definido
       • sla_due_date = calculado automaticamente
   └─> Se convertToTask = TRUE:
       • Sistema cria tarefa automaticamente
       • related_task_id = ID da tarefa
       • converted_to_task = TRUE

3. OPERACIONAL resolve ocorrência
   └─> Preenche formulário estruturado:
       • Método de resolução
       • Custo (se houver)
       • Complicações (se houver)
       • Medidas preventivas
       • Tempo gasto
       • Notas
   └─> Sistema atualiza `occurrences`:
       • status = RESOLVIDA
       • resolved_at = CURRENT_TIMESTAMP
       • resolved_by = userId
       • resolution_notes = dados do formulário

4. SÍNDICO pode adicionar observação
   └─> Adiciona observação em `occurrences.sindico_observation`
   └─> Sistema registra quem adicionou e quando
```

### 7.3 Fluxo Financeiro Completo

#### **Entrada Financeira:**
```
1. FINANCEIRO cria entrada
   └─> Define: descrição, valor, data, categoria, centro de custo
   └─> Opcional: marcar como recorrente (MONTHLY, QUARTERLY, YEARLY)
   └─> Opcional: marcar como variável (com valor médio)
   └─> Sistema cria registro em `financial_entries` com received = FALSE

2. FINANCEIRO marca como recebida
   └─> Upload de comprovante PDF
   └─> Preenche: método de recebimento, detalhes, notas
   └─> Sistema atualiza:
       • received = TRUE
       • received_at = CURRENT_TIMESTAMP
       • receipt_pdf_path = caminho do PDF
       • receipt_details, receipt_method, receipt_notes

3. Sistema usa para projeções
   └─> Se recorrente, aparece nas projeções futuras
   └─> Se variável, usa average_amount ou amount
```

#### **Saída Financeira:**
```
1. FINANCEIRO cria saída
   └─> Define: descrição, valor, data, categoria, centro de custo, conta (bill)
   └─> Opcional: marcar como recorrente
   └─> Opcional: marcar como variável
   └─> Define: requiresApproval, approvalLimit
   └─> Sistema cria registro em `financial_exits`

2. Sistema verifica aprovação
   └─> Se requiresApproval = TRUE e valor > approvalLimit:
       • payment_status = PENDING
       • Sistema cria registro em `approvals`
       • Aparece no dashboard do síndico
   └─> Se não precisa aprovação:
       • payment_status = APPROVED

3. SÍNDICO aprova/rejeita
   └─> Se aprovar:
       • payment_status = APPROVED
       • approved_by = userId
       • approved_at = CURRENT_TIMESTAMP
   └─> Se rejeitar:
       • payment_status = REJECTED
       • rejection_reason = motivo obrigatório

4. FINANCEIRO marca como paga
   └─> Upload de comprovante PDF
   └─> Preenche: método de pagamento, detalhes, notas
   └─> Sistema atualiza:
       • payment_status = PAID
       • paid_at = CURRENT_TIMESTAMP
       • payment_receipt_pdf_path = caminho do PDF
       • payment_details, payment_method, payment_notes

5. Sistema usa para projeções
   └─> Se recorrente, aparece nas projeções futuras
```

### 7.4 Fluxo de Consumo Mensal

```
1. FINANCEIRO registra consumo
   └─> Seleciona conta (bill)
   └─> Define: mês, ano, valor do consumo, unidade, valor da conta, vencimento
   └─> Sistema cria/atualiza registro em `monthly_consumption`
   └─> UNIQUE(condominium_id, bill_id, month, year) evita duplicatas

2. Sistema usa para KPIs
   └─> Calcula média de consumo por tipo
   └─> Compara mês atual vs anteriores
   └─> Gera gráficos de comparação (água vs energia)
```

### 7.5 Fluxo de Triagem de Ocorrência

```
1. OPERACIONAL cria ocorrência
   └─> classification = NULL (não classificada)

2. ADMINISTRATIVO acessa pendentes
   └─> Lista ocorrências com triaged = FALSE

3. ADMINISTRATIVO faz triagem
   └─> Define classification (obrigatório):
       • PREVENTIVA - Manutenções programadas
       • CORRETIVA - Reparos, consertos
       • EMERGENCIA - Urgências
       • MELHORIA - Upgrades
       • LIMPEZA - Serviços de limpeza
       • JARDINAGEM - Áreas verdes
       • SEGURANCA - Segurança
       • ELETRICA - Elétrica
       • HIDRAULICA - Hidráulica
       • OUTRA - Outros
   └─> Define SLA (horas)
   └─> Atribui responsável (opcional)
   └─> Opcional: converte para tarefa

4. Sistema atualiza ocorrência
   └─> triaged = TRUE
   └─> classification = valor definido
   └─> sla_due_date = calculado
   └─> Se convertToTask: cria tarefa automaticamente
```

---

## 8. ROTAS E ENDPOINTS

### 8.1 Autenticação (`/auth`)
- `GET /auth/login` - Tela de login
- `POST /auth/login` - Processar login
- `POST /auth/logout` - Logout

### 8.2 Master (`/master`)
- `GET /master/dashboard`
- `GET /master/condominios` - Listar
- `GET /master/condominios/novo` - Form criar
- `POST /master/condominios` - Criar
- `GET /master/condominios/:id/editar` - Form editar
- `POST /master/condominios/:id` - Atualizar
- `GET /master/usuarios` - Listar
- `GET /master/usuarios/novo` - Form criar
- `POST /master/usuarios` - Criar
- `GET /master/usuarios/:id/editar` - Form editar
- `POST /master/usuarios/:id` - Atualizar

### 8.3 Síndico (`/sindico`)
- `GET /sindico/dashboard`
- `GET /sindico/aprovacoes` - Listar pendentes
- `POST /sindico/aprovacoes/:id/processar` - Aprovar/rejeitar
- `GET /sindico/alertas` - Listar alertas
- `POST /sindico/alertas/:id/resolver` - Resolver alerta
- `GET /sindico/logs` - Visualizar logs
- `GET /sindico/tarefas` - Listar tarefas
- `GET /sindico/tarefas/:id` - Detalhes tarefa
- `POST /sindico/tarefas/:id/observacao` - Adicionar observação
- `GET /sindico/ocorrencias` - Listar ocorrências
- `GET /sindico/ocorrencias/:id` - Detalhes ocorrência
- `POST /sindico/ocorrencias/:id/observacao` - Adicionar observação
- `POST /sindico/ocorrencias/:id/reabrir` - Reabrir ocorrência
- `POST /sindico/tarefas/:id/reabrir` - Reabrir tarefa

### 8.4 Administrativo (`/administrativo`)
- `GET /administrativo/dashboard`
- `GET /administrativo/tarefas` - Listar
- `GET /administrativo/tarefas/nova` - Form criar
- `POST /administrativo/tarefas` - Criar
- `POST /administrativo/tarefas/:id/reabrir` - Reabrir
- `GET /administrativo/documentos` - Listar
- `GET /administrativo/documentos/novo` - Form criar
- `POST /administrativo/documentos` - Criar (com upload)
- `GET /administrativo/documentos/categorias` - Listar categorias
- `GET /administrativo/documentos/categorias/nova` - Form criar categoria
- `POST /administrativo/documentos/categorias` - Criar categoria
- `GET /administrativo/documentos/:id/editar` - Form editar
- `POST /administrativo/documentos/:id` - Atualizar
- `GET /administrativo/ocorrencias` - Listar todas
- `GET /administrativo/ocorrencias/pendentes` - Listar pendentes triagem
- `GET /administrativo/ocorrencias/:id/triar` - Form triagem
- `POST /administrativo/ocorrencias/:id/triar` - Processar triagem
- `GET /administrativo/orcamentos` - Listar
- `GET /administrativo/orcamentos/novo` - Form criar
- `POST /administrativo/orcamentos` - Criar (com upload)
- `GET /administrativo/comunicados` - Listar
- `GET /administrativo/comunicados/novo` - Form criar
- `POST /administrativo/comunicados` - Criar
- `POST /administrativo/comunicados/:id/desativar` - Desativar

### 8.5 Financeiro (`/financeiro`)
- `GET /financeiro/dashboard`
- `GET /financeiro/entradas` - Listar
- `GET /financeiro/entradas/nova` - Form criar
- `POST /financeiro/entradas` - Criar
- `GET /financeiro/entradas/:id/receber` - Form marcar recebida
- `POST /financeiro/entradas/:id/receber` - Processar (com upload PDF)
- `GET /financeiro/entradas/:id/comprovante` - Ver PDF
- `GET /financeiro/saidas` - Listar
- `GET /financeiro/saidas/nova` - Form criar
- `POST /financeiro/saidas` - Criar
- `GET /financeiro/saidas/:id/pagar` - Form marcar paga
- `POST /financeiro/saidas/:id/pagar` - Processar (com upload PDF)
- `GET /financeiro/saidas/:id/comprovante` - Ver PDF
- `GET /financeiro/saidas/:id/reabrir` - Form reabrir
- `POST /financeiro/saidas/:id/reabrir` - Reabrir
- `GET /financeiro/contas` - Listar contas
- `GET /financeiro/contas/nova` - Form criar conta
- `POST /financeiro/contas` - Criar conta
- `GET /financeiro/centros-custo` - Listar
- `GET /financeiro/centros-custo/novo` - Form criar
- `POST /financeiro/centros-custo` - Criar
- `GET /financeiro/consumo` - Listar consumo
- `GET /financeiro/consumo/novo` - Form criar consumo
- `POST /financeiro/consumo` - Criar consumo
- `GET /financeiro/api/consumption-comparison` - API comparação consumo
- `GET /financeiro/api/projections` - API projeções

### 8.6 Patrimônio (`/patrimonio`)
- `GET /patrimonio/dashboard`
- `GET /patrimonio/ativos` - Listar
- `GET /patrimonio/ativos/novo` - Form criar
- `POST /patrimonio/ativos` - Criar
- `GET /patrimonio/ativos/:id` - Detalhes
- `GET /patrimonio/ativos/:id/editar` - Form editar
- `POST /patrimonio/ativos/:id` - Atualizar
- `GET /patrimonio/ativos/:id/manutencao/nova` - Form criar manutenção
- `POST /patrimonio/ativos/:id/manutencao` - Criar manutenção
- `POST /patrimonio/ativos/:id/calcular-depreciacao` - Calcular depreciação

### 8.7 Operacional (`/operacional`)
- `GET /operacional/dashboard`
- `GET /operacional/checklist` - Checklist diário
- `POST /operacional/checklist/:id/atualizar` - Atualizar item
- `GET /operacional/tarefas/:id` - Detalhes tarefa
- `GET /operacional/tarefas/:id/concluir` - Form concluir
- `POST /operacional/tarefas/:id/finalizar` - Processar conclusão
- `GET /operacional/ocorrencias` - Listar
- `GET /operacional/ocorrencias/nova` - Form criar
- `POST /operacional/ocorrencias` - Criar
- `GET /operacional/ocorrencias/:id/resolver` - Form resolver
- `POST /operacional/ocorrencias/:id/resolver` - Processar resolução

### 8.8 Limpeza (`/limpeza`)
- `GET /limpeza/dashboard`
- `GET /limpeza/ocorrencias` - Listar
- `GET /limpeza/ocorrencias/nova` - Form criar
- `POST /limpeza/ocorrencias` - Criar
- `GET /limpeza/ocorrencias/:id` - Detalhes

### 8.9 Conselho (`/conselho`)
- `GET /conselho/dashboard`

### 8.10 Estoque (`/estoque`)
- `GET /estoque/` - Dashboard
- `GET /estoque/items` - Listar
- `GET /estoque/items/novo` - Form criar
- `POST /estoque/items` - Criar
- `GET /estoque/items/:id` - Detalhes
- `GET /estoque/items/:id/editar` - Form editar
- `POST /estoque/items/:id` - Atualizar
- `GET /estoque/items/:id/movimentacao` - Form movimentação
- `POST /estoque/items/:id/movimentacao` - Processar movimentação

### 8.11 Configurações (`/config`)
- `GET /config/` - Listar
- `GET /config/nova` - Form criar
- `POST /config/` - Criar
- `GET /config/:key/edit` - Form editar
- `POST /config/:key` - Atualizar

### 8.12 Notificações (`/notifications`)
- `GET /notifications/` - Listar
- `POST /notifications/:id/read` - Marcar como lida
- `POST /notifications/:id/resolve` - Resolver
- `POST /notifications/:id/justify` - Justificar

### 8.13 Automações (`/automation`)
- `GET /automation/run` - Executar automações
- `GET /automation/notifications` - Ver notificações pendentes
- `POST /automation/notifications/:id/read` - Marcar lida

---

## 9. REGRAS DE NEGÓCIO

### 9.1 Regras de Tarefas
- ✅ Prazo (`due_date`) é **OBRIGATÓRIO** - Tarefa sem prazo não pode ser criada
- ✅ Evidência é obrigatória se `evidence_required = TRUE`
- ✅ Comentário obrigatório se item de checklist marcado como "não feito"
- ✅ Tarefa concluída não pode ser editada (apenas reaberta)
- ✅ Apenas OPERACIONAL pode concluir tarefas atribuídas a ele
- ✅ ADMINISTRATIVO cria tarefas, não executa

### 9.2 Regras de Ocorrências
- ✅ OPERACIONAL cria ocorrências, não resolve (exceto se atribuído)
- ✅ ADMINISTRATIVO faz triagem (obrigatória)
- ✅ Classificação é obrigatória na triagem
- ✅ SLA é calculado automaticamente: `sla_due_date = CURRENT_TIMESTAMP + sla_hours`
- ✅ Ocorrência pode ser convertida em tarefa automaticamente
- ✅ Resolução requer formulário estruturado completo

### 9.3 Regras Financeiras
- ✅ Entrada marcada como recebida não pode ser editada
- ✅ Saída marcada como paga não pode ser editada
- ✅ Saída acima do limite precisa de aprovação do síndico
- ✅ Aprovação rejeitada não pode ser paga
- ✅ Comprovante PDF obrigatório ao marcar como recebida/paga
- ✅ Recorrência permite projeções futuras
- ✅ Valores variáveis usam `average_amount` para projeções

### 9.4 Regras de Aprovação
- ✅ ADMINISTRATIVO aprova até `approval_limit` (padrão: R$ 1.000,00)
- ✅ SÍNDICO aprova valores acima do limite
- ✅ Rejeição requer motivo obrigatório
- ✅ Aprovação é registrada em `audit_logs`

### 9.5 Regras de Patrimônio
- ✅ Depreciação calculada automaticamente
- ✅ Valor atual = valor original - (depreciação × tempo)
- ✅ Manutenções vinculadas a ativos
- ✅ Histórico imutável de manutenções

### 9.6 Regras de Estoque
- ✅ Movimentação atualiza quantidade automaticamente
- ✅ Alerta automático se `current_quantity < minimum_quantity`
- ✅ Histórico completo de movimentações

### 9.7 Regras de Auditoria
- ✅ **TODAS** as ações importantes são registradas em `audit_logs`
- ✅ Logs são **IMUTÁVEIS** (nunca editados ou deletados)
- ✅ Registra: usuário, ação, módulo, entidade, antes/depois, IP, user-agent
- ✅ Logs incluem dados completos em JSON (before_data, after_data)

---

## 10. AUTOMAÇÕES E ALERTAS

### 10.1 Automações Implementadas

#### **Verificação de SLA**
- Verifica tarefas e ocorrências com prazo vencido
- Cria alertas automaticamente:
  - **CRÍTICO:** > 48 horas de atraso → Notifica síndico
  - **AVISO:** < 48 horas de atraso → Notifica responsável

#### **Escalonamento**
- Se tarefa/ocorrência muito atrasada:
  - Notifica chefe imediato (síndico)
  - Registra em logs
  - Atualiza status

#### **Alertas de Documentos**
- Verifica documentos próximos do vencimento
- Cria notificação para ADMINISTRATIVO
- Alerta configurável (ex: 30 dias antes)

#### **Alertas de Estoque**
- Verifica itens abaixo do mínimo
- Cria notificação para ADMINISTRATIVO
- Alerta em tempo real

#### **Notificações de Tarefas**
- Cria notificação quando tarefa é atribuída
- Notifica responsável automaticamente

#### **Projeções Financeiras**
- Calcula automaticamente baseado em recorrências
- Projeta próximos 3 meses
- Considera valores variáveis com média

### 10.2 Tipos de Notificações

| Tipo | Descrição | Destinatário |
|------|-----------|--------------|
| `TASK_OVERDUE` | Tarefa atrasada | Responsável + Síndico |
| `OCCURRENCE_OVERDUE` | Ocorrência atrasada | Responsável + Síndico |
| `APPROVAL_PENDING` | Aprovação pendente | Síndico |
| `DOCUMENT_EXPIRING` | Documento vencendo | Administrativo |
| `INVENTORY_LOW` | Estoque baixo | Administrativo |
| `TASK_CREATED` | Tarefa criada | Responsável |
| `OCCURRENCE_CREATED` | Ocorrência criada | Administrativo |

---

## 11. UPLOADS E ARQUIVOS

### 11.1 Tipos de Upload

#### **Comprovantes de Entrada (`/uploads/receipts/`)**
- Formato: PDF apenas
- Tamanho máximo: 10MB
- Nome: `receipt_{entryId}_{timestamp}.pdf`
- Acessível via: `/uploads/receipts/receipt_{id}_{timestamp}.pdf`

#### **Comprovantes de Pagamento (`/uploads/payments/`)**
- Formato: PDF apenas
- Tamanho máximo: 10MB
- Nome: `payment_{exitId}_{timestamp}.pdf`
- Acessível via: `/uploads/payments/payment_{id}_{timestamp}.pdf`

#### **Contratos/Documentos (`/uploads/contracts/`)**
- Formato: PDF (preferencial)
- Tamanho máximo: 50MB
- Nome: `contract_{userId}_{timestamp}.pdf`
- Múltiplos arquivos permitidos (até 10 por vez)

### 11.2 Middleware de Upload
- **Multer** configurado em `src/middlewares/upload.js`
- Validação de tipo de arquivo
- Validação de tamanho
- Criação automática de diretórios

---

## 12. KPIs E DASHBOARDS

### 12.1 Dashboard Financeiro

#### **KPIs Principais:**
- Saldo atual (entradas - saídas)
- Entradas do mês atual (com variação % vs mês anterior)
- Saídas do mês atual (com variação % vs mês anterior)
- Média mensal dos últimos 6 meses (entradas/saídas)

#### **Gráficos:**
- **Evolução Financeira (6 meses):** Linha com entradas, saídas e saldo
- **Consumo de Contas:** Barras com média por tipo de conta
- **Comparação de Consumo:** Linha comparando água vs energia ao longo do tempo

#### **Projeções:**
- Próximos 3 meses com:
  - Entradas previstas (baseadas em recorrências)
  - Saídas previstas (baseadas em recorrências)
  - Saldo projetado

#### **Tabela de Consumo:**
- Últimos registros de consumo mensal
- Filtros por mês/ano/tipo de conta

### 12.2 Dashboard Síndico

#### **Informações Exibidas:**
- Aprovações pendentes
- Alertas críticos e avisos
- Resumo de tarefas (abertas, concluídas, atrasadas)
- Resumo de ocorrências (abertas, resolvidas, atrasadas)
- KPIs financeiros resumidos

### 12.3 Dashboard Administrativo

#### **Informações Exibidas:**
- Tarefas pendentes
- Ocorrências pendentes de triagem
- Documentos próximos do vencimento
- Alertas e notificações

### 12.4 Dashboard Operacional

#### **Informações Exibidas:**
- Checklist diário
- Tarefas atribuídas
- Ocorrências abertas
- Notificações

---

## 13. CHECKLIST DE VERIFICAÇÃO

### 13.1 Funcionalidades Implementadas

#### **Autenticação e Segurança**
- [x] Login com JWT
- [x] Middleware de autenticação
- [x] Middleware de autorização (RBAC)
- [x] Logout
- [x] Proteção de rotas por perfil
- [x] Senhas criptografadas (bcrypt)

#### **SUPER_MASTER**
- [x] Dashboard master
- [x] CRUD condomínios
- [x] CRUD usuários
- [x] Atribuição de perfis
- [x] Ativação/desativação de usuários

#### **SÍNDICO**
- [x] Dashboard executivo
- [x] Aprovações (aprovar/rejeitar)
- [x] Alertas e avisos
- [x] Visualização de logs
- [x] Visualização de tarefas/ocorrências
- [x] Adicionar observações
- [x] Reabrir tarefas/ocorrências/saídas

#### **ADMINISTRATIVO**
- [x] Dashboard administrativo
- [x] CRUD tarefas (com prazo obrigatório)
- [x] Triagem de ocorrências (classificação, SLA)
- [x] CRUD documentos e categorias
- [x] Solicitações de orçamento
- [x] Comunicados operacionais
- [x] Reabertura de tarefas

#### **FINANCEIRO**
- [x] Dashboard financeiro com KPIs
- [x] CRUD entradas/saídas
- [x] Comprovantes PDF (entrada/saída)
- [x] CRUD contas (bills)
- [x] CRUD centros de custo
- [x] Registro de consumo mensal
- [x] Projeções financeiras (3 meses)
- [x] Comparação de consumo (água/energia)
- [x] Gráficos (Chart.js)
- [x] Recorrência (MONTHLY, QUARTERLY, YEARLY)
- [x] Valores variáveis com média
- [x] Reabertura de saídas

#### **PATRIMONIO**
- [x] Dashboard patrimonial
- [x] CRUD ativos
- [x] Registrar manutenções
- [x] Calcular depreciação automática
- [x] Histórico de ativos

#### **OPERACIONAL**
- [x] Dashboard operacional
- [x] Checklist diário
- [x] Concluir tarefas (formulário estruturado)
- [x] Criar ocorrências
- [x] Resolver ocorrências (formulário estruturado)
- [x] Ver apenas tarefas atribuídas

#### **LIMPEZA**
- [x] Dashboard de limpeza
- [x] Criar ocorrências de limpeza
- [x] Ver ocorrências de limpeza

#### **CONSELHO**
- [x] Dashboard de visualização (read-only)

#### **ESTOQUE**
- [x] Dashboard de estoque
- [x] CRUD itens
- [x] Movimentações (entrada/saída/ajuste)
- [x] Alertas de estoque mínimo

#### **CONFIGURAÇÕES**
- [x] Configurações do condomínio
- [x] Parâmetros personalizáveis

#### **NOTIFICAÇÕES**
- [x] Sistema de notificações
- [x] Marcar como lida
- [x] Resolver/justificar

#### **AUTOMAÇÕES**
- [x] Verificação de SLA
- [x] Alertas automáticos
- [x] Escalonamento
- [x] Notificações automáticas

#### **AUDITORIA**
- [x] Logs completos (audit_logs)
- [x] Registro de todas as ações
- [x] Before/after data
- [x] IP e user-agent

### 13.2 Funcionalidades Pendentes ou Parciais

#### **Upload de Evidências**
- [x] Estrutura criada (`task_evidences`)
- [ ] Interface de upload implementada
- [ ] Visualização de evidências

#### **Validações Avançadas**
- [ ] Validação de valores permitidos (enum) para classification
- [ ] Histórico de mudanças de categoria
- [ ] Relatórios específicos por categoria

#### **Melhorias Futuras**
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Filtros avançados em todas as listagens
- [ ] Busca global
- [ ] Dashboard personalizável
- [ ] Notificações por email
- [ ] App mobile

---

## 14. ESTRUTURA DE DADOS DETALHADA

### 14.1 Campos Estruturados de Conclusão de Tarefa

```javascript
{
  success: boolean,                    // Tarefa foi bem-sucedida?
  issues_description: string,          // Contratempos encontrados
  completion_time_minutes: number,    // Tempo gasto em minutos
  completion_quality: string,        // EXCELENTE, BOM, REGULAR, RUIM
  notes: string                       // Notas adicionais
}
```

### 14.2 Campos Estruturados de Resolução de Ocorrência

```javascript
{
  resolution_method: string,          // Método usado para resolver
  resolution_cost: decimal,          // Custo da resolução
  complications: string,              // Complicações encontradas
  preventive_measures: string,        // Medidas preventivas
  time_spent_minutes: number,         // Tempo gasto
  notes: string                       // Notas adicionais
}
```

### 14.3 Dados de Comprovante (Entrada)

```javascript
{
  receiptPdfPath: string,             // Caminho do PDF
  receiptDetails: string,             // Detalhes do recebimento
  receiptMethod: string,              // Método (DINHEIRO, PIX, TRANSFERENCIA, etc)
  receiptNotes: string                // Observações
}
```

### 14.4 Dados de Comprovante (Saída)

```javascript
{
  paymentReceiptPdfPath: string,      // Caminho do PDF
  paymentDetails: string,             // Detalhes do pagamento
  paymentMethod: string,              // Método de pagamento
  paymentNotes: string                // Observações
}
```

### 14.5 Dados de Recorrência

```javascript
{
  isRecurring: boolean,               // É recorrente?
  recurrenceType: string,             // MONTHLY, QUARTERLY, YEARLY, UNIQUE
  isVariable: boolean,                // Valor variável?
  averageAmount: decimal              // Valor médio (se variável)
}
```

---

## 15. CONFIGURAÇÃO E INSTALAÇÃO

### 15.1 Variáveis de Ambiente (.env)

```env
# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/condominio

# JWT
JWT_SECRET=seu_secret_aqui

# Servidor
PORT=3000
NODE_ENV=development
```

### 15.2 Inicialização

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar .env:**
   - Copiar `.env.example` para `.env`
   - Preencher variáveis

3. **Iniciar servidor:**
   ```bash
   npm run dev
   ```

4. **Inicialização automática:**
   - Sistema verifica e cria tabelas automaticamente
   - Cria usuário SUPER_MASTER padrão:
     - Username: `admin`
     - Senha: `admin123`
     - **ALTERAR APÓS PRIMEIRO LOGIN!**

### 15.3 Estrutura de Uploads

O sistema cria automaticamente:
- `uploads/receipts/` - Comprovantes de entrada
- `uploads/payments/` - Comprovantes de pagamento
- `uploads/contracts/` - Contratos/documentos

---

## 16. FLUXOS DETALHADOS POR MÓDULO

### 16.1 Fluxo de Aprovação Financeira

```
1. FINANCEIRO cria saída
   └─> Valor: R$ 5.000,00
   └─> requiresApproval: TRUE
   └─> approvalLimit: R$ 1.000,00
   └─> Sistema verifica: 5000 > 1000 → precisa aprovação

2. Sistema cria aprovação
   └─> Tabela: approvals
   └─> Status: PENDING
   └─> Tipo: FINANCIAL_EXIT
   └─> Entity: financial_exits
   └─> Entity ID: ID da saída

3. SÍNDICO vê no dashboard
   └─> Aprovações pendentes: 1
   └─> Clica em "Aprovações"

4. SÍNDICO aprova/rejeita
   └─> Se aprovar:
       • Sistema atualiza financial_exits.payment_status = APPROVED
       • Sistema atualiza approvals.status = APPROVED
       • approvals.approved_by = userId
       • approvals.approved_at = CURRENT_TIMESTAMP
   └─> Se rejeitar:
       • Sistema atualiza financial_exits.payment_status = REJECTED
       • Sistema atualiza approvals.status = REJECTED
       • approvals.rejection_reason = motivo (obrigatório)

5. FINANCEIRO pode pagar (se aprovado)
   └─> Se payment_status = APPROVED:
       • Pode marcar como paga
       • Upload de comprovante PDF
   └─> Se payment_status = REJECTED:
       • Não pode pagar
       • Deve criar nova saída ou reabrir
```

### 16.2 Fluxo de Triagem e Conversão

```
1. OPERACIONAL cria ocorrência
   └─> "Bomba d'água com barulho estranho"
   └─> status: ABERTA
   └─> triaged: FALSE

2. ADMINISTRATIVO acessa pendentes
   └─> /administrativo/ocorrencias/pendentes
   └─> Vê ocorrência não triada

3. ADMINISTRATIVO faz triagem
   └─> Classification: CORRETIVA
   └─> Priority: ALTA
   └─> SLA: 24 horas
   └─> AssignTo: Operacional X
   └─> ConvertToTask: TRUE
   └─> TaskTitle: "Reparar bomba d'água"
   └─> TaskDueDate: (calculado do SLA)

4. Sistema processa triagem
   └─> Atualiza occurrences:
       • triaged = TRUE
       • classification = CORRETIVA
       • sla_hours = 24
       • sla_due_date = CURRENT_TIMESTAMP + 24h
       • assigned_to = Operacional X
   └─> Cria tarefa automaticamente:
       • title = "Reparar bomba d'água"
       • description = descrição da ocorrência
       • assigned_to = Operacional X
       • due_date = sla_due_date
       • priority = ALTA
       • task_type = CORRECTIVE
       • related_occurrence_id = ID da ocorrência
   └─> Atualiza occurrences:
       • converted_to_task = TRUE
       • related_task_id = ID da tarefa criada
   └─> Cria notificação para Operacional X

5. OPERACIONAL recebe notificação
   └─> Vê nova tarefa no dashboard
   └─> Executa tarefa
   └─> Conclui com formulário estruturado

6. Sistema atualiza ocorrência
   └─> Quando tarefa concluída:
       • occurrences.status = RESOLVIDA (opcional, pode ser manual)
```

### 16.3 Fluxo de Projeções Financeiras

```
1. FINANCEIRO cria entrada recorrente
   └─> Descrição: "Taxa de condomínio"
   └─> Valor: R$ 10.000,00
   └─> isRecurring: TRUE
   └─> recurrenceType: MONTHLY
   └─> isVariable: FALSE

2. Sistema salva entrada
   └─> financial_entries.is_recurring = TRUE
   └─> financial_entries.recurrence_type = MONTHLY

3. Dashboard calcula projeções
   └─> Para cada mês futuro (1, 2, 3):
       • Busca entradas com is_recurring = TRUE
       • Filtra por recurrence_type:
         - MONTHLY: sempre inclui
         - QUARTERLY: se mês corresponde e diferença múltiplo de 3
         - YEARLY: se mês corresponde e já passou 1 ano
       • Soma valores (usa average_amount se variável)
   └─> Mesmo processo para saídas

4. Exibe projeções
   └─> Próximos 3 meses:
       • Entradas previstas: R$ 10.000,00/mês
       • Saídas previstas: R$ 8.000,00/mês
       • Saldo projetado: R$ 2.000,00/mês
```

---

## 17. CLASSIFICAÇÕES E CATEGORIAS

### 17.1 Classification de Ocorrências

| Valor | Descrição | Quando Usar |
|-------|-----------|-------------|
| `PREVENTIVA` | Manutenção preventiva | Manutenções programadas, inspeções |
| `CORRETIVA` | Manutenção corretiva | Reparos, consertos, correções |
| `EMERGENCIA` | Emergência | Situações urgentes |
| `MELHORIA` | Melhoria/Upgrade | Melhorias, upgrades |
| `LIMPEZA` | Limpeza | Serviços de limpeza |
| `JARDINAGEM` | Jardinagem | Poda, plantio, áreas verdes |
| `SEGURANCA` | Segurança | Portões, câmeras, segurança |
| `ELETRICA` | Elétrica | Problemas elétricos |
| `HIDRAULICA` | Hidráulica | Água, encanamento |
| `OUTRA` | Outra | Outros tipos |

### 17.2 Categorias Financeiras

#### **Entradas:**
- `TAXA` - Taxa de condomínio
- `RECEITA` - Outras receitas
- `OUTRA` - Outras entradas

#### **Saídas:**
- `MANUTENCAO` - Gastos com manutenção
- `CONTA` - Contas (água, luz, gás)
- `CONTRATO` - Pagamentos de contratos
- `OUTRA` - Outras saídas

### 17.3 Tipos de Recorrência

- `MONTHLY` - Mensal
- `QUARTERLY` - Trimestral
- `YEARLY` - Anual
- `UNIQUE` - Única (não repete)

---

## 18. OBSERVAÇÕES DO SÍNDICO

### 18.1 Funcionalidade
- SÍNDICO pode adicionar observações em tarefas e ocorrências
- Observações são registradas diretamente nas tabelas:
  - `occurrences.sindico_observation`
  - `tasks` (via tabela `sindico_observations`)

### 18.2 Fluxo
```
1. SÍNDICO visualiza tarefa/ocorrência
2. SÍNDICO adiciona observação
3. Sistema salva:
   - Para ocorrências: campos diretos na tabela
   - Para tarefas: tabela sindico_observations
4. Observação aparece na visualização
```

---

## 19. REABERTURA

### 19.1 Entidades que Podem ser Reabertas
- ✅ Tarefas
- ✅ Ocorrências
- ✅ Saídas Financeiras

### 19.2 Campos Adicionados
- `reopened` - BOOLEAN
- `reopened_at` - TIMESTAMP
- `reopened_by` - INTEGER (user_id)
- `reopening_reason` - TEXT

### 19.3 Fluxo
```
1. SÍNDICO solicita reabertura
2. Define motivo obrigatório
3. Sistema atualiza campos
4. Status volta para estado anterior apropriado
5. Registrado em audit_logs
```

---

## 20. VERIFICAÇÕES E VALIDAÇÕES

### 20.1 Validações de Formulários
- ✅ Campos obrigatórios validados no backend
- ✅ Tipos de dados validados
- ✅ Relacionamentos validados (foreign keys)
- ✅ Valores permitidos validados (enums)

### 20.2 Validações de Permissões
- ✅ Middleware `authorize` em todas as rotas
- ✅ Verificação de perfil antes de ações
- ✅ Verificação de condomínio (usuário pertence ao condomínio)

### 20.3 Validações de Negócio
- ✅ Tarefa sem prazo não pode ser criada
- ✅ Comentário obrigatório se checklist não feito
- ✅ Entrada/saída paga não pode ser editada
- ✅ Aprovação rejeitada não pode ser paga
- ✅ Rejeição requer motivo

---

## 21. PONTOS DE ATENÇÃO E MELHORIAS FUTURAS

### 21.1 Funcionalidades Parciais
- ⚠️ Upload de evidências: estrutura criada, falta interface
- ⚠️ Validação de enums: alguns valores hardcoded, ideal seria tabela de configuração

### 21.2 Melhorias Sugeridas
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Filtros avançados em todas as listagens
- [ ] Busca global no sistema
- [ ] Dashboard personalizável por usuário
- [ ] Notificações por email
- [ ] App mobile
- [ ] API REST completa para integrações
- [ ] Relatórios customizáveis
- [ ] Gráficos mais avançados
- [ ] Backup automático do banco

---

## 22. CONCLUSÃO

Este sistema é um **ecossistema completo de gestão condominial** com:

✅ **19 fases de desenvolvimento** implementadas  
✅ **13 módulos** funcionais  
✅ **30+ tabelas** no banco de dados  
✅ **100+ rotas** implementadas  
✅ **RBAC rigoroso** em todas as funcionalidades  
✅ **Auditoria completa** de todas as ações  
✅ **Automações inteligentes** (SLA, alertas, escalonamento)  
✅ **Projeções financeiras** baseadas em recorrências  
✅ **KPIs e gráficos** profissionais  
✅ **Uploads seguros** de documentos  
✅ **Formulários estruturados** para análise  

O sistema está **pronto para produção** e segue todas as regras de negócio definidas.

---

**Última atualização:** Janeiro 2025  
**Versão do documento:** 1.0.0
