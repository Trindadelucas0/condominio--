# 🧪 GUIA COMPLETO DE TESTE - FLUXO DE MÚLTIPLOS ORÇAMENTOS

## 📋 RESUMO DO FLUXO

```
1. ADMINISTRATIVO → Cria solicitação com múltiplos orçamentos
2. FINANCEIRO → Revisa e compara orçamentos → Envia para síndico
3. SÍNDICO → Escolhe qual orçamento aprovar → Sistema cria saída automaticamente
4. FINANCEIRO → Verifica se foi executada → Preenche formulário completo
```

---

## ✅ TESTE 1: ADMINISTRATIVO - Criar Solicitação com Múltiplos Orçamentos

### Passo a Passo:

1. **Login como ADMINISTRATIVO**
   - Acesse: `http://localhost:3000/auth/login`
   - Use credenciais de usuário com perfil ADMINISTRATIVO

2. **Acessar Formulário de Solicitação**
   - No menu, clique em "Orçamentos" ou acesse diretamente:
   - URL: `/administrativo/orcamentos/novo`

3. **Preencher Dados da Solicitação**
   - **Título:** `Reparo do Elevador Social`
   - **Descrição:** `Elevador apresentando problemas de funcionamento, precisa de orçamento para reparo`
   - **Prioridade:** `ALTA`
   - **Valor Estimado:** `5000.00` (opcional)
   - **Ocorrência Relacionada:** (opcional - selecione uma se houver)
   - **Tarefa Relacionada:** (opcional - selecione uma se houver)

4. **Adicionar Primeiro Orçamento**
   - Clique no botão **"Adicionar Orçamento"**
   - Preencha:
     - **Nome do Fornecedor:** `Elevadores XYZ Ltda`
     - **Contato:** `(11) 98765-4321`
     - **Valor do Orçamento:** `4500.00`
     - **Validade:** `2024-12-31`
     - **Descrição:** `Troca de cabos e revisão completa`

5. **Adicionar Segundo Orçamento**
   - Clique novamente em **"Adicionar Orçamento"**
   - Preencha:
     - **Nome do Fornecedor:** `Manutenção Express`
     - **Contato:** `contato@express.com.br`
     - **Valor do Orçamento:** `3800.00`
     - **Validade:** `2024-12-15`
     - **Descrição:** `Reparo pontual com garantia de 6 meses`

6. **Adicionar Terceiro Orçamento**
   - Clique novamente em **"Adicionar Orçamento"**
   - Preencha:
     - **Nome do Fornecedor:** `Técnicos Especializados`
     - **Contato:** `(11) 91234-5678`
     - **Valor do Orçamento:** `5200.00`
     - **Validade:** `2025-01-15`
     - **Descrição:** `Serviço completo com peças originais`

7. **Adicionar Anexos (Opcional)**
   - No campo "Anexos", selecione arquivos PDF, DOC ou imagens
   - Pode selecionar múltiplos arquivos

8. **Submeter Formulário**
   - Clique em **"Criar Solicitação"**
   - ✅ **Resultado Esperado:**
     - Mensagem de sucesso
     - Redirecionamento para lista de orçamentos
     - Status: `PENDING_FINANCEIRO`

### ✅ Validações a Testar:

- [ ] Não permite criar sem adicionar pelo menos um orçamento
- [ ] Não permite criar orçamento sem nome do fornecedor
- [ ] Não permite criar orçamento sem valor
- [ ] Permite remover orçamentos antes de submeter
- [ ] Todos os 3 orçamentos são salvos corretamente

---

## ✅ TESTE 2: FINANCEIRO - Revisar e Comparar Orçamentos

### Passo a Passo:

1. **Login como FINANCEIRO**
   - Acesse: `http://localhost:3000/auth/login`
   - Use credenciais de usuário com perfil FINANCEIRO

2. **Acessar Orçamentos Pendentes**
   - No menu, clique em "Orçamentos Pendentes" ou acesse:
   - URL: `/financeiro/orcamentos-pendentes`

