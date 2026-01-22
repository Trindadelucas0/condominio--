# Explicação: Fechamento e Reabertura de Mês

## 📋 Funcionalidades Implementadas

### 1. ✅ Relatório só gera PDF quando mês está fechado

**Antes**: Relatórios podiam ser gerados para qualquer mês, mesmo que não estivesse fechado.

**Agora**: 
- O sistema verifica se o mês está fechado antes de gerar o relatório
- Se o mês não estiver fechado, exibe a mensagem: *"Relatório só pode ser gerado para meses fechados. Por favor, feche o mês primeiro."*

**Como funciona**:
```javascript
// Verifica se o mês está fechado
const closure = await monthlyClosureService.getClosureByMonth(condominiumId, month, year);
if (!closure || closure.status !== 'CLOSED') {
  throw new Error('Relatório só pode ser gerado para meses fechados...');
}
```

---

### 2. ✅ Opção de reabrir mês fechado

**Funcionalidade**: Permite reabrir um mês que foi fechado anteriormente.

**Como usar**:
1. Vá em **Financeiro → Fechamento Mensal**
2. Selecione o mês fechado que deseja reabrir
3. Clique em **"Reabrir Mês"**
4. Informe o **motivo da reabertura** (obrigatório)
5. O mês será reaberto e poderá receber novos registros

**Status do mês após reabertura**:
- Status muda de `CLOSED` para `REOPENED`
- Registra quem reabriu e quando
- Registra o motivo da reabertura (obrigatório)

---

### 3. ✅ Registros associados ao mês reaberto

**Comportamento**: Quando um mês é reaberto, todos os registros financeiros criados a partir daquele momento que tenham data dentro do mês reaberto serão automaticamente aceitos e associados a esse mês.

**Validações implementadas**:

#### Ao criar Entrada Financeira:
- Verifica se o mês da data está fechado
- Se estiver fechado (não reaberto), bloqueia a criação
- Se estiver reaberto ou aberto, permite a criação

#### Ao criar Saída Financeira:
- Verifica se o mês da data está fechado
- Se estiver fechado (não reaberto), bloqueia a criação
- Se estiver reaberto ou aberto, permite a criação

**Mensagem de erro**:
```
Não é possível criar [entrada/saída] financeira. 
O mês MM/AAAA está fechado. 
Reabra o mês primeiro se necessário.
```

---

## 🔄 Fluxo Completo

### Fechamento de Mês:
```
1. Financeiro/Síndico fecha o mês
   ↓
2. Sistema valida se pode fechar (sem pendências)
   ↓
3. Calcula totais do mês
   ↓
4. Marca status como CLOSED
   ↓
5. Bloqueia criação de novos registros naquele mês
   ↓
6. Permite gerar relatório PDF
```

### Reabertura de Mês:
```
1. Síndico reabre o mês (com motivo obrigatório)
   ↓
2. Status muda para REOPENED
   ↓
3. Sistema registra quem reabriu e quando
   ↓
4. A partir deste momento, permite criar registros
   com data naquele mês
   ↓
5. Novos registros são automaticamente associados
   ao mês reaberto
```

### Geração de Relatório:
```
1. Usuário tenta gerar relatório
   ↓
2. Sistema verifica se mês está fechado
   ↓
3. Se NÃO estiver fechado:
   → Exibe erro: "Relatório só pode ser gerado para meses fechados"
   ↓
4. Se estiver fechado:
   → Gera PDF com todos os dados do mês
   → Salva em uploads/reports/
   → Registra no histórico
```

---

## 🔧 Arquivos Modificados

### 1. `src/services/reportService.js`
- Adicionada validação para verificar se mês está fechado antes de gerar relatório

### 2. `src/services/monthlyClosureService.js`
- Melhorada função `reopenMonth` com documentação sobre associação de registros
- Adicionado log detalhado da reabertura

### 3. `src/services/financeiroService.js`
- Adicionada validação em `createEntry` para verificar se mês está fechado
- Adicionada validação em `createExit` para verificar se mês está fechado

---

## 📝 Regras de Negócio

### Status do Mês:
- **OPEN**: Mês aberto (padrão para mês atual)
- **CLOSING**: Mês em processo de fechamento
- **CLOSED**: Mês fechado (bloqueia novos registros, permite gerar relatório)
- **REOPENED**: Mês reaberto (permite novos registros novamente)

### Validações:
1. ✅ **Relatório**: Só gera se mês estiver `CLOSED`
2. ✅ **Criar Entrada**: Bloqueia se mês estiver `CLOSED` (não reaberto)
3. ✅ **Criar Saída**: Bloqueia se mês estiver `CLOSED` (não reaberto)
4. ✅ **Reabrir Mês**: Só permite se mês estiver `CLOSED`
5. ✅ **Motivo de Reabertura**: Obrigatório ao reabrir

---

## 🚀 Como Usar

### Fechar um Mês:
1. Vá em **Financeiro → Fechamento Mensal**
2. Selecione o mês/ano
3. Verifique se há pendências
4. Clique em **"Fechar Mês"**
5. Adicione observações (opcional)
6. Confirme

### Reabrir um Mês:
1. Vá em **Financeiro → Fechamento Mensal**
2. Selecione o mês fechado
3. Clique em **"Reabrir Mês"**
4. **Informe o motivo** (obrigatório)
5. Confirme

### Gerar Relatório:
1. Vá em **Financeiro → Relatórios**
2. Selecione mês/ano **fechado**
3. Clique em **"Gerar Relatório"**
4. Se o mês não estiver fechado, será exibido erro
5. Se estiver fechado, o PDF será gerado e salvo

---

## ⚠️ Importante

- **Mês fechado**: Não permite criar novos registros, mas permite gerar relatório
- **Mês reaberto**: Permite criar novos registros novamente
- **Relatório**: Só pode ser gerado para meses fechados (garante dados consolidados)
- **Motivo de reabertura**: Sempre obrigatório (auditoria)

---

## 🔍 Exemplo Prático

**Cenário**: Janeiro/2026 foi fechado, mas esquecemos de registrar uma despesa.

**Solução**:
1. Vá em Fechamento Mensal
2. Selecione Janeiro/2026
3. Clique em "Reabrir Mês"
4. Motivo: "Esquecemos de registrar despesa de manutenção"
5. Confirme
6. Agora você pode criar a despesa com data em Janeiro/2026
7. Após registrar, pode fechar o mês novamente
8. E então gerar o relatório atualizado
