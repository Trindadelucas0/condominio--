# PLANO DE TESTES - SISTEMA DE GESTÃO CONDOMINIAL

## OBJETIVO
Este documento fornece checklist completo para testes manuais do sistema, cobrindo todas as telas, botões, validações e fluxos.

---

## PRÉ-REQUISITOS
- [ ] Banco PostgreSQL configurado e rodando
- [ ] Variáveis de ambiente configuradas (.env)
- [ ] Servidor Node.js rodando (`npm run dev`)
- [ ] Usuários de teste criados (um de cada perfil)
- [ ] Condomínio de teste criado

---

## 1. TESTES DE AUTENTICAÇÃO

### 1.1 Tela de Login
- [ ] Abrir `/auth/login` sem estar logado → deve carregar
- [ ] Tentar login com username vazio → deve mostrar erro "Preencha usuário e senha"
- [ ] Tentar login com senha vazia → deve mostrar erro "Preencha usuário e senha"
- [ ] Tentar login com credenciais inválidas → deve mostrar "Credenciais inválidas"
- [ ] Tentar login com usuário inativo → deve mostrar "Usuário inativo"
- [ ] Tentar login com credenciais válidas → deve redirecionar conforme perfil
- [ ] Verificar cookies criados (accessToken, refreshToken, token) → devem existir
- [ ] Verificar redirecionamento:
  - [ ] SUPER_MASTER → `/master/dashboard`
  - [ ] SINDICO → `/sindico/dashboard`
  - [ ] FINANCEIRO → `/financeiro/dashboard`
  - [ ] ADMINISTRATIVO → `/administrativo/dashboard`
  - [ ] OPERACIONAL → `/operacional/dashboard`
  - [ ] LIMPEZA → `/limpeza/dashboard`
  - [ ] CONSELHO → `/conselho/dashboard`

### 1.2 Logout
- [ ] Estar logado
- [ ] Clicar em "Sair" (POST `/auth/logout`) → deve redirecionar para `/auth/login`
- [ ] Verificar cookies removidos → devem estar vazios
- [ ] Tentar acessar rota protegida após logout → deve redirecionar para login

### 1.3 Renovação de Token
- [ ] Estar logado
- [ ] Aguardar 15 minutos (ou manipular cookie para expirar)
- [ ] Fazer requisição → deve renovar token automaticamente
- [ ] Se refresh token inválido → deve redirecionar para login

---

## 2. TESTES DE AUTORIZAÇÃO (RBAC)

### 2.1 Acesso Negado - URLs Protegidas
Para cada perfil, testar acesso a rotas que NÃO devem ter acesso:

**OPERACIONAL:**
- [ ] Tentar acessar `/master/dashboard` → deve retornar 403
- [ ] Tentar acessar `/sindico/dashboard` → deve retornar 403
- [ ] Tentar acessar `/administrativo/dashboard` → deve retornar 403
- [ ] Tentar acessar `/financeiro/dashboard` → deve retornar 403

**ADMINISTRATIVO:**
- [ ] Tentar acessar `/master/dashboard` → deve retornar 403
- [ ] Tentar acessar `/sindico/dashboard` → deve retornar 403
- [ ] Tentar acessar `/financeiro/dashboard` → deve retornar 403 (módulo separado)

**FINANCEIRO:**
- [ ] Tentar acessar `/master/dashboard` → deve retornar 403
- [ ] Tentar acessar `/sindico/dashboard` → deve retornar 403
- [ ] Tentar acessar `/administrativo/dashboard` → deve retornar 403

**SINDICO:**
- [ ] Tentar acessar `/master/dashboard` → deve retornar 403
- [ ] Tentar acessar `/operacional/dashboard` → deve retornar 403

**SUPER_MASTER:**
- [ ] Tentar acessar `/sindico/dashboard` → deve retornar 403 (não tem condomínio)
- [ ] Tentar acessar `/operacional/dashboard` → deve retornar 403