3. **Verificar Exibição dos Orçamentos**
   - ✅ **Resultado Esperado:**
     - Deve aparecer a solicitação criada
     - Deve mostrar **TODOS os 3 orçamentos** em grid
     - Cada orçamento deve mostrar:
       - Nome do fornecedor
       - Contato
       - Valor em destaque
       - Descrição
       - Validade (se informada)

4. **Comparar Orçamentos**
   - Observe os valores:
     - Elevadores XYZ: R$ 4.500,00
     - Manutenção Express: R$ 3.800,00 (mais barato)
     - Técnicos Especializados: R$ 5.200,00 (mais caro)

5. **Preencher Revisão**
   - **Observações do Financeiro:** `Comparando 3 orçamentos. Manutenção Express oferece melhor custo-benefício.`
   - **Centro de Custo:** (selecione um se houver)

6. **Enviar para Síndico**
   - Clique em **"Revisar e Enviar para Síndico"**
   - ✅ **Resultado Esperado:**
     - Mensagem de sucesso
     - Status muda para: `PENDING_SINDICO`
     - Síndico recebe notificação

### ✅ Validações a Testar:

- [ ] Todos os orçamentos são exibidos corretamente
- [ ] Valores estão formatados corretamente (R$ X.XXX,XX)
- [ ] Observações são obrigatórias
- [ ] Status muda corretamente após revisão

---

## ✅ TESTE 3: SÍNDICO - Escolher e Aprovar Orçamento

### Passo a Passo:

1. **Login como SÍNDICO**
   - Acesse: `http://localhost:3000/auth/login`
   - Use credenciais de usuário com perfil SÍNDICO

2. **Acessar Orçamentos Pendentes**
   - No menu, clique em "Orçamentos Pendentes" ou acesse:
   - URL: `/sindico/orcamentos-pendentes`

3. **Verificar Exibição**
   - ✅ **Resultado Esperado:**
     - Deve aparecer a solicitação revisada pelo financeiro
     - Deve mostrar **TODOS os 3 orçamentos** em cards
     - Deve mostrar observações do financeiro
     - Cada orçamento deve ter um **radio button** para seleção

4. **Analisar Orçamentos**
   - Compare:
     - **Elevadores XYZ:** R$ 4.500,00 - Empresa conhecida
     - **Manutenção Express:** R$ 3.800,00 - Melhor preço
     - **Técnicos Especializados:** R$ 5.200,00 - Mais caro, mas com peças originais

5. **Selecionar Orçamento para Aprovar**
   - Clique no **radio button** do orçamento que deseja aprovar
   - Exemplo: Selecione **"Manutenção Express"** (R$ 3.800,00)

6. **Adicionar Observações (Opcional)**
   - **Observações:** `Aprovado o orçamento da Manutenção Express por oferecer melhor custo-benefício conforme análise do financeiro.`

7. **Aprovar Orçamento**
   - Clique em **"✓ Aprovar Orçamento Selecionado"**
   - ✅ **Resultado Esperado:**
     - Mensagem de sucesso
     - Status do orçamento selecionado: `APPROVED`
     - Status dos outros orçamentos: `REJECTED`
     - Status da solicitação: `APPROVED`
     - **SAÍDA FINANCEIRA CRIADA AUTOMATICAMENTE** com:
       - Descrição: "Reparo do Elevador Social"
       - Valor: R$ 3.800,00
       - Status: `PENDING` (needs_verification = TRUE)
     - Financeiro recebe notificação

### ✅ Validações a Testar:

- [ ] Não permite aprovar sem selecionar um orçamento
- [ ] Apenas um orçamento pode ser selecionado (radio buttons)
- [ ] Orçamento selecionado fica marcado como APPROVED
- [ ] Outros orçamentos ficam marcados como REJECTED
- [ ] Saída financeira é criada automaticamente
- [ ] Valor da saída corresponde ao orçamento aprovado
- [ ] Saída tem `needs_verification = TRUE`

