# 📊 ANÁLISE COMPLETA: DEPARTAMENTO OPERACIONAL

**Data:** Janeiro 2026  
**Analista:** Arquiteto de Software Sênior + Product Manager  
**Metodologia:** Análise baseada em código-fonte, rotas, banco de dados e telas existentes

---

## 1. VISÃO GERAL DO DEPARTAMENTO

### Nome do Departamento
**OPERACIONAL** (também referenciado como "Zeladoria")

### Finalidade dentro do Sistema
Módulo responsável pela **execução operacional** do condomínio. Atua como a "mão-de-obra" do sistema, focando em:
- Execução de tarefas e checklists
- Registro de ocorrências e problemas
- Execução de manutenções
- Acompanhamento de orçamentos liberados
- Fornecimento de evidências (fotos) para comprovação de trabalho

### Público que Usa
- **OPERACIONAL**: Usuários com role "OPERACIONAL" (zeladores, porteiros operacionais)
- **LIMPEZA**: Também tem acesso parcial (checklists diários apenas)

### Perfil de Acesso
- Todas as rotas exigem autenticação (`authenticate` middleware)
- Rotas específicas exigem perfil OPERACIONAL ou LIMPEZA (`authorize('OPERACIONAL', 'LIMPEZA')`)

### Princípio Fundamental
> **"Quem executa não decide. Quem decide não executa."**  
O operacional **NÃO** tem acesso a:
- Valores financeiros
- Aprovações de gastos
- Edição de tarefas concluídas
- Criação/edição de tarefas (recebe, executa)

---

## 2. FUNCIONALIDADES EXISTENTES (REAL)

### ✅ 2.1. Dashboard Operacional
**Rota:** `GET /operacional/dashboard`  
**View:** `views/operacional/dashboard.ejs`  
**Service:** `operacionalService.getDashboardStats()`  
**Status:** ✅ **Funciona**  
**Observação técnica:**
- Dashboard com estatísticas em tempo real
- Integra com múltiplos serviços (tasks, occurrences, maintenances, budget_requests)
- Cards visuais com indicadores de status

**Estatísticas exibidas:**
- Tarefas pendentes
- Tarefas atrasadas
- Ocorrências abertas
- Manutenções pendentes
- Manutenções em andamento
- Orçamentos liberados

---

### ✅ 2.2. Sistema de Checklist (Antigo - Mantido para Compatibilidade)
**Rota:** `GET /operacional/checklist`  
**View:** `views/operacional/checklist.ejs`  
**Service:** `operacionalService.listTasks()`  
**Status:** ✅ **Funciona**  
**Observação técnica:**
- Lista tarefas da tabela `tasks` atribuídas ao usuário
- Busca checklists da tabela `checklists` vinculados a cada tarefa
- Limite de 50 registros sem paginação
- Ordenação por `due_date ASC, priority DESC`

**Funcionalidades:**
- Lista tarefas atribuídas ao usuário operacional
- Exibe checklists vinculados a cada tarefa
- Permite atualizar status de itens (DONE / NOT_DONE)
- **Regra de negócio:** Comentário obrigatório quando item é NOT_DONE
- Visualização de tarefas pendentes e em andamento
- Destaque visual para tarefas atrasadas

---

### ✅ 2.3. Checklist Diários (Novo Sistema - Baseado em Regras)
**Rotas:**
- `GET /operacional/checklists-diarios` - Lista checklists do dia
- `GET /operacional/checklists-diarios/:id` - Executa checklist específico
- `POST /operacional/checklists-diarios/:id/iniciar` - Inicia checklist
- `POST /operacional/checklists-diarios/:checklistId/items/:itemId` - Atualiza item
- `POST /operacional/checklists-diarios/:id/finalizar` - Finaliza checklist
- `POST /operacional/checklists-diarios/:id/evidencias` - Adiciona evidências (fotos)

**Views:** `views/operacional/checklists-diarios/list.ejs`, `execute.ejs`  
**Controller:** `dailyChecklistController.js`  
**Service:** `dailyChecklistService.js`  
**Status:** ✅ **Funciona**  
**Observação técnica:**
- Checklists gerados automaticamente baseados em `checklist_models`
- Funcionalidade `generateDailyChecklists()` existente no service
- Upload de evidências com multer configurado
- Histórico de execuções na tabela `daily_checklists`

**Funcionalidades:**
- Checklists gerados automaticamente baseados em regras/configurações
- Execução com upload de evidências (fotos)
- Status por item de checklist
- Histórico de execuções

---

### ✅ 2.4. Detalhes de Tarefa
**Rota:** `GET /operacional/tarefas/:id`  
**View:** `views/operacional/task.ejs`  
**Service:** `operacionalService.getTaskById()`  
**Status:** ✅ **Funciona**  
**Observação técnica:**
- Busca tarefa da tabela `tasks` com validação de `assigned_to`
- Busca checklists da tabela `checklists`
- Busca evidências da tabela `task_evidences`

**Funcionalidades:**
- Visualização completa da tarefa
- Lista de checklists vinculados
- Lista de evidências (fotos) anexadas
- Informações de quem criou e quando

---

### ✅ 2.5. Conclusão de Tarefa (Formulário Estruturado)
**Rotas:**
- `GET /operacional/tarefas/:id/concluir` - Exibe formulário
- `POST /operacional/tarefas/:id/finalizar` - Processa conclusão

**Views:** `views/operacional/complete-task.ejs`  
**Service:** `operacionalService.completeTask()`  
**Status:** ✅ **Funciona**  
**Observação técnica:**
- Valida se todos os checklists estão DONE antes de permitir conclusão
- Campos estruturados salvos na tabela `tasks`:
  - `completion_success` (obrigatório, boolean)
  - `completion_notes` (texto)
  - `had_issues` (boolean)
  - `issues_description` (texto)
  - `completion_time_minutes` (integer)
  - `completion_quality` (ENUM: EXCELENTE, BOM, REGULAR, RUIM)
- Atualiza `status = 'COMPLETED'` e `completed_at = CURRENT_TIMESTAMP`
- Registra em `audit_logs`

**Funcionalidades:**
- Formulário estruturado de conclusão
- Validação: Todos os checklists devem estar DONE
- Campos opcionais: tempo, qualidade, problemas
- Registro em log de auditoria

---

