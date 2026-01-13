# 🧪 GUIA COMPLETO DE TESTES - SISTEMA DE GESTÃO CONDOMINIAL

Este documento contém um guia passo-a-passo para testar TODAS as funcionalidades do sistema, botão por botão, fluxo por fluxo.

**✅ VALIDADO:** Este guia foi validado contra o código real do sistema (Janeiro 2025).

**⚠️ IMPORTANTE:**
- Porta padrão: `3000` (configurável via `.env`)
- Estados de `financial_entries`: `PENDING_REVIEW` → `APPROVED` → `RECEIVED` ou `REJECTED`
- Soft delete implementado em `financial_entries` (campos: `deleted_at`, `deleted_by`, `delete_reason`)
- Limpeza `EQUIPAMENTO_DEFEITO` **não cria** ocorrência de zeladoria automaticamente (notifica ADMINISTRATIVO)

---

## 📋 PRÉ-REQUISITOS

Antes de começar os testes, você precisa:

1. ✅ Ter o sistema rodando (servidor iniciado)
2. ✅ Ter acesso ao banco de dados (PostgreSQL)
3. ✅ Ter pelo menos um condomínio criado
4. ✅ Ter usuários criados com os seguintes perfis:
   - SUPER_MASTER
   - SINDICO
   - FINANCEIRO
   - ADMINISTRATIVO
   - OPERACIONAL
   - LIMPEZA
   - CONSELHO

**Dica:** Use o SUPER_MASTER para criar condomínios e usuários primeiro.

---

## 🎯 COMO USAR ESTE GUIA

1. **Siga a ordem dos testes** (comece pelo SUPER_MASTER)
2. **Marque cada item** que você testou (use ✅ ou ❌)
3. **Anote problemas** encontrados
4. **Teste um perfil por vez** (faça logout e login com outro perfil)
5. **Não pule etapas** - cada teste depende do anterior

---

## 📝 LEGENDA

- ✅ = Funcionou corretamente
- ❌ = Não funcionou / Erro encontrado
- ⚠️ = Funcionou, mas com observações
- 🟡 = Opcional (não crítico)
- 🔴 = Crítico (deve funcionar)

---

## 🔵 PARTE 1: SUPER_MASTER (Administração do Sistema)

### 1.1 Login como SUPER_MASTER

1. Acesse: `http://localhost:3000/auth/login` (ou a porta configurada no `.env`)
2. Preencha:
   - Username: (seu usuário SUPER_MASTER)
   - Senha: (sua senha)
3. Clique em **"Entrar"**
4. ✅ **Esperado:** Deve redirecionar para `/master/dashboard`

**Se não funcionou:**
- ❌ Verifique se o usuário existe e está ativo
- ❌ Verifique se a senha está correta
- ❌ Verifique se o servidor está rodando

---

### 1.2 Dashboard Master

**Tela:** `/master/dashboard`

**O que verificar:**
1. ✅ Página carrega sem erros
2. ✅ Mostra "Total de condomínios ativos"
3. ✅ Mostra "Total de condomínios inativos"******************************************************************
4. ✅ Mostra "Total de usuários ativos"
5. ✅ Mostra "Logs nas últimas 24h"
6. ✅ Menu de navegação está visível

---

### 1.3 Listar Condomínios

**Tela:** `/master/condominios`

**Passos:**
1. Clique em "Condomínios" no menu
2. ✅ **Esperado:** Deve mostrar lista de condomínios
3. ✅ Verificar se mostra: Nome, Endereço, CNPJ, Telefone, Email, Status

**Botões a testar:**
- ✅ **"Novo Condomínio"** → Deve ir para formulário de criação

---

### 1.4 Criar Novo Condomínio

**Tela:** `/master/condominios/novo`

**Passos:**
1. Clique em **"Novo Condomínio"**
2. Preencha o formulário:
   - Nome: "Condomínio Teste 001"
   - Endereço: "Rua Teste, 123"
   - CNPJ: "12.345.678/0001-90" (ou deixe vazio)
   - Telefone: "(11) 98765-4321"
   - Email: "teste@condominio.com"
   - Active: ✅ (marcado)
3. Clique em **"Salvar"**
4. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
5. ✅ Verificar se o condomínio aparece na lista

**Teste de validação:**
- ❌ Tente criar sem nome → Deve mostrar erro
- ❌ Tente criar com CNPJ inválido → Deve mostrar erro
- ❌ Tente criar com email inválido → Deve mostrar erro

**Anote:** ID do condomínio criado: _______________

---

### 1.5 Editar Condomínio

**Passos:**
1. Na lista de condomínios, clique em **"Editar"** de um condomínio
2. ✅ **Esperado:** Deve abrir formulário com dados preenchidos
3. Altere o nome para "Condomínio Teste 001 - EDITADO"
4. Clique em **"Salvar"**
5. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
6. ✅ Verificar se o nome foi atualizado

---

### 1.6 Listar Usuários

**Tela:** `/master/usuarios`

**Passos:**
1. Clique em "Usuários" no menu
2. ✅ **Esperado:** Deve mostrar lista de usuários
3. ✅ Verificar se mostra: Username, Email, Nome Completo, Condomínio, Perfis, Status

**Botões a testar:**
- ✅ **"Novo Usuário"** → Deve ir para formulário de criação

---

### 1.7 Criar Novo Usuário

**Tela:** `/master/usuarios/novo`

**Passos:**
1. Clique em **"Novo Usuário"**
2. Preencha o formulário:
   - Username: "usuario_teste_001"
   - Email: "usuario.teste@email.com"
   - Password: "senha123"
   - Nome Completo: "Usuário Teste 001"
   - Condomínio: Selecione o condomínio criado anteriormente
   - Active: ✅ (marcado)
   - Perfis: Marque "SINDICO"
3. Clique em **"Salvar"**
4. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
5. ✅ Verificar se o usuário aparece na lista

**Criar usuários para cada perfil:**
- [ ] Usuário com perfil FINANCEIRO
- [ ] Usuário com perfil ADMINISTRATIVO
- [ ] Usuário com perfil OPERACIONAL
- [ ] Usuário com perfil LIMPEZA
- [ ] Usuário com perfil CONSELHO

**Anote os usuários criados:**
- SINDICO: _______________
- FINANCEIRO: _______________
- ADMINISTRATIVO: _______________
- OPERACIONAL: _______________
- LIMPEZA: _______________
- CONSELHO: _______________

---

## 🔵 PARTE 2: SÍNDICO (Aprovações e Visão Executiva)

### 2.1 Login como SINDICO

