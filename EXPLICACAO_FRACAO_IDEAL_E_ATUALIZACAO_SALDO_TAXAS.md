# Explicação: Fração Ideal e Atualização Automática de Saldo nas Taxas

## 📋 O que é Fração Ideal?

A **fração ideal** é a porcentagem que cada apartamento representa no condomínio. Ela é usada para:

- **Rateio proporcional de despesas**: Se um apartamento tem fração ideal de 2.5% (0.0250), ele deve pagar 2.5% das despesas comuns do condomínio
- **Cálculo de taxas proporcionais**: Quando há despesas extras, cada apartamento paga proporcionalmente à sua fração ideal
- **Distribuição justa de custos**: Apartamentos maiores ou com mais área útil geralmente têm fração ideal maior

### Exemplo:
- Condomínio com 40 apartamentos
- Apartamento 101 tem fração ideal de 0.0250 (2.5%)
- Se houver uma despesa extra de R$ 1.000,00, o apartamento 101 deve pagar R$ 25,00 (2.5% de R$ 1.000,00)

### Como cadastrar:
A fração ideal é cadastrada no formulário de apartamentos, no campo "Fração Ideal (%)". 
- Exemplo: Se o apartamento representa 2.5% do condomínio, digite `2.5` ou `0.0250`

---

## 💰 Atualização Automática de Saldo ao Criar Taxas

### Como funciona:

Quando uma **taxa mensal** é criada para um apartamento, o sistema agora:

1. ✅ **Cria automaticamente uma entrada financeira** (`financial_entry`) vinculada à taxa
2. ✅ **Atualiza o saldo do condomínio** (a entrada aparece como "não recebida" inicialmente)
3. ✅ **Vincula a taxa à entrada financeira** através do campo `financial_entry_id`

### Fluxo completo:

```
1. Usuário cria taxa mensal para apartamento
   ↓
2. Sistema cria taxa na tabela monthly_fees
   ↓
3. Sistema cria entrada financeira automaticamente:
   - Descrição: "Taxa de Condomínio - Apt 101 - 01/2026"
   - Valor: igual ao valor da taxa
   - Categoria: TAXA
   - Status: PENDING_REVIEW (aguardando aprovação do síndico)
   - Recebida: FALSE (ainda não foi paga)
   ↓
4. Sistema vincula taxa com entrada financeira
   ↓
5. Saldo do condomínio é atualizado quando:
   - Síndico aprova a entrada financeira
   - Taxa é marcada como paga (entrada é marcada como recebida)
```

### Quando a taxa é marcada como paga:

Quando você marca uma taxa como **paga**, o sistema:

1. ✅ **Aprova automaticamente a entrada financeira** (se ainda estiver pendente)
2. ✅ **Marca a entrada como recebida** (`received = TRUE`)
3. ✅ **Atualiza o saldo do condomínio** imediatamente
4. ✅ **Invalida o cache do dashboard** para refletir o novo saldo

---

## 🔧 Implementação Técnica

### Arquivos modificados:

1. **`src/database/extendTablesPhase30.sql`**
   - Adiciona campo `financial_entry_id` na tabela `monthly_fees`
   - Cria índice para melhorar performance

2. **`src/services/inadimplenciaService.js`**
   - Função `createMonthlyFee`: Cria entrada financeira automaticamente
   - Função `markFeeAsPaid`: Marca entrada como recebida quando taxa é paga

3. **`src/database/init.js`**
   - Adiciona verificação e execução do script Phase30

### Estrutura de dados:

```sql
-- Tabela monthly_fees agora tem:
financial_entry_id INTEGER REFERENCES financial_entries(id)

-- Tabela financial_entries tem:
linked_to_id INTEGER  -- ID da taxa (quando linked_to_type = 'MONTHLY_FEE')
linked_to_type VARCHAR(50)  -- 'MONTHLY_FEE' quando vinculada a uma taxa
```

---

## ✅ Benefícios

1. **Saldo sempre atualizado**: O saldo do condomínio reflete automaticamente todas as taxas criadas
2. **Rastreabilidade**: Cada taxa está vinculada à sua entrada financeira correspondente
3. **Automação**: Não é necessário criar entrada financeira manualmente para cada taxa
4. **Consistência**: Garante que todas as taxas tenham entrada financeira correspondente

---

## 📝 Notas Importantes

- A entrada financeira é criada como **PENDING_REVIEW** inicialmente
- O síndico precisa **aprovar** a entrada antes que ela conte no saldo disponível
- Quando a taxa é marcada como paga, a entrada é **aprovada e marcada como recebida automaticamente**
- Se a entrada já estiver aprovada, apenas marca como recebida ao pagar a taxa

---

## 🚀 Como usar

1. **Criar taxa mensal**: Vá em Financeiro → Taxas → Nova Taxa
   - O sistema cria automaticamente a entrada financeira

2. **Aprovar entrada** (Síndico): Vá em Síndico → Entradas Pendentes
   - Aprova a entrada financeira vinculada à taxa

3. **Marcar taxa como paga**: Vá em Financeiro → Taxas → Marcar como Paga
   - Sistema aprova e marca entrada como recebida automaticamente
   - Saldo é atualizado imediatamente

---

## 🔍 Verificação

Para verificar se está funcionando:

1. Crie uma taxa para um apartamento
2. Vá em Financeiro → Entradas
3. Procure pela entrada com descrição "Taxa de Condomínio - Apt XXX - MM/AAAA"
4. Verifique que a entrada está vinculada à taxa (campo `linked_to_id`)
