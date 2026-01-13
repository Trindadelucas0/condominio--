# ✅ CHECKLIST DE CORREÇÕES

**Data de Criação:** Janeiro 2025  
**Status:** Aguardando Implementação

---

## 📋 INSTRUÇÕES

- [ ] Marque cada item conforme for implementando
- [ ] Teste cada correção isoladamente antes de marcar como completo
- [ ] Anote problemas encontrados durante a implementação
- [ ] Siga a ordem de prioridade (ALTA → MÉDIA → BAIXA)

---

## 🔴 FASE 1: CORREÇÕES DE ALTA PRIORIDADE

### 1.1 CONDOMÍNIOS - Filtro Ativo/Inativo

- [ ] **Arquivo:** `src/services/masterService.js`
  - [ ] Modificar função `listCondominios()` para filtrar `WHERE active = TRUE`
  - [ ] Adicionar parâmetro opcional para listar inativos se necessário

- [ ] **Arquivo:** `views/master/condominios/list.ejs`
  - [ ] Adicionar filtro/checkbox para visualizar inativos (opcional)

- [ ] **Teste:**
  - [ ] Criar condomínio e marcar como inativo
  - [ ] Verificar que não aparece na listagem padrão
  - [ ] Verificar que aparece quando filtra inativos

---

### 1.2 USUÁRIOS - Corrigir [object Object] nos Perfis

- [ ] **Arquivo:** `src/services/masterService.js`
  - [ ] Modificar função `listUsuarios()` linha ~167-178
  - [ ] Alterar query para retornar array de strings: `json_agg(DISTINCT r.name)`
  - [ ] OU processar resultado para extrair nomes antes de retornar

- [ ] **Arquivo:** `views/master/usuarios/list.ejs`
  - [ ] Se necessário, modificar linha 68-72 para acessar `role.name` se ainda for objeto

- [ ] **Teste:**
  - [ ] Listar usuários
  - [ ] Verificar que perfis aparecem como strings (ex: "SINDICO", "FINANCEIRO")
  - [ ] Não deve aparecer [object Object]

---

### 1.3 SÍNDICO - Saldo não atualiza ao aprovar entrada

- [ ] **Arquivo:** `src/services/sindicoService.js` ou `financeiroService.js`
  - [ ] Localizar função de aprovar entrada financeira
  - [ ] Verificar se atualiza `received = TRUE` e `received_at` ao aprovar
  - [ ] Se não, adicionar atualização desses campos

- [ ] **Arquivo:** `src/services/sindicoService.js`
  - [ ] Verificar função `getDashboardStats()` linha ~54-76
  - [ ] Confirmar que cálculo de saldo usa `received = TRUE AND deleted_at IS NULL`

- [ ] **Teste:**
  - [ ] Criar entrada como FINANCEIRO
  - [ ] Aprovar como SINDICO
  - [ ] Verificar que saldo aumenta no dashboard do síndico
  - [ ] Verificar que entrada aparece como aprovada/recebida

---

### 1.4 SÍNDICO - Orçamentos não aparecem no dashboard

- [ ] **Arquivo:** `src/services/sindicoService.js`
  - [ ] Verificar que `getDashboardStats()` busca `pendingBudgets` (linha ~103-109)
  - [ ] Confirmar que está retornando no objeto de stats

- [ ] **Arquivo:** `views/sindico/dashboard.ejs`
  - [ ] Adicionar card para "Orçamentos Aguardando Aprovação"
  - [ ] Mostrar contador: `<%= stats.pendingBudgets %>`
  - [ ] Adicionar link para rota de orçamentos

- [ ] **Arquivo:** `src/controllers/sindicoController.js`
  - [ ] Criar rota `GET /sindico/orcamentos-pendentes` se não existir
  - [ ] Criar view `views/sindico/orcamentos-pendentes.ejs`

- [ ] **Teste:**
  - [ ] Criar orçamento como ADMINISTRATIVO
  - [ ] FINANCEIRO revisar e enviar para síndico
  - [ ] Verificar que aparece no dashboard do síndico
  - [ ] Verificar que pode clicar e ver detalhes

---

### 1.5 SÍNDICO - Entradas pendentes em formato card

- [ ] **Arquivo:** Verificar se existe rota `/sindico/entradas-pendentes`
  - [ ] Se não existe, criar no `sindicoController.js`
  - [ ] Criar função `showEntradasPendentes()`

- [ ] **Arquivo:** `src/services/sindicoService.js`
  - [ ] Criar função `listPendingEntries()` que busca entradas com `review_status = 'PENDING_REVIEW'`