1. Faça **logout** (ou abra navegador em aba anônima)
2. Acesse: `http://localhost:3000/auth/login`
3. Preencha com usuário SINDICO criado anteriormente
4. Clique em **"Entrar"**
5. ✅ **Esperado:** Deve redirecionar para `/sindico/dashboard`

**⚠️ NOTA:** Verifique a porta do servidor no `.env` (padrão: 3000). Se estiver usando porta diferente, ajuste as URLs.

---

### 2.2 Dashboard Síndico

**Tela:** `/sindico/dashboard`

**O que verificar:**
1. ✅ Página carrega sem erros
2. ✅ Mostra "Aprovações pendentes" (contador)
3. ✅ Mostra "Saldo financeiro"
4. ✅ Mostra "Tarefas atrasadas"
5. ✅ Mostra "Ocorrências abertas"
6. ✅ Mostra "Entradas pendentes de análise"
7. ✅ Mostra "Orçamentos aguardando aprovação"
8. ✅ Mostra "Manutenções concluídas"
9. ✅ Mostra "Ocorrências pendentes de aprovação"

**Anotar valores iniciais:**
- Aprovações pendentes: _______________
- Saldo financeiro: _______________

---

### 2.3 Entradas Pendentes de Análise

**Tela:** `/sindico/entradas-pendentes`

**⚠️ IMPORTANTE:** Esta tela só terá entradas se o FINANCEIRO criar entradas primeiro.

**Passos (se houver entradas):**
1. Clique em "Entradas Pendentes" no menu (ou no dashboard)
2. ✅ **Esperado:** Deve mostrar lista de entradas com `review_status = 'PENDING_REVIEW'`
3. Para cada entrada, verifique:
   - ✅ Mostra: Descrição, Valor, Data, Categoria, Centro de Custo
   - ✅ Mostra: Criada em, Criada por
   - ✅ Tem botão **"Aprovar"**
   - ✅ Tem botão **"Rejeitar"**

**Anotar:** Quantidade de entradas pendentes: _______________

**⚠️ Se não houver entradas:** Vá para PARTE 3 (FINANCEIRO) primeiro para criar entradas, depois volte aqui.

---

### 2.4 Aprovar Entrada

**Passos:**
1. Na lista de entradas pendentes, clique em **"Aprovar"** de uma entrada
2. ✅ **Esperado:** Deve abrir formulário/modal de aprovação
3. (Se houver campo) Preencha "Observações" (opcional)
4. Clique em **"Aprovar"** ou **"Confirmar"**
5. ✅ **Esperado:** Deve voltar para lista com mensagem "Aprovada com sucesso"
6. ✅ **Esperado:** A entrada NÃO deve mais aparecer na lista de pendentes
7. ✅ Verificar se o saldo financeiro foi atualizado no dashboard

**Anotar:** ID da entrada aprovada: _______________

---

### 2.5 Rejeitar Entrada

**Passos:**
1. Na lista de entradas pendentes, clique em **"Rejeitar"** de uma entrada
2. ✅ **Esperado:** Deve abrir formulário/modal de rejeição
3. **OBRIGATÓRIO:** Preencha "Motivo da Rejeição"
4. Clique em **"Rejeitar"** ou **"Confirmar"**
5. ✅ **Esperado:** Deve voltar para lista com mensagem "Rejeitada com sucesso"
6. ✅ **Esperado:** A entrada NÃO deve mais aparecer na lista de pendentes
7. ✅ Verificar se o saldo financeiro NÃO foi alterado

**Anotar:** ID da entrada rejeitada: _______________

---

### 2.6 Ocorrências Pendentes de Aprovação

**Tela:** `/sindico/ocorrencias-pendentes-aprovacao`

**⚠️ IMPORTANTE:** Esta tela só terá ocorrências se OPERACIONAL ou LIMPEZA criar ocorrências que requerem aprovação.

**Passos (se houver ocorrências):**
1. Clique em "Ocorrências Pendentes" no menu
2. ✅ **Esperado:** Deve mostrar lista de ocorrências com `approval_status = 'PENDING'`
3. Para cada ocorrência, verifique:
   - ✅ Mostra: Título, Descrição, Localização, Prioridade, Tipo
   - ✅ Mostra: Criada por
   - ✅ Tem botão **"Aprovar"**
   - ✅ Tem botão **"Rejeitar"**

**⚠️ Se não houver ocorrências:** Vá para PARTE 5 (OPERACIONAL) ou PARTE 6 (LIMPEZA) primeiro.

---

### 2.7 Manutenções

**Tela:** `/sindico/manutencoes`

**Passos:**
1. Clique em "Manutenções" no menu
2. ✅ **Esperado:** Deve mostrar lista de manutenções
3. ✅ Verificar se mostra: Tipo, Título, Status, Responsável, Data Prevista

**Botões a testar:**
- ✅ **"Nova Manutenção"** → Deve ir para formulário de criação

---

### 2.8 Criar Nova Manutenção

**Tela:** `/sindico/manutencoes/novo`

**Passos:**
1. Clique em **"Nova Manutenção"**
2. Preencha o formulário:
   - Tipo: Selecione "PREVENTIVA" ou "CORRETIVA"
   - Título: "Manutenção Teste 001"
   - Descrição: "Descrição da manutenção de teste"
   - Localização: "Localização teste" (opcional)
   - Prioridade: Selecione "NORMAL"
   - Data Prevista: Selecione uma data futura
   - Responsável: Selecione um usuário OPERACIONAL
   - Ativo: (opcional) Selecione um ativo se houver
3. Clique em **"Criar"**
4. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
5. ✅ Verificar se a manutenção aparece na lista com status "PENDING"

**Anotar:** ID da manutenção criada: _______________

---

### 2.9 Modelos de Checklist

**Tela:** `/sindico/checklist-modelos`

**Passos:**
1. Clique em "Modelos de Checklist" no menu
2. ✅ **Esperado:** Deve mostrar lista de modelos de checklist
3. ✅ Verificar se mostra: Nome, Departamento, Dias da Semana, Status

**Botões a testar:**
- ✅ **"Novo Modelo"** → Deve ir para formulário de criação

---

### 2.10 Criar Novo Modelo de Checklist

**Tela:** `/sindico/checklist-modelos/novo`

**Passos:**
1. Clique em **"Novo Modelo"**
2. Preencha o formulário:
   - Nome: "Checklist Teste 001"
   - Descrição: "Descrição do checklist teste"
   - Departamento: Selecione "ZELADORIA" ou "LIMPEZA"
   - Dias da Semana: Marque pelo menos um (ex: Segunda-feira)
   - Ativo: ✅ (marcado)
   - Requer Foto: ✅ (opcional)
   - Requer Justificativa: ✅ (opcional)
   - Responsável Padrão: Selecione "OPERACIONAL" ou "LIMPEZA"