### 2.2 Acesso Negado - Ações Específicas
- [ ] OPERACIONAL tentar aprovar entrada financeira → deve retornar 403
- [ ] FINANCEIRO tentar aprovar orçamento → deve retornar 403 (só síndico)
- [ ] ADMINISTRATIVO tentar criar manutenção → deve retornar 403 (só síndico)
- [ ] OPERACIONAL tentar criar modelo de checklist → deve retornar 403 (só síndico)

---

## 3. TESTES DO MÓDULO SUPER_MASTER

### 3.1 Dashboard Master
- [ ] Acessar `/master/dashboard` como SUPER_MASTER → deve carregar
- [ ] Verificar estatísticas exibidas (condomínios, usuários, logs)
- [ ] Verificar links para outras telas

### 3.2 CRUD de Condomínios
**Lista:**
- [ ] Acessar `/master/condominios` → deve listar condomínios
- [ ] Verificar colunas: nome, endereço, CNPJ, telefone, email, status

**Criar:**
- [ ] Clicar em "Novo Condomínio" → deve abrir formulário
- [ ] Tentar salvar sem nome → deve mostrar erro
- [ ] Tentar salvar com CNPJ inválido → deve mostrar erro
- [ ] Tentar salvar com email inválido → deve mostrar erro
- [ ] Preencher todos os campos válidos e salvar → deve criar e redirecionar com `?success=created`
- [ ] Verificar condomínio criado na lista

**Editar:**
- [ ] Clicar em "Editar" em um condomínio → deve abrir formulário preenchido
- [ ] Alterar nome e salvar → deve atualizar e redirecionar com `?success=updated`
- [ ] Verificar alteração na lista

### 3.3 CRUD de Usuários
**Lista:**
- [ ] Acessar `/master/usuarios` → deve listar usuários
- [ ] Verificar colunas: username, email, nome, condomínio, perfis, status

**Criar:**
- [ ] Clicar em "Novo Usuário" → deve abrir formulário
- [ ] Tentar salvar sem username → deve mostrar erro
- [ ] Tentar salvar sem email → deve mostrar erro
- [ ] Tentar salvar sem senha → deve mostrar erro
- [ ] Tentar salvar com email duplicado → deve mostrar erro
- [ ] Preencher todos os campos e selecionar perfis → deve criar
- [ ] Verificar usuário criado na lista

**Editar:**
- [ ] Clicar em "Editar" em um usuário → deve abrir formulário preenchido
- [ ] Alterar nome e salvar → deve atualizar
- [ ] Alterar perfis e salvar → deve atualizar perfis
- [ ] Desativar usuário (uncheck active) → deve atualizar status

---

## 4. TESTES DO MÓDULO SÍNDICO

### 4.1 Dashboard Síndico
- [ ] Acessar `/sindico/dashboard` como SINDICO → deve carregar
- [ ] Verificar cards de estatísticas (aprovações, alertas, saldo, etc)
- [ ] Verificar links para outras telas

### 4.2 Entradas Pendentes
- [ ] Acessar `/sindico/entradas-pendentes` → deve listar entradas com `review_status = 'PENDING_REVIEW'`
- [ ] Verificar informações exibidas (descrição, valor, data, categoria)
- [ ] Clicar em "Aprovar" sem preencher observações → deve aprovar (observações opcionais)
- [ ] Preencher observações e aprovar → deve aprovar e notificar financeiro
- [ ] Verificar entrada aprovada não aparece mais na lista
- [ ] Clicar em "Rejeitar" sem motivo → deve mostrar erro (campo obrigatório)
- [ ] Preencher motivo e rejeitar → deve rejeitar e notificar financeiro
- [ ] Verificar entrada rejeitada não aparece mais na lista

### 4.3 Ocorrências Pendentes de Aprovação
- [ ] Acessar `/sindico/ocorrencias-pendentes-aprovacao` → deve listar ocorrências com `approval_status = 'PENDING'`
- [ ] Clicar em "Aprovar" → deve aprovar e notificar operacional
- [ ] Clicar em "Rejeitar" sem motivo → deve mostrar erro
- [ ] Preencher motivo e rejeitar → deve rejeitar e notificar operacional

