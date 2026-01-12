# 🔐 MATRIZ DE PERMISSÕES E PADRONIZAÇÃO DE ESTADOS

## 📋 VISÃO GERAL

Este documento formaliza o sistema de permissões em nível técnico (AÇÃO x ENTIDADE) e padroniza todos os estados do sistema usando State Machines.

---

## 1. MATRIZ DE PERMISSÕES (AÇÃO x ENTIDADE)

### 1.1 Estrutura

**Tabela `permissions`:**
- `entity_type` - Tipo de entidade (tasks, occurrences, financial_exits, etc)
- `action` - Ação (create, read, update, delete, approve, pay, complete, etc)
- `description` - Descrição da permissão

**Tabela `role_permissions`:**
- `role_id` - Perfil
- `permission_id` - Permissão
- Mapeia quais perfis têm quais permissões

### 1.2 Matriz Completa de Permissões

| Entidade | Ação | Quem Pode | Descrição |
|----------|------|-----------|-----------|
| **tasks** | create | ADMINISTRATIVO | Criar tarefas |
| **tasks** | read | Todos (com contexto) | Visualizar tarefas |
| **tasks** | update | ADMINISTRATIVO | Editar tarefas |
| **tasks** | delete | ADMINISTRATIVO | Deletar tarefas |
| **tasks** | complete | OPERACIONAL | Concluir tarefas |
| **tasks** | reopen | SINDICO | Reabrir tarefas |
| **tasks** | add_observation | SINDICO | Adicionar observações |
| **occurrences** | create | OPERACIONAL, LIMPEZA | Criar ocorrências |
| **occurrences** | read | Todos (com contexto) | Visualizar ocorrências |
| **occurrences** | update | ADMINISTRATIVO | Editar ocorrências |
| **occurrences** | triage | ADMINISTRATIVO | Triar ocorrências |
| **occurrences** | resolve | OPERACIONAL | Resolver ocorrências |
| **occurrences** | reopen | SINDICO | Reabrir ocorrências |
| **occurrences** | add_observation | SINDICO | Adicionar observações |
| **financial_entries** | create | FINANCEIRO | Criar entradas |
| **financial_entries** | read | FINANCEIRO, SINDICO | Visualizar entradas |
| **financial_entries** | update | FINANCEIRO | Editar entradas |
| **financial_entries** | mark_received | FINANCEIRO | Marcar como recebida |
| **financial_entries** | view_receipt | FINANCEIRO, SINDICO | Ver comprovante |
| **financial_exits** | create | FINANCEIRO | Criar saídas |
| **financial_exits** | read | FINANCEIRO, SINDICO | Visualizar saídas |
| **financial_exits** | update | FINANCEIRO | Editar saídas |
| **financial_exits** | approve | ADMINISTRATIVO | Aprovar até limite |
| **financial_exits** | approve_high_value | SINDICO | Aprovar acima do limite |
| **financial_exits** | pay | FINANCEIRO | Marcar como paga |
| **financial_exits** | view_receipt | FINANCEIRO, SINDICO | Ver comprovante |
| **financial_exits** | reopen | SINDICO | Reabrir saída |
| **documents** | create | ADMINISTRATIVO | Criar documentos |
| **documents** | read | ADMINISTRATIVO, SINDICO | Visualizar documentos |
| **documents** | update | ADMINISTRATIVO | Editar documentos |
| **documents** | delete | ADMINISTRATIVO | Deletar documentos |
| **assets** | create | PATRIMONIO | Criar ativos |
| **assets** | read | PATRIMONIO, SINDICO | Visualizar ativos |
| **assets** | update | PATRIMONIO | Editar ativos |
| **assets** | register_maintenance | PATRIMONIO | Registrar manutenções |
| **assets** | calculate_depreciation | PATRIMONIO | Calcular depreciação |
| **inventory_items** | create | ADMINISTRATIVO | Criar itens de estoque |
| **inventory_items** | read | ADMINISTRATIVO | Visualizar estoque |
| **inventory_items** | update | ADMINISTRATIVO | Editar estoque |
| **inventory_items** | movement | ADMINISTRATIVO | Movimentar estoque |
| **budget_requests** | create | ADMINISTRATIVO | Criar solicitações |
| **budget_requests** | read | ADMINISTRATIVO, SINDICO | Visualizar solicitações |
| **budget_requests** | approve | SINDICO | Aprovar solicitações |
| **monthly_consumption** | create | FINANCEIRO | Registrar consumo |
| **monthly_consumption** | read | FINANCEIRO, SINDICO | Visualizar consumo |
| **monthly_consumption** | update | FINANCEIRO | Editar consumo |
| **users** | create | SUPER_MASTER | Criar usuários |
| **users** | read | SUPER_MASTER | Visualizar usuários |
| **users** | update | SUPER_MASTER | Editar usuários |
| **users** | assign_roles | SUPER_MASTER | Atribuir perfis |
| **condominiums** | create | SUPER_MASTER | Criar condomínios |
| **condominiums** | read | SUPER_MASTER | Visualizar condomínios |
| **condominiums** | update | SUPER_MASTER | Editar condomínios |