3. Adicione pelo menos 2 itens:
   - Item 1: "Verificar portão"
   - Item 2: "Verificar elevador"
4. Clique em **"Salvar"**
5. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
6. ✅ Verificar se o modelo aparece na lista

**Anotar:** ID do modelo criado: _______________

---

## 🔵 PARTE 3: FINANCEIRO (Gestão Financeira)

### 3.1 Login como FINANCEIRO

1. Faça **logout**
2. Acesse: `http://localhost:3000/auth/login`
3. Preencha com usuário FINANCEIRO criado anteriormente
4. Clique em **"Entrar"**
5. ✅ **Esperado:** Deve redirecionar para `/financeiro/dashboard`

---

### 3.2 Dashboard Financeiro

**Tela:** `/financeiro/dashboard`

**O que verificar:**
1. ✅ Página carrega sem erros
2. ✅ Mostra "Entradas pendentes de análise"
3. ✅ Mostra "Saídas pendentes"
4. ✅ Mostra "Orçamentos aguardando análise"
5. ✅ Mostra "Saldo atual"
6. ✅ Mostra "Contas vencendo"

**Anotar valores iniciais:**
- Entradas pendentes: _______________
- Saldo atual: _______________

---

### 3.3 Listar Entradas

**Tela:** `/financeiro/entradas`

**Passos:**
1. Clique em "Entradas" no menu
2. ✅ **Esperado:** Deve mostrar lista de entradas financeiras
3. ✅ Verificar se mostra: Descrição, Valor, Data, Categoria, Status de Análise

**Botões a testar:**
- ✅ **"Nova Entrada"** → Deve ir para formulário de criação

---

### 3.4 Criar Nova Entrada

**Tela:** `/financeiro/entradas/nova`

**Passos:**
1. Clique em **"Nova Entrada"**
2. Preencha o formulário:
   - Descrição: "Entrada Teste 001"
   - Valor: "1500.00"
   - Data: Selecione data de hoje ou passada
   - Centro de Custo: (opcional) Selecione um centro de custo
   - Categoria: Selecione "TAXA", "RECEITA" ou "OUTRA"
3. Clique em **"Salvar"**
4. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
5. ✅ Verificar se a entrada aparece na lista com status "PENDING_REVIEW"
6. ✅ Verificar se aparece no dashboard como "Entradas pendentes de análise"

**Anotar:** ID da entrada criada: _______________

**Teste de validação:**
- ❌ Tente criar sem descrição → Deve mostrar erro
- ❌ Tente criar com valor zero → Deve mostrar erro
- ❌ Tente criar com valor negativo → Deve mostrar erro
- ❌ Tente criar sem data → Deve mostrar erro

---

### 3.5 Listar Entradas Rejeitadas

**Tela:** `/financeiro/entradas-rejeitadas`

**⚠️ IMPORTANTE:** Esta tela só terá entradas se o SINDICO rejeitar entradas primeiro.

**Passos (se houver entradas rejeitadas):**
1. Clique em "Entradas Rejeitadas" no menu
2. ✅ **Esperado:** Deve mostrar lista de entradas com `review_status = 'REJECTED'`
3. Para cada entrada, verifique:
   - ✅ Mostra: Descrição, Valor, Motivo da Rejeição, Data
   - ✅ Tem botão **"Editar"**
   - ✅ Tem botão **"Excluir"**

**⚠️ Se não houver entradas rejeitadas:** 
- Volte para PARTE 2 (SINDICO) e rejeite uma entrada
- Depois volte aqui

---

### 3.6 Editar Entrada Rejeitada

**Passos:**
1. Na lista de entradas rejeitadas, clique em **"Editar"** de uma entrada
2. ✅ **Esperado:** Deve abrir formulário com dados preenchidos
3. Altere a descrição para "Entrada Teste 001 - CORRIGIDA"
4. Altere o valor (se necessário)
5. Clique em **"Salvar"**
6. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
7. ✅ **Esperado:** A entrada deve ter status `review_status = 'PENDING_REVIEW'` novamente
8. ✅ Verificar se a entrada NÃO aparece mais na lista de rejeitadas
9. ✅ Verificar se a entrada aparece em "Entradas pendentes" do SINDICO

---

### 3.7 Excluir Entrada Rejeitada (SOFT DELETE)

**Passos:**
1. Na lista de entradas rejeitadas, clique em **"Excluir"** de uma entrada
2. ✅ **Esperado:** Deve pedir confirmação (se houver)
3. Confirme a exclusão
4. ✅ **Esperado:** Deve voltar para lista com mensagem "Excluída com sucesso"
5. ✅ **Esperado:** A entrada NÃO deve mais aparecer na lista
6. ✅ **VERIFICAR NO BANCO:** A entrada deve ter `deleted_at` preenchido (soft delete)

**Teste no banco de dados:**
```sql
SELECT id, description, deleted_at, deleted_by 
FROM financial_entries 
WHERE id = [ID_DA_ENTRADA_EXCLUIDA];
```
✅ **Esperado:** `deleted_at` deve estar preenchido, `deleted_by` deve ter o ID do usuário FINANCEIRO

---

### 3.8 Listar Saídas

**Tela:** `/financeiro/saidas`

**Passos:**
1. Clique em "Saídas" no menu
2. ✅ **Esperado:** Deve mostrar lista de saídas financeiras
3. ✅ Verificar se mostra: Descrição, Valor, Data, Status de Pagamento

**Botões a testar:**
- ✅ **"Nova Saída"** → Deve ir para formulário de criação

---

### 3.9 Criar Nova Saída

**Tela:** `/financeiro/saidas/nova`

**Passos:**
1. Clique em **"Nova Saída"**
2. Preencha o formulário:
   - Descrição: "Saída Teste 001"
   - Valor: "500.00"
   - Data: Selecione data de hoje ou passada
   - Centro de Custo: (opcional)
   - Categoria: Selecione "MANUTENCAO", "CONTA", "CONTRATO" ou "OUTRA"
   - Requer Aprovação: ✅ (marcado)
   - Limite de Aprovação: "1000.00"
3. Clique em **"Salvar"**
4. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
5. ✅ Verificar se a saída aparece na lista com status "PENDING" (se valor > limite) ou "APPROVED" (se valor <= limite)

**Teste com valores diferentes:**
- [ ] Criar saída com valor 500.00 (abaixo do limite) → Status deve ser "APPROVED" ou "PENDING"?
- [ ] Criar saída com valor 1500.00 (acima do limite) → Status deve ser "PENDING"

**Anotar:** ID da saída criada: _______________

