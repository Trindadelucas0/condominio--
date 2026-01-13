# 🔍 ANÁLISE COMPLETA DE PROBLEMAS E SOLUÇÕES

**Data:** Janeiro 2025  
**Status:** Em Análise

---

## 📋 SUMÁRIO

Este documento lista TODOS os problemas identificados no sistema, suas causas raiz, soluções propostas e prioridades.

---

## 🏢 1. PROBLEMAS EM CONDOMÍNIOS

### Problema 1.1: Permite criar condomínio apenas com nome
**Descrição:** Sistema permite criar condomínio somente com o campo "nome" preenchido, não validando outros campos obrigatórios.

**Causa Raiz:** 
- Arquivo: `src/services/masterServiceEnhanced.js` - Validação permite apenas nome
- Campos como endereço, telefone, email deveriam ser obrigatórios ou ter validação mais rigorosa

**Solução:**
1. Adicionar validação para tornar endereço obrigatório
2. Adicionar validação de telefone (formato brasileiro)
3. Email opcional, mas se preenchido, validar formato

**Prioridade:** 🔴 ALTA

---

### Problema 1.2: Não mostra condomínio inativo quando marca como inativo
**Descrição:** Quando marca condomínio como inativo, ele não some da listagem. O sistema considera inativo como ativo.

**Causa Raiz:**
- Arquivo: `src/services/masterService.js` - Função `listCondominios()` não filtra por `active = TRUE`
- Arquivo: `views/master/condominios/list.ejs` - Mostra todos os condomínios independente do status

**Solução:**
1. Modificar `listCondominios()` para filtrar apenas condomínios ativos por padrão
2. Adicionar filtro na view para permitir visualizar inativos (se necessário)
3. Verificar queries que usam condomínios para garantir filtro de `active = TRUE`

**Prioridade:** 🔴 ALTA

---

## 👥 2. PROBLEMAS EM USUÁRIOS

### Problema 2.1: Perfis aparecem como [object Object]
**Descrição:** Na listagem de usuários, na coluna "Perfis", aparece `[object Object]` em vez dos nomes dos perfis.

**Causa Raiz:**
- Arquivo: `src/services/masterService.js` - Função `listUsuarios()` retorna roles como array de objetos `{id, name}`
- Arquivo: `views/master/usuarios/list.ejs` - Linha 70 tenta exibir `role` diretamente sem acessar `role.name`

**Solução:**
1. Modificar `listUsuarios()` para retornar array de strings com nomes dos perfis OU
2. Modificar view `list.ejs` para acessar `role.name` ao invés de `role`

**Arquivos a modificar:**
- `src/services/masterService.js` - linha ~167-178 (função `listUsuarios`)
- `views/master/usuarios/list.ejs` - linha 68-72

**Prioridade:** 🔴 ALTA

---

## 👨‍💼 3. PROBLEMAS NO SÍNDICO

### Problema 3.1: Aprovações pendentes mostram valor breve mas não tem detalhes ao clicar
**Descrição:** No dashboard do síndico, aparece contador de aprovações pendentes, mas ao clicar não mostra detalhes.

**Causa Raiz:**
- Arquivo: `views/sindico/dashboard.ejs` - Card de aprovações pendentes
- Arquivo: `src/services/sindicoService.js` - Função `listPendingApprovals()` pode não estar sendo chamada corretamente

**Solução:**
1. Verificar rota `/sindico/aprovacoes` 
2. Garantir que controller está retornando dados completos
3. Adicionar link funcional do card para página de detalhes

**Prioridade:** 🔴 ALTA

---

### Problema 3.2: Não mostra parte de orçamento
**Descrição:** No dashboard do síndico não aparece seção de orçamentos aguardando aprovação.

**Causa Raiz:**
- Arquivo: `src/services/sindicoService.js` - Função `getDashboardStats()` busca `pendingBudgets` mas pode não estar sendo exibido
- Arquivo: `views/sindico/dashboard.ejs` - Pode não ter card para orçamentos

**Solução:**
1. Verificar se `pendingBudgets` está sendo retornado em `getDashboardStats()`
2. Adicionar card no dashboard para "Orçamentos Aguardando Aprovação"
3. Criar rota e view para listar orçamentos pendentes

