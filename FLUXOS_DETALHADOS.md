# 🔄 FLUXOS DETALHADOS DO SISTEMA
## Guia Completo de Como Funciona Cada Processo

---

## 💰 FLUXO FINANCEIRO - ENTRADAS E SAÍDAS

### 📥 **FLUXO DE ENTRADA FINANCEIRA (RECEITAS)**

**Quem pode criar:** Usuário com perfil **FINANCEIRO**

**Passo a passo:**

1. **FINANCEIRO acessa:** `/financeiro/entradas/nova`
2. **Preenche o formulário:**
   - Descrição (ex: "Taxa de condomínio - Janeiro/2024")
   - Valor (ex: R$ 15.000,00)
   - Data da entrada
   - Centro de custo (opcional)
   - Categoria (TAXA, RECEITA, OUTRA)
3. **Sistema cria a entrada:**
   - Status inicial: `received = FALSE` (não recebida ainda)
   - Registra no log de auditoria
   - **NÃO precisa de aprovação** (entradas são sempre permitidas)
4. **FINANCEIRO marca como recebida:**
   - Quando o dinheiro realmente entrar na conta
   - Clica em "Marcar como Recebido"
   - Status muda para `received = TRUE`
   - Data de recebimento é registrada
5. **Sistema atualiza:**
   - Saldo do condomínio aumenta
   - Dashboard financeiro reflete o novo saldo
   - Log de auditoria registra a mudança

**Resumo:**
```
FINANCEIRO cria entrada → Sistema registra → FINANCEIRO marca como recebida → Saldo atualiza
```

---

### 📤 **FLUXO DE SAÍDA FINANCEIRA (DESPESAS) - COM APROVAÇÃO**

**Quem pode criar:** Usuário com perfil **FINANCEIRO**

**Passo a passo:**

1. **FINANCEIRO acessa:** `/financeiro/saidas/nova`
2. **Preenche o formulário:**
   - Descrição (ex: "Reforma do elevador")
   - Valor (ex: R$ 8.000,00)
   - Data da saída
   - Conta vinculada (opcional - água, luz, gás)
   - Centro de custo (opcional)
   - Categoria (MANUTENCAO, CONTA, CONTRATO, OUTRA)
   - **Requer aprovação:** ☑ (marcado)
   - **Limite de aprovação:** R$ 1.000,00 (padrão)
3. **Sistema verifica:**
   - Valor (R$ 8.000,00) > Limite (R$ 1.000,00)? **SIM**
   - Precisa de aprovação? **SIM**
4. **Sistema cria a saída:**
   - Status: `payment_status = 'PENDING'` (pendente de aprovação)
   - **Sistema cria automaticamente uma APROVAÇÃO na tabela `approvals`:**
     - Tipo: `FINANCIAL_EXIT`
     - Status: `PENDING`
     - Valor solicitado: R$ 8.000,00
     - Solicitado por: FINANCEIRO (usuário que criou)
5. **Aprovação aparece para o SÍNDICO:**
   - No dashboard: "X aprovações pendentes"
   - No menu: `/sindico/aprovacoes`
   - Lista mostra todas as aprovações pendentes
6. **SÍNDICO decide:**
   - **APROVAR:**
     - Clica em "Aprovar"
     - Pode adicionar motivo (opcional)
     - Sistema atualiza:
       - `approvals.status = 'APPROVED'`
       - `financial_exits.payment_status = 'APPROVED'`
       - `financial_exits.approved_by = SÍNDICO`
       - `financial_exits.approved_at = agora`
   - **REJEITAR:**
     - Clica em "Rejeitar"
     - **DEVE** informar motivo (obrigatório)
     - Sistema atualiza:
       - `approvals.status = 'REJECTED'`
       - `financial_exits.payment_status = 'REJECTED'`
       - `approvals.rejection_reason = motivo informado`
7. **Se APROVADA, FINANCEIRO pode marcar como paga:**
   - Acessa `/financeiro/saidas`
   - Vê a saída com status "APROVADA"
   - Clica em "Marcar como Paga"
   - Sistema atualiza:
     - `payment_status = 'PAID'`
     - `paid_at = agora`
     - Saldo do condomínio diminui