### 4.4 Modelos de Checklist
**Lista:**
- [ ] Acessar `/sindico/checklist-modelos` → deve listar modelos
- [ ] Verificar colunas: nome, departamento, dias, status

**Criar:**
- [ ] Clicar em "Novo Modelo" → deve abrir formulário
- [ ] Tentar salvar sem nome → deve mostrar erro
- [ ] Tentar salvar sem departamento → deve mostrar erro
- [ ] Tentar salvar sem selecionar dias da semana → deve mostrar erro
- [ ] Preencher todos os campos, selecionar dias, adicionar itens → deve criar
- [ ] Verificar modelo criado na lista

**Editar:**
- [ ] Clicar em "Editar" → deve abrir formulário preenchido
- [ ] Alterar nome e salvar → deve atualizar

**Ativar/Desativar:**
- [ ] Clicar em "Ativar/Desativar" → deve alternar status
- [ ] Verificar modelo inativo não gera checklists

### 4.5 Manutenções
**Lista:**
- [ ] Acessar `/sindico/manutencoes` → deve listar manutenções criadas

**Criar:**
- [ ] Clicar em "Nova Manutenção" → deve abrir formulário
- [ ] Tentar salvar sem tipo → deve mostrar erro
- [ ] Tentar salvar sem título → deve mostrar erro
- [ ] Tentar salvar sem descrição → deve mostrar erro
- [ ] Tentar salvar sem responsável → deve mostrar erro
- [ ] Preencher todos os campos e salvar → deve criar e notificar operacional
- [ ] Verificar manutenção criada na lista

---

## 5. TESTES DO MÓDULO FINANCEIRO

### 5.1 Dashboard Financeiro
- [ ] Acessar `/financeiro/dashboard` → deve carregar
- [ ] Verificar estatísticas (entradas pendentes, saídas, orçamentos)

### 5.2 Entradas Financeiras
**Lista:**
- [ ] Acessar `/financeiro/entradas` → deve listar entradas

**Criar:**
- [ ] Clicar em "Nova Entrada" → deve abrir formulário
- [ ] Tentar salvar sem descrição → deve mostrar erro
- [ ] Tentar salvar sem valor → deve mostrar erro
- [ ] Tentar salvar com valor zero → deve mostrar erro
- [ ] Tentar salvar com valor negativo → deve mostrar erro
- [ ] Preencher todos os campos e salvar → deve criar com `review_status = 'PENDING_REVIEW'`
- [ ] Verificar notificação enviada ao síndico

**Editar (Entrada Rejeitada):**
- [ ] Acessar `/financeiro/entradas-rejeitadas` → deve listar entradas rejeitadas
- [ ] Clicar em "Editar" → deve abrir formulário preenchido
- [ ] Alterar descrição e salvar → deve atualizar e resetar status para PENDING_REVIEW
- [ ] Verificar entrada não aparece mais em rejeitadas

**Excluir (Entrada Rejeitada):**
- [ ] Clicar em "Excluir" → deve confirmar e deletar
- [ ] Verificar entrada não aparece mais na lista

### 5.3 Saídas Financeiras
**Lista:**
- [ ] Acessar `/financeiro/saidas` → deve listar saídas

**Criar:**
- [ ] Clicar em "Nova Saída" → deve abrir formulário
- [ ] Preencher campos obrigatórios e salvar → deve criar
- [ ] Criar saída com `requires_approval = true` e valor > limite → deve criar com `payment_status = 'PENDING'`
- [ ] Criar saída com valor <= limite → deve criar com `payment_status = 'APPROVED'`
- [ ] Verificar notificação ao síndico (se requer aprovação)

### 5.4 Orçamentos Pendentes
- [ ] Acessar `/financeiro/orcamentos-pendentes` → deve listar orçamentos com `status = 'PENDING_FINANCEIRO'`
- [ ] Clicar em "Revisar" sem preencher observações → deve mostrar erro (obrigatório)
- [ ] Preencher observações e revisar → deve atualizar status para `PENDING_SINDICO`
- [ ] Verificar notificação ao síndico