**Prioridade:** 🔴 ALTA

---

### Problema 3.3: Entrada pendente está com "Analisar Entrada" como bloco
**Descrição:** Na tela de entradas pendentes, aparece como bloco e precisa estar em formato de cards.

**Causa Raiz:**
- View de entradas pendentes provavelmente está usando layout de tabela ou bloco único
- Não há view específica para entradas pendentes em formato card

**Solução:**
1. Criar ou modificar view `/sindico/entradas-pendentes` 
2. Converter layout de bloco/tabela para cards
3. Cada entrada deve ser um card com: descrição, valor, data, botões aprovar/rejeitar

**Prioridade:** 🟡 MÉDIA

---

### Problema 3.4: Quando aprova entrada, não muda saldo atual
**Descrição:** Ao aprovar uma entrada financeira, o saldo do dashboard não é atualizado.

**Causa Raiz:**
- Arquivo: `src/services/sindicoService.js` - Função de aprovar entrada pode não estar atualizando `received = TRUE`
- Saldo é calculado baseado em `received = TRUE`, mas aprovação pode estar apenas mudando `review_status`

**Solução:**
1. Verificar função de aprovação de entrada financeira
2. Garantir que ao aprovar, também marca `received = TRUE` OU ajustar cálculo de saldo
3. Verificar se cálculo de saldo em `getDashboardStats()` está correto

**Prioridade:** 🔴 ALTA

---

### Problema 3.5: No resumo financeiro fica pendente
**Descrição:** Após aprovar entrada, ela continua aparecendo como pendente no resumo financeiro.

**Causa Raiz:**
- Mesmo problema do 3.4 - status não está sendo atualizado corretamente
- View de resumo financeiro pode estar filtrando incorretamente

**Solução:**
- Mesma solução do problema 3.4

**Prioridade:** 🔴 ALTA

---

### Problema 3.6: Notificações aparecem mas ao clicar não detalha nada
**Descrição:** Notificação aparece "nova entrada financeira aguardando análise" mas ao clicar em "ver detalhes" não mostra nada.

**Causa Raiz:**
- Link da notificação pode estar quebrado ou apontando para rota incorreta
- Controller pode não estar retornando dados da entrada

**Solução:**
1. Verificar tabela `notifications` e campo `entity_id`
2. Verificar rota de detalhes de notificação
3. Garantir que controller busca e exibe dados da entrada relacionada

**Prioridade:** 🔴 ALTA

---

### Problema 3.7: Quando registra não aparece formulário
**Descrição:** Ao tentar registrar algo (provavelmente entrada), o formulário não aparece.

**Causa Raiz:**
- Rota de criação pode não estar funcionando
- Controller pode estar com erro

**Solução:**
1. Verificar rota `/sindico/entradas/nova` ou similar
2. Verificar controller `sindicoController.js`
3. Testar se view de formulário existe

**Prioridade:** 🟡 MÉDIA

---

## 🚨 4. PROBLEMAS EM OCORRÊNCIAS

### Problema 4.1: Só consegue visualizar ocorrência
**Descrição:** Na tela de ocorrências, só é possível visualizar, não há ações disponíveis.

**Causa Raiz:**
- View de ocorrências pode não ter botões de ação
- Permissões podem estar bloqueando ações

**Solução:**
1. Adicionar botões: Aprovar, Rejeitar, Enviar de volta, Finalizar
2. Criar rotas para cada ação
3. Implementar lógica de aprovação/rejeição
4. Adicionar formulário de comunicação/resposta

**Prioridade:** 🔴 ALTA

---

### Problema 4.2: Falta botão de aprovar e formulário de comunicação
**Descrição:** Não há opção de aprovar ocorrência ou enviar de volta para pessoa com comunicação.

**Causa Raiz:**
- Funcionalidade não implementada
- View não tem interface para isso

**Solução:**
1. Criar sistema de comunicação em ocorrências
2. Adicionar campo de mensagem/resposta
3. Criar tabela `occurrence_messages` se necessário
4. Implementar fluxo: Ocorrência → Aprovar/Rejeitar/Enviar de volta → Aguardar resposta → Finalizar