8. **Se REJEITADA:**
   - Saída fica bloqueada
   - Não pode ser marcada como paga
   - FINANCEIRO pode ver o motivo da rejeição
   - Pode criar nova saída corrigida (se necessário)

**Resumo:**
```
FINANCEIRO cria saída (valor alto) 
  → Sistema cria aprovação automática 
  → SÍNDICO vê no painel 
  → SÍNDICO aprova/rejeita 
  → Se aprovada: FINANCEIRO marca como paga 
  → Saldo atualiza
```

---

### 📤 **FLUXO DE SAÍDA FINANCEIRA (DESPESAS) - SEM APROVAÇÃO**

**Quando não precisa de aprovação:**
- Valor é menor ou igual ao limite (ex: R$ 800,00 ≤ R$ 1.000,00)
- Ou checkbox "Requer aprovação" está desmarcado

**Passo a passo:**

1. **FINANCEIRO cria saída** (mesmo processo)
2. **Sistema verifica:**
   - Valor ≤ Limite? **SIM**
   - Status: `payment_status = 'APPROVED'` (aprovada automaticamente)
   - **NÃO cria aprovação** na tabela `approvals`
3. **FINANCEIRO pode marcar como paga imediatamente:**
   - Não precisa esperar aprovação do síndico
   - Pode marcar como paga na hora

**Resumo:**
```
FINANCEIRO cria saída (valor baixo) 
  → Sistema aprova automaticamente 
  → FINANCEIRO marca como paga 
  → Saldo atualiza
```

---

## ✅ SISTEMA DE APROVAÇÕES - ONDE E COMO APROVA

### **ONDE APROVA:**

**Local:** Painel do SÍNDICO → Menu "Aprovações" → `/sindico/aprovacoes`

**Quem aprova:** Apenas **SÍNDICO** ou **SUBSÍNDICO**

**O que aparece:**
- Lista de todas as aprovações pendentes
- Informações de cada aprovação:
  - Tipo (FINANCIAL_EXIT, CONTRACT, etc)
  - Valor solicitado
  - Descrição
  - Quem solicitou
  - Data da solicitação

### **COMO APROVA:**

1. **SÍNDICO acessa:** `/sindico/aprovacoes`
2. **Vê a lista de pendências**
3. **Clica em uma aprovação** para ver detalhes
4. **Escolhe a ação:**
   - **Botão "Aprovar":**
     - Pode adicionar motivo (opcional)
     - Confirma
     - Sistema atualiza status para `APPROVED`
     - Se for despesa financeira, libera para pagamento
   - **Botão "Rejeitar":**
     - **DEVE** informar motivo (obrigatório)
     - Confirma
     - Sistema atualiza status para `REJECTED`
     - Despesa fica bloqueada

### **QUANDO PRECISA DE APROVAÇÃO:**

**Despesas Financeiras (Saídas):**
- ✅ Valor > Limite configurado (padrão: R$ 1.000,00)
- ✅ E checkbox "Requer aprovação" está marcado

**Outros tipos (futuros):**
- Contratos acima de um valor
- Manutenções preventivas caras
- Qualquer item configurado para requerer aprovação

---

## 🔄 OUTROS FLUXOS IMPORTANTES DO SISTEMA

### **FLUXO DE TAREFAS**

```
1. ADMINISTRATIVO cria tarefa:
   - Título, descrição, prazo, responsável
   - Define checklist (itens a verificar)
   ↓
2. Tarefa aparece para OPERACIONAL (responsável)
   ↓
3. OPERACIONAL executa:
   - Marca itens do checklist como feito/não feito
   - Se não feito, DEVE justificar (obrigatório)
   ↓
4. OPERACIONAL conclui tarefa:
   - Preenche formulário estruturado:
     * Foi bem sucedida? (obrigatório)
     * Observações finais
     * Teve contratempos?
     * Tempo gasto
     * Qualidade da execução
   ↓
5. Tarefa fica com status "COMPLETED"
   ↓
6. Sistema verifica se está atrasada:
   - Se prazo passou → cria alerta
   ↓
7. ADMINISTRATIVO e SÍNDICO podem ver:
   - Todas as informações de conclusão
   - Checklist completo
   - Dados estruturados para análise
```