- [ ] **Arquivo:** Criar view `views/sindico/entradas-pendentes.ejs`
  - [ ] Layout em formato de cards (não tabela)
  - [ ] Cada card mostra: descrição, valor, data, categoria
  - [ ] Botões "Aprovar" e "Rejeitar" em cada card

- [ ] **Teste:**
  - [ ] Acessar `/sindico/entradas-pendentes`
  - [ ] Verificar layout em cards
  - [ ] Verificar que pode aprovar/rejeitar

---

### 1.6 SÍNDICO - Notificações não mostram detalhes

- [ ] **Arquivo:** Verificar tabela `notifications`
  - [ ] Confirmar estrutura: `entity_type`, `entity_id`

- [ ] **Arquivo:** Verificar rota de notificações
  - [ ] Criar rota `GET /sindico/notificacoes/:id/detalhes` se não existir
  - [ ] Controller deve buscar notificação e entidade relacionada

- [ ] **Arquivo:** Criar view de detalhes
  - [ ] Mostrar dados da entrada/orçamento relacionado
  - [ ] Mostrar botões de ação

- [ ] **Teste:**
  - [ ] Criar entrada que gera notificação
  - [ ] Clicar na notificação
  - [ ] Verificar que mostra detalhes completos

---

### 1.7 FINANCEIRO - Orçamentos não aparecem

- [ ] **Arquivo:** `src/services/financeiroService.js`
  - [ ] Criar função `getDashboardStats()` se não existir
  - [ ] Adicionar busca de orçamentos com `status = 'PENDING_FINANCEIRO'`

- [ ] **Arquivo:** `views/administrativo/financeiro/dashboard.ejs` ou similar
  - [ ] Adicionar card para "Orçamentos Pendentes"
  - [ ] Adicionar link para listagem

- [ ] **Arquivo:** Verificar/criar rota `/financeiro/orcamentos-pendentes`
  - [ ] Criar view para listar orçamentos

- [ ] **Teste:**
  - [ ] ADMINISTRATIVO cria orçamento
  - [ ] Verificar que aparece no financeiro
  - [ ] Verificar que pode revisar

---

### 1.8 FINANCEIRO - Entradas pendentes de análise

- [ ] **Arquivo:** `src/services/financeiroService.js`
  - [ ] Adicionar no dashboard stats: contagem de entradas `review_status = 'PENDING_REVIEW'`

- [ ] **Arquivo:** `views/administrativo/financeiro/dashboard.ejs`
  - [ ] Adicionar card mostrando entradas pendentes

- [ ] **Teste:**
  - [ ] Criar entrada
  - [ ] Verificar que aparece no dashboard
  - [ ] Verificar contador

---

### 1.9 FINANCEIRO - Duplicação ao editar entrada rejeitada

- [ ] **Arquivo:** `src/services/financeiroService.js`
  - [ ] Localizar função de editar entrada (provavelmente `updateEntry()`)
  - [ ] Verificar que está fazendo `UPDATE` e não `INSERT`
  - [ ] Garantir que usa `WHERE id = $X`

- [ ] **Arquivo:** `src/controllers/financeiroController.js` ou `administrativoController.js`
  - [ ] Verificar rota de edição de entrada rejeitada
  - [ ] Confirmar que chama função de UPDATE

- [ ] **Arquivo:** Função de atualização
  - [ ] Ao editar entrada rejeitada, resetar:
    - [ ] `review_status = 'PENDING_REVIEW'`
    - [ ] `reviewed_by = NULL`
    - [ ] `reviewed_at = NULL`
    - [ ] `rejection_reason = NULL`

- [ ] **Teste:**
  - [ ] Criar entrada e ser rejeitada
  - [ ] Editar entrada rejeitada
  - [ ] Verificar que não duplica
  - [ ] Verificar que status volta para PENDING_REVIEW

---

### 1.10 FINANCEIRO - Não sai de "entrada registrada"

- [ ] **Arquivo:** Verificar função de marcar como recebida
  - [ ] Criar rota `POST /financeiro/entradas/:id/marcar-recebida` se não existir
  - [ ] Atualizar `received = TRUE` e `received_at = NOW()`

- [ ] **Arquivo:** View de listagem de entradas
  - [ ] Adicionar botão "Marcar como Recebida" para entradas aprovadas
  - [ ] Atualizar status visual após marcar

- [ ] **Teste:**
  - [ ] Criar e aprovar entrada
  - [ ] Marcar como recebida
  - [ ] Verificar que status muda
  - [ ] Verificar que saldo é atualizado

---

### 1.11 FINANCEIRO - Visualização de orçamentos

