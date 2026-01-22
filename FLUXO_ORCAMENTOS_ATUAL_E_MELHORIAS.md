# 📋 FLUXO DE ORÇAMENTOS - ANÁLISE ATUAL E MELHORIAS NECESSÁRIAS

## 🔄 FLUXO ATUAL (Como está funcionando)

### 1. **Quem Solicita**
- **ADMINISTRATIVO** cria uma solicitação de orçamento
- Status inicial: `PENDING_FINANCEIRO`
- Pode vincular a uma ocorrência ou tarefa
- Pode anexar documentos

### 2. **Quem Revisa**
- **FINANCEIRO** revisa a solicitação
- Adiciona observações e centro de custo
- Status muda para: `PENDING_SINDICO`
- Notifica o síndico

### 3. **Quem Aprova**
- **SÍNDICO** aprova ou rejeita
- Se aprovar, define valor aprovado (pode ser diferente do solicitado)
- Status muda para: `APPROVED` ou `REJECTED`
- Notifica o financeiro

### 4. **Quem Libera**
- **FINANCEIRO** libera para operacional ou retorna para síndico
- Se liberar, status muda para: `LIBERATED`
- Notifica o operacional

### 5. **Quem Visualiza**
- **OPERACIONAL** vê orçamentos liberados
- Pode ver os orçamentos que foram liberados para ele

---

## ❌ PROBLEMAS IDENTIFICADOS

### 1. **Não há múltiplos orçamentos na mesma solicitação**
- Atualmente, uma solicitação = um orçamento
- Não é possível comparar orçamentos de diferentes fornecedores

### 2. **Não cria saída financeira automaticamente**
- Quando o síndico aprova, não cria uma saída financeira
- Financeiro precisa criar manualmente

### 3. **Não há validação de saída real**
- Não há um fluxo para verificar se a saída realmente aconteceu
- Não há preenchimento de formulário após verificação

---

## ✅ FLUXO DESEJADO (O que precisa ser implementado)

### 1. **Solicitação com Múltiplos Orçamentos**
```
ADMINISTRATIVO solicita orçamento
  └─> Adiciona ORÇAMENTO 1 (Fornecedor A - R$ 1.000)
  └─> Adiciona ORÇAMENTO 2 (Fornecedor B - R$ 1.200)
  └─> Adiciona ORÇAMENTO 3 (Fornecedor C - R$ 900)
  └─> Status: PENDING_FINANCEIRO
```

### 2. **Revisão pelo Financeiro**
```
FINANCEIRO revisa solicitação
  └─> Vê todos os orçamentos
  └─> Adiciona observações
  └─> Define centro de custo
  └─> Status: PENDING_SINDICO
```

### 3. **Aprovação pelo Síndico**
```
SÍNDICO escolhe QUAL orçamento aprovar
  └─> Vê todos os orçamentos
  └─> Seleciona um para aprovar (ex: Orçamento 3 - R$ 900)
  └─> Status do orçamento selecionado: APPROVED
  └─> Status dos outros: REJECTED
  └─> Status da solicitação: APPROVED
  └─> **CRIA AUTOMATICAMENTE SAÍDA FINANCEIRA** com valor aprovado
  └─> Status da saída: PENDING (aguardando verificação)
```

### 4. **Verificação pelo Financeiro**
```
FINANCEIRO vê saída criada automaticamente
  └─> Verifica se foi realmente executada
  └─> Preenche formulário de saída:
      - Confirma valor
      - Adiciona comprovante (se houver)
      - Define data de pagamento
      - Marca como paga (se já foi)
  └─> Status da saída: APPROVED ou PAID
```

---

## 🗄️ ESTRUTURA DE BANCO NECESSÁRIA