### ✅ 2.6. Gerenciamento de Ocorrências
**Rotas:**
- `GET /operacional/ocorrencias` - Lista ocorrências
- `GET /operacional/ocorrencias/nova` - Formulário de criação
- `POST /operacional/ocorrencias` - Cria ocorrência
- `GET /operacional/ocorrencias/:id` - Detalhes
- `GET /operacional/ocorrencias/:id/resolver` - Formulário de resolução
- `POST /operacional/ocorrencias/:id/resolver` - Resolve ocorrência

**Views:** `views/operacional/ocorrencias.ejs`, `ocorrencia-form.ejs`, `ocorrencia-detail.ejs`, `resolve-occurrence.ejs`  
**Service:** `operacionalService.createOccurrence()`, `listOccurrences()`, `resolveOccurrence()`  
**Status:** ✅ **Funciona**  
**Observação técnica:**
- Listagem limitada a 100 registros sem paginação
- Filtro apenas por status (query param `?status=`)
- Cria notificações automáticas quando `requires_approval = TRUE`
- Usa `stateValidator` para validar transições de estado

**Funcionalidades de Criação:**
- Título e descrição obrigatórios
- Localização opcional (texto livre)
- Prioridade (BAIXA, NORMAL, ALTA, URGENTE)
- Tipo de ocorrência (EMERGENCY, NON_ROUTINE, etc.)
- Flag de requer aprovação
- Destinatário (user ou role) para notificação
- Flags: `isInChecklist`, `isRoutineTask`

**Funcionalidades de Resolução:**
- Formulário estruturado com campos:
  - `resolution_success` (obrigatório, boolean)
  - `resolution_notes` (obrigatório, texto)
  - `resolution_method` (INTERNA, TERCEIRO, MANUTENCAO, OUTRA)
  - `resolution_cost` (decimal)
  - `had_complications` (boolean)
  - `complications_description` (texto)
  - `resolution_time_minutes` (integer)
  - `preventive_measures` (texto)
- Validação de transição de estado (stateValidator)
- Atualiza `status = 'RESOLVIDA'` e `resolved_at = CURRENT_TIMESTAMP`
- Registra em `audit_logs`

---

### ✅ 2.7. Integração com Manutenções
**Rotas:**
- `GET /operacional/manutencoes` - Lista manutenções
- `GET /operacional/manutencoes/:id` - Detalhes
- `POST /operacional/manutencoes/:id/iniciar` - Inicia manutenção
- `GET /operacional/manutencoes/:id/concluir` - Formulário de conclusão
- `POST /operacional/manutencoes/:id/concluir` - Finaliza manutenção

**Controller:** `manutencaoController.js` (importado)  
**Status:** ✅ **Funciona**  
**Observação técnica:**
- Operacional apenas visualiza/inicia/finaliza manutenções atribuídas a ele
- Não cria manutenções (isso é feito por outro módulo)

**Funcionalidades:**
- Visualização de manutenções atribuídas ao operacional
- Início de manutenção (muda status para IN_PROGRESS)
- Conclusão de manutenção (com formulário estruturado)

---

### ✅ 2.8. Orçamentos Liberados
**Rota:** `GET /operacional/orcamentos`  
**View:** `views/operacional/orcamentos.ejs`  
**Service:** `orcamentoService.listBudgetRequests()` (filtrado)  
**Status:** ✅ **Funciona**  
**Observação técnica:**
- Lista apenas orçamentos com `status = 'LIBERATED'`
- Filtra apenas orçamentos onde `requested_by = req.user.id`
- Apenas visualização (sem ações de execução)

**Funcionalidades:**
- Lista orçamentos aprovados para execução
- Visualização de orçamentos solicitados pelo próprio usuário

---

### ✅ 2.9. Auditoria e Logs
**Status:** ✅ **Funciona**  
**Observação técnica:**
- Todas as ações são registradas em `audit_logs`
- Logs incluem: userId, condominiumId, action, module, entityType, entityId, beforeData, afterData, ipAddress, userAgent

**Funcionalidades:**
- Registro de todas as ações (CREATE, UPDATE, COMPLETE, RESOLVE)
- Dados "antes" e "depois" salvos
- Rastreamento de IP e User-Agent

---

## 3. ANÁLISE DE MATURIDADE

### Classificação: 🟡 **INTERMEDIÁRIO** (6.5/10)

### Justificativa:

#### ✅ Pontos Fortes (Tendem para Avançado):

1. **Estrutura de Dados Rica:**
   - Campos estruturados para conclusão de tarefas (tempo, qualidade, problemas)
   - Campos estruturados para resolução de ocorrências (método, custo, complicações, medidas preventivas)
   - Suporte a evidências (fotos) vinculadas

2. **Regras de Negócio Implementadas:**
   - Validação de transição de estados (stateValidator)
   - Comentário obrigatório quando item de checklist é NOT_DONE
   - Validação de todos os checklists DONE antes de concluir tarefa
   - Sistema de notificações automáticas

3. **Auditoria:**
   - Logs completos de todas as ações
   - Rastreamento de IP e User-Agent
   - Dados antes/depois salvos

4. **Integração com Outros Módulos:**
   - Integração funcional com manutenções
   - Integração funcional com orçamentos
   - Separação de responsabilidades (operacional não cria tarefas)

5. **UI/UX:**
   - Dashboard moderno e visual
   - Cards informativos com gradientes
   - Feedback visual para tarefas atrasadas
   - Formulários bem estruturados

#### ⚠️ Pontos Fracos (Prendem em Intermediário):

1. **Duplicação de Sistemas:**
   - Dois sistemas de checklist coexistindo (antigo `/operacional/checklist` e novo `/operacional/checklists-diarios`)
   - Pode confundir usuários
   - Manutenção duplicada de código

2. **Falta de SLA:**
   - Não há sistema de SLA (Service Level Agreement) implementado
   - Não há alertas automáticos por atraso
   - Não há cálculo de tempo de resposta
   - Não há prazos máximos configuráveis por tipo de tarefa/ocorrência

3. **Falta de Relatórios:**
   - Não há relatórios de produtividade do operacional
   - Não há métricas de tempo médio de conclusão
   - Não há análise de ocorrências recorrentes

4. **Falta de Automação:**
   - Checklists diários existem mas podem não estar totalmente integrados ao workflow
   - Não há escalonamento automático de ocorrências
   - Não há criação automática de tarefas a partir de ocorrências