**Prioridade:** 🔴 ALTA

---

## ✅ 5. PROBLEMAS EM CHECKLIST

### Problema 5.1: Não aparece nada no síndico
**Descrição:** Checklist não aparece em nenhuma parte do perfil síndico.

**Causa Raiz:**
- Dashboard do síndico pode não ter seção de checklist
- Menu pode não ter link para checklist
- Checklist pode ser apenas para OPERACIONAL/LIMPEZA

**Solução:**
1. Verificar se síndico deve visualizar checklists (consulta de regras de negócio)
2. Se sim, adicionar card no dashboard e menu
3. Criar view para síndico visualizar checklists

**Prioridade:** 🟡 MÉDIA (depende da regra de negócio)

---

## 💰 6. PROBLEMAS NO FINANCEIRO

### Problema 6.1: Não mostra orçamento
**Descrição:** No dashboard financeiro não aparece seção de orçamentos.

**Causa Raiz:**
- Arquivo: `src/services/financeiroService.js` - Dashboard stats pode não incluir orçamentos
- View `financeiro/dashboard.ejs` pode não ter card de orçamentos

**Solução:**
1. Adicionar busca de orçamentos pendentes no dashboard stats
2. Adicionar card no dashboard
3. Criar rota para listar orçamentos

**Prioridade:** 🔴 ALTA

---

### Problema 6.2: Não mostra entrada pendente de análise
**Descrição:** Dashboard financeiro não mostra entradas pendentes de análise do síndico.

**Causa Raiz:**
- Dashboard pode não estar buscando entradas com `review_status = 'PENDING_REVIEW'`
- View pode não ter card para isso

**Solução:**
1. Verificar `getDashboardStats()` do financeiro
2. Adicionar contagem de entradas pendentes
3. Adicionar card no dashboard

**Prioridade:** 🔴 ALTA

---

### Problema 6.3: Editar entrada rejeitada duplica entrada
**Descrição:** Ao editar entrada rejeitada e reenviar, cria duplicata e não muda status.

**Causa Raiz:**
- Função de edição pode estar criando novo registro ao invés de atualizar
- Status não está sendo resetado para `PENDING_REVIEW` após edição

**Solução:**
1. Verificar função `updateEntry()` ou similar em `financeiroService.js`
2. Garantir que edição atualiza registro existente
3. Resetar `review_status` para `PENDING_REVIEW` ao editar entrada rejeitada
4. Verificar se há `review_reason` ou campos relacionados que precisam ser limpos

**Prioridade:** 🔴 ALTA

---

### Problema 6.4: Não sai de "entrada registrada" quando marca como resolvida
**Descrição:** Após marcar entrada como resolvida, status não muda.

**Causa Raiz:**
- Campo `received` pode não estar sendo atualizado
- View pode estar mostrando status incorreto

**Solução:**
1. Verificar função de marcar como recebida
2. Garantir atualização de `received = TRUE` e `received_at`
3. Verificar filtros nas views

**Prioridade:** 🔴 ALTA

---

### Problema 6.5: Orçamento não tem visualização
**Descrição:** Mensagem diz "verifique no ADM" mas não tem opção de visualização de orçamento.

**Causa Raiz:**
- Funcionalidade não implementada
- Rota/view não existe

**Solução:**
1. Criar rota `/financeiro/orcamentos` ou similar
2. Criar view para listar e visualizar orçamentos
3. Adicionar link no menu financeiro

**Prioridade:** 🔴 ALTA

---

## 🏛️ 7. PROBLEMAS EM CENTRO DE CUSTO

### Problema 7.1: Erro ao criar novo centro de custo
**Descrição:** Ao tentar criar novo centro de custo, sistema dá erro.

**Causa Raiz:**
- Controller pode ter erro de sintaxe
- Service pode estar com validação incorreta
- Campo obrigatório pode estar faltando

**Solução:**
1. Verificar logs de erro no servidor
2. Verificar controller `financeiroController.js` - função de criar centro de custo
3. Verificar service `financeiroService.js`
4. Verificar estrutura da tabela `cost_centers`

**Prioridade:** 🔴 ALTA

---

### Problema 7.2: Formulário não tem opção de definir ativo
**Descrição:** Formulário de centro de custo não tem checkbox ou campo para marcar como ativo/inativo.