### 5.5 Orçamentos Aprovados
- [ ] Acessar `/financeiro/orcamentos-aprovados` → deve listar orçamentos com `status = 'APPROVED'`
- [ ] Clicar em "Liberar" → deve atualizar `released_to_operational = true`
- [ ] Verificar notificação ao operacional
- [ ] Clicar em "Retornar" sem motivo → deve mostrar erro
- [ ] Preencher motivo e retornar → deve atualizar status para `PENDING_SINDICO`

### 5.6 Contas
- [ ] Acessar `/financeiro/contas` → deve listar contas
- [ ] Clicar em "Nova Conta" → deve abrir formulário
- [ ] Preencher e salvar → deve criar

### 5.7 Centros de Custo
- [ ] Acessar `/financeiro/centros-custo` → deve listar centros de custo
- [ ] Clicar em "Novo Centro de Custo" → deve abrir formulário
- [ ] Preencher e salvar → deve criar

### 5.8 Consumo
- [ ] Acessar `/financeiro/consumo/novo` → deve abrir formulário
- [ ] Tentar salvar sem conta → deve mostrar erro
- [ ] Preencher todos os campos e salvar → deve criar registro

---

## 6. TESTES DO MÓDULO ADMINISTRATIVO

### 6.1 Dashboard Administrativo
- [ ] Acessar `/administrativo/dashboard` → deve carregar
- [ ] Verificar estatísticas (tarefas, ocorrências, documentos)

### 6.2 Tarefas
**Lista:**
- [ ] Acessar `/administrativo/tarefas` → deve listar tarefas criadas

**Criar:**
- [ ] Clicar em "Nova Tarefa" → deve abrir formulário
- [ ] Tentar salvar sem título → deve mostrar erro
- [ ] Tentar salvar sem responsável → deve mostrar erro
- [ ] Tentar salvar sem data de vencimento → deve mostrar erro
- [ ] Preencher todos os campos, adicionar itens de checklist → deve criar
- [ ] Verificar notificação ao operacional

**Reabrir:**
- [ ] Clicar em "Reabrir" em tarefa concluída → deve abrir formulário
- [ ] Preencher motivo e reabrir → deve atualizar status para PENDING
- [ ] Verificar notificação ao operacional

### 6.3 Triagem de Ocorrências
- [ ] Acessar `/administrativo/ocorrencias/pendentes` → deve listar ocorrências não triadas
- [ ] Clicar em "Triar" → deve abrir formulário
- [ ] Preencher campos (atribuir, classificar, SLA) e triar → deve atualizar
- [ ] Verificar ocorrência triada não aparece mais em pendentes
- [ ] Se convertida para tarefa, verificar tarefa criada

### 6.4 Solicitação de Orçamento
- [ ] Acessar `/administrativo/orcamentos/novo` → deve abrir formulário
- [ ] Tentar salvar sem título → deve mostrar erro
- [ ] Tentar salvar sem descrição → deve mostrar erro
- [ ] Preencher campos, anexar PDFs (máximo 10, até 50MB cada) → deve criar
- [ ] Verificar notificação ao financeiro
- [ ] Tentar anexar arquivo não-PDF → deve mostrar erro
- [ ] Tentar anexar arquivo > 50MB → deve mostrar erro

---

## 7. TESTES DO MÓDULO OPERACIONAL

### 7.1 Dashboard Operacional
- [ ] Acessar `/operacional/dashboard` → deve carregar
- [ ] Verificar estatísticas (tarefas pendentes, atrasadas, ocorrências, manutenções)

### 7.2 Checklists Diários
**Lista:**
- [ ] Acessar `/operacional/checklists-diarios` → deve listar checklists do dia
- [ ] Alterar filtro de data → deve listar checklists da data selecionada
- [ ] Verificar informações: modelo, data, status, progresso

