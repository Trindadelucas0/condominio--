# 🧪 GUIA DE TESTES MANUAIS - SISTEMA DE GESTÃO CONDOMINIAL

Este documento fornece um checklist estruturado para testes manuais do sistema.

---

## 📋 PRÉ-REQUISITOS

- [ ] Banco de dados PostgreSQL configurado e rodando
- [ ] Variáveis de ambiente configuradas (.env)
- [ ] Servidor Node.js rodando (`npm run dev`)
- [ ] Acesso ao navegador
- [ ] Credenciais do SUPER_MASTER inicial

---

## 🔐 1. TESTES DE AUTENTICAÇÃO

### 1.1 Login Básico
- [ ] Acessar `/auth/login`
- [ ] Tentar login com credenciais inválidas → deve retornar erro
- [ ] Tentar login com credenciais válidas → deve redirecionar para dashboard do perfil
- [ ] Verificar se cookie JWT foi criado (inspecionar navegador)

### 1.2 Redirecionamento por Perfil
- [ ] Login como SUPER_MASTER → deve redirecionar para `/master/dashboard`
- [ ] Login como SINDICO → deve redirecionar para `/sindico/dashboard`
- [ ] Login como SUBSINDICO → deve redirecionar para `/sindico/dashboard`
- [ ] Login como ADMINISTRATIVO → deve redirecionar para `/administrativo/dashboard`
- [ ] Login como OPERACIONAL → deve redirecionar para `/operacional/dashboard`
- [ ] Login como CONSELHO → deve redirecionar para `/conselho/dashboard`

### 1.3 Logout
- [ ] Estar logado
- [ ] Clicar em logout → deve redirecionar para `/auth/login`
- [ ] Tentar acessar rota protegida após logout → deve redirecionar para login

---

## 🛡️ 2. TESTES DE AUTORIZAÇÃO (RBAC)

### 2.1 Acesso Negado - URLs Protegidas
Para cada perfil, testar acesso a rotas que NÃO devem ter acesso:

- [ ] OPERACIONAL tentar acessar `/master/dashboard` → deve negar acesso
- [ ] OPERACIONAL tentar acessar `/sindico/dashboard` → deve negar acesso
- [ ] OPERACIONAL tentar acessar `/administrativo/dashboard` → deve negar acesso
- [ ] OPERACIONAL tentar acessar `/administrativo/financeiro/dashboard` → deve negar acesso
- [ ] ADMINISTRATIVO tentar acessar `/master/dashboard` → deve negar acesso
- [ ] SINDICO tentar acessar `/master/dashboard` → deve negar acesso
- [ ] SINDICO tentar acessar `/administrativo/dashboard` → deve negar acesso

### 2.2 Acesso Permitido
- [ ] SUPER_MASTER pode acessar `/master/*`
- [ ] SINDICO pode acessar `/sindico/*`
- [ ] ADMINISTRATIVO pode acessar `/administrativo/*`
- [ ] OPERACIONAL pode acessar `/operacional/*`

---

## 👑 3. TESTES SUPER_MASTER

### 3.1 Dashboard
- [ ] Acessar `/master/dashboard`
- [ ] Verificar exibição de estatísticas (condomínios, usuários, logs)
- [ ] Verificar links para ações rápidas

### 3.2 Gestão de Condomínios
- [ ] Listar condomínios (`/master/condominios`)
- [ ] Criar novo condomínio → verificar se aparece na lista
- [ ] Editar condomínio existente → verificar se alterações foram salvas
- [ ] Desativar condomínio → verificar se status mudou
- [ ] Verificar logs de auditoria após cada ação

### 3.3 Gestão de Usuários
- [ ] Listar usuários (`/master/usuarios`)
- [ ] Criar novo usuário → verificar se aparece na lista
- [ ] Editar usuário existente → verificar se alterações foram salvas
- [ ] Atribuir múltiplos perfis a um usuário
- [ ] Desativar usuário → verificar se status mudou
- [ ] Verificar logs de auditoria após cada ação

---

## 🔴 4. TESTES SÍNDICO/SUBSÍNDICO

### 4.1 Dashboard
- [ ] Acessar `/sindico/dashboard`
- [ ] Verificar cards de estatísticas (aprovações, alertas, financeiro)
- [ ] Verificar links para ações rápidas

### 4.2 Aprovações
- [ ] Acessar `/sindico/aprovacoes`
- [ ] Ver lista de aprovações pendentes (se houver)
- [ ] Aprovar uma aprovação pendente → verificar se status mudou
- [ ] Rejeitar uma aprovação com motivo → verificar se status mudou
- [ ] Verificar se aprovação foi registrada nos logs