5. **Falta de Workflow Avançado:**
   - Não há sistema de aprovação de tarefas concluídas
   - Não há revisão de qualidade por supervisor
   - Não há sistema de comentários/conversas em tarefas

6. **Problemas Técnicos:**
   - Limites arbitrários (50 tarefas, 100 ocorrências) sem paginação
   - Faltam filtros avançados (data, prioridade, responsável)
   - Falta busca textual

7. **Falta de Mobile/Offline:**
   - Sistema parece ser apenas web
   - Não há indicação de suporte offline para zeladores em campo

8. **Falta de Geolocalização:**
   - Ocorrências têm "location" como texto livre
   - Não há GPS/coordenadas
   - Não há mapa de ocorrências

9. **Falta de Análise Preditiva:**
   - Não há identificação de padrões
   - Não há previsão de manutenções preventivas baseada em histórico
   - Não há alertas inteligentes

---

## 4. LIMITAÇÕES ATUAIS (DETALHAMENTO)

### 🔴 PROBLEMAS TÉCNICOS

#### 4.1. Duplicação de Sistemas de Checklist
**Problema:**
- Sistema antigo (`/operacional/checklist`) e novo (`/operacional/checklists-diarios`) coexistem
- Pode confundir usuários sobre qual usar
- Manutenção duplicada aumenta custo e risco de bugs

**Evidência no Código:**
- `operacionalController.js`: Funções `showChecklist()`, `updateChecklistItem()` (sistema antigo)
- `dailyChecklistController.js`: Funções `showDailyChecklists()`, `startChecklist()`, `updateItem()` (sistema novo)
- Ambas as rotas estão ativas em `operacionalRoutes.js`

**Impacto:**
- Confusão para usuários (qual sistema usar?)
- Duplicação de lógica de negócio
- Manutenção mais cara (mudanças precisam ser feitas em dois lugares)

---

#### 4.2. Limites Arbitrários sem Paginação
**Problema:**
- Listagem de tarefas limitada a 50 registros sem paginação (`LIMIT 50` no SQL)
- Listagem de ocorrências limitada a 100 registros sem paginação (`LIMIT 100` no SQL)
- Pode perder dados em condomínios grandes

**Evidência no Código:**
```sql
-- operacionalService.js linha 101
sql += ` ORDER BY t.due_date ASC, t.priority DESC LIMIT 50`;

-- operacionalService.js linha 517
sql += ` ORDER BY created_at DESC LIMIT 100`;
```

**Impacto:**
- Performance degrada com volume de dados
- Usuários não conseguem ver todos os registros
- Perda de funcionalidade em condomínios grandes

---

#### 4.3. Falta de Paginação
**Problema:**
- Nenhuma das listagens tem paginação implementada
- Não há parâmetros `page` ou `limit` nas queries
- Não há controle de navegação (próxima página, página anterior)

**Evidência no Código:**
- `operacionalService.listTasks()`: Sem paginação
- `operacionalService.listOccurrences()`: Sem paginação
- Views não têm controles de paginação

**Impacto:**
- Usuários não conseguem navegar por grandes volumes de dados
- Performance degrada com volume
- UX ruim para condomínios grandes

---

#### 4.4. Falta de Filtros Avançados
**Problema:**
- Filtros básicos apenas (status)
- Não há filtro por data, prioridade, responsável, etc.
- Queries não suportam múltiplos filtros

**Evidência no Código:**
```javascript
// operacionalService.js linha 93-96
if (filters.status) {
  sql += ` AND t.status = $${paramCount++}`;
  params.push(filters.status);
}
// Apenas filtro por status
```

**Impacto:**
- Fica difícil gerenciar muitos registros
- Usuários precisam usar busca manual para encontrar itens específicos
- Reduz produtividade

---

#### 4.5. Falta de Busca Textual
**Problema:**
- Não há busca textual em tarefas ou ocorrências
- Não há campo de busca nas views
- Não há query com LIKE ou full-text search

**Evidência no Código:**
- Views não têm campo de busca
- Services não têm função de busca

**Impacto:**
- Dificulta encontrar itens antigos
- Usuários precisam navegar manualmente por listas
- Reduz eficiência

---

### 🔴 PROBLEMAS DE FLUXO

#### 4.6. Criação de Tarefas
**Problema:**
- Operacional NÃO pode criar tarefas para si mesmo
- Deve esperar administrativo criar
- Pode criar ocorrência, mas não gera tarefa automaticamente

**Evidência no Código:**
- `operacionalService.createOccurrence()`: Cria apenas ocorrência
- Não há lógica para criar tarefa automaticamente a partir de ocorrência
- Operacional não tem rotas para criar tarefas

**Impacto:**
- Duplicação de trabalho (administrativo precisa criar tarefa manualmente)
- Demora na execução (espera por administrativo)
- Possibilidade de tarefa ficar esquecida

---

#### 4.7. Ocorrência vs Tarefa (Falta de Vinculação)
**Problema:**
- Operacional cria "ocorrência" mas isso não vira "tarefa" automaticamente
- Administrativo precisa manualmente criar tarefa a partir de ocorrência
- Duplicação de trabalho

**Evidência no Código:**
- Tabela `occurrences` não tem `task_id` (foreign key)
- Tabela `tasks` não tem `occurrence_id` (foreign key)
- Não há relação direta entre ocorrência e tarefa

**Impacto:**
- Dados ficam desconectados
- Rastreabilidade perdida
- Duplicação de trabalho manual

---

#### 4.8. Resolução de Ocorrência não Fecha Tarefas Relacionadas
**Problema:**
- Ocorrência resolvida não fecha tarefas relacionadas automaticamente
- Falta de vinculação entre ocorrência e tarefa
- Tarefas podem ficar abertas mesmo após resolução da ocorrência

**Evidência no Código:**
- `operacionalService.resolveOccurrence()`: Apenas atualiza ocorrência
- Não há lógica para buscar e fechar tarefas relacionadas

**Impacto:**
- Inconsistência de dados
- Trabalho manual para fechar tarefas
- Possibilidade de tarefas esquecidas

---

#### 4.9. Orçamentos Liberados (Falta de Fluxo de Execução)
**Problema:**
- Operacional vê orçamentos liberados, mas não há fluxo claro de "executar orçamento"
- Falta de vinculação entre orçamento aprovado e execução prática
- Não há rastreamento de execução do orçamento

