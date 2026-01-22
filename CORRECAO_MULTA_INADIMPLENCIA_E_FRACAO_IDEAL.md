# Correção: Multa de Inadimplência e Fração Ideal

## 📋 Alterações Realizadas

### 1. ✅ Remoção da Fração Ideal

**O que foi feito**:
- Campo "Fração Ideal" removido do formulário de cadastro de apartamentos
- Coluna "Fração Ideal" removida da listagem de apartamentos
- Campo continua no banco de dados (para não quebrar dados existentes), mas não é mais usado

**Motivo**: Não faz sentido ter fração ideal para este sistema de condomínio.

---

### 2. ✅ Multa e Juros Adicionados Automaticamente na Criação da Taxa

**O que foi feito**:
- Quando uma nova taxa é criada, o sistema verifica se o apartamento tem taxas anteriores em atraso
- Se houver taxas em atraso, calcula automaticamente multa e juros
- Adiciona multa e juros ao valor da nova taxa criada

**Como funciona**:

```
1. Usuário cria nova taxa para apartamento
   ↓
2. Sistema verifica se há taxas anteriores em atraso
   ↓
3. Se houver:
   - Calcula multa (2% do valor da taxa em atraso)
   - Calcula juros (1% ao mês de atraso)
   - Soma multa + juros de todas as taxas em atraso
   ↓
4. Cria nova taxa com valor = valor base + multas + juros das taxas anteriores
   ↓
5. Cria entrada financeira com valor total (incluindo multas e juros)
   ↓
6. Descrição da entrada inclui informação sobre multas e juros
```

**Exemplo Prático**:

```
Apartamento 101 tem:
- Taxa Janeiro/2026: R$ 500,00 (em atraso há 30 dias)
- Taxa Fevereiro/2026: R$ 500,00 (em atraso há 10 dias)

Ao criar Taxa Março/2026 (R$ 500,00):
- Multa Janeiro: R$ 500,00 × 2% = R$ 10,00
- Juros Janeiro: R$ 500,00 × 1% × 1 mês = R$ 5,00
- Multa Fevereiro: R$ 500,00 × 2% = R$ 10,00
- Juros Fevereiro: R$ 500,00 × 1% × 0,33 mês = R$ 1,65

Total de multas: R$ 20,00
Total de juros: R$ 6,65

Valor da Taxa Março/2026 = R$ 500,00 + R$ 20,00 + R$ 6,65 = R$ 526,65
```

---

## 🔧 Implementação Técnica

### Arquivos Modificados:

1. **`src/services/inadimplenciaService.js`**
   - Função `createMonthlyFee`: Adicionada verificação de taxas em atraso
   - Calcula multa e juros automaticamente
   - Adiciona ao valor da nova taxa

2. **`views/administrativo/financeiro/apartamentos/form.ejs`**
   - Campo "Fração Ideal" removido

3. **`views/administrativo/financeiro/apartamentos/list.ejs`**
   - Coluna "Fração Ideal" removida

---

## 📝 Regras de Negócio

### Cálculo de Multa e Juros:

- **Multa**: 2% do valor da taxa em atraso (aplicada uma vez por taxa)
- **Juros**: 1% ao mês do valor da taxa em atraso (calculado proporcionalmente)
- **Aplicação**: Multas e juros das taxas anteriores são adicionadas à nova taxa criada

### Comportamento:

1. **Taxas anteriores em atraso**: Continuam em aberto até serem pagas
2. **Nova taxa**: Inclui automaticamente multas e juros das taxas anteriores
3. **Entrada financeira**: Criada com valor total (taxa + multas + juros)
4. **Descrição**: Inclui informação sobre multas e juros se houver

---

## ⚠️ Importante

- **Multas e juros são adicionadas à nova taxa**: Não são registradas separadamente
- **Taxas anteriores continuam em aberto**: Até serem pagas individualmente
- **Valor da entrada financeira**: Reflete o valor total incluindo multas e juros
- **Fração ideal**: Não é mais usada, mas campo permanece no banco para compatibilidade

---

## 🔍 Exemplo de Uso

**Cenário**: Apartamento 101 tem 2 taxas em atraso e está criando a taxa de Março.

**Passo a passo**:
1. Sistema verifica taxas em atraso do apartamento 101
2. Encontra 2 taxas não pagas
3. Calcula multa e juros de cada uma
4. Cria nova taxa de Março com valor = R$ 500,00 + multas + juros
5. Descrição da entrada: "Taxa de Condomínio - Apt 101 - 03/2026 (Inclui multa: R$ 20,00 e juros: R$ 6,65 de 2 taxa(s) em atraso)"
6. Valor total da entrada: R$ 526,65

---

## ✅ Benefícios

1. **Automação**: Multas e juros calculados automaticamente
2. **Transparência**: Descrição da entrada mostra multas e juros incluídos
3. **Simplicidade**: Não precisa calcular manualmente
4. **Consistência**: Sempre aplica as mesmas regras de multa e juros