- [ ] **Arquivo:** `src/controllers/financeiroController.js` ou `administrativoController.js`
  - [ ] Criar rota `GET /financeiro/orcamentos`
  - [ ] Criar função `listOrcamentos()`

- [ ] **Arquivo:** `src/services/financeiroService.js`
  - [ ] Criar função `listBudgets()` que busca orçamentos do condomínio

- [ ] **Arquivo:** Criar view `views/administrativo/financeiro/orcamentos/list.ejs`
  - [ ] Listar todos os orçamentos
  - [ ] Mostrar status, valor, criado por
  - [ ] Botão para visualizar detalhes

- [ ] **Arquivo:** Criar view de detalhes `views/administrativo/financeiro/orcamentos/detail.ejs`

- [ ] **Arquivo:** Menu financeiro
  - [ ] Adicionar link "Orçamentos"

- [ ] **Teste:**
  - [ ] Acessar `/financeiro/orcamentos`
  - [ ] Verificar lista
  - [ ] Verificar detalhes

---

### 1.12 CENTRO DE CUSTO - Erro ao criar

- [ ] **Arquivo:** Verificar logs do servidor quando criar centro de custo
  - [ ] Identificar erro específico

- [ ] **Arquivo:** `src/controllers/financeiroController.js` ou similar
  - [ ] Localizar função de criar centro de custo
  - [ ] Verificar validações
  - [ ] Verificar se todos os campos obrigatórios estão sendo processados

- [ ] **Arquivo:** `src/services/financeiroService.js`
  - [ ] Verificar função `createCostCenter()` ou similar
  - [ ] Verificar estrutura da tabela `cost_centers`

- [ ] **Arquivo:** View do formulário
  - [ ] Verificar se todos os campos necessários estão no form
  - [ ] Verificar names dos inputs

- [ ] **Teste:**
  - [ ] Tentar criar centro de custo
  - [ ] Verificar que cria sem erro
  - [ ] Verificar que aparece na listagem

---

### 1.13 CENTRO DE CUSTO - Campo ativo no formulário

- [ ] **Arquivo:** View do formulário de centro de custo
  - [ ] Adicionar checkbox: `<input type="checkbox" name="active" value="true" checked>`

- [ ] **Arquivo:** Controller
  - [ ] Processar campo `active` do formulário

- [ ] **Arquivo:** Service
  - [ ] Salvar campo `active` no banco

- [ ] **Teste:**
  - [ ] Criar centro de custo marcando/desmarcando ativo
  - [ ] Verificar que salva corretamente

---

### 1.14 OPERACIONAL - Tarefas não aparecem

- [ ] **Arquivo:** `src/services/operacionalService.js`
  - [ ] Verificar função `getDashboardStats()` ou similar
  - [ ] Adicionar contagem de tarefas atribuídas ao usuário

- [ ] **Arquivo:** `src/services/operacionalService.js`
  - [ ] Verificar função `listTasks()`
  - [ ] Confirmar filtro: `WHERE assigned_to = $userId AND condominium_id = $condominiumId`

- [ ] **Arquivo:** `views/operacional/dashboard.ejs`
  - [ ] Adicionar card para tarefas pendentes
  - [ ] Adicionar link para lista de tarefas

- [ ] **Teste:**
  - [ ] ADMINISTRATIVO cria tarefa atribuída ao OPERACIONAL
  - [ ] Verificar que aparece no dashboard do OPERACIONAL
  - [ ] Verificar que aparece na lista

---

### 1.15 OPERACIONAL - Ocorrências não aparecem

- [ ] **Arquivo:** `src/services/operacionalService.js`
  - [ ] Verificar função de listar ocorrências
  - [ ] Confirmar filtro de `condominium_id`
  - [ ] Verificar que busca ocorrências do tipo correto

- [ ] **Arquivo:** Função de criar ocorrência
  - [ ] Verificar que `condominium_id` está sendo salvo
  - [ ] Verificar que `status = 'ABERTA'` por padrão

- [ ] **Arquivo:** View de listagem
  - [ ] Verificar que está filtrando corretamente
  - [ ] Verificar que mostra ocorrências abertas

- [ ] **Teste:**
  - [ ] OPERACIONAL cria ocorrência
  - [ ] Verificar que aparece na lista
  - [ ] Verificar filtros de status

---

### 1.16 OPERACIONAL - Transição de status não permitida

- [ ] **Arquivo:** `src/services/operacionalService.js`
  - [ ] Localizar função de resolver ocorrência
  - [ ] Verificar regras de transição de status