**Executar:**
- [ ] Clicar em "Executar" → deve abrir tela de execução
- [ ] Verificar status PENDING → deve mostrar botão "Iniciar Checklist"
- [ ] Clicar em "Iniciar Checklist" → deve atualizar status para IN_PROGRESS
- [ ] Atualizar item para DONE → deve atualizar item
- [ ] Atualizar item para NOT_DONE sem justificativa (se requires_justification) → deve mostrar erro
- [ ] Preencher justificativa e atualizar → deve atualizar
- [ ] Adicionar foto (upload imagem, máximo 10MB) → deve salvar
- [ ] Tentar adicionar arquivo não-imagem → deve mostrar erro
- [ ] Clicar em "Finalizar Checklist" → deve atualizar status para COMPLETED
- [ ] Verificar progresso atualizado

### 7.3 Ocorrências
**Lista:**
- [ ] Acessar `/operacional/ocorrencias` → deve listar ocorrências reportadas

**Criar:**
- [ ] Clicar em "Nova Ocorrência" → deve abrir formulário
- [ ] Tentar salvar sem título → deve mostrar erro
- [ ] Tentar salvar sem descrição → deve mostrar erro
- [ ] Preencher campos, selecionar tipo ROUTINE → deve criar sem aprovação
- [ ] Preencher campos, selecionar tipo NON_ROUTINE, marcar requiresApproval → deve criar com aprovação pendente
- [ ] Verificar notificação ao aprovador (se requer aprovação)

**Resolver:**
- [ ] Clicar em "Resolver" → deve abrir formulário
- [ ] Tentar resolver sem notas → deve mostrar erro
- [ ] Preencher notas e resolver → deve atualizar status para RESOLVIDA
- [ ] Verificar notificação ao síndico

### 7.4 Manutenções
**Lista:**
- [ ] Acessar `/operacional/manutencoes` → deve listar manutenções atribuídas

**Iniciar:**
- [ ] Clicar em "Iniciar" em manutenção PENDING → deve atualizar status para IN_PROGRESS

**Concluir:**
- [ ] Clicar em "Concluir" → deve abrir formulário
- [ ] Tentar concluir sem notas → deve mostrar erro
- [ ] Preencher notas, custo (opcional) e concluir → deve atualizar status para COMPLETED
- [ ] Verificar notificação ao síndico

---

## 8. TESTES DO MÓDULO LIMPEZA

### 8.1 Dashboard Limpeza
- [ ] Acessar `/limpeza/dashboard` → deve carregar
- [ ] Verificar estatísticas (checklists, ocorrências)

### 8.2 Ocorrências de Limpeza
- [ ] Acessar `/limpeza/ocorrencias` → deve listar ocorrências de limpeza
- [ ] Clicar em "Nova Ocorrência" → deve abrir formulário
- [ ] Selecionar tipo EQUIPAMENTO_DEFEITO → deve criar também ocorrência de ZELADORIA automaticamente
- [ ] Verificar notificação ao operacional (se convertida)

---

## 9. TESTES DE NOTIFICAÇÕES

### 9.1 Lista de Notificações
- [ ] Acessar `/notifications` → deve listar notificações do usuário
- [ ] Verificar filtro "Lidas/Não Lidas" → deve filtrar corretamente
- [ ] Clicar em "Marcar como Lida" → deve atualizar notificação
- [ ] Clicar em "Marcar Todas como Lidas" → deve atualizar todas
- [ ] Clicar em link de detalhes (se entity_type preenchido) → deve redirecionar para entidade

### 9.2 Badge no Navbar
- [ ] Verificar badge de notificações não lidas → deve exibir contador
- [ ] Marcar notificação como lida → deve atualizar contador
- [ ] Verificar contador não excede 99 (mostra "99+")

### 9.3 API de Contador
- [ ] Fazer GET `/notifications/unread-count` → deve retornar JSON `{count: number}`

---

## 10. TESTES DE VALIDAÇÕES

### 10.1 Validações de Campos
- [ ] Tentar criar condomínio com CNPJ inválido → deve mostrar erro
- [ ] Tentar criar usuário com email inválido → deve mostrar erro
- [ ] Tentar criar entrada com valor zero → deve mostrar erro
- [ ] Tentar criar entrada com valor negativo → deve mostrar erro
- [ ] Tentar criar entrada com data muito futura (>365 dias) → deve mostrar erro