---

## ✅ TESTE 4: FINANCEIRO - Verificar e Completar Saída

### Passo a Passo:

1. **Login como FINANCEIRO**
   - Acesse: `http://localhost:3000/auth/login`
   - Use credenciais de usuário com perfil FINANCEIRO

2. **Acessar Saídas para Verificação**
   - No menu, procure por "Saídas para Verificação" ou acesse:
   - URL: `/financeiro/saidas-verificacao`
   - ✅ **Resultado Esperado:**
     - Deve aparecer a saída criada automaticamente
     - Deve mostrar:
       - Descrição: "Reparo do Elevador Social"
       - Valor: R$ 3.800,00
       - Data
       - Status: "Aguardando Verificação"
       - Informações do orçamento relacionado

3. **Abrir Formulário de Verificação**
   - Clique em **"Verificar e Completar"**

4. **Verificar Informações do Orçamento**
   - ✅ **Resultado Esperado:**
     - Deve mostrar um card azul com:
       - Título do orçamento relacionado
       - Fornecedor aprovado: "Manutenção Express"

5. **Completar Dados da Saída**
   - **Descrição:** `Reparo do Elevador Social - Manutenção Express`
   - **Valor:** `3800.00` (já preenchido, pode ajustar se necessário)
   - **Data:** Selecione a data atual ou data futura
   - **Centro de Custo:** Selecione um centro de custo (ex: "Manutenção")
   - **Categoria:** `MANUTENCAO` (já selecionada)

6. **Confirmar Verificação**
   - Clique em **"Confirmar Verificação"**
   - ✅ **Resultado Esperado:**
     - Mensagem de sucesso
     - Saída é marcada como `verified = TRUE`
     - Saída sai da lista de "Saídas para Verificação"
     - Status da saída pode mudar para `APPROVED` (se valor < limite) ou `PENDING` (se precisa aprovação)

### ✅ Validações a Testar:

- [ ] Lista mostra apenas saídas com `needs_verification = TRUE` e `verified = FALSE`
- [ ] Formulário pré-preenche dados do orçamento
- [ ] Permite ajustar descrição, valor e data
- [ ] Após verificação, saída não aparece mais na lista
- [ ] Saída fica disponível na lista geral de saídas

---

## ✅ TESTE 5: Verificar Lista de Solicitações (ADMINISTRATIVO)

### Passo a Passo:

1. **Login como ADMINISTRATIVO**
   - Acesse: `/administrativo/orcamentos`

2. **Verificar Lista**
   - ✅ **Resultado Esperado:**
     - Deve aparecer a solicitação criada
     - Deve mostrar status atual
     - Deve mostrar todos os orçamentos em grid
     - Orçamento aprovado deve ter badge verde "Aprovado"
     - Outros orçamentos devem ter badge vermelho "Rejeitado"

---

## ✅ TESTE 6: Rejeitar Solicitação (SÍNDICO)

### Passo a Passo:

1. **Criar Nova Solicitação** (como ADMINISTRATIVO)
   - Crie outra solicitação com 2 orçamentos

2. **Revisar** (como FINANCEIRO)
   - Revise e envie para síndico

3. **Rejeitar** (como SÍNDICO)
   - Acesse: `/sindico/orcamentos-pendentes`
   - Encontre a solicitação
   - No formulário de rejeição, preencha:
     - **Motivo da Rejeição:** `Orçamentos acima do orçamento disponível`
   - Clique em **"✗ Rejeitar Orçamento"**
   - ✅ **Resultado Esperado:**
     - Status da solicitação: `REJECTED`
     - Todos os orçamentos ficam como `REJECTED`
     - Financeiro recebe notificação

---

## 🐛 POSSÍVEIS PROBLEMAS E SOLUÇÕES

### Problema: "Não consigo adicionar orçamentos no formulário"
- **Solução:** Verifique se o JavaScript está habilitado no navegador
- **Solução:** Abra o console do navegador (F12) e verifique erros