### 4.3 Alertas
- [ ] Acessar `/sindico/alertas`
- [ ] Ver lista de alertas
- [ ] Filtrar por severidade (CRITICAL, WARNING)
- [ ] Resolver um alerta → verificar se status mudou
- [ ] Verificar se alerta foi registrado nos logs

### 4.4 Logs de Auditoria
- [ ] Acessar `/sindico/logs`
- [ ] Ver lista de logs
- [ ] Filtrar por módulo
- [ ] Filtrar por usuário
- [ ] Filtrar por ação
- [ ] Filtrar por período (data inicial/final)
- [ ] Expandir detalhes de um log → verificar antes/depois

---

## 🟠 5. TESTES ADMINISTRATIVO

### 5.1 Dashboard
- [ ] Acessar `/administrativo/dashboard`
- [ ] Verificar estatísticas de tarefas e documentos

### 5.2 Tarefas
- [ ] Listar tarefas (`/administrativo/tarefas`)
- [ ] Criar nova tarefa → definir prazo e responsável
- [ ] Editar tarefa existente
- [ ] Verificar se tarefa aparece para o operacional atribuído

### 5.3 Documentos
- [ ] Listar documentos (`/administrativo/documentos`)
- [ ] Criar novo documento (sem upload por enquanto)
- [ ] Editar documento existente
- [ ] Verificar alertas de documentos próximos do vencimento

### 5.4 Financeiro
- [ ] Acessar `/administrativo/financeiro/dashboard`
- [ ] Criar entrada financeira → marcar como recebida
- [ ] Criar saída financeira (valor baixo, sem aprovação)
- [ ] Criar saída financeira (valor alto, requer aprovação)
- [ ] Verificar se saída com valor alto apareceu nas aprovações do síndico
- [ ] Tentar marcar saída como paga SEM aprovação → deve negar
- [ ] Após aprovação do síndico, marcar como paga → deve permitir
- [ ] Tentar editar saída paga → deve negar

### 5.5 Patrimônio
- [ ] Acessar `/administrativo/patrimonio/dashboard`
- [ ] Criar novo ativo
- [ ] Editar ativo existente
- [ ] Registrar manutenção em um ativo
- [ ] Recalcular depreciação de um ativo
- [ ] Ver histórico de manutenções e depreciação

---

## 🟢 6. TESTES OPERACIONAL

### 6.1 Dashboard
- [ ] Acessar `/operacional/dashboard`
- [ ] Verificar estatísticas de tarefas e ocorrências

### 6.2 Checklist
- [ ] Acessar `/operacional/checklist`
- [ ] Marcar item como DONE → deve salvar automaticamente
- [ ] Marcar item como NOT_DONE → deve exigir comentário
- [ ] Tentar salvar NOT_DONE sem comentário → deve impedir
- [ ] Adicionar comentário em NOT_DONE → deve salvar
- [ ] Verificar se ação foi registrada nos logs

### 6.3 Ocorrências
- [ ] Listar ocorrências (`/operacional/ocorrencias`)
- [ ] Criar nova ocorrência → definir título, descrição, prioridade
- [ ] Editar ocorrência existente (se permitido)
- [ ] Verificar se ocorrência aparece no sistema

### 6.4 Acesso Negado
- [ ] Tentar acessar `/administrativo/*` → deve negar
- [ ] Tentar acessar `/sindico/*` → deve negar
- [ ] Tentar acessar `/master/*` → deve negar

---

## 💰 7. TESTES DE APROVAÇÃO FINANCEIRA

### 7.1 Fluxo de Aprovação Dupla
- [ ] ADMINISTRATIVO cria saída com valor acima do limite
- [ ] Verificar se saída apareceu em `/sindico/aprovacoes`
- [ ] SINDICO aprova a saída
- [ ] ADMINISTRATIVO marca saída como paga → deve permitir
- [ ] Verificar se status da saída mudou para PAID
- [ ] Verificar logs de auditoria

### 7.2 Fluxo de Rejeição
- [ ] ADMINISTRATIVO cria saída com valor acima do limite
- [ ] SINDICO rejeita a saída (com motivo)
- [ ] ADMINISTRATIVO tenta marcar como paga → deve negar
- [ ] Verificar se status da saída permanece REJECTED

### 7.3 Saída sem Aprovação (valor baixo)
- [ ] ADMINISTRATIVO cria saída com valor abaixo do limite
- [ ] Verificar se saída NÃO apareceu em `/sindico/aprovacoes`
- [ ] ADMINISTRATIVO marca como paga → deve permitir (sem aprovação)

---

## 🔔 8. TESTES DE SLA E AUTOMAÇÕES