**Causa Raiz:**
- View do formulário não tem campo `active`
- Controller pode não estar enviando esse campo

**Solução:**
1. Adicionar checkbox "Ativo" no formulário
2. Garantir que controller processa esse campo
3. Garantir que service salva `active` no banco

**Prioridade:** 🟡 MÉDIA

---

## 🏢 8. PROBLEMAS NO ADMINISTRATIVO

### Problema 8.1: Não aparece ocorrências não criadas
**Descrição:** Dashboard administrativo não mostra ocorrências que ainda não foram triadas/criadas.

**Causa Raiz:**
- Dashboard pode não estar buscando ocorrências pendentes de triagem
- View pode não ter card para isso

**Solução:**
1. Verificar `getDashboardStats()` do administrativo
2. Adicionar contagem de ocorrências não triadas
3. Adicionar card no dashboard

**Prioridade:** 🔴 ALTA

---

### Problema 8.2: Não mostra orçamento
**Descrição:** Dashboard administrativo não mostra orçamentos.

**Causa Raiz:**
- Similar ao problema 6.1
- Dashboard não tem seção de orçamentos

**Solução:**
1. Adicionar busca de orçamentos no dashboard stats
2. Adicionar card no dashboard

**Prioridade:** 🔴 ALTA

---

### Problema 8.3: Coluna RELATED_OCCURRENCE_ID aparece ao criar tarefa
**Descrição:** Ao criar tarefa, aparece coluna "RELATED_OCCURRENCE_ID" que não deveria aparecer.

**Causa Raiz:**
- View do formulário pode estar mostrando campo que não deveria
- Campo pode estar sendo retornado do banco mas não deveria ser exibido

**Solução:**
1. Verificar view `administrativo/tarefas/form.ejs`
2. Remover ou ocultar campo `related_occurrence_id` se não for necessário
3. Se for necessário, fazer campo opcional e oculto

**Prioridade:** 🟡 BAIXA

---

### Problema 8.4: Não tem modo de ocorrência nem de orçamento
**Descrição:** Não há opções para criar/gerenciar ocorrências e orçamentos no administrativo.

**Causa Raiz:**
- Funcionalidades não implementadas
- Menu pode não ter links

**Solução:**
1. Criar rotas para ocorrências no administrativo
2. Criar rotas para orçamentos
3. Adicionar no menu
4. Criar views

**Prioridade:** 🔴 ALTA

---

## 🔧 9. PROBLEMAS NO OPERACIONAL

### Problema 9.1: Checklist precisa de formulário com foto
**Descrição:** Ao executar checklist, deveria ter campo para enviar foto mas não aparece.

**Causa Raiz:**
- View de checklist pode não ter campo de upload
- Funcionalidade não implementada

**Solução:**
1. Adicionar campo de upload de foto no formulário de checklist
2. Implementar salvamento de foto
3. Vincular foto ao item do checklist

**Prioridade:** 🟡 MÉDIA

---

### Problema 9.2: Não aparece nada de tarefas
**Descrição:** Dashboard operacional não mostra tarefas atribuídas.

**Causa Raiz:**
- Dashboard pode não estar buscando tarefas
- Tarefas podem não estar sendo atribuídas corretamente

**Solução:**
1. Verificar `getDashboardStats()` do operacional
2. Verificar função `listTasks()` 
3. Garantir que tarefas têm `assigned_to` correto

**Prioridade:** 🔴 ALTA

---

### Problema 9.3: Ocorrência criada não aparece
**Descrição:** Ao criar ocorrência, ela não aparece na lista de ocorrências abertas.

**Causa Raiz:**
- Ocorrência pode estar sendo criada com status incorreto
- Query de listagem pode ter filtro incorreto
- Ocorrência pode estar sendo criada em outro condomínio

**Solução:**
1. Verificar função de criação de ocorrência
2. Verificar query de listagem
3. Garantir que status inicial é `ABERTA`
4. Verificar filtro de `condominium_id`

**Prioridade:** 🔴 ALTA

---

### Problema 9.4: Transição de status não permitida
**Descrição:** Ao tentar resolver ocorrência, aparece erro "transição de aberto para resolver não é permitido".