**Evidência no Código:**
- View `operacional/orcamentos.ejs`: Apenas visualização
- Não há rotas para executar orçamento
- Não há vinculação entre `budget_requests` e execução

**Impacto:**
- Falta de controle de execução
- Dificuldade em rastrear se orçamento foi executado
- Gestão financeira prejudicada

---

#### 4.10. Manutenções (Falta de Vinculação com Ocorrências)
**Problema:**
- Operacional inicia/finaliza manutenção, mas não há vinculação clara com ocorrências que geraram a manutenção
- Falta de rastreabilidade da origem da manutenção

**Evidência no Código:**
- Tabela `maintenances` pode não ter `occurrence_id` (foreign key)
- Não há campo explícito vinculando manutenção à ocorrência que a gerou

**Impacto:**
- Perda de contexto histórico
- Dificuldade em entender por que manutenção foi necessária
- Análise de padrões prejudicada

---

### 🔴 FALHAS DE REGRA DE NEGÓCIO

#### 4.11. Falta de SLA (Service Level Agreement)
**Problema:**
- Não há prazo máximo para resolver ocorrência
- Não há prazo máximo para concluir tarefa (apenas `due_date`, mas não há SLA configurável por tipo)
- Não há alertas de violação de SLA
- Não há relatório de SLA cumprido/violado

**Evidência no Código:**
- Tabela `occurrences` não tem campo `sla_deadline` ou `sla_hours`
- Tabela `tasks` tem `due_date` mas não tem `sla_hours` configurável por tipo
- Não há jobs/cron jobs verificando SLA
- Não há sistema de alertas de SLA

**Impacto:**
- Não há como garantir cumprimento de prazos
- Gestores precisam verificar manualmente
- Dificuldade em comprovar eficiência para auditorias

---

#### 4.12. Falta de Validação de Evidências
**Problema:**
- Tarefas podem ser concluídas sem evidências mesmo com `evidence_required = TRUE`
- Não há validação obrigatória de foto antes de concluir

**Evidência no Código:**
```javascript
// operacionalService.js linha 273-284
// Verifica se todos os checklists estão DONE (se houver)
// MAS NÃO verifica se há evidências quando evidence_required = TRUE
```

**Impacto:**
- Perda de controle de qualidade
- Tarefas podem ser marcadas como concluídas sem comprovação
- Risco legal em caso de auditoria

---

#### 4.13. Falta de Reabertura
**Problema:**
- Tarefa concluída não pode ser reaberta
- Ocorrência resolvida não pode ser reaberta
- Falta de controle para casos onde trabalho foi mal feito

**Evidência no Código:**
- `operacionalService.completeTask()`: Atualiza `status = 'COMPLETED'` sem opção de reverter
- `operacionalService.resolveOccurrence()`: Atualiza `status = 'RESOLVIDA'` sem opção de reverter
- Não há rotas ou funções para reabrir tarefas/ocorrências

**Impacto:**
- Erros ficam permanentemente registrados como corretos
- Não há como corrigir trabalhos mal feitos
- Qualidade prejudicada

---

#### 4.14. Falta de Revisão de Trabalho
**Problema:**
- Não há sistema de revisão/validação de trabalho concluído
- Supervisor não pode aprovar/rejeitar trabalho do operacional
- Trabalho concluído não passa por validação

**Evidência no Código:**
- Tabela `tasks` não tem campos `reviewed_by`, `review_status`, `review_notes`
- Não há rotas para revisar tarefas
- Não há workflow de revisão

**Impacto:**
- Qualidade pode degradar sem supervisão
- Erros não são detectados
- Falta de controle de qualidade

---

#### 4.15. Prioridade sem Efeito
**Problema:**
- Prioridade de tarefa/ocorrência não influencia ordem de exibição de forma clara
- Não há alertas específicos para URGENTE
- Prioridade não afeta SLA ou prazos

**Evidência no Código:**
```sql
-- operacionalService.js linha 101
sql += ` ORDER BY t.due_date ASC, t.priority DESC LIMIT 50`;
-- Prioridade é usada na ordenação, mas apenas como segundo critério
-- Não há alertas específicos por prioridade
```

**Impacto:**
- Itens URGENTE podem não ser visíveis de forma destacada
- Gestores podem não perceber urgências
- Priorização ineficiente

---

### 🔴 FALHAS DE USABILIDADE

#### 4.16. Terminologia Confusa
**Problema:**
- "Checklist" vs "Checklists Diários" - não fica claro a diferença
- "Ocorrência" vs "Tarefa" - usuário pode não entender quando usar cada um

**Evidência no Código:**
- Rotas: `/operacional/checklist` vs `/operacional/checklists-diarios`
- Views: `checklist.ejs` vs `checklists-diarios/list.ejs`
- Nenhuma explicação clara da diferença

**Impacto:**
- Confusão para usuários
- Reduz adoção
- Aumenta necessidade de treinamento

---

#### 4.17. Falta de Feedback Visual
**Problema:**
- Não há indicador de "salvando..." ao atualizar checklist
- Não há confirmação antes de ações destrutivas (se houver)
- Feedback de ações não é imediato

**Evidência no Código:**
- Views não têm spinners ou indicadores de loading
- Formulários não têm confirmação antes de submit

**Impacto:**
- Usuários não sabem se ação foi processada
- Possibilidade de cliques múltiplos
- UX ruim

---

#### 4.18. Falta de Ajuda Contextual
**Problema:**
- Não há tooltips explicativos
- Não há ajuda sobre o que é cada campo
- Não há exemplos de boas práticas

**Evidência no Código:**
- Views não têm tooltips ou popovers
- Não há documentação inline

**Impacto:**
- Dificulta onboarding
- Aumenta necessidade de suporte
- Reduz autossuficiência dos usuários

---

### 🔴 RISCOS PARA O CLIENTE

#### 4.19. Risco de Perda de Produtividade
**Problema:**
- Sem SLA, tarefas podem ficar esquecidas
- Sem alertas automáticos, gestor precisa verificar manualmente
- Sem automação, trabalho manual aumenta

**Impacto:**
- Tarefas podem atrasar sem ninguém perceber
- Gestores precisam monitorar manualmente
- Reduz eficiência operacional

---

#### 4.20. Risco de Qualidade
**Problema:**
- Sem revisão de trabalho, qualidade pode degradar
- Sem reabertura, erros ficam permanentemente registrados como corretos
- Sem validação de evidências, trabalhos podem ser marcados como concluídos sem comprovação