### 10.2 Validações de Negócio
- [ ] Tentar aprovar entrada de outro condomínio (manipulando URL) → deve retornar erro
- [ ] Tentar transição de estado inválida (ex: PENDING → PAID sem APPROVED) → deve retornar erro
- [ ] Tentar ação sem permissão (ex: operacional aprovar entrada) → deve retornar 403

---

## 11. TESTES DE FLUXOS COMPLETOS

### 11.1 Fluxo de Entrada Financeira (Criação → Aprovação → Recebimento)
1. [ ] Financeiro cria entrada
2. [ ] Síndico vê em pendentes
3. [ ] Síndico aprova
4. [ ] Financeiro vê entrada aprovada
5. [ ] Financeiro marca como recebida (se implementado)

### 11.2 Fluxo de Orçamento (ADM → Financeiro → Síndico → Financeiro → Operacional)
1. [ ] Administrativo cria orçamento
2. [ ] Financeiro revisa e envia para síndico
3. [ ] Síndico aprova
4. [ ] Financeiro libera para operacional
5. [ ] Operacional vê orçamento liberado

### 11.3 Fluxo de Checklist Diário (Geração → Execução)
1. [ ] Executar job de geração manualmente (`/automation/generate-checklists`)
2. [ ] Verificar checklists criados para hoje
3. [ ] Operacional executa checklist
4. [ ] Operacional finaliza checklist
5. [ ] Verificar checklist marcado como COMPLETED

### 11.4 Fluxo de Ocorrência com Aprovação
1. [ ] Operacional cria ocorrência com requiresApproval = true
2. [ ] Síndico vê em pendentes de aprovação
3. [ ] Síndico aprova
4. [ ] Operacional resolve ocorrência
5. [ ] Verificar ocorrência marcada como RESOLVIDA

### 11.5 Fluxo de Manutenção
1. [ ] Síndico cria manutenção
2. [ ] Operacional vê manutenção atribuída
3. [ ] Operacional inicia manutenção
4. [ ] Operacional conclui manutenção
5. [ ] Síndico vê manutenção concluída

---

## 12. TESTES DE PERFORMANCE E ESTABILIDADE

### 12.1 Tempo de Carregamento
- [ ] Medir tempo de carregamento do dashboard (deve ser < 2s)
- [ ] Medir tempo de carregamento de lista com 100 registros (deve ser < 3s)
- [ ] Medir tempo de carregamento de lista com 1000 registros (deve ser < 5s)

### 12.2 Requisições Simultâneas
- [ ] Fazer 10 requisições simultâneas ao dashboard → deve responder todas
- [ ] Fazer 10 uploads simultâneos → deve processar todos

### 12.3 Gargalos Visíveis
- [ ] Verificar queries sem índice em tabelas grandes (audit_logs, notifications)
- [ ] Verificar loops aninhados em services (ex: criar notificação para cada usuário)
- [ ] Verificar uploads grandes (50MB) → deve processar sem travar

---

## 13. TESTES DE SEGURANÇA E CONSISTÊNCIA

### 13.1 Validação de Permissões
- [ ] Verificar middleware `authorize()` em todas as rotas protegidas
- [ ] Verificar middleware `authorizeAction()` em ações críticas
- [ ] Verificar validação de `condominium_id` em todas as queries

### 13.2 Proteção contra Acesso Direto
- [ ] Tentar acessar URL diretamente sem autenticação → deve redirecionar para login
- [ ] Tentar acessar URL de outro condomínio (manipulando ID) → deve retornar erro
- [ ] Tentar acessar ação sem permissão → deve retornar 403

### 13.3 Validação no Backend
- [ ] Desabilitar validação HTML5 e tentar enviar dados inválidos → backend deve validar
- [ ] Tentar SQL Injection em campos de texto → deve ser tratado (parâmetros)
- [ ] Tentar XSS em campos de texto → deve ser escapado (EJS)