**Causa Raiz:**
- Máquina de estados pode ter regras rígidas
- Status intermediário pode ser necessário

**Solução:**
1. Verificar regras de transição de status em `operacionalService.js`
2. Permitir transição de `ABERTA` → `EM_ATENDIMENTO` → `RESOLVIDA`
3. Ou adicionar status intermediário

**Prioridade:** 🔴 ALTA

---

### Problema 9.5: Orçamento deu negado
**Descrição:** Ao acessar orçamento, aparece mensagem de acesso negado.

**Causa Raiz:**
- Permissões podem estar bloqueando acesso
- Rota pode não estar configurada para operacional

**Solução:**
1. Verificar se operacional deve ter acesso a orçamentos (regra de negócio)
2. Se sim, adicionar permissão
3. Se não, remover link do menu

**Prioridade:** 🟡 MÉDIA (depende da regra)

---

## 🧹 10. PROBLEMAS NA LIMPEZA

### Problema 10.1: Ocorrência criada não mostra para quem foi encaminhada
**Descrição:** Ao criar ocorrência de limpeza, não aparece informação de para quem foi encaminhada ou aguardando.

**Causa Raiz:**
- View de detalhes de ocorrência pode não mostrar `assigned_to`
- Campo pode não estar sendo preenchido

**Solução:**
1. Verificar view de detalhes de ocorrência de limpeza
2. Adicionar exibição de `assigned_to` ou `approval_required_from`
3. Mostrar status de aprovação se necessário

**Prioridade:** 🔴 ALTA

---

### Problema 10.2: Checklist não mostra nada
**Descrição:** Dashboard de limpeza não mostra checklists.

**Causa Raiz:**
- Similar ao problema 9.2
- Dashboard pode não estar buscando checklists de limpeza

**Solução:**
1. Verificar dashboard stats de limpeza
2. Adicionar busca de checklists do departamento LIMPEZA
3. Adicionar cards no dashboard

**Prioridade:** 🔴 ALTA

---

## 👥 11. PROBLEMAS NO CONSELHO

### Problema 11.1: Não tem absolutamente nada
**Descrição:** Dashboard do conselho está vazio ou não tem funcionalidades.

**Causa Raiz:**
- Funcionalidades não implementadas
- Conselho pode ser apenas visualização

**Solução:**
1. Definir o que conselho deve visualizar (regra de negócio)
2. Adicionar cards de visualização no dashboard
3. Criar rotas de visualização (sem edição)

**Prioridade:** 🟡 MÉDIA (depende da regra)

---

## 📊 RESUMO DE PRIORIDADES

### 🔴 ALTA PRIORIDADE (Corrigir primeiro)
1. Usuários: Perfis [object Object]
2. Condomínios: Filtro de ativos/inativos
3. Síndico: Saldo não atualiza ao aprovar
4. Síndico: Orçamentos não aparecem
5. Financeiro: Orçamentos e entradas pendentes
6. Financeiro: Duplicação ao editar entrada rejeitada
7. Centro de Custo: Erro ao criar
8. Operacional: Tarefas não aparecem
9. Operacional: Ocorrências não aparecem
10. Limpeza: Ocorrências não mostram encaminhamento

### 🟡 MÉDIA PRIORIDADE
1. Checklist: Formato card para entradas
2. Checklist: Upload de foto
3. Centro de Custo: Campo ativo
4. Operacional: Acesso a orçamentos

### 🟢 BAIXA PRIORIDADE
1. Administrativo: Coluna RELATED_OCCURRENCE_ID

---

## 📝 NOTAS IMPORTANTES

- **Regras de Negócio:** Alguns problemas dependem de definição de regras (ex: conselho deve ver o quê?)
- **Fluxo de Estados:** Verificar matriz de estados em `MATRIZ_PERMISSOES_E_STATES.md`
- **Permissões:** Muitos problemas podem estar relacionados a permissões incorretas
- **Testes:** Após correções, testar fluxos completos

---

**Próximos Passos:**
1. Criar checklist detalhado de correções
2. Implementar correções por prioridade
3. Testar cada correção isoladamente
4. Criar guia de testes atualizado