### 8.1 SLA de Tarefas
- [ ] Criar tarefa com prazo próximo
- [ ] Executar automação (`/automation/run` - se tiver endpoint)
- [ ] Verificar se alerta foi criado para tarefa atrasada
- [ ] Verificar se notificação foi enviada

### 8.2 SLA de Ocorrências
- [ ] Criar ocorrência com SLA definido
- [ ] Aguardar vencimento do SLA
- [ ] Executar automação
- [ ] Verificar se alerta foi criado
- [ ] Verificar se notificação foi enviada

### 8.3 Escalonamento
- [ ] Criar tarefa/ocorrência que ultrapassa SLA
- [ ] Executar automação
- [ ] Verificar se alerta crítico foi criado para síndico
- [ ] Verificar se notificação foi enviada

---

## 📊 9. TESTES DE AUDITORIA

### 9.1 Registro de Logs
- [ ] Realizar ação qualquer (criar/editar/deletar)
- [ ] Verificar se log foi criado em `audit_logs`
- [ ] Verificar se log contém: user_id, action, module, entity_type, entity_id
- [ ] Verificar se log contém before_data e after_data (para UPDATE)
- [ ] Verificar se log contém ip_address e user_agent

### 9.2 Imutabilidade dos Logs
- [ ] Tentar editar log diretamente no banco → deve falhar (se tiver restrição)
- [ ] Verificar que logs não podem ser deletados via interface (não há botão)

### 9.3 Visualização de Logs
- [ ] Acessar `/sindico/logs`
- [ ] Aplicar filtros (módulo, ação, usuário, data)
- [ ] Expandir detalhes de um log
- [ ] Verificar visualização de before_data e after_data (JSON formatado)

---

## 📈 10. TESTES DE DASHBOARDS

### 10.1 Dashboard Síndico
- [ ] Verificar KPIs financeiros (saldo, entradas, saídas)
- [ ] Verificar KPIs operacionais (tarefas atrasadas, ocorrências)
- [ ] Verificar links para ações rápidas
- [ ] Verificar cores condicionais (verde/vermelho para saldo)

### 10.2 Dashboard Master
- [ ] Verificar estatísticas globais
- [ ] Verificar distribuição de usuários por perfil
- [ ] Verificar contagem de logs (24h e 7 dias)
- [ ] Verificar links para ações rápidas

---

## ✅ 11. TESTES DE VALIDAÇÕES E REGRAS DE NEGÓCIO

### 11.1 Soft Delete
- [ ] Desativar condomínio → verificar se aparece como inativo
- [ ] Desativar usuário → verificar se não pode mais fazer login
- [ ] Verificar que dados não foram deletados fisicamente

### 11.2 Regras de Negócio Financeiro
- [ ] Tentar editar saída paga → deve negar
- [ ] Tentar marcar saída como paga SEM aprovação (valor alto) → deve negar
- [ ] Tentar criar saída com valor negativo → deve validar

### 11.3 Regras de Checklist
- [ ] Tentar marcar NOT_DONE sem comentário → deve exigir
- [ ] Verificar que comentário é obrigatório para NOT_DONE

### 11.4 Regras de Patrimônio
- [ ] Verificar que histórico de depreciação não pode ser editado
- [ ] Verificar que valor atual é calculado automaticamente

---

## 🐛 12. TESTES DE ERROS E BORDAS

### 12.1 Erros de Validação
- [ ] Tentar criar condomínio sem nome → deve mostrar erro
- [ ] Tentar criar usuário sem email → deve mostrar erro
- [ ] Tentar criar tarefa sem prazo → deve mostrar erro

### 12.2 Acesso a Recursos Inexistentes
- [ ] Tentar acessar `/master/condominios/9999/editar` → deve mostrar erro 404
- [ ] Tentar acessar `/administrativo/tarefas/9999` → deve mostrar erro

### 12.3 Sessão Expirada
- [ ] Fazer login
- [ ] Remover/modificar cookie JWT manualmente
- [ ] Tentar acessar rota protegida → deve redirecionar para login

---

## 📝 NOTAS DE TESTE

**Data dos Testes:** _______________

**Testador:** _______________

**Observações:**
- 
- 
- 

**Bugs Encontrados:**
- 
- 
- 

---

## ✅ CONCLUSÃO DOS TESTES

- [ ] Todos os testes de autenticação passaram
- [ ] Todos os testes de autorização passaram
- [ ] Todos os testes funcionais passaram
- [ ] Todos os testes de regras de negócio passaram
- [ ] Bugs críticos foram corrigidos
- [ ] Sistema está pronto para FASE 14 (Finalização)