---

### **FLUXO DE OCORRÊNCIAS**

```
1. OPERACIONAL encontra problema:
   - Exemplo: "Vazamento no 3º andar"
   ↓
2. OPERACIONAL cria ocorrência:
   - Título, descrição, localização, prioridade
   ↓
3. Ocorrência fica com status "ABERTA"
   ↓
4. Sistema verifica SLA:
   - Se passar do prazo → cria alerta
   - Se muito atrasada → escala para SÍNDICO
   ↓
5. OPERACIONAL resolve:
   - Preenche formulário estruturado:
     * Foi resolvida com sucesso? (obrigatório)
     * Notas de resolução (obrigatório)
     * Método utilizado
     * Custo (se houver)
     * Teve complicações?
     * Tempo gasto
     * Medidas preventivas
   ↓
6. Ocorrência fica com status "RESOLVIDA"
   ↓
7. SÍNDICO pode ver:
   - Todas as informações de resolução
   - Dados estruturados para análise
   - Histórico completo
```

---

### **FLUXO DE DOCUMENTOS**

```
1. ADMINISTRATIVO cadastra documento:
   - Nome, tipo, data de vencimento
   - Categoria, fornecedor
   ↓
2. Sistema verifica vencimento:
   - Se próximo de vencer → cria alerta
   - Se vencido → alerta crítico
   ↓
3. ADMINISTRATIVO renova/atualiza:
   - Atualiza data de vencimento
   - Sistema registra no log
```

---

### **FLUXO DE ALERTAS AUTOMÁTICOS**

```
Sistema verifica automaticamente (via automação):
  ↓
1. Tarefas atrasadas:
   - Prazo vencido < 48h → Alerta AVISO
   - Prazo vencido > 48h → Alerta CRÍTICO
   ↓
2. Ocorrências com SLA vencido:
   - Cria alerta automático
   - Escala para SÍNDICO se muito atrasada
   ↓
3. Documentos próximos de vencer:
   - 7 dias antes → Alerta AVISO
   - Vencido → Alerta CRÍTICO
   ↓
4. Alertas aparecem no painel do SÍNDICO:
   - Dashboard mostra contadores
   - Menu "Alertas" mostra lista completa
   ↓
5. SÍNDICO pode:
   - Resolver o alerta (marcar como resolvido)
   - Ver detalhes do problema
```

---

## 📊 RESUMO VISUAL DOS FLUXOS

### **ENTRADA FINANCEIRA:**
```
FINANCEIRO
  ↓ [Cria entrada]
SISTEMA
  ↓ [Registra como não recebida]
FINANCEIRO
  ↓ [Marca como recebida]
SISTEMA
  ↓ [Atualiza saldo]
✅ Concluído
```

### **SAÍDA FINANCEIRA (Valor Alto):**
```
FINANCEIRO
  ↓ [Cria saída > limite]
SISTEMA
  ↓ [Cria aprovação automática]
SÍNDICO
  ↓ [Vê no painel]
SÍNDICO
  ↓ [Aprova/Rejeita]
SISTEMA
  ↓ [Se aprovada: libera para pagamento]
FINANCEIRO
  ↓ [Marca como paga]
SISTEMA
  ↓ [Atualiza saldo]
✅ Concluído
```

### **SAÍDA FINANCEIRA (Valor Baixo):**
```
FINANCEIRO
  ↓ [Cria saída ≤ limite]
SISTEMA
  ↓ [Aprova automaticamente]
FINANCEIRO
  ↓ [Marca como paga]
SISTEMA
  ↓ [Atualiza saldo]
✅ Concluído
```

### **TAREFA:**
```
ADMINISTRATIVO
  ↓ [Cria tarefa com prazo]
OPERACIONAL
  ↓ [Executa checklist]
OPERACIONAL
  ↓ [Conclui com dados estruturados]
SISTEMA
  ↓ [Verifica atrasos → cria alertas se necessário]
ADMINISTRATIVO/SÍNDICO
  ↓ [Vê informações completas]
✅ Concluído
```