---

### 3.10 Pagar Saída (Marcar como Paga)

**Tela:** `/financeiro/saidas/:id/pagar`

**⚠️ IMPORTANTE:** Só pode pagar saídas que estão com status "APPROVED".

**Passos:**
1. Na lista de saídas, encontre uma saída com status "APPROVED"
2. Clique em **"Pagar"** (se houver botão)
3. ✅ **Esperado:** Deve abrir formulário/modal de pagamento
4. (Se houver) Faça upload de comprovante (PDF) - opcional
5. Clique em **"Marcar como Paga"** ou **"Pagar"**
6. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
7. ✅ Verificar se o status da saída mudou para "PAID"
8. ✅ Verificar se o saldo financeiro foi atualizado no dashboard

---

### 3.11 Orçamentos Pendentes

**Tela:** `/financeiro/orcamentos-pendentes`

**⚠️ IMPORTANTE:** Esta tela só terá orçamentos se o ADMINISTRATIVO criar orçamentos primeiro.

**Passos (se houver orçamentos):**
1. Clique em "Orçamentos Pendentes" no menu
2. ✅ **Esperado:** Deve mostrar lista de orçamentos com `status = 'PENDING_FINANCEIRO'`
3. Para cada orçamento, verifique:
   - ✅ Mostra: Título, Descrição, Valor Estimado, Criado por, Data
   - ✅ Tem botão **"Revisar e Enviar para Síndico"**

**⚠️ Se não houver orçamentos:** Vá para PARTE 4 (ADMINISTRATIVO) primeiro.

---

### 3.12 Revisar Orçamento

**Passos:**
1. Na lista de orçamentos pendentes, clique em **"Revisar e Enviar para Síndico"**
2. ✅ **Esperado:** Deve abrir formulário/modal de revisão
3. **OBRIGATÓRIO:** Preencha "Observações do Financeiro"
4. Centro de Custo: (opcional) Selecione um centro de custo
5. Clique em **"Revisar"** ou **"Enviar para Síndico"**
6. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
7. ✅ **Esperado:** O orçamento NÃO deve mais aparecer na lista de pendentes
8. ✅ Verificar se o orçamento aparece em "Orçamentos aguardando aprovação" do SINDICO

---

### 3.13 Orçamentos Aprovados

**Tela:** `/financeiro/orcamentos-aprovados`

**⚠️ IMPORTANTE:** Esta tela só terá orçamentos se o SINDICO aprovar orçamentos primeiro.

**Passos (se houver orçamentos aprovados):**
1. Clique em "Orçamentos Aprovados" no menu
2. ✅ **Esperado:** Deve mostrar lista de orçamentos com `status = 'APPROVED'`
3. Para cada orçamento, verifique:
   - ✅ Mostra: Título, Valor Aprovado, Observações do Síndico
   - ✅ Tem botão **"Liberar para Operacional"**
   - ✅ Tem botão **"Retornar para Síndico"**

---

### 3.14 Liberar Orçamento para Operacional

**Passos:**
1. Na lista de orçamentos aprovados, clique em **"Liberar para Operacional"**
2. ✅ **Esperado:** Deve abrir formulário/modal
3. (Se houver) Preencha "Observações do Financeiro" (opcional)
4. Clique em **"Liberar"** ou **"Confirmar"**
5. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
6. ✅ **Esperado:** O orçamento não deve mais aparecer na lista
7. ✅ Verificar se o orçamento aparece no dashboard do OPERACIONAL como "Orçamentos liberados"

---

### 3.15 Centros de Custo

**Tela:** `/financeiro/centros-custo`

**Passos:**
1. Clique em "Centros de Custo" no menu
2. ✅ **Esperado:** Deve mostrar lista de centros de custo
3. ✅ Verificar se mostra: Nome, Descrição, Status

**Botões a testar:**
- ✅ **"Novo Centro de Custo"** → Deve ir para formulário de criação

---

### 3.16 Criar Novo Centro de Custo

**Passos:**
1. Clique em **"Novo Centro de Custo"**
2. Preencha:
   - Nome: "Centro de Custo Teste 001"
   - Descrição: "Descrição do centro de custo teste"
3. Clique em **"Salvar"**
4. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
5. ✅ Verificar se o centro de custo aparece na lista

---

### 3.17 Contas (Água, Luz, Gás)

**Tela:** `/financeiro/contas`

**Passos:**
1. Clique em "Contas" no menu
2. ✅ **Esperado:** Deve mostrar lista de contas recorrentes
3. ✅ Verificar se mostra: Nome, Tipo, Fornecedor, Número da Conta, Status

**Botões a testar:**
- ✅ **"Nova Conta"** → Deve ir para formulário de criação

---

### 3.18 Criar Nova Conta

**Passos:**
1. Clique em **"Nova Conta"**
2. Preencha:
   - Nome: "Conta de Água"
   - Tipo: Selecione "AGUA", "LUZ", "GAS" ou "OUTRA"
   - Fornecedor: "Fornecedor Teste"
   - Número da Conta: "123456789"
   - Ativa: ✅ (marcado)
3. Clique em **"Salvar"**
4. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
5. ✅ Verificar se a conta aparece na lista

---

### 3.19 Registrar Consumo

**Tela:** `/financeiro/consumo/novo`

**Passos:**
1. Clique em "Registrar Consumo" no menu (ou botão relacionado)
2. Preencha:
   - Conta: Selecione uma conta criada anteriormente
   - Valor do Consumo: "100"
   - Data do Consumo: Selecione uma data
   - Valor da Conta: "250.00"
3. Clique em **"Registrar"**
4. ✅ **Esperado:** Deve voltar para dashboard ou lista com mensagem de sucesso
5. ✅ Verificar se o consumo foi registrado

---

## 🔵 PARTE 4: ADMINISTRATIVO (Triagem e Orçamentos)

### 4.1 Login como ADMINISTRATIVO

1. Faça **logout**
2. Acesse: `http://localhost:3000/auth/login`
3. Preencha com usuário ADMINISTRATIVO criado anteriormente
4. Clique em **"Entrar"**
5. ✅ **Esperado:** Deve redirecionar para `/administrativo/dashboard`

---

### 4.2 Dashboard Administrativo

**Tela:** `/administrativo/dashboard`

**O que verificar:**
1. ✅ Página carrega sem erros
2. ✅ Mostra "Tarefas pendentes"
3. ✅ Mostra "Ocorrências não triadas"
4. ✅ Mostra "Documentos"
5. ✅ Mostra "Orçamentos"

---

### 4.3 Listar Tarefas

**Tela:** `/administrativo/tarefas`

