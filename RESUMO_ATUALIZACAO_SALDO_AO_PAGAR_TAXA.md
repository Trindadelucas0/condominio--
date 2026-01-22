# Resumo: Atualização de Saldo ao Pagar Taxa

## ✅ Implementação Completa

### O que foi feito:

1. **Remoção da Fração Ideal**
   - Campo removido do formulário de apartamentos
   - Coluna removida da listagem
   - Campo permanece no banco (compatibilidade), mas não é mais usado

2. **Multa e Juros Adicionados na Criação da Taxa**
   - Ao criar nova taxa, verifica taxas anteriores em atraso
   - Calcula multa (2%) e juros (1% ao mês) automaticamente
   - Adiciona multas e juros ao valor da nova taxa
   - Entrada financeira criada com valor total (taxa + multas + juros)

3. **Atualização Automática de Saldo ao Pagar Taxa**
   - Quando marca taxa como paga, aprova entrada financeira automaticamente
   - Marca entrada como recebida (`received = TRUE`)
   - **Saldo financeiro é atualizado automaticamente**
   - Cache do dashboard é invalidado para refletir novo saldo imediatamente

---

## 🔄 Fluxo Completo

### Criar Taxa com Inadimplência:
```
1. Usuário cria nova taxa para apartamento
   ↓
2. Sistema verifica taxas anteriores em atraso
   ↓
3. Se houver:
   - Calcula multa (2% de cada taxa)
   - Calcula juros (1% ao mês de cada taxa)
   - Soma todas as multas e juros
   ↓
4. Cria taxa com valor = valor base + multas + juros
   ↓
5. Cria entrada financeira com valor total
   ↓
6. Descrição inclui: "Inclui multa: R$ X e juros: R$ Y de N taxa(s) em atraso"
```

### Pagar Taxa:
```
1. Usuário marca taxa como paga
   ↓
2. Sistema marca taxa como paga (paid = TRUE)
   ↓
3. Sistema aprova entrada financeira (se pendente)
   ↓
4. Sistema marca entrada como recebida (received = TRUE)
   ↓
5. **Saldo financeiro é atualizado automaticamente**
   ↓
6. Cache do dashboard é invalidado
   ↓
7. Próxima consulta ao dashboard mostra saldo atualizado
```

---

## 💰 Como o Saldo é Calculado

O saldo financeiro é calculado como:

```sql
Saldo = Entradas Recebidas - Saídas Pagas - Saídas Aprovadas (não pagas)
```

Onde:
- **Entradas Recebidas**: `financial_entries` com `received = TRUE`
- **Saídas Pagas**: `financial_exits` com `payment_status = 'PAID'`
- **Saídas Aprovadas**: `financial_exits` com `payment_status = 'APPROVED'`

**Portanto**, ao marcar a entrada como recebida (`received = TRUE`), o saldo é atualizado automaticamente na próxima consulta.

---

## 🔧 Arquivos Modificados

### 1. `src/services/inadimplenciaService.js`
- **`createMonthlyFee`**: Adiciona multas e juros de taxas anteriores ao valor da nova taxa
- **`markFeeAsPaid`**: Garante que entrada financeira seja marcada como recebida ao pagar taxa

### 2. `src/services/financeiroService.js`
- **`markEntryAsReceived`**: Permite comprovante opcional para entradas vinculadas a taxas
- Invalida cache do dashboard automaticamente

### 3. `views/administrativo/financeiro/apartamentos/form.ejs`
- Campo "Fração Ideal" removido

### 4. `views/administrativo/financeiro/apartamentos/list.ejs`
- Coluna "Fração Ideal" removida

---

## 📝 Regras de Negócio

### Multa e Juros:
- **Multa**: 2% do valor da taxa em atraso (aplicada uma vez)
- **Juros**: 1% ao mês do valor da taxa em atraso (calculado proporcionalmente)
- **Aplicação**: Multas e juros são adicionadas ao valor da nova taxa criada

### Atualização de Saldo:
- **Ao criar taxa**: Entrada financeira criada com `received = FALSE` (não conta no saldo ainda)
- **Ao pagar taxa**: Entrada financeira marcada como `received = TRUE` (conta no saldo)
- **Cache**: Invalidado automaticamente para atualizar dashboard imediatamente

---

## ⚠️ Importante

- **Saldo só atualiza quando entrada é marcada como recebida**: `received = TRUE`
- **Taxa paga = Entrada recebida**: Ao marcar taxa como paga, entrada é automaticamente marcada como recebida
- **Cache invalidado**: Dashboard mostra saldo atualizado imediatamente
- **Comprovante opcional para taxas**: Taxas podem ser marcadas como pagas sem comprovante inicialmente

---

## 🔍 Exemplo Prático

**Cenário**: Apartamento 101 tem 2 taxas em atraso e está criando a taxa de Março.

**Passo 1 - Criar Taxa**:
- Taxa Janeiro: R$ 500,00 (30 dias em atraso)
- Taxa Fevereiro: R$ 500,00 (10 dias em atraso)
- Nova Taxa Março: R$ 500,00

**Cálculo**:
- Multa Janeiro: R$ 10,00 (2% de R$ 500,00)
- Juros Janeiro: R$ 5,00 (1% × 1 mês)
- Multa Fevereiro: R$ 10,00 (2% de R$ 500,00)
- Juros Fevereiro: R$ 1,65 (1% × 0,33 mês)

**Total**: R$ 500,00 + R$ 20,00 + R$ 6,65 = **R$ 526,65**

**Passo 2 - Pagar Taxa**:
- Usuário marca taxa de Março como paga
- Sistema marca entrada financeira como recebida
- **Saldo aumenta em R$ 526,65 automaticamente**
- Dashboard mostra saldo atualizado

---

## ✅ Validações Implementadas

1. ✅ Entrada financeira é aprovada automaticamente ao pagar taxa
2. ✅ Entrada financeira é marcada como recebida ao pagar taxa
3. ✅ Cache do dashboard é invalidado para atualizar saldo
4. ✅ Comprovante é opcional para taxas (usa valor padrão se não tiver)
5. ✅ Log de auditoria registra todas as ações

---

## 🚀 Resultado Final

Agora o sistema:
- ✅ Remove fração ideal (não faz sentido)
- ✅ Adiciona multas e juros automaticamente ao criar taxa
- ✅ **Atualiza saldo financeiro automaticamente ao pagar taxa**
- ✅ Invalida cache para dashboard mostrar saldo atualizado imediatamente