- [ ] **Solução:**
  - [ ] Permitir transição `ABERTA` → `EM_ATENDIMENTO` → `RESOLVIDA`
  - [ ] OU adicionar passo intermediário: primeiro "Iniciar Atendimento", depois "Resolver"

- [ ] **Arquivo:** View de ocorrências
  - [ ] Adicionar botão "Iniciar Atendimento" se status é ABERTA
  - [ ] Adicionar botão "Resolver" se status é EM_ATENDIMENTO

- [ ] **Teste:**
  - [ ] Criar ocorrência (status ABERTA)
  - [ ] Clicar em "Iniciar Atendimento" (muda para EM_ATENDIMENTO)
  - [ ] Clicar em "Resolver" (muda para RESOLVIDA)
  - [ ] Verificar que funciona

---

### 1.17 LIMPEZA - Ocorrências não mostram encaminhamento

- [ ] **Arquivo:** View de detalhes de ocorrência de limpeza
  - [ ] Adicionar seção mostrando:
    - [ ] `assigned_to` (se atribuída)
    - [ ] `approval_required_from` (se requer aprovação)
    - [ ] Status de aprovação (`approval_status`)

- [ ] **Arquivo:** View de listagem
  - [ ] Adicionar coluna mostrando "Aguardando aprovação" ou "Atribuída para X"

- [ ] **Teste:**
  - [ ] Criar ocorrência de limpeza que requer aprovação
  - [ ] Verificar que mostra "Aguardando aprovação do SINDICO"
  - [ ] Após aprovação, verificar que mostra status correto

---

### 1.18 LIMPEZA - Checklist não aparece

- [ ] **Arquivo:** `src/services/limpezaService.js` ou `operacionalService.js`
  - [ ] Verificar função de buscar checklists
  - [ ] Filtrar por departamento "LIMPEZA"

- [ ] **Arquivo:** Dashboard de limpeza
  - [ ] Adicionar card para checklists pendentes

- [ ] **Teste:**
  - [ ] SINDICO cria modelo de checklist para LIMPEZA
  - [ ] Verificar que aparece no dashboard de limpeza
  - [ ] Verificar que pode executar

---

## 🟡 FASE 2: CORREÇÕES DE MÉDIA PRIORIDADE

### 2.1 SÍNDICO - Formulário de registro não aparece

- [ ] Verificar rota de criação
- [ ] Verificar controller
- [ ] Verificar view do formulário
- [ ] Testar criação

---

### 2.2 OCORRÊNCIAS - Botões de ação e comunicação

- [ ] Criar sistema de mensagens em ocorrências
- [ ] Adicionar botões: Aprovar, Rejeitar, Enviar de volta
- [ ] Criar formulário de comunicação
- [ ] Implementar fluxo completo

---

### 2.3 CHECKLIST - Upload de foto no operacional

- [ ] Adicionar campo de upload no formulário de checklist
- [ ] Implementar salvamento de arquivo
- [ ] Vincular foto ao item do checklist
- [ ] Mostrar foto na visualização

---

### 2.4 OPERACIONAL - Acesso a orçamentos

- [ ] Verificar regra de negócio: operacional deve ver orçamentos?
- [ ] Se sim, adicionar permissão
- [ ] Criar view de visualização
- [ ] Se não, remover link do menu

---

### 2.5 ADMINISTRATIVO - Ocorrências não criadas

- [ ] Adicionar no dashboard stats
- [ ] Adicionar card no dashboard
- [ ] Criar rota e view

---

### 2.6 ADMINISTRATIVO - Orçamentos

- [ ] Adicionar no dashboard stats
- [ ] Adicionar card
- [ ] Verificar rotas existentes

---

### 2.7 CONSELHO - Funcionalidades

- [ ] Definir regras de negócio
- [ ] Criar dashboard de visualização
- [ ] Adicionar cards informativos
- [ ] Implementar rotas de visualização

---

## 🟢 FASE 3: CORREÇÕES DE BAIXA PRIORIDADE

### 3.1 ADMINISTRATIVO - Coluna RELATED_OCCURRENCE_ID

- [ ] Ocultar campo no formulário se não for necessário
- [ ] Ou tornar opcional e não obrigatório

---

## 📝 NOTAS DE IMPLEMENTAÇÃO

**Use este espaço para anotar problemas encontrados durante a implementação:**

- 

- 

- 

---

## ✅ VALIDAÇÃO FINAL

Antes de considerar completo, verificar:

- [ ] Todas as correções foram testadas
- [ ] Nenhum erro aparece no console do servidor
- [ ] Fluxos principais funcionam end-to-end
- [ ] Documentação foi atualizada

---

**Última atualização:** _______________  
**Implementado por:** _______________