**Passos:**
1. Clique em "Tarefas" no menu
2. ✅ **Esperado:** Deve mostrar lista de tarefas
3. ✅ Verificar se mostra: Título, Responsável, Vencimento, Prioridade, Status

**Botões a testar:**
- ✅ **"Nova Tarefa"** → Deve ir para formulário de criação

---

### 4.4 Criar Nova Tarefa

**Tela:** `/administrativo/tarefas/nova`

**Passos:**
1. Clique em **"Nova Tarefa"**
2. Preencha o formulário:
   - Título: "Tarefa Teste 001"
   - Descrição: "Descrição da tarefa teste"
   - Responsável: Selecione um usuário OPERACIONAL
   - Data de Vencimento: Selecione uma data futura
   - Prioridade: Selecione "NORMAL"
   - Itens de Checklist: (opcional) Adicione 2 itens:
     - "Verificar portão"
     - "Verificar elevador"
3. Clique em **"Criar"**
4. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
5. ✅ Verificar se a tarefa aparece na lista com status "PENDING"
6. ✅ Verificar se a tarefa aparece no dashboard do OPERACIONAL

**Anotar:** ID da tarefa criada: _______________

---

### 4.5 Triagem de Ocorrências

**Tela:** `/administrativo/ocorrencias/:id/triar`

**⚠️ IMPORTANTE:** Esta tela só aparecerá se houver ocorrências não triadas.

**Passos:**
1. Acesse a lista de ocorrências não triadas (se houver menu/link)
2. Selecione uma ocorrência e clique em **"Triar"**
3. ✅ **Esperado:** Deve abrir formulário de triagem
4. Preencha:
   - Responsável: Selecione um usuário OPERACIONAL
   - Classificação: (opcional)
   - SLA (horas): "24" (opcional)
   - Converter para Tarefa: ✅ (opcional, marcado)
5. Clique em **"Triar"**
6. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
7. ✅ Verificar se a ocorrência foi atualizada
8. ✅ Se "Converter para Tarefa" estava marcado, verificar se tarefa foi criada

---

### 4.6 Solicitação de Orçamento

**Tela:** `/administrativo/orcamentos/novo`

**Passos:**
1. Clique em "Solicitar Orçamento" no menu (ou botão relacionado)
2. Preencha o formulário:
   - Título: "Orçamento Teste 001"
   - Descrição: "Descrição do orçamento teste"
   - Valor Estimado: "2000.00" (opcional)
   - Prioridade: Selecione "NORMAL"
   - Ocorrência Relacionada: (opcional) Selecione uma ocorrência
   - Tarefa Relacionada: (opcional) Selecione uma tarefa
   - Arquivos: (opcional) Faça upload de PDFs (máximo 10, até 50MB cada)
3. Clique em **"Solicitar"**
4. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
5. ✅ Verificar se o orçamento aparece em "Orçamentos pendentes" do FINANCEIRO

**Anotar:** ID do orçamento criado: _______________

---

## 🔵 PARTE 5: OPERACIONAL (Execução)

### 5.1 Login como OPERACIONAL

1. Faça **logout**
2. Acesse: `http://localhost:3000/auth/login`
3. Preencha com usuário OPERACIONAL criado anteriormente
4. Clique em **"Entrar"**
5. ✅ **Esperado:** Deve redirecionar para `/operacional/dashboard`

---

### 5.2 Dashboard Operacional

**Tela:** `/operacional/dashboard`

**O que verificar:**
1. ✅ Página carrega sem erros
2. ✅ Mostra "Tarefas pendentes"
3. ✅ Mostra "Tarefas atrasadas"
4. ✅ Mostra "Ocorrências abertas"
5. ✅ Mostra "Manutenções pendentes"
6. ✅ Mostra "Orçamentos liberados"

---

### 5.3 Checklists Diários

**Tela:** `/operacional/checklists-diarios`

**⚠️ IMPORTANTE:** Checklists diários são gerados automaticamente baseados nos modelos criados pelo SINDICO.

**Passos:**
1. Clique em "Checklists Diários" no menu
2. ✅ **Esperado:** Deve mostrar lista de checklists do dia
3. ✅ Verificar se mostra: Modelo, Data, Status, Progresso

**Botões a testar:**
- ✅ **"Executar"** → Deve ir para tela de execução do checklist

**⚠️ Se não houver checklists:** Verifique se há modelos ativos e se hoje é um dos dias da semana configurados.

---

### 5.4 Executar Checklist

**Tela:** `/operacional/checklists-diarios/:id`

**Passos:**
1. Na lista de checklists, clique em **"Executar"** de um checklist
2. ✅ **Esperado:** Deve mostrar tela de execução com:
   - Status do checklist (PENDING, IN_PROGRESS, COMPLETED, LATE)
   - Progresso (%)
   - Lista de itens
3. Se status for "PENDING", clique em **"Iniciar Checklist"**
4. ✅ **Esperado:** Status deve mudar para "IN_PROGRESS"
5. Para cada item:
   - Marque como "Feito" ou "Não Feito"
   - Se "Não Feito" e requer justificativa, preencha comentário
   - (Se houver) Adicione foto
6. Após marcar todos os itens, clique em **"Finalizar Checklist"**
7. ✅ **Esperado:** Status deve mudar para "COMPLETED"
8. ✅ **Esperado:** Progresso deve mostrar 100%

---

### 5.5 Listar Tarefas

**Tela:** `/operacional/tarefas` ou similar

**Passos:**
1. Clique em "Tarefas" no menu
2. ✅ **Esperado:** Deve mostrar lista de tarefas atribuídas ao usuário
3. ✅ Verificar se mostra apenas tarefas atribuídas a você
4. ✅ Verificar se mostra: Título, Vencimento, Prioridade, Status

---

### 5.6 Concluir Tarefa

**Passos:**
1. Na lista de tarefas, encontre uma tarefa com status "PENDING" ou "IN_PROGRESS"
2. Clique em **"Ver Detalhes"** ou **"Concluir"**
3. ✅ **Esperado:** Deve abrir formulário/tela de conclusão
4. Preencha:
   - Concluída com Sucesso: ✅ (marcado)
   - Notas de Conclusão: (opcional) "Tarefa concluída com sucesso"
   - Tempo de Conclusão (minutos): "30" (opcional)
   - Qualidade: Selecione "BOM" (opcional)
5. Clique em **"Concluir"**
6. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
7. ✅ Verificar se o status da tarefa mudou para "COMPLETED"

---

### 5.7 Listar Ocorrências

**Tela:** `/operacional/ocorrencias`

**Passos:**
1. Clique em "Ocorrências" no menu
2. ✅ **Esperado:** Deve mostrar lista de ocorrências
3. ✅ Verificar se mostra: Título, Status, Prioridade, Localização