**Impacto:**
- Qualidade do serviço pode cair
- Problemas podem persistir sem correção
- Risco legal em auditorias

---

#### 4.21. Risco de Escalabilidade
**Problema:**
- Sem paginação, sistema pode ficar lento com volume
- Sem filtros avançados, fica difícil gerenciar muitos registros
- Limites arbitrários podem causar perda de dados

**Impacto:**
- Sistema pode não escalar para condomínios grandes
- Performance degrada com volume
- Usuários podem perder acesso a dados antigos

---

#### 4.22. Risco de Conformidade
**Problema:**
- Sem SLA, não há como comprovar cumprimento de prazos
- Sem relatórios, auditoria externa fica difícil
- Sem rastreabilidade completa, conformidade pode ser questionada

**Impacto:**
- Dificuldade em passar por auditorias
- Não há como comprovar eficiência
- Risco de não conformidade com regulamentações

---

#### 4.23. Risco de Integração
**Problema:**
- Falta de integração clara entre ocorrência → tarefa → manutenção → orçamento
- Dados podem ficar desconectados
- Rastreabilidade perdida

**Impacto:**
- Dados isolados dificultam análise
- Perda de contexto histórico
- Análise de padrões prejudicada

---

## 5. CHECKLIST DE MELHORIAS NECESSÁRIAS

### 🔹 CATEGORIA 1: CORREÇÕES TÉCNICAS URGENTES

#### ✅ TEC-001: Unificar Sistemas de Checklist
**Descrição:** Remover sistema antigo ou migrar tudo para sistema novo de checklists diários  
**Prioridade:** 🔴 ALTA  
**Complexidade:** MÉDIA  
**Impacto:** Reduz confusão, facilita manutenção  
**Tarefas:**
- [ ] Decidir qual sistema manter (recomendado: novo sistema baseado em regras)
- [ ] Migrar dados do sistema antigo para o novo (se necessário)
- [ ] Atualizar rotas para usar apenas um sistema
- [ ] Atualizar views para remover referências ao sistema antigo
- [ ] Atualizar navegação/menu para remover link do sistema antigo
- [ ] Testar funcionalidade completa do sistema unificado
- [ ] Documentar migração

**Arquivos Afetados:**
- `src/controllers/operacionalController.js` (remover funções antigas)
- `src/services/operacionalService.js` (remover lógica antiga)
- `src/routes/operacionalRoutes.js` (remover rotas antigas)
- `views/operacional/checklist.ejs` (remover ou migrar)

---

#### ✅ TEC-002: Implementar Paginação em Listagens
**Descrição:** Adicionar paginação (10/20/50 por página) em todas as listas  
**Prioridade:** 🔴 ALTA  
**Complexidade:** BAIXA  
**Impacto:** Melhora performance e usabilidade  
**Tarefas:**
- [ ] Adicionar parâmetros `page` e `limit` nas queries SQL
- [ ] Implementar cálculo de `offset` e `total` de registros
- [ ] Adicionar controles de paginação nas views (próxima, anterior, número de página)
- [ ] Testar paginação com grandes volumes de dados
- [ ] Adicionar seleção de itens por página (10/20/50)

**Arquivos Afetados:**
- `src/services/operacionalService.js` (funções `listTasks()`, `listOccurrences()`)
- `src/controllers/operacionalController.js`
- `views/operacional/checklist.ejs`
- `views/operacional/ocorrencias.ejs`

---

#### ✅ TEC-003: Implementar Busca Textual
**Descrição:** Adicionar campo de busca em tarefas e ocorrências  
**Prioridade:** 🟡 MÉDIA  
**Complexidade:** BAIXA  
**Impacto:** Melhora descoberta de itens antigos  
**Tarefas:**
- [ ] Adicionar campo de busca nas views
- [ ] Implementar query SQL com LIKE ou full-text search
- [ ] Buscar em título, descrição, localização
- [ ] Adicionar filtro de busca nos services
- [ ] Testar busca com diferentes termos

**Arquivos Afetados:**
- `src/services/operacionalService.js`
- `src/controllers/operacionalController.js`
- `views/operacional/checklist.ejs`
- `views/operacional/ocorrencias.ejs`

---

#### ✅ TEC-004: Implementar Filtros Avançados
**Descrição:** Adicionar filtros por data, prioridade, responsável  
**Prioridade:** 🟡 MÉDIA  
**Complexidade:** BAIXA  
**Impacto:** Melhora gestão de grandes volumes  
**Tarefas:**
- [ ] Adicionar campos de filtro nas views (data, prioridade, responsável)
- [ ] Implementar lógica de filtros nos services
- [ ] Atualizar queries SQL para suportar múltiplos filtros
- [ ] Adicionar botão "Limpar Filtros"
- [ ] Testar combinação de filtros

**Arquivos Afetados:**
- `src/services/operacionalService.js`
- `src/controllers/operacionalController.js`
- `views/operacional/checklist.ejs`
- `views/operacional/ocorrencias.ejs`

---

#### ✅ TEC-005: Validação de Evidências Obrigatórias
**Descrição:** Impedir conclusão de tarefa se `evidence_required = TRUE` e não houver foto  
**Prioridade:** 🔴 ALTA  
**Complexidade:** BAIXA  
**Impacto:** Garante comprovação de trabalho  
**Tarefas:**
- [ ] Adicionar validação em `operacionalService.completeTask()`
- [ ] Verificar se há evidências na tabela `task_evidences` quando `evidence_required = TRUE`
- [ ] Retornar erro claro se evidências faltarem
- [ ] Atualizar view de conclusão para mostrar erro
- [ ] Testar validação

**Arquivos Afetados:**
- `src/services/operacionalService.js` (função `completeTask()`)

---

### 🔹 CATEGORIA 2: MELHORIAS DE FLUXO

#### ✅ FLU-001: Criação Automática de Tarefa a partir de Ocorrência
**Descrição:** Quando operacional cria ocorrência que requer ação, sistema cria tarefa automaticamente  
**Prioridade:** 🔴 ALTA  
**Complexidade:** MÉDIA  
**Impacto:** Reduz trabalho manual administrativo  
**Tarefas:**
- [ ] Adicionar campo `occurrence_id` na tabela `tasks` (foreign key)
- [ ] Implementar lógica em `createOccurrence()` para criar tarefa quando necessário
- [ ] Configurar tipos de ocorrência que geram tarefa automaticamente
- [ ] Atualizar view de detalhes de ocorrência para mostrar tarefa relacionada
- [ ] Testar criação automática