### Nova Tabela: `budget_quotes` (Cotações/Orçamentos)
```sql
CREATE TABLE budget_quotes (
  id SERIAL PRIMARY KEY,
  budget_request_id INTEGER NOT NULL REFERENCES budget_requests(id) ON DELETE CASCADE,
  supplier_name VARCHAR(255) NOT NULL, -- Nome do fornecedor
  supplier_contact VARCHAR(255), -- Contato do fornecedor
  quote_value DECIMAL(15,2) NOT NULL, -- Valor do orçamento
  quote_description TEXT, -- Descrição do orçamento
  quote_validity_date DATE, -- Validade do orçamento
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  approved_by INTEGER REFERENCES users(id), -- Quem aprovou
  approved_at TIMESTAMP, -- Quando foi aprovado
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Modificação na Tabela: `budget_requests`
- Adicionar campo `approved_quote_id` (referência ao orçamento aprovado)
- Adicionar campo `related_financial_exit_id` (referência à saída criada)

### Modificação na Tabela: `financial_exits`
- Adicionar campo `related_budget_request_id` (referência à solicitação)
- Adicionar campo `related_budget_quote_id` (referência ao orçamento aprovado)
- Adicionar campo `needs_verification` BOOLEAN DEFAULT TRUE (se precisa verificação)

---

## 📝 FUNCIONALIDADES A IMPLEMENTAR

### 1. **Formulário de Solicitação (ADMINISTRATIVO)**
- [ ] Permitir adicionar múltiplos orçamentos
- [ ] Campos por orçamento:
  - Nome do fornecedor
  - Contato
  - Valor
  - Descrição
  - Validade
  - Anexo (opcional)

### 2. **Visualização de Orçamentos (FINANCEIRO)**
- [ ] Ver todos os orçamentos da solicitação
- [ ] Comparar valores
- [ ] Adicionar observações

### 3. **Aprovação (SÍNDICO)**
- [ ] Ver todos os orçamentos
- [ ] Selecionar qual aprovar
- [ ] Ao aprovar, criar saída financeira automaticamente
- [ ] Notificar financeiro

### 4. **Verificação de Saída (FINANCEIRO)**
- [ ] Ver saídas criadas automaticamente
- [ ] Verificar se foi realmente executada
- [ ] Preencher formulário completo
- [ ] Adicionar comprovante
- [ ] Marcar como paga

---

## 🔄 FLUXO COMPLETO PROPOSTO

```
1. ADMINISTRATIVO
   └─> Cria solicitação
   └─> Adiciona 3 orçamentos (Fornecedor A, B, C)
   └─> Status: PENDING_FINANCEIRO

2. FINANCEIRO
   └─> Revisa solicitação
   └─> Vê os 3 orçamentos
   └─> Adiciona observações
   └─> Status: PENDING_SINDICO

3. SÍNDICO
   └─> Vê solicitação com 3 orçamentos
   └─> Compara valores
   └─> Escolhe aprovar Orçamento C (R$ 900)
   └─> Status do Orçamento C: APPROVED
   └─> Status dos outros: REJECTED
   └─> **SISTEMA CRIA SAÍDA FINANCEIRA AUTOMATICAMENTE**
   └─> Saída criada com:
       - Descrição: "Título da solicitação"
       - Valor: R$ 900
       - Status: PENDING_VERIFICATION
       - Relacionada ao orçamento aprovado

4. FINANCEIRO
   └─> Recebe notificação de saída criada
   └─> Vê saída pendente de verificação
   └─> Verifica se foi realmente executada
   └─> Preenche formulário:
       - Confirma valor
       - Adiciona comprovante
       - Define data de pagamento
       - Marca como paga (se já foi)
   └─> Status: APPROVED ou PAID
```

---

## 🎯 PRÓXIMOS PASSOS

1. Criar tabela `budget_quotes`
2. Modificar formulário de solicitação para permitir múltiplos orçamentos
3. Modificar aprovação do síndico para escolher qual orçamento aprovar
4. Implementar criação automática de saída financeira
5. Criar tela de verificação de saídas para o financeiro
6. Implementar preenchimento de formulário de saída