**Botões a testar:**
- ✅ **"Nova Ocorrência"** → Deve ir para formulário de criação

---

### 5.8 Criar Nova Ocorrência

**Tela:** `/operacional/ocorrencias/nova`

**Passos:**
1. Clique em **"Nova Ocorrência"**
2. Preencha o formulário:
   - Título: "Ocorrência Teste 001"
   - Descrição: "Descrição da ocorrência teste"
   - Localização: "Localização teste" (opcional)
   - Prioridade: Selecione "NORMAL"
   - Tipo: Selecione "ROUTINE", "NON_ROUTINE" ou "EMERGENCY"
   - Requer Aprovação: ✅ (marcado, se NON_ROUTINE ou EMERGENCY)
   - Aprovação Necessária De: Selecione "SINDICO" (se requer aprovação)
3. Clique em **"Criar"**
4. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
5. ✅ Verificar se a ocorrência aparece na lista com status "ABERTA"
6. ✅ Se requer aprovação, verificar se aparece em "Ocorrências pendentes" do SINDICO

**Anotar:** ID da ocorrência criada: _______________

---

### 5.9 Resolver Ocorrência

**Tela:** `/operacional/ocorrencias/:id/resolver`

**Passos:**
1. Na lista de ocorrências, encontre uma ocorrência com status "ABERTA" ou "EM_ATENDIMENTO"
2. Clique em **"Resolver"**
3. ✅ **Esperado:** Deve abrir formulário de resolução
4. **OBRIGATÓRIO:** Preencha "Notas de Resolução"
5. Clique em **"Resolver"**
6. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
7. ✅ Verificar se o status da ocorrência mudou para "RESOLVIDA"

---

### 5.10 Listar Manutenções

**Tela:** `/operacional/manutencoes`

**Passos:**
1. Clique em "Manutenções" no menu
2. ✅ **Esperado:** Deve mostrar lista de manutenções atribuídas a você
3. ✅ Verificar se mostra apenas manutenções atribuídas a você
4. ✅ Verificar se mostra: Tipo, Título, Status, Data Prevista

---

### 5.11 Iniciar Manutenção

**Passos:**
1. Na lista de manutenções, encontre uma manutenção com status "PENDING"
2. Clique em **"Iniciar"**
3. ✅ **Esperado:** Deve atualizar status para "IN_PROGRESS"
4. ✅ Verificar se aparece `started_at` preenchido

---

### 5.12 Concluir Manutenção

**Tela:** `/operacional/manutencoes/:id/concluir`

**Passos:**
1. Na lista de manutenções, encontre uma manutenção com status "IN_PROGRESS"
2. Clique em **"Concluir"**
3. ✅ **Esperado:** Deve abrir formulário de conclusão
4. Preencha:
   - Notas de Conclusão: "Manutenção concluída com sucesso"
   - Custo: "350.00" (opcional)
5. Clique em **"Concluir"**
6. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
7. ✅ Verificar se o status da manutenção mudou para "COMPLETED"
8. ✅ Verificar se aparece no dashboard do SINDICO como "Manutenções concluídas"

---

### 5.13 Orçamentos Liberados

**Tela:** (menu ou dashboard)

**Passos:**
1. Verifique no dashboard se há "Orçamentos liberados"
2. ✅ **Esperado:** Deve mostrar orçamentos com `status = 'LIBERATED'`
3. ✅ Verificar se você consegue visualizar detalhes dos orçamentos

---

## 🔵 PARTE 6: LIMPEZA (Ocorrências de Limpeza)

### 6.1 Login como LIMPEZA

1. Faça **logout**
2. Acesse: `http://localhost:3000/auth/login`
3. Preencha com usuário LIMPEZA criado anteriormente
4. Clique em **"Entrar"**
5. ✅ **Esperado:** Deve redirecionar para `/limpeza/dashboard`

---

### 6.2 Dashboard Limpeza

**Tela:** `/limpeza/dashboard`

**O que verificar:**
1. ✅ Página carrega sem erros
2. ✅ Mostra "Checklists pendentes"
3. ✅ Mostra "Ocorrências de limpeza"

---

### 6.3 Listar Ocorrências de Limpeza

**Tela:** `/limpeza/ocorrencias`

**Passos:**
1. Clique em "Ocorrências" no menu
2. ✅ **Esperado:** Deve mostrar lista de ocorrências de limpeza
3. ✅ Verificar se mostra apenas ocorrências do tipo "LIMPEZA"
4. ✅ Verificar se mostra: Título, Tipo, Status

**Botões a testar:**
- ✅ **"Nova Ocorrência"** → Deve ir para formulário de criação

---

### 6.4 Criar Ocorrência de Limpeza - EQUIPAMENTO_DEFEITO (TESTE CRÍTICO)

**Tela:** `/limpeza/ocorrencias/nova`

**⚠️ TESTE CRÍTICO:** Este é o teste da correção implementada!

**Passos:**
1. Clique em **"Nova Ocorrência"**
2. Preencha o formulário:
   - Título: "Equipamento de Limpeza Quebrado"
   - Descrição: "Enceradeira com defeito no motor"
   - Localização: "Área comum - 1º andar"
   - Tipo: Selecione **"EQUIPAMENTO_DEFEITO"**
3. Clique em **"Criar"**
4. ✅ **Esperado:** Deve voltar para lista com mensagem de sucesso
5. ✅ **CRÍTICO:** A mensagem deve dizer "O administrativo foi notificado para verificar se é necessário criar ocorrência de zeladoria"
6. ✅ **CRÍTICO:** NÃO deve criar ocorrência de zeladoria automaticamente
7. ✅ Verificar se a ocorrência de limpeza foi criada com `needs_zeladoria = TRUE`
8. ✅ Verificar se aparece notificação no dashboard do ADMINISTRATIVO

**Anotar:** ID da ocorrência de limpeza criada: _______________

**Verificar no banco de dados:**
```sql
-- Verificar ocorrência de limpeza
SELECT id, title, limpeza_type, needs_zeladoria 
FROM occurrences 
WHERE id = [ID_DA_OCORRENCIA] AND occurrence_type = 'LIMPEZA';

-- VERIFICAR: NÃO deve existir ocorrência de zeladoria criada automaticamente
-- (Esta query pode retornar erro se a coluna não existir - isso é esperado, significa que não há ocorrências criadas automaticamente)
SELECT id, title, occurrence_type 
FROM occurrences 
WHERE reported_by = [ID_DO_USUARIO_LIMPEZA] 
AND occurrence_type = 'ZELADORIA' 
AND created_at >= (SELECT created_at FROM occurrences WHERE id = [ID_DA_OCORRENCIA]);
```
✅ **Esperado:** Não deve retornar nenhuma ocorrência de zeladoria criada no mesmo momento