---

## 2. DECISÃO: APROVAÇÃO FINANCEIRA

### ✅ **DECISÃO IMPLEMENTADA: ADMINISTRATIVO APROVA ATÉ LIMITE**

**Regra:**
- **ADMINISTRATIVO** pode aprovar saídas financeiras **até o limite configurado** (padrão: R$ 1.000,00)
- **SINDICO** aprova saídas **acima do limite**
- **FINANCEIRO** cria saídas, mas **NÃO aprova** (apenas marca como paga após aprovação)

**Permissões:**
- `financial_exits:approve` → ADMINISTRATIVO (até limite)
- `financial_exits:approve_high_value` → SINDICO (acima do limite)

**Fluxo:**
```
1. FINANCEIRO cria saída
   └─> Se requiresApproval = TRUE e valor > approvalLimit:
       • payment_status = PENDING
       • Precisa aprovação do SINDICO
   └─> Se requiresApproval = TRUE e valor <= approvalLimit:
       • payment_status = PENDING
       • ADMINISTRATIVO pode aprovar (até limite)
   └─> Se requiresApproval = FALSE:
       • payment_status = APPROVED (automático)

2. ADMINISTRATIVO aprova (se valor <= limite)
   └─> payment_status = APPROVED
   └─> approved_by = userId (ADMINISTRATIVO)

3. SINDICO aprova (se valor > limite)
   └─> payment_status = APPROVED
   └─> approved_by = userId (SINDICO)

4. FINANCEIRO marca como paga
   └─> payment_status = PAID
   └─> Upload de comprovante PDF
```

---

## 3. STATE MACHINES PADRONIZADAS

### 3.1 Estrutura

**Tabela `state_machines`:**
- `entity_type` - Tipo de entidade
- `state` - Estado (PENDING, APPROVED, PAID, etc)
- `display_name` - Nome para exibição
- `is_initial` - Se é estado inicial
- `is_final` - Se é estado final
- `display_order` - Ordem de exibição

**Tabela `state_transitions`:**
- `entity_type` - Tipo de entidade
- `from_state` - Estado de origem
- `to_state` - Estado de destino
- `required_permission` - Permissão necessária (formato: "entity_type:action")
- `description` - Descrição da transição

### 3.2 Estados Padronizados por Entidade

#### **TASKS**
| Estado | Display | Inicial | Final | Descrição |
|--------|---------|---------|-------|-----------|
| `PENDING` | Pendente | ✅ | ❌ | Tarefa criada, aguardando execução |
| `IN_PROGRESS` | Em Andamento | ❌ | ❌ | Tarefa em execução |
| `COMPLETED` | Concluída | ❌ | ✅ | Tarefa concluída |
| `CANCELLED` | Cancelada | ❌ | ✅ | Tarefa cancelada |

**Transições Permitidas:**
- `PENDING` → `IN_PROGRESS` (automático quando atribuído)
- `PENDING` → `COMPLETED` (operacional completa)
- `IN_PROGRESS` → `COMPLETED` (operacional completa)
- `COMPLETED` → `PENDING` (reabertura - síndico)
- `PENDING` → `CANCELLED` (cancelamento - administrativo)

#### **OCCURRENCES**
| Estado | Display | Inicial | Final | Descrição |
|--------|---------|---------|-------|-----------|
| `ABERTA` | Aberta | ✅ | ❌ | Ocorrência criada, aguardando triagem |
| `EM_ATENDIMENTO` | Em Atendimento | ❌ | ❌ | Ocorrência em resolução |
| `AGUARDANDO_TERCEIRO` | Aguardando Terceiro | ❌ | ❌ | Aguardando ação de terceiro |
| `RESOLVIDA` | Resolvida | ❌ | ✅ | Ocorrência resolvida |
| `ENCERRADA` | Encerrada | ❌ | ✅ | Ocorrência encerrada |

**Transições Permitidas:**
- `ABERTA` → `EM_ATENDIMENTO` (após triagem e atribuição)
- `EM_ATENDIMENTO` → `AGUARDANDO_TERCEIRO` (aguardando terceiro)
- `AGUARDANDO_TERCEIRO` → `EM_ATENDIMENTO` (retomada)
- `EM_ATENDIMENTO` → `RESOLVIDA` (operacional resolve)
- `AGUARDANDO_TERCEIRO` → `RESOLVIDA` (operacional resolve)
- `RESOLVIDA` → `ENCERRADA` (fechamento final)
- `RESOLVIDA` → `ABERTA` (reabertura - síndico)
- `ENCERRADA` → `ABERTA` (reabertura - síndico)

