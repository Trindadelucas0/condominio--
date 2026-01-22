# Correção: Taxas Duplicadas e Campos de Multa/Juros

## ✅ Problemas Corrigidos

### 1. **Erro "Taxa já cadastrada"**
**Problema**: Sistema bloqueava criação de taxa se já existisse uma para o mesmo apartamento/mês/ano.

**Solução**: 
- Sistema agora permite **editar taxas existentes** ao invés de bloquear
- Se a taxa já existe e não está paga, ela é atualizada
- Se a taxa já existe e está paga, mostra erro (não permite editar taxa paga)
- Se não existe, cria nova taxa normalmente

### 2. **Campos de Multa e Juros não apareciam**
**Problema**: Formulário não tinha campos para informar multa e juros manualmente.

**Solução**:
- Adicionados campos opcionais no formulário:
  - **Multa (R$)**: Campo para informar multa manualmente
  - **Juros (R$)**: Campo para informar juros manualmente
- Se os campos estiverem vazios, o sistema calcula automaticamente
- Se os campos estiverem preenchidos, usa os valores informados

### 3. **Saldo atualizado ao pagar taxa**
**Problema**: Verificação se o saldo estava sendo atualizado corretamente.

**Solução**:
- Confirmado que o saldo é atualizado automaticamente ao marcar taxa como paga
- A entrada financeira é marcada como recebida (`received = TRUE`)
- Cache do dashboard é invalidado para mostrar saldo atualizado imediatamente

---

## 🔄 Como Funciona Agora

### Criar/Editar Taxa:

1. **Preencher formulário**:
   - Apartamento, Mês, Ano, Valor Base, Data de Vencimento (obrigatórios)
   - Multa e Juros (opcionais - se vazios, calcula automaticamente)

2. **Se taxa já existe**:
   - Se não está paga: **Atualiza** a taxa existente
   - Se está paga: Mostra erro (não permite editar)

3. **Cálculo de Multa e Juros**:
   - **Se informados manualmente**: Usa os valores informados
   - **Se não informados**: Calcula automaticamente das taxas em atraso
     - Multa: 2% de cada taxa em atraso
     - Juros: 1% ao mês de cada taxa em atraso

4. **Valor Total**:
   - Valor Total = Valor Base + Multa + Juros
   - Entrada financeira criada com valor total
   - Taxa salva com valor total no campo `amount`

### Pagar Taxa:

1. Usuário marca taxa como paga
2. Sistema aprova entrada financeira (se pendente)
3. Sistema marca entrada como recebida (`received = TRUE`)
4. **Saldo financeiro é atualizado automaticamente**
5. Cache do dashboard é invalidado
6. Dashboard mostra saldo atualizado

---

## 📝 Arquivos Modificados

### 1. `src/services/inadimplenciaService.js`

**Função `createMonthlyFee`**:
- ✅ Removida validação que bloqueava taxas duplicadas
- ✅ Adicionada lógica para atualizar taxa existente (se não estiver paga)
- ✅ Adicionado suporte para multa e juros manuais (`manualLateFee`, `manualInterest`)
- ✅ Se multa/juros manuais não informados, calcula automaticamente
- ✅ Atualiza entrada financeira se taxa já existir

**Função `markFeeAsPaid`**:
- ✅ Corrigido cálculo do total (não soma multa/juros novamente, pois já estão no `amount`)
- ✅ Garante que entrada financeira seja marcada como recebida
- ✅ Invalida cache do dashboard

### 2. `views/administrativo/financeiro/taxas/form.ejs`

**Adicionados campos**:
- ✅ Campo "Multa (R$)" - opcional
- ✅ Campo "Juros (R$)" - opcional
- ✅ Seção destacada explicando que são opcionais
- ✅ Texto explicativo sobre cálculo automático

---

## 🎯 Regras de Negócio

### Edição de Taxas:
- ✅ Taxa não paga: Pode editar
- ❌ Taxa paga: Não pode editar (mostra erro)

### Multa e Juros:
- ✅ **Informados manualmente**: Usa valores informados
- ✅ **Não informados**: Calcula automaticamente das taxas em atraso
- ✅ **Cálculo automático**: 
  - Multa: 2% de cada taxa em atraso
  - Juros: 1% ao mês de cada taxa em atraso

### Valor da Taxa:
- ✅ Campo `amount` na tabela `monthly_fees` = Valor Base + Multa + Juros
- ✅ Entrada financeira criada com valor total
- ✅ Ao pagar, não soma multa/juros novamente (já estão no `amount`)

### Saldo Financeiro:
- ✅ Atualizado automaticamente ao marcar taxa como paga
- ✅ Entrada financeira marcada como recebida (`received = TRUE`)
- ✅ Cache invalidado para dashboard mostrar saldo atualizado

---

## 🔍 Exemplo Prático

### Cenário 1: Criar Taxa (sem multa/juros manuais)
```
1. Usuário preenche:
   - Apartamento: 101
   - Mês: Março
   - Ano: 2026
   - Valor Base: R$ 500,00
   - Multa: (vazio)
   - Juros: (vazio)
   - Vencimento: 10/03/2026

2. Sistema:
   - Verifica se há taxas em atraso
   - Se houver, calcula multa e juros automaticamente
   - Cria taxa com valor total = R$ 500,00 + multa + juros
```

### Cenário 2: Criar Taxa (com multa/juros manuais)
```
1. Usuário preenche:
   - Apartamento: 101
   - Mês: Março
   - Ano: 2026
   - Valor Base: R$ 500,00
   - Multa: R$ 20,00
   - Juros: R$ 10,00
   - Vencimento: 10/03/2026

2. Sistema:
   - Usa multa e juros informados manualmente
   - Cria taxa com valor total = R$ 500,00 + R$ 20,00 + R$ 10,00 = R$ 530,00
```

### Cenário 3: Editar Taxa Existente
```
1. Usuário tenta criar taxa para:
   - Apartamento: 101
   - Mês: Março
   - Ano: 2026

2. Sistema:
   - Verifica se já existe taxa para este apartamento/mês/ano
   - Se existe e não está paga: Atualiza a taxa existente
   - Se existe e está paga: Mostra erro "Taxa já foi paga e não pode ser editada"
   - Se não existe: Cria nova taxa
```

---

## ✅ Validações Implementadas

1. ✅ Taxa não paga pode ser editada
2. ✅ Taxa paga não pode ser editada (mostra erro)
3. ✅ Multa e juros opcionais (se vazios, calcula automaticamente)
4. ✅ Multa e juros manuais aceitos (se informados, usa valores informados)
5. ✅ Saldo atualizado automaticamente ao pagar taxa
6. ✅ Cache invalidado para dashboard mostrar saldo atualizado

---

## 🚀 Resultado Final

Agora o sistema:
- ✅ Permite editar taxas existentes (se não estiverem pagas)
- ✅ Tem campos para multa e juros manuais no formulário
- ✅ Calcula multa e juros automaticamente se não informados
- ✅ Atualiza saldo financeiro automaticamente ao pagar taxa
- ✅ Dashboard mostra saldo atualizado imediatamente