### **OCORRÊNCIA:**
```
OPERACIONAL
  ↓ [Cria ocorrência]
SISTEMA
  ↓ [Verifica SLA → cria alertas se necessário]
OPERACIONAL
  ↓ [Resolve com dados estruturados]
SISTEMA
  ↓ [Atualiza status]
SÍNDICO
  ↓ [Vê informações completas]
✅ Concluído
```

---

## 🎯 REGRAS IMPORTANTES

### **APROVAÇÕES:**
- ✅ Apenas SÍNDICO/SUBSÍNDICO pode aprovar
- ✅ FINANCEIRO cria, mas não aprova valores altos
- ✅ Sistema cria aprovação automaticamente quando necessário
- ✅ Aprovação rejeitada bloqueia o pagamento
- ✅ Tudo é registrado no log de auditoria

### **ENTRADAS:**
- ✅ Não precisam de aprovação (sempre permitidas)
- ✅ Podem ser marcadas como recebidas depois
- ✅ Atualizam o saldo quando recebidas

### **SAÍDAS:**
- ✅ Valores baixos: aprovados automaticamente
- ✅ Valores altos: precisam de aprovação do síndico
- ✅ Só podem ser pagas se estiverem aprovadas
- ✅ Uma vez pagas, não podem ser editadas

### **AUDITORIA:**
- ✅ Todas as ações são registradas nos logs
- ✅ Logs são imutáveis (não podem ser alterados)
- ✅ Registram: quem, quando, o que, antes/depois

---

## 📍 ONDE CADA COISA ACONTECE

### **FINANCEIRO:**
- Dashboard: `/financeiro/dashboard`
- Entradas: `/financeiro/entradas`
- Saídas: `/financeiro/saidas`
- Contas: `/financeiro/contas`
- Centros de Custo: `/financeiro/centros-custo`

### **SÍNDICO:**
- Dashboard: `/sindico/dashboard`
- Aprovações: `/sindico/aprovacoes` ⭐ **AQUI APROVA**
- Alertas: `/sindico/alertas`
- Tarefas: `/sindico/tarefas`
- Ocorrências: `/sindico/ocorrencias`
- Logs: `/sindico/logs`

### **ADMINISTRATIVO:**
- Dashboard: `/administrativo/dashboard`
- Tarefas: `/administrativo/tarefas`
- Documentos: `/administrativo/documentos`

### **OPERACIONAL:**
- Dashboard: `/operacional/dashboard`
- Checklist: `/operacional/checklist`
- Ocorrências: `/operacional/ocorrencias`

---

## 🔍 EXEMPLO PRÁTICO COMPLETO

**Cenário:** Reforma do elevador custando R$ 12.000,00

```
1. FINANCEIRO cria saída:
   - Descrição: "Reforma do elevador"
   - Valor: R$ 12.000,00
   - Requer aprovação: ☑ SIM
   - Limite: R$ 1.000,00
   ↓
2. Sistema verifica:
   - 12.000 > 1.000? SIM
   - Cria aprovação automática
   - Status: PENDING
   ↓
3. SÍNDICO vê no painel:
   - "1 aprovação pendente"
   - Clica em "Aprovações"
   - Vê: "Reforma do elevador - R$ 12.000,00"
   ↓
4. SÍNDICO aprova:
   - Clica em "Aprovar"
   - Adiciona motivo: "Aprovado conforme orçamento"
   - Confirma
   ↓
5. Sistema atualiza:
   - Aprovação: status = APPROVED
   - Saída: payment_status = APPROVED
   - Liberada para pagamento
   ↓
6. FINANCEIRO marca como paga:
   - Vê saída com status "APROVADA"
   - Clica em "Marcar como Paga"
   - Sistema atualiza: payment_status = PAID
   - Saldo diminui R$ 12.000,00
   ↓
7. Tudo registrado nos logs:
   - Criação da saída
   - Criação da aprovação
   - Aprovação pelo síndico
   - Pagamento pelo financeiro
```

---

## ⚠️ IMPORTANTE

- **Ninguém "avisa ninguém"** - o sistema orquestra tudo automaticamente
- **Aprovações aparecem automaticamente** no painel do síndico
- **Alertas são criados automaticamente** pelo sistema
- **Tudo é registrado** nos logs de auditoria
- **Cada perfil só vê o que pode fazer** (RBAC rígido)