**Arquivos Afetados:**
- `src/database/extendTablesPhase6.sql` (adicionar foreign key)
- `src/services/operacionalService.js` (função `createOccurrence()`)
- `views/operacional/ocorrencia-detail.ejs`

---

#### ✅ FLU-002: Vinculação Ocorrência ↔ Tarefa
**Descrição:** Vincular ocorrências e tarefas bidirecionalmente  
**Prioridade:** 🟡 MÉDIA  
**Complexidade:** BAIXA  
**Impacto:** Melhora rastreabilidade  
**Tarefas:**
- [ ] Adicionar campo `task_id` na tabela `occurrences` (foreign key)
- [ ] Atualizar views para mostrar vínculo entre ocorrência e tarefa
- [ ] Atualizar views para mostrar vínculo entre tarefa e ocorrência
- [ ] Testar vinculação

**Arquivos Afetados:**
- `src/database/extendTablesPhase6.sql`
- `views/operacional/ocorrencia-detail.ejs`
- `views/operacional/task.ejs`

---

#### ✅ FLU-003: Fechamento Automático de Tarefa ao Resolver Ocorrência
**Descrição:** Ocorrência resolvida fecha tarefas relacionadas automaticamente  
**Prioridade:** 🟡 MÉDIA  
**Complexidade:** BAIXA  
**Impacto:** Reduz trabalho manual  
**Tarefas:**
- [ ] Implementar lógica em `resolveOccurrence()` para buscar tarefas relacionadas
- [ ] Atualizar status de tarefas relacionadas para COMPLETED
- [ ] Testar fechamento automático

**Arquivos Afetados:**
- `src/services/operacionalService.js` (função `resolveOccurrence()`)

---

#### ✅ FLU-004: Fluxo de Execução de Orçamento
**Descrição:** Criar fluxo claro para operacional executar orçamento aprovado  
**Prioridade:** 🟡 MÉDIA  
**Complexidade:** MÉDIA  
**Impacto:** Melhora controle de execução  
**Tarefas:**
- [ ] Adicionar rota para iniciar execução de orçamento
- [ ] Criar view de execução de orçamento
- [ ] Vincular execução de orçamento a manutenção ou tarefa
- [ ] Atualizar status de orçamento quando executado
- [ ] Testar fluxo completo

**Arquivos Afetados:**
- `src/routes/operacionalRoutes.js`
- `src/controllers/operacionalController.js`
- `src/services/orcamentoService.js`
- `views/operacional/orcamentos.ejs`

---

#### ✅ FLU-005: Vinculação Manutenção ↔ Ocorrência
**Descrição:** Vincular manutenções às ocorrências que as geraram  
**Prioridade:** 🟡 BAIXA  
**Complexidade:** BAIXA  
**Impacto:** Melhora rastreabilidade histórica  
**Tarefas:**
- [ ] Adicionar campo `occurrence_id` na tabela `maintenances` (foreign key)
- [ ] Atualizar views para mostrar vínculo
- [ ] Testar vinculação

**Arquivos Afetados:**
- `src/database/` (schema de manutenções)
- `views/operacional/` (views de manutenções)

---

### 🔹 CATEGORIA 3: SISTEMA DE SLA

#### ✅ SLA-001: Tabela de Configuração de SLA
**Descrição:** Criar tabela para configurar SLA por tipo de tarefa/ocorrência  
**Prioridade:** 🔴 ALTA  
**Complexidade:** MÉDIA  
**Impacto:** Permite gestão profissional de prazos  
**Tarefas:**
- [ ] Criar tabela `sla_configurations` com campos: tipo, sla_hours, alert_before_hours
- [ ] Criar interface administrativa para configurar SLA
- [ ] Migração de dados para tabela
- [ ] Documentar configurações padrão

**Arquivos Afetados:**
- `src/database/` (novo schema SQL)
- `src/controllers/configController.js` (ou novo controller de SLA)
- `views/config/sla-config.ejs` (nova view)

---

#### ✅ SLA-002: Cálculo de SLA em Tarefas
**Descrição:** Calcular prazo máximo de SLA para cada tarefa baseado em configuração  
**Prioridade:** 🔴 ALTA  
**Complexidade:** MÉDIA  
**Impacto:** Define prazos claros  
**Tarefas:**
- [ ] Adicionar campo `sla_deadline` na tabela `tasks`
- [ ] Calcular `sla_deadline` ao criar tarefa (created_at + sla_hours)
- [ ] Atualizar função de criação de tarefa
- [ ] Exibir `sla_deadline` nas views

**Arquivos Afetados:**
- `src/database/extendTablesPhase6.sql`
- `src/services/administrativoService.js` (ou onde tarefas são criadas)

---

#### ✅ SLA-003: Cálculo de SLA em Ocorrências
**Descrição:** Calcular prazo máximo de SLA para cada ocorrência baseado em configuração  
**Prioridade:** 🔴 ALTA  
**Complexidade:** MÉDIA  
**Impacto:** Define prazos claros  
**Tarefas:**
- [ ] Adicionar campo `sla_deadline` na tabela `occurrences`
- [ ] Calcular `sla_deadline` ao criar ocorrência (created_at + sla_hours)
- [ ] Atualizar função `createOccurrence()`
- [ ] Exibir `sla_deadline` nas views

**Arquivos Afetados:**
- `src/database/extendTablesPhase6.sql`
- `src/services/operacionalService.js` (função `createOccurrence()`)

---

#### ✅ SLA-004: Job de Verificação de SLA
**Descrição:** Criar job/cron que verifica SLA e cria alertas quando próximo do prazo  
**Prioridade:** 🔴 ALTA  
**Complexidade:** MÉDIA  
**Impacto:** Alertas automáticos garantem cumprimento  
**Tarefas:**
- [ ] Criar função `checkSLA()` que verifica tarefas/ocorrências próximas do prazo
- [ ] Criar alertas quando SLA está próximo de vencer
- [ ] Criar alertas quando SLA foi violado
- [ ] Configurar job/cron para executar periodicamente (ex: a cada hora)
- [ ] Testar criação de alertas