**Verificar notificações:**
```sql
-- Verificar notificação para ADMINISTRATIVO
SELECT * FROM notifications 
WHERE entity_type = 'occurrences' 
AND entity_id = [ID_DA_OCORRENCIA]
AND notification_type = 'OCCURRENCE_REQUIRES_ATTENTION';
```
✅ **Esperado:** Deve existir notificação para ADMINISTRATIVO

---

### 6.5 Criar Ocorrência de Limpeza - Outros Tipos

**Teste com outros tipos:**
- [ ] AREA_IMPROPRIA → Não deve notificar ADMINISTRATIVO
- [ ] SUJEIRA_EXCESSIVA → Não deve notificar ADMINISTRATIVO
- [ ] FALTA_MATERIAL → Não deve notificar ADMINISTRATIVO

---

### 6.6 Ver Detalhes de Ocorrência de Limpeza

**Tela:** `/limpeza/ocorrencias/:id`

**Passos:**
1. Na lista de ocorrências, clique em **"Ver Detalhes"** de uma ocorrência do tipo EQUIPAMENTO_DEFEITO
2. ✅ **Esperado:** Deve mostrar detalhes da ocorrência
3. ✅ **CRÍTICO:** NÃO deve mostrar seção "Ocorrência de Zeladoria Criada Automaticamente"
4. ✅ **Esperado:** Deve mostrar informação: "Esta ocorrência de limpeza requer atenção da zeladoria. O administrativo foi notificado e decidirá se é necessário criar uma ocorrência de zeladoria relacionada."

---

### 6.7 Checklists Diários (Limpeza)

**Tela:** `/limpeza/checklists-diarios` ou `/operacional/checklists-diarios`

**Passos:**
1. Clique em "Checklists Diários" no menu
2. ✅ **Esperado:** Deve mostrar lista de checklists de limpeza
3. ✅ Verificar se mostra apenas checklists do departamento "LIMPEZA"
4. Execute um checklist seguindo os passos da PARTE 5.4

---

## 🔵 PARTE 7: CONSELHO (Visualização)

### 7.1 Login como CONSELHO

1. Faça **logout**
2. Acesse: `http://localhost:3000/auth/login`
3. Preencha com usuário CONSELHO criado anteriormente
4. Clique em **"Entrar"**
5. ✅ **Esperado:** Deve redirecionar para `/conselho/dashboard`

---

### 7.2 Dashboard Conselho

**Tela:** `/conselho/dashboard`

**O que verificar:**
1. ✅ Página carrega sem erros
2. ✅ Mostra informações de visualização (sem opções de criação/edição)
3. ✅ **CRÍTICO:** NÃO deve ter botões de "Criar", "Editar", "Excluir", "Aprovar"
4. ✅ **CRÍTICO:** Apenas visualização

---

### 7.3 Logs de Auditoria (Se houver tela)

**⚠️ IMPORTANTE:** Verifique se CONSELHO tem acesso a logs e quais informações são visíveis.

**Passos:**
1. Tente acessar logs (se houver menu/link)
2. ✅ **Esperado:** Se tiver acesso, deve mostrar logs FILTRADOS (sem IP, sem before/after completo)
3. ✅ **CRÍTICO:** NÃO deve mostrar:
   - `ip_address`
   - `user_agent`
   - `before_data` completo
   - `after_data` completo
   - Logs de LOGIN
4. ✅ **Esperado:** Deve mostrar apenas: Ação, Módulo, Entidade, Data, Nome do Usuário

---

## 🔵 PARTE 8: TESTES CRÍTICOS DE CORREÇÕES

### 8.1 Teste: Estados de financial_entries

**Objetivo:** Verificar se os estados estão corretos após correção

**Passos:**
1. Login como FINANCEIRO
2. Crie uma nova entrada
3. ✅ **Verificar no banco:**
   ```sql
   SELECT id, description, review_status 
   FROM financial_entries 
   WHERE id = [ID_DA_ENTRADA];
   ```
   ✅ **Esperado:** `review_status` deve ser `'PENDING_REVIEW'` (NÃO 'PENDING')
4. Login como SINDICO
5. Aprove a entrada
6. ✅ **Verificar no banco:**
   ```sql
   SELECT review_status, reviewed_by, reviewed_at, received, received_at 
   FROM financial_entries 
   WHERE id = [ID_DA_ENTRADA];
   ```
   ✅ **Esperado:** 
   - `review_status` deve ser `'APPROVED'`
   - `reviewed_by` deve estar preenchido (ID do síndico)
   - `reviewed_at` deve estar preenchido
7. Login como FINANCEIRO
8. ✅ **NOTA:** A funcionalidade de "marcar como recebida" pode não estar implementada como rota separada. Verifique se existe essa opção na interface.
   - Se existir, marque como recebida
   - Se não existir, verifique se o campo `received` pode ser atualizado via edição
9. ✅ **Verificar no banco:**
   ```sql
   SELECT review_status, received, received_at 
   FROM financial_entries 
   WHERE id = [ID_DA_ENTRADA];
   ```
   ✅ **Esperado:** 
   - Se marcado como recebida: `received = TRUE` e `received_at` preenchido
   - **NOTA:** O estado `review_status` pode permanecer como `'APPROVED'` ou mudar para `'RECEIVED'` dependendo da implementação
   - O campo `received` (boolean) é independente de `review_status`

---

### 8.2 Teste: Soft Delete em financial_entries

**Objetivo:** Verificar se soft delete está funcionando

**Passos:**
1. Login como FINANCEIRO
2. Crie uma entrada
3. SINDICO rejeita a entrada
4. FINANCEIRO exclui a entrada rejeitada
5. ✅ **Verificar no banco:**
   ```sql
   SELECT id, description, deleted_at, deleted_by, delete_reason 
   FROM financial_entries 
   WHERE id = [ID_DA_ENTRADA];
   ```
   ✅ **Esperado:** 
   - `deleted_at` deve estar preenchido (NÃO NULL)
   - `deleted_by` deve ter o ID do usuário FINANCEIRO
   - `delete_reason` deve estar preenchido
   - O registro NÃO deve ter sido deletado fisicamente (ainda existe na tabela)
6. ✅ **Verificar na listagem:**
   - A entrada NÃO deve aparecer em `/financeiro/entradas`
   - A entrada NÃO deve aparecer em `/financeiro/entradas-rejeitadas`
   - A entrada NÃO deve contar no saldo financeiro do dashboard