#### **FINANCIAL_EXITS (payment_status)**
| Estado | Display | Inicial | Final | Descrição |
|--------|---------|---------|-------|-----------|
| `PENDING` | Pendente | ✅ | ❌ | Aguardando aprovação |
| `APPROVED` | Aprovada | ❌ | ❌ | Aprovada, aguardando pagamento |
| `PAID` | Paga | ❌ | ✅ | Paga (final) |
| `REJECTED` | Rejeitada | ❌ | ✅ | Rejeitada |

**Transições Permitidas:**
- `PENDING` → `APPROVED` (aprovação - ADMINISTRATIVO até limite, SINDICO acima)
- `PENDING` → `REJECTED` (rejeição - SINDICO)
- `APPROVED` → `PAID` (pagamento - FINANCEIRO)
- `REJECTED` → `PENDING` (reabertura - SINDICO)

#### **FINANCIAL_ENTRIES (received)**
| Estado | Display | Inicial | Final | Descrição |
|--------|---------|---------|-------|-----------|
| `PENDING` | Pendente | ✅ | ❌ | Aguardando recebimento |
| `RECEIVED` | Recebida | ❌ | ✅ | Recebida (final) |

**Transições Permitidas:**
- `PENDING` → `RECEIVED` (marcar como recebida - FINANCEIRO)

#### **CHECKLISTS**
| Estado | Display | Inicial | Final | Descrição |
|--------|---------|---------|-------|-----------|
| `PENDING` | Pendente | ✅ | ❌ | Item pendente |
| `DONE` | Feito | ❌ | ✅ | Item concluído |
| `NOT_DONE` | Não Feito | ❌ | ✅ | Item não concluído |

**Transições Permitidas:**
- `PENDING` → `DONE` (marcar como feito)
- `PENDING` → `NOT_DONE` (marcar como não feito)
- `DONE` → `PENDING` (reverter)
- `NOT_DONE` → `PENDING` (reverter)

#### **ASSETS**
| Estado | Display | Inicial | Final | Descrição |
|--------|---------|---------|-------|-----------|
| `ACTIVE` | Ativo | ✅ | ❌ | Ativo em funcionamento |
| `INACTIVE` | Inativo | ❌ | ❌ | Ativo inativo |
| `MAINTENANCE` | Em Manutenção | ❌ | ❌ | Ativo em manutenção |
| `DECOMMISSIONED` | Desativado | ❌ | ✅ | Desativado permanentemente |

**Transições Permitidas:**
- `ACTIVE` → `MAINTENANCE` (registrar manutenção)
- `MAINTENANCE` → `ACTIVE` (manutenção concluída)
- `ACTIVE` → `INACTIVE` (desativar temporariamente)
- `MAINTENANCE` → `INACTIVE` (desativar temporariamente)
- `INACTIVE` → `ACTIVE` (reativar)
- `ACTIVE` → `DECOMMISSIONED` (desativar permanentemente)
- `INACTIVE` → `DECOMMISSIONED` (desativar permanentemente)

#### **DOCUMENTS**
| Estado | Display | Inicial | Final | Descrição |
|--------|---------|---------|-------|-----------|
| `ACTIVE` | Ativo | ✅ | ❌ | Documento ativo |
| `EXPIRED` | Vencido | ❌ | ❌ | Documento vencido |
| `ARCHIVED` | Arquivado | ❌ | ✅ | Documento arquivado |

**Transições Permitidas:**
- `ACTIVE` → `EXPIRED` (vencimento automático)
- `ACTIVE` → `ARCHIVED` (arquivar)
- `EXPIRED` → `ARCHIVED` (arquivar)

#### **BUDGET_REQUESTS**
| Estado | Display | Inicial | Final | Descrição |
|--------|---------|---------|-------|-----------|
| `PENDING` | Pendente | ✅ | ❌ | Aguardando aprovação |
| `APPROVED` | Aprovada | ❌ | ❌ | Aprovada |
| `REJECTED` | Rejeitada | ❌ | ✅ | Rejeitada |
| `PURCHASED` | Comprada | ❌ | ✅ | Comprada/executada |

**Transições Permitidas:**
- `PENDING` → `APPROVED` (aprovação - SINDICO)
- `PENDING` → `REJECTED` (rejeição - SINDICO)
- `APPROVED` → `PURCHASED` (comprada/executada)

---

## 4. USO DO SISTEMA DE PERMISSÕES

### 4.1 Middleware de Permissão Específica