**Arquivos Afetados:**
- `src/jobs/slaCheckJob.js` (novo arquivo)
- `src/services/alertService.js` (ou criar)
- Configuração de cron jobs

---

#### ✅ SLA-005: Notificações de SLA
**Descrição:** Enviar notificações por email/push quando SLA está próximo  
**Prioridade:** 🟡 MÉDIA  
**Complexidade:** MÉDIA  
**Impacto:** Notifica responsáveis automaticamente  
**Tarefas:**
- [ ] Integrar com serviço de email (ex: nodemailer)
- [ ] Criar templates de email para alertas de SLA
- [ ] Enviar email para responsável quando SLA está próximo
- [ ] Enviar email para supervisor quando SLA é violado
- [ ] Testar envio de emails

**Arquivos Afetados:**
- `src/services/notificationService.js`
- `src/jobs/slaCheckJob.js`
- Templates de email

---

#### ✅ SLA-006: Relatório de SLA
**Descrição:** Criar relatório mostrando SLA cumprido/violado  
**Prioridade:** 🟡 MÉDIA  
**Complexidade:** MÉDIA  
**Impacto:** Permite análise de performance  
**Tarefas:**
- [ ] Criar função `getSLAReport()` que calcula métricas de SLA
- [ ] Calcular taxa de cumprimento de SLA
- [ ] Calcular tempo médio de resolução
- [ ] Criar view de relatório de SLA
- [ ] Exportar relatório em PDF/Excel

**Arquivos Afetados:**
- `src/services/reportService.js` (ou criar)
- `src/controllers/reportController.js`
- `views/operacional/sla-report.ejs`

---

### 🔹 CATEGORIA 4: SISTEMA DE REVISÃO

#### ✅ REV-001: Campos de Revisão na Tabela Tasks
**Descrição:** Adicionar campos para revisão de tarefas concluídas  
**Prioridade:** 🟡 MÉDIA  
**Complexidade:** BAIXA  
**Impacto:** Permite controle de qualidade  
**Tarefas:**
- [ ] Adicionar campos: `review_status` (PENDING, APPROVED, REJECTED), `reviewed_by`, `review_notes`, `reviewed_at`
- [ ] Atualizar schema SQL
- [ ] Migração de dados

**Arquivos Afetados:**
- `src/database/extendTablesPhase6.sql`

---

#### ✅ REV-002: Interface de Revisão para Supervisor
**Descrição:** Criar interface para supervisor revisar tarefas concluídas  
**Prioridade:** 🟡 MÉDIA  
**Complexidade:** MÉDIA  
**Impacto:** Permite aprovação/rejeição de trabalho  
**Tarefas:**
- [ ] Criar rota `/administrativo/tarefas/:id/revisar`
- [ ] Criar view de revisão de tarefa
- [ ] Implementar função para aprovar/rejeitar tarefa
- [ ] Notificar operacional quando tarefa é rejeitada
- [ ] Testar fluxo de revisão

**Arquivos Afetados:**
- `src/routes/administrativoRoutes.js`
- `src/controllers/administrativoController.js`
- `src/services/administrativoService.js`
- `views/administrativo/review-task.ejs`

---

#### ✅ REV-003: Reabertura de Tarefa Rejeitada
**Descrição:** Permitir reabertura de tarefa quando rejeitada na revisão  
**Prioridade:** 🟡 MÉDIA  
**Complexidade:** BAIXA  
**Impacto:** Permite correção de erros  
**Tarefas:**
- [ ] Adicionar lógica para mudar status de COMPLETED para PENDING quando rejeitada
- [ ] Notificar operacional sobre rejeição e motivos
- [ ] Permitir operacional reabrir tarefa para correção
- [ ] Testar reabertura

**Arquivos Afetados:**
- `src/services/administrativoService.js`
- `src/services/operacionalService.js`

---

### 🔹 CATEGORIA 5: RELATÓRIOS E ANALYTICS

#### ✅ REP-001: Relatório de Produtividade do Operacional
**Descrição:** Relatório mostrando tarefas concluídas, tempo médio, qualidade  
**Prioridade:** 🟡 MÉDIA  
**Complexidade:** MÉDIA  
**Impacto:** Permite análise de performance  
**Tarefas:**
- [ ] Criar função `getOperationalProductivityReport()` que agrega dados de tarefas
- [ ] Calcular: total de tarefas concluídas, tempo médio, taxa de sucesso, qualidade média
- [ ] Criar view de relatório
- [ ] Exportar relatório em PDF/Excel
- [ ] Adicionar filtros por período

**Arquivos Afetados:**
- `src/services/reportService.js`
- `src/controllers/reportController.js`
- `views/operacional/productivity-report.ejs`

---

#### ✅ REP-002: Análise de Ocorrências Recorrentes
**Descrição:** Identificar ocorrências que se repetem (mesmo local, mesmo tipo)  
**Prioridade:** 🟡 BAIXA  
**Complexidade:** MÉDIA  
**Impacto:** Permite ações preventivas  
**Tarefas:**
- [ ] Criar função que agrupa ocorrências por localização/tipo
- [ ] Calcular frequência de ocorrências recorrentes
- [ ] Criar view de análise
- [ ] Sugerir ações preventivas
- [ ] Testar agrupamento

**Arquivos Afetados:**
- `src/services/reportService.js`
- `views/operacional/recurring-occurrences.ejs`

---

#### ✅ REP-003: Métricas de Tempo Médio de Conclusão
**Descrição:** Calcular tempo médio de conclusão por tipo de tarefa  
**Prioridade:** 🟡 MÉDIA  
**Complexidade:** BAIXA  
**Impacto:** Permite benchmarking  
**Tarefas:**
- [ ] Calcular tempo médio usando `completion_time_minutes` ou `completed_at - created_at`
- [ ] Agrupar por tipo de tarefa
- [ ] Exibir métricas no dashboard
- [ ] Criar gráfico de evolução temporal

**Arquivos Afetados:**
- `src/services/operacionalService.js` (função `getDashboardStats()`)
- `views/operacional/dashboard.ejs`

---

### 🔹 CATEGORIA 6: AUTOMAÇÃO

#### ✅ AUT-001: Integração Completa de Checklists Diários
**Descrição:** Garantir que checklists diários estejam totalmente integrados ao workflow  
**Prioridade:** 🟡 MÉDIA  
**Complexidade:** BAIXA  
**Impacto:** Automação funcional  
**Tarefas:**
- [ ] Verificar se job de geração automática está rodando
- [ ] Verificar se checklists são gerados todos os dias
- [ ] Testar fluxo completo de execução
- [ ] Documentar integração