### Problema: "Orçamentos não aparecem na visualização"
- **Solução:** Verifique se os orçamentos foram salvos no banco:
  ```sql
  SELECT * FROM budget_quotes WHERE budget_request_id = [ID_DA_SOLICITACAO];
  ```

### Problema: "Saída financeira não foi criada automaticamente"
- **Solução:** Verifique os logs do servidor
- **Solução:** Verifique se o orçamento foi realmente aprovado:
  ```sql
  SELECT * FROM budget_quotes WHERE id = [ID_DO_ORCAMENTO];
  ```

### Problema: "Saída não aparece em 'Saídas para Verificação'"
- **Solução:** Verifique se a saída tem `needs_verification = TRUE`:
  ```sql
  SELECT * FROM financial_exits WHERE needs_verification = TRUE AND verified = FALSE;
  ```

---

## 📊 CHECKLIST DE TESTE COMPLETO

### Funcionalidades Básicas
- [ ] Criar solicitação com 1 orçamento
- [ ] Criar solicitação com 3 orçamentos
- [ ] Criar solicitação com 5 orçamentos (teste de limite)
- [ ] Remover orçamento antes de submeter
- [ ] Validar campos obrigatórios

### Fluxo Financeiro
- [ ] Financeiro vê todos os orçamentos
- [ ] Financeiro pode comparar valores
- [ ] Financeiro adiciona observações
- [ ] Status muda para PENDING_SINDICO

### Fluxo Síndico
- [ ] Síndico vê todos os orçamentos
- [ ] Síndico pode selecionar qual aprovar
- [ ] Apenas um orçamento pode ser selecionado
- [ ] Orçamento selecionado fica APPROVED
- [ ] Outros orçamentos ficam REJECTED
- [ ] Saída financeira é criada automaticamente
- [ ] Notificação é enviada ao financeiro

### Fluxo Verificação
- [ ] Financeiro vê saídas para verificação
- [ ] Formulário mostra dados do orçamento
- [ ] Permite ajustar dados
- [ ] Marca como verificada
- [ ] Saída sai da lista de verificação

### Casos Especiais
- [ ] Rejeitar solicitação inteira
- [ ] Solicitação sem orçamentos (deve dar erro)
- [ ] Orçamento sem nome do fornecedor (deve dar erro)
- [ ] Orçamento sem valor (deve dar erro)

---

## 🎯 DADOS DE TESTE SUGERIDOS

### Solicitação 1: Reparo de Elevador
- **Título:** Reparo do Elevador Social
- **Descrição:** Elevador apresentando problemas
- **Orçamento 1:** Elevadores XYZ - R$ 4.500,00
- **Orçamento 2:** Manutenção Express - R$ 3.800,00
- **Orçamento 3:** Técnicos Especializados - R$ 5.200,00

### Solicitação 2: Pintura da Fachada
- **Título:** Pintura da Fachada do Prédio
- **Descrição:** Necessário repintar toda a fachada
- **Orçamento 1:** Pinturas & Cia - R$ 15.000,00
- **Orçamento 2:** Reforma Total - R$ 12.500,00
- **Orçamento 3:** Pintura Express - R$ 18.000,00

### Solicitação 3: Troca de Portões
- **Título:** Troca dos Portões de Entrada
- **Descrição:** Portões antigos precisam ser substituídos
- **Orçamento 1:** Portões Modernos - R$ 8.000,00
- **Orçamento 2:** Ferragens Silva - R$ 7.200,00

---

## ✅ CONCLUSÃO

Após testar todos os passos acima, o sistema deve estar funcionando completamente com:
- ✅ Múltiplos orçamentos por solicitação
- ✅ Comparação de orçamentos
- ✅ Aprovação seletiva
- ✅ Criação automática de saída financeira
- ✅ Verificação e preenchimento de saída

**Boa sorte nos testes! 🚀**