```javascript
// Exemplo: Verificar se pode aprovar saída financeira
router.post('/saidas/:id/aprovar', 
  authenticate,
  authorizeAction('financial_exits', 'approve'),
  controller.approvarSaida
);
```

### 4.2 Middleware de Transição de Estado

```javascript
// Exemplo: Verificar se pode fazer transição PENDING → APPROVED
router.post('/saidas/:id/aprovar',
  authenticate,
  authorizeTransition('financial_exits', 'PENDING', 'APPROVED'),
  controller.approvarSaida
);
```

### 4.3 Verificação Programática

```javascript
const permissionService = require('../services/permissionService');

// Verificar permissão
const canApprove = await permissionService.hasPermission(
  userId,
  'financial_exits',
  'approve'
);

// Verificar transição
const canTransition = await permissionService.canTransition(
  userId,
  'financial_exits',
  'PENDING',
  'APPROVED'
);
```

---

## 5. BENEFÍCIOS DA FORMALIZAÇÃO

### 5.1 Antes (Problemas)
- ❌ Permissões espalhadas em `if` statements
- ❌ Difícil manutenção
- ❌ Inconsistências entre módulos
- ❌ Estados não padronizados
- ❌ Transições não validadas

### 5.2 Depois (Soluções)
- ✅ Permissões centralizadas em tabelas
- ✅ Fácil manutenção (adicionar permissão = INSERT)
- ✅ Consistência garantida
- ✅ Estados padronizados (state machines)
- ✅ Transições validadas automaticamente
- ✅ Auditoria completa de permissões
- ✅ Fácil adicionar novos perfis/permissões

---

## 6. MIGRAÇÃO E COMPATIBILIDADE

### 6.1 Sistema Híbrido
O sistema mantém **compatibilidade** com o sistema antigo:
- Middleware `authorize` (por perfil) continua funcionando
- Novo middleware `authorizeAction` (por permissão) disponível
- Novo middleware `authorizeTransition` (por transição) disponível

### 6.2 Migração Gradual
- Rotas críticas podem usar `authorizeAction` imediatamente
- Rotas simples continuam usando `authorize` (por perfil)
- Migração pode ser feita gradualmente

---

## 7. EXEMPLOS DE USO

### 7.1 Rota com Permissão Específica

```javascript
// Antes (por perfil)
router.post('/saidas/:id/aprovar',
  authenticate,
  authorize('ADMINISTRATIVO', 'SINDICO'),
  controller.approvarSaida
);

// Depois (por permissão - mais específico)
router.post('/saidas/:id/aprovar',
  authenticate,
  authorizeAction('financial_exits', 'approve'), // Até limite
  controller.approvarSaida
);

router.post('/saidas/:id/aprovar-alto-valor',
  authenticate,
  authorizeAction('financial_exits', 'approve_high_value'), // Acima do limite
  controller.approvarSaidaAltoValor
);
```

### 7.2 Validação de Transição

```javascript
// No controller, antes de atualizar estado:
const canTrans = await permissionService.canTransition(
  req.user.id,
  'financial_exits',
  currentExit.payment_status,
  'APPROVED'
);

if (!canTrans) {
  return res.status(403).send('Transição de estado não permitida');
}
```

---

## 8. CHECKLIST DE IMPLEMENTAÇÃO

- [x] Tabela `permissions` criada
- [x] Tabela `role_permissions` criada
- [x] Tabela `state_machines` criada
- [x] Tabela `state_transitions` criada
- [x] Script `initPermissions.sql` criado
- [x] Script `initRolePermissions.sql` criado
- [x] Script `initStateMachines.sql` criado
- [x] Script `initStateTransitions.sql` criado
- [x] Serviço `permissionService.js` criado
- [x] Middleware `authorizeAction` criado
- [x] Middleware `authorizeTransition` criado
- [x] Integração no `init.js` (execução automática)
- [ ] Migração gradual de rotas para usar `authorizeAction`
- [ ] Validação de transições em controllers críticos
- [ ] Interface para gerenciar permissões (futuro)

---

## 9. DECISÃO: ADMINISTRATIVO APROVA DINHEIRO

### ✅ **IMPLEMENTADO: ADMINISTRATIVO APROVA ATÉ LIMITE**

**Justificativa:**
- ADMINISTRATIVO tem visão completa do condomínio
- Acelera aprovações de valores baixos/médios
- SINDICO fica apenas para valores altos (decisões estratégicas)
- Mantém controle hierárquico

**Limite Padrão:** R$ 1.000,00 (configurável por condomínio)

**Permissões:**
- `financial_exits:approve` → ADMINISTRATIVO (até limite)
- `financial_exits:approve_high_value` → SINDICO (acima do limite)

---

**Última atualização:** Janeiro 2025