**Arquivos Afetados:**
- `src/jobs/` (verificar jobs existentes)
- `src/services/dailyChecklistService.js`

---

#### ✅ AUT-002: Escalonamento Automático de Ocorrências
**Descrição:** Escalonar ocorrências para supervisor quando não resolvidas no prazo  
**Prioridade:** 🟡 MÉDIA  
**Complexidade:** MÉDIA  
**Impacto:** Garante resolução de problemas críticos  
**Tarefas:**
- [ ] Criar lógica para identificar ocorrências não resolvidas no prazo
- [ ] Notificar supervisor quando ocorrência é escalada
- [ ] Atualizar status da ocorrência para "ESCALADA"
- [ ] Integrar com job de verificação de SLA
- [ ] Testar escalonamento

**Arquivos Afetados:**
- `src/jobs/slaCheckJob.js`
- `src/services/operacionalService.js`

---

#### ✅ AUT-003: Criação Automática de Tarefa a partir de Ocorrência
**Descrição:** Implementar lógica para criar tarefa automaticamente quando necessário (ver FLU-001)  
**Prioridade:** 🔴 ALTA  
**Complexidade:** MÉDIA  
**Impacto:** Reduz trabalho manual  
**Tarefas:**
- [ ] Ver item FLU-001 (já listado acima)

---

### 🔹 CATEGORIA 7: MELHORIAS DE UX

#### ✅ UX-001: Feedback Visual de Salvamento
**Descrição:** Adicionar indicador "salvando..." ao atualizar checklist  
**Prioridade:** 🟡 BAIXA  
**Complexidade:** BAIXA  
**Impacto:** Melhora UX  
**Tarefas:**
- [ ] Adicionar spinner/loading ao enviar formulário
- [ ] Desabilitar botão durante salvamento
- [ ] Mostrar mensagem de sucesso após salvar
- [ ] Testar feedback visual

**Arquivos Afetados:**
- `views/operacional/checklist.ejs`
- JavaScript inline ou arquivo JS separado

---

#### ✅ UX-002: Tooltips Explicativos
**Descrição:** Adicionar tooltips explicando campos e funcionalidades  
**Prioridade:** 🟡 BAIXA  
**Complexidade:** BAIXA  
**Impacto:** Melhora onboarding  
**Tarefas:**
- [ ] Adicionar atributos `title` ou tooltips Bootstrap/Popper
- [ ] Criar texto explicativo para cada campo importante
- [ ] Adicionar tooltips em botões e ações
- [ ] Testar tooltips

**Arquivos Afetados:**
- Todas as views do operacional
- CSS/JS para tooltips

---

#### ✅ UX-003: Ordenação por Prioridade
**Descrição:** Mostrar tarefas URGENTE primeiro na lista  
**Prioridade:** 🟡 BAIXA  
**Complexidade:** BAIXA  
**Impacto:** Melhora priorização  
**Tarefas:**
- [ ] Atualizar ORDER BY para priorizar URGENTE
- [ ] Adicionar destaque visual para URGENTE
- [ ] Testar ordenação

**Arquivos Afetados:**
- `src/services/operacionalService.js` (função `listTasks()`)
- `views/operacional/checklist.ejs`

---

### 🔹 CATEGORIA 8: MELHORIAS AVANÇADAS (LONGO PRAZO)

#### ✅ ADV-001: App Mobile (React Native / Flutter)
**Descrição:** Desenvolver app mobile para operacionais executarem tarefas em campo  
**Prioridade:** 🟢 FUTURO  
**Complexidade:** ALTA  
**Impacto:** Acesso offline, melhor UX mobile  
**Tarefas:**
- [ ] Escolher tecnologia (React Native ou Flutter)
- [ ] Criar projeto mobile
- [ ] Implementar autenticação
- [ ] Implementar listagem de tarefas
- [ ] Implementar execução de checklist
- [ ] Implementar upload de fotos
- [ ] Implementar sincronização offline
- [ ] Publicar nas lojas (iOS e Android)

---

#### ✅ ADV-002: Geolocalização
**Descrição:** Adicionar GPS para ocorrências e mapa de ocorrências  
**Prioridade:** 🟢 FUTURO  
**Complexidade:** ALTA  
**Impacto:** Melhora rastreamento  
**Tarefas:**
- [ ] Adicionar campos `latitude` e `longitude` na tabela `occurrences`
- [ ] Integrar com API de geolocalização do navegador
- [ ] Criar mapa de ocorrências (usando Google Maps ou OpenStreetMap)
- [ ] Adicionar check-in em locais específicos
- [ ] Testar geolocalização

---

#### ✅ ADV-003: Análise Preditiva
**Descrição:** ML para prever manutenções e identificar padrões  
**Prioridade:** 🟢 FUTURO  
**Complexidade:** MUITO ALTA  
**Impacto:** Manutenção preventiva  
**Tarefas:**
- [ ] Coletar dados históricos de manutenções
- [ ] Treinar modelo de ML
- [ ] Implementar alertas preditivos
- [ ] Integrar com dashboard

---

## 6. RESUMO DO CHECKLIST

### Total de Itens: 38 melhorias

### Por Prioridade:
- 🔴 ALTA: 8 itens
- 🟡 MÉDIA: 18 itens
- 🟡 BAIXA: 7 itens
- 🟢 FUTURO: 3 itens

### Por Categoria:
- 🔧 Técnicas: 5 itens
- 🔄 Fluxo: 5 itens
- ⏰ SLA: 6 itens
- ✅ Revisão: 3 itens
- 📊 Relatórios: 3 itens
- 🤖 Automação: 3 itens
- 💡 UX: 3 itens
- 🚀 Avançadas: 3 itens

### Estimativa de Esforço:
- **Curto Prazo (Alta Prioridade):** ~40-60 horas de desenvolvimento
- **Médio Prazo (Média Prioridade):** ~80-120 horas de desenvolvimento
- **Longo Prazo (Baixa Prioridade + Futuro):** ~200+ horas de desenvolvimento

---

**Conclusão:** O módulo OPERACIONAL tem base sólida mas precisa de melhorias focadas em SLA, automação e relatórios para atingir nível comercial premium (R$ 20.000).