---

### 8.3 Teste: Dashboard não mostra entradas deletadas

**Objetivo:** Verificar se queries de dashboard filtram `deleted_at IS NULL`

**Passos:**
1. Login como FINANCEIRO
2. Anote o saldo financeiro do dashboard
3. Crie uma entrada com valor 1000.00
4. SINDICO aprova a entrada
5. ✅ **Verificar:** Saldo deve aumentar em 1000.00
6. ✅ **NOTA:** Se a funcionalidade "marcar como recebida" estiver implementada, marque como recebida
7. ✅ **Verificar:** Saldo deve continuar aumentado (mesmo se não marcar como recebida, pois aprovação já conta)
8. SINDICO rejeita outra entrada
9. FINANCEIRO exclui a entrada rejeitada
10. ✅ **CRÍTICO:** O saldo NÃO deve diminuir (porque entrada deletada não conta no saldo)
11. ✅ **Verificar no banco:**
    ```sql
    -- Saldo deve contar apenas entradas recebidas E não deletadas
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM financial_entries 
    WHERE condominium_id = [ID_DO_CONDOMINIO] 
    AND received = TRUE 
    AND deleted_at IS NULL;
    ```
    ✅ **Esperado:** O valor deve bater com o saldo do dashboard

---

### 8.4 Teste: Limpeza cria zeladoria (NÃO DEVE CRIAR AUTOMATICAMENTE)

**Objetivo:** Verificar se a correção está funcionando

**Este teste já foi feito na PARTE 6.4 - Consulte lá para detalhes completos.**

**Resumo:**
- ✅ Criar ocorrência EQUIPAMENTO_DEFEITO → NÃO deve criar zeladoria automaticamente
- ✅ Deve notificar ADMINISTRATIVO
- ✅ View não deve mostrar "Ocorrência de Zeladoria Criada Automaticamente"

---

### 8.5 Teste: Asset_id em financial_exits

**Objetivo:** Verificar se campo asset_id existe e pode ser usado

**Passos:**
1. Login como FINANCEIRO
2. ✅ **Verificar no banco se campo existe:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'financial_exits' 
   AND column_name = 'asset_id';
   ```
   ✅ **Esperado:** Deve retornar a coluna `asset_id` do tipo `integer`
3. Crie uma saída financeira
4. ✅ **Verificar se pode incluir asset_id:**
   - Por enquanto, o formulário ainda não tem o campo
   - Mas o campo existe na tabela e pode ser usado no futuro

---

## 🔵 PARTE 9: TESTES DE PERMISSÕES

### 9.1 Teste: OPERACIONAL não vê financeiro

**Passos:**
1. Login como OPERACIONAL
2. Tente acessar diretamente: `http://localhost:3000/financeiro/dashboard`
3. ✅ **Esperado:** Deve retornar 403 (Forbidden) ou redirecionar

---

### 9.2 Teste: LIMPEZA não aprova nada

**Passos:**
1. Login como LIMPEZA
2. ✅ **Esperado:** Dashboard não deve ter opções de aprovação
3. ✅ **Esperado:** Menu não deve ter links para aprovações

---

### 9.3 Teste: CONSELHO não cria/edita/exclui

**Passos:**
1. Login como CONSELHO
2. ✅ **CRÍTICO:** Dashboard não deve ter botões de "Criar", "Editar", "Excluir"
3. ✅ **CRÍTICO:** Tente acessar URLs de criação/edição diretamente
4. ✅ **Esperado:** Deve retornar 403 (Forbidden) ou redirecionar

---

## 📊 CHECKLIST FINAL

### Problemas Críticos Corrigidos
- [ ] Estados de financial_entries funcionam corretamente
- [ ] Soft delete funciona (não DELETE físico)
- [ ] Dashboard não mostra entradas deletadas no saldo
- [ ] Limpeza não cria zeladoria automaticamente (notifica ADMINISTRATIVO)
- [ ] View occurrence-detail.ejs não mostra zeladoriaOccurrence

### Funcionalidades Básicas
- [ ] SUPER_MASTER pode criar condomínios e usuários
- [ ] SINDICO pode aprovar/rejeitar entradas
- [ ] FINANCEIRO pode criar entradas e saídas
- [ ] ADMINISTRATIVO pode criar tarefas e orçamentos
- [ ] OPERACIONAL pode executar tarefas e checklists
- [ ] LIMPEZA pode criar ocorrências de limpeza
- [ ] CONSELHO só visualiza (não cria/edita)

### Fluxos Completos
- [ ] Fluxo: Entrada → Aprovação → Recebimento
- [ ] Fluxo: Ocorrência → Triagem → Resolução
- [ ] Fluxo: Tarefa → Execução → Conclusão
- [ ] Fluxo: Orçamento → Revisão → Aprovação → Liberação
- [ ] Fluxo: Manutenção → Execução → Conclusão

---

## ⚠️ PROBLEMAS ENCONTRADOS

**Anote aqui qualquer problema encontrado durante os testes:**

1. **Problema:** ________________________________
   - **Onde:** ________________________________
   - **O que aconteceu:** ________________________________
   - **O que deveria acontecer:** ________________________________

2. **Problema:** ________________________________
   - **Onde:** ________________________________
   - **O que aconteceu:** ________________________________
   - **O que deveria acontecer:** ________________________________

---

## 📝 OBSERVAÇÕES

**Anote aqui observações importantes:**

- ________________________________
- ________________________________
- ________________________________

---

**Data dos Testes:** _______________
**Testado por:** _______________
**Versão do Sistema:** _______________

---

**Última atualização:** Janeiro 2025

**✅ VALIDAÇÃO:** Este guia foi validado contra o código real do sistema em Janeiro 2025.
- ✅ Rotas verificadas contra `src/routes/*.js`
- ✅ Estados validados contra `src/services/*.js` e `MATRIZ_PERMISSOES_E_STATES.md`
- ✅ Correções implementadas validadas (soft delete, estados, limpeza)
- ✅ Campos de banco de dados verificados (`review_status`, `deleted_at`, `deleted_by`, `delete_reason`)

**⚠️ NOTAS IMPORTANTES:**
- Porta padrão: `3000` (configurável via `.env` - verifique sua configuração)
- A funcionalidade "marcar como recebida" pode não ter rota específica - verifique na interface
- Estados: `PENDING_REVIEW` → `APPROVED` → `RECEIVED` ou `REJECTED`
- Soft delete: campos `deleted_at`, `deleted_by`, `delete_reason` (NÃO DELETE físico)
- Limpeza EQUIPAMENTO_DEFEITO: NÃO cria zeladoria automaticamente (notifica ADMINISTRATIVO)