### 13.4 Dados Críticos
- [ ] Tentar deletar entrada aprovada → deve negar (só permite PENDING ou REJECTED)
- [ ] Tentar alterar valor de saída aprovada → deve negar (exceto síndico)
- [ ] Tentar reabrir tarefa já reaberta → deve negar (flag reopened)

### 13.5 Dados Imutáveis
- [ ] Verificar `audit_logs` nunca é deletado
- [ ] Verificar `created_at` nunca é alterado
- [ ] Verificar `id` nunca é alterado

---

## 14. TESTES DE ERROS PROPOSITAIS

### 14.1 Erros de Validação
- [ ] Enviar formulário vazio → deve mostrar erros
- [ ] Enviar dados inválidos (email sem @, valor negativo) → deve mostrar erros
- [ ] Enviar arquivo muito grande → deve mostrar erro

### 14.2 Erros de Permissão
- [ ] Tentar ação sem permissão → deve retornar 403
- [ ] Tentar transição de estado inválida → deve retornar erro

### 14.3 Erros de Banco
- [ ] Desconectar banco e tentar operação → deve retornar 500
- [ ] Tentar criar registro com foreign key inválida → deve retornar erro

### 14.4 Erros de Rede
- [ ] Interromper conexão durante upload → deve tratar erro
- [ ] Timeout em query lenta → deve retornar erro

---

## 15. CENÁRIOS DE TESTE

### Cenário 1: Fluxo Feliz de Tarefa
1. [ ] Administrativo cria tarefa
2. [ ] Operacional recebe notificação
3. [ ] Operacional vê tarefa no dashboard
4. [ ] Operacional executa checklist
5. [ ] Operacional completa tarefa
6. [ ] Administrativo vê tarefa concluída

### Cenário 2: Fluxo de Erro de Entrada Rejeitada
1. [ ] Financeiro cria entrada
2. [ ] Síndico rejeita com motivo
3. [ ] Financeiro vê entrada rejeitada
4. [ ] Financeiro edita entrada
5. [ ] Financeiro salva (status volta para PENDING_REVIEW)
6. [ ] Síndico aprova entrada corrigida

### Cenário 3: Fluxo de Permissão Inválida
1. [ ] Operacional tenta acessar dashboard síndico
2. [ ] Sistema retorna 403
3. [ ] Operacional vê mensagem de acesso negado
4. [ ] Operacional não consegue acessar

### Cenário 4: Fluxo de Dados Inconsistentes
1. [ ] Tentar aprovar entrada que já foi aprovada → deve negar
2. [ ] Tentar resolver ocorrência já resolvida → deve negar
3. [ ] Tentar finalizar checklist já finalizado → deve negar

---

## 16. CHECKLIST FINAL

### Funcionalidades Principais
- [ ] Login e logout funcionam
- [ ] Todos os dashboards carregam
- [ ] CRUD de condomínios funciona
- [ ] CRUD de usuários funciona
- [ ] Criação de entradas funciona
- [ ] Aprovação de entradas funciona
- [ ] Criação de saídas funciona
- [ ] Criação de tarefas funciona
- [ ] Execução de checklists funciona
- [ ] Criação de ocorrências funciona
- [ ] Resolução de ocorrências funciona
- [ ] Criação de manutenções funciona
- [ ] Execução de manutenções funciona
- [ ] Fluxo de orçamentos funciona
- [ ] Notificações funcionam

### Segurança
- [ ] Autenticação obrigatória em rotas protegidas
- [ ] Autorização por perfil funciona
- [ ] Validação de condominium_id funciona
- [ ] Proteção contra SQL Injection
- [ ] Proteção contra XSS

### Performance
- [ ] Dashboards carregam em < 2s
- [ ] Listas carregam em < 3s
- [ ] Uploads processam corretamente

### Estabilidade
- [ ] Erros são tratados adequadamente
- [ ] Logs são registrados
- [ ] Sistema não quebra com dados inválidos

---

**FIM DO PLANO DE TESTES**
