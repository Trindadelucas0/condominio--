# 🏢 REGRAS DE NEGÓCIO - SISTEMA DE GESTÃO CONDOMINIAL
## Sistema Profissional de R$ 50 Milhões

---

## 📋 ÍNDICE

1. [Hierarquia e Permissões](#1-hierarquia-e-permissões)
2. [Fluxos Operacionais por Departamento](#2-fluxos-operacionais-por-departamento)
3. [Regras de Negócio Críticas](#3-regras-de-negócio-críticas)
4. [Módulos e Funcionalidades](#4-módulos-e-funcionalidades)
5. [Integrações e Automações](#5-integrações-e-automações)

---

## 1. HIERARQUIA E PERMISSÕES

### 🔴 SUPER_MASTER (Administrador do Sistema)
**Função:** Governa o SOFTWARE, não o condomínio

**Pode:**
- ✅ Criar/editar/desativar condomínios
- ✅ Criar/editar/desativar usuários
- ✅ Atribuir roles a usuários
- ✅ Configurar limites globais
- ✅ Ver logs de TODOS os condomínios
- ✅ Ver métricas globais
- ✅ Ativar/desativar módulos por condomínio

**NÃO Pode:**
- ❌ Acessar dados financeiros específicos
- ❌ Aprovar despesas
- ❌ Executar tarefas operacionais
- ❌ Ver dados de um condomínio específico (sem necessidade)

**Dashboard:**
- Total de condomínios ativos
- Total de usuários
- Métricas globais
- Logs de sistema

---

### 🟠 SINDICO / SUBSINDICO (Master do Condomínio)
**Função:** Decisão Estratégica e Fiscalização

**Pode:**
- ✅ Ver TODOS os dashboards e relatórios
- ✅ Aprovar despesas de qualquer valor
- ✅ Aprovar/rejeitar orçamentos
- ✅ Aprovar/rejeitar ocorrências
- ✅ Fechar/reabrir mês financeiro
- ✅ Ver inadimplência completa
- ✅ Ver todos os logs de auditoria
- ✅ Criar assembleias
- ✅ Configurar fundo de reserva
- ✅ Ver todas as aprovações pendentes
- ✅ Gerar relatórios em PDF
- ✅ Reabrir mês fechado (com justificativa)

**NÃO Pode:**
- ❌ Executar checklists operacionais
- ❌ Marcar tarefas como concluídas
- ❌ Criar lançamentos financeiros diretamente (deve passar por FINANCEIRO)
- ❌ Editar dados históricos
- ❌ Apagar logs

**Dashboard:**
- Inadimplência (% e valores)
- Saldo atual
- Gastos do mês
- Alertas críticos
- Aprovações pendentes
- Tarefas atrasadas
- Ocorrências abertas

---

### 🟡 FINANCEIRO (Cérebro Financeiro)
**Função:** Organização e Controle Financeiro

**Pode:**
- ✅ Criar/editar entradas financeiras
- ✅ Criar/editar saídas financeiras
- ✅ Aprovar despesas até limite configurado
- ✅ Marcar entradas como recebidas
- ✅ Marcar saídas como pagas
- ✅ Cadastrar apartamentos
- ✅ Lançar taxas mensais
- ✅ Marcar taxas como pagas
- ✅ Fechar mês financeiro
- ✅ Gerar relatórios em PDF
- ✅ Configurar fundo de reserva
- ✅ Ratear despesas
- ✅ Ver consumo mensal
- ✅ Gerenciar centros de custo
- ✅ Ver histórico financeiro

**NÃO Pode:**
- ❌ Aprovar despesas acima do limite (precisa SINDICO)
- ❌ Reabrir mês fechado
- ❌ Executar tarefas operacionais
- ❌ Ver logs de outros módulos (exceto financeiro)
- ❌ Editar dados de mês fechado

**Dashboard:**
- Saldo atual
- Entradas pendentes de análise
- Saídas pendentes de aprovação
- Gastos do mês
- Inadimplência
- Consumo mensal
- Gráficos financeiros

**Limite de Aprovação:**
- Padrão: R$ 1.000,00
- Configurável por condomínio
- Acima disso: precisa SINDICO

---

### 🟢 ADMINISTRATIVO (Organizador)
**Função:** Organização e Planejamento

**Pode:**
- ✅ Criar tarefas
- ✅ Definir responsável e prazo
- ✅ Criar SLA
- ✅ Gerenciar documentos
- ✅ Criar ocorrências
- ✅ Triar ocorrências
- ✅ Criar assembleias
- ✅ Registrar participantes e decisões
- ✅ Gerenciar contratos
- ✅ Ver alertas de vencimento
- ✅ Criar solicitações de orçamento
- ✅ Revisar orçamentos (antes de enviar ao síndico)

**NÃO Pode:**
- ❌ Executar tarefas (só OPERACIONAL)
- ❌ Aprovar despesas acima do limite
- ❌ Ver dados financeiros detalhados
- ❌ Fechar mês financeiro
- ❌ Editar dados históricos

**Dashboard:**
- Tarefas pendentes
- Ocorrências abertas
- Documentos próximos ao vencimento
- Orçamentos pendentes
- Alertas de vencimento

---

### 🔵 OPERACIONAL (Zeladoria/Manutenção)
**Função:** Execução Técnica

**Pode:**
- ✅ Executar checklists diários
- ✅ Marcar tarefas como concluídas
- ✅ Criar ocorrências
- ✅ Resolver ocorrências
- ✅ Ver suas próprias tarefas
- ✅ Ver ocorrências atribuídas
- ✅ Anexar fotos de evidência
- ✅ Registrar manutenções realizadas
- ✅ Ver patrimônio (somente leitura)

**NÃO Pode:**
- ❌ Ver dados financeiros
- ❌ Aprovar nada
- ❌ Criar tarefas
- ❌ Editar tarefas de outros
- ❌ Ver logs de auditoria
- ❌ Acessar dashboard financeiro

**Dashboard:**
- Tarefas atribuídas
- Tarefas atrasadas
- Ocorrências abertas
- Checklists do dia
- Manutenções pendentes

---

### 🟣 CONSELHO (Fiscalização)
**Função:** Transparência e Fiscalização

**Pode:**
- ✅ Ver TODOS os dados (somente leitura)
- ✅ Ver dashboards
- ✅ Ver relatórios
- ✅ Ver logs de auditoria
- ✅ Ver assembleias e decisões
- ✅ Ver dados financeiros

**NÃO Pode:**
- ❌ Criar nada
- ❌ Editar nada
- ❌ Aprovar nada
- ❌ Executar nada
- ❌ Apagar nada

**Dashboard:**
- Visão geral do condomínio
- Dados financeiros (somente leitura)
- Relatórios disponíveis
- Histórico de assembleias

---

## 2. FLUXOS OPERACIONAIS POR DEPARTAMENTO

### 💰 FLUXO FINANCEIRO COMPLETO

#### 2.1. Lançamento de Entrada (Taxa de Condomínio)
**Quem:** FINANCEIRO
**Fluxo:**
1. Acessa `/financeiro/entradas/nova`
2. Preenche: descrição, valor, data, categoria, centro de custo
3. Clica "Salvar"
4. Sistema cria entrada com status `PENDING_REVIEW`
5. SINDICO recebe notificação
6. SINDICO aprova/rejeita em `/sindico/entradas-pendentes`
7. Se aprovada, FINANCEIRO marca como recebida
8. FINANCEIRO anexa comprovante PDF
9. Sistema atualiza saldo automaticamente

#### 2.2. Lançamento de Saída (Despesa)
**Quem:** FINANCEIRO
**Fluxo:**
1. Acessa `/financeiro/saidas/nova`
2. Preenche: descrição, valor, data, categoria, centro de custo
3. Se valor > limite de aprovação: sistema marca `requires_approval = TRUE`
4. Clica "Salvar"
5. **Se valor <= limite:** FINANCEIRO pode aprovar diretamente
6. **Se valor > limite:** SINDICO recebe notificação
7. SINDICO aprova/rejeita em `/sindico/saidas-pendentes`
8. Se aprovada, FINANCEIRO marca como paga
9. FINANCEIRO anexa comprovante PDF e nota fiscal (opcional)
10. Sistema atualiza saldo automaticamente

#### 2.3. Fechamento Mensal
**Quem:** FINANCEIRO ou SINDICO
**Quando:** Último dia útil do mês ou início do mês seguinte
**Fluxo:**
1. Acessa `/financeiro/fechamento-mensal`
2. Sistema valida:
   - Entradas pendentes de análise
   - Saídas pendentes de aprovação
   - Mês já fechado
3. Se há pendências: mostra lista para resolver
4. Se tudo OK: clica "Fechar Mês"
5. Sistema:
   - Calcula totais (entradas, saídas, saldo)
   - Bloqueia edição de lançamentos do mês
   - Gera registro imutável
   - Registra no log
6. Após fechamento: edições do mês são bloqueadas
7. Para reabrir: apenas SINDICO, com justificativa obrigatória

#### 2.4. Controle de Inadimplência
**Quem:** FINANCEIRO
**Fluxo:**
1. Cadastra apartamentos em `/financeiro/apartamentos`
2. Lança taxas mensais em `/financeiro/taxas`
3. Sistema calcula automaticamente:
   - Dias em atraso
   - Multa (2% do valor)
   - Juros (1% ao mês)
4. Sistema gera avisos automáticos:
   - 5 dias: WARNING
   - 15 dias: WARNING
   - 30 dias: CRITICAL
5. FINANCEIRO marca como paga quando recebe
6. Sistema atualiza inadimplência no dashboard

---

### 🏛️ FLUXO DE ASSEMBLEIAS

**Quem:** SINDICO ou ADMINISTRATIVO
**Fluxo Completo:**
1. **Criação:**
   - Acessa `/assembleias/novo`
   - Preenche: data, horário, tipo, local, pauta, quórum
   - Clica "Criar"
   - Sistema gera avisos automáticos (7 dias antes)

2. **Registro de Participantes:**
   - Na assembleia, acessa `/assembleias/:id`
   - Adiciona participantes (nome, documento, apartamento)
   - Marca presença
   - Sistema calcula quórum automaticamente

3. **Registro de Decisões:**
   - Adiciona decisões na pauta
   - Registra votação (a favor, contra, abstenção)
   - Sistema marca como aprovada/rejeitada

4. **Ata Assinada:**
   - Faz upload da ata assinada (PDF)
   - Marca como assinada
   - Sistema registra quem assinou e quando

5. **Finalização:**
   - Clica "Finalizar Assembleia"
   - Sistema verifica quórum
   - Marca como COMPLETED
   - Gera registro imutável

---

### 🔧 FLUXO OPERACIONAL

#### 3.1. Checklist Diário
**Quem:** OPERACIONAL
**Fluxo:**
1. Acessa checklist do dia
2. Marca cada item como "Feito" ou "Não Feito"
3. Se "Não Feito": comentário obrigatório
4. Anexa foto de evidência (obrigatório)
5. Clica "Finalizar Checklist"
6. Sistema:
   - Registra conclusão
   - Se item crítico não feito: cria alerta
   - Atualiza histórico

#### 3.2. Ocorrência → Tarefa → Pagamento
**Fluxo Automático:**
1. OPERACIONAL cria ocorrência com foto
2. Sistema cria tarefa automática para ADMINISTRATIVO
3. ADMINISTRATIVO tria e cria orçamento
4. FINANCEIRO revisa orçamento
5. SINDICO aprova orçamento
6. FINANCEIRO libera valor
7. OPERACIONAL executa serviço
8. OPERACIONAL anexa foto do serviço feito
9. FINANCEIRO lança despesa
10. SINDICO aprova despesa
11. FINANCEIRO marca como paga
12. Sistema atualiza patrimônio automaticamente

---

## 3. REGRAS DE NEGÓCIO CRÍTICAS

### 🔒 REGRA 1: Quem Executa Não Decide
- OPERACIONAL executa, mas não aprova
- FINANCEIRO lança, mas não aprova alto valor
- ADMINISTRATIVO organiza, mas não executa

### 🔒 REGRA 2: Quem Decide Não Executa
- SINDICO aprova, mas não marca checklist
- SINDICO fecha mês, mas não lança despesas
- SINDICO decide, mas não executa tarefas

### 🔒 REGRA 3: Imutabilidade de Dados Históricos
- Mês fechado: NÃO pode editar
- Logs: NUNCA podem ser apagados
- Assembleias finalizadas: NÃO podem ser alteradas
- Dados aprovados: NÃO podem ser editados sem reabertura

### 🔒 REGRA 4: Dupla Aprovação Financeira
- Até limite: FINANCEIRO aprova
- Acima do limite: SINDICO aprova
- Mês fechado: NINGUÉM edita (exceto SINDICO com reabertura)

### 🔒 REGRA 5: Evidência Obrigatória
- Tarefa concluída: foto obrigatória
- Ocorrência resolvida: foto obrigatória
- Entrada recebida: comprovante PDF obrigatório
- Saída paga: comprovante PDF obrigatório

### 🔒 REGRA 6: SLA e Escalonamento
- Tarefa sem prazo: NÃO existe
- Tarefa atrasada: alerta automático
- Tarefa muito atrasada: escalona para SINDICO
- Ocorrência sem ação: alerta automático

---

## 4. MÓDULOS E FUNCIONALIDADES

### 💰 MÓDULO FINANCEIRO
**Acesso:** FINANCEIRO, SINDICO

**Funcionalidades:**
- Entradas e saídas
- Fechamento mensal
- Inadimplência
- Relatórios PDF
- Fundo de reserva
- Rateio de despesas
- Consumo mensal
- Centros de custo

**Dashboard:**
- Saldo atual
- Gastos do mês
- Inadimplência
- Pendências

---

### 🏛️ MÓDULO ASSEMBLEIAS
**Acesso:** SINDICO, ADMINISTRATIVO

**Funcionalidades:**
- Criar assembleia
- Registrar participantes
- Registrar decisões
- Upload de ata assinada
- Relatório da assembleia

---

### 🔧 MÓDULO OPERACIONAL
**Acesso:** OPERACIONAL

**Funcionalidades:**
- Checklists diários
- Tarefas atribuídas
- Ocorrências
- Manutenções
- Evidências (fotos)

---

### 📋 MÓDULO ADMINISTRATIVO
**Acesso:** ADMINISTRATIVO, SINDICO

**Funcionalidades:**
- Gestão de tarefas
- Triagem de ocorrências
- Documentos
- Orçamentos
- Assembleias

---

## 5. INTEGRAÇÕES E AUTOMAÇÕES

### ⚡ Automações Implementadas

1. **Ocorrência → Tarefa Automática**
   - OPERACIONAL cria ocorrência
   - Sistema cria tarefa para ADMINISTRATIVO

2. **Avisos Automáticos**
   - Boleto gerado
   - Pagamento em atraso (5, 15, 30 dias)
   - Assembleia agendada (7 dias antes)
   - Manutenção programada (3 dias antes)

3. **Cálculos Automáticos**
   - Inadimplência (dias, multa, juros)
   - Saldo financeiro
   - Gastos do mês
   - Depreciação de ativos

4. **Bloqueios Automáticos**
   - Mês fechado: bloqueia edição
   - Tarefa concluída: bloqueia edição
   - Despesa paga: bloqueia edição

---

## 📊 DASHBOARDS POR PERFIL

### SINDICO Dashboard
- Inadimplência (% e valores)
- Saldo atual
- Gastos do mês
- Alertas críticos
- Aprovações pendentes
- Tarefas atrasadas
- Ocorrências abertas

### FINANCEIRO Dashboard
- Saldo atual
- Entradas pendentes
- Saídas pendentes
- Gastos do mês
- Inadimplência
- Consumo mensal

### ADMINISTRATIVO Dashboard
- Tarefas pendentes
- Ocorrências abertas
- Documentos vencendo
- Orçamentos pendentes

### OPERACIONAL Dashboard
- Tarefas atribuídas
- Tarefas atrasadas
- Checklists do dia
- Ocorrências abertas

---

## 🎯 PRIORIDADES DE DESENVOLVIMENTO

### ✅ Fase 1 - COMPLETA
- Estrutura base
- Autenticação
- Permissões
- Módulos principais

### ✅ Fase 2 - COMPLETA
- Fechamento mensal
- Inadimplência
- Assembleias
- Relatórios PDF
- Fundo de reserva

### 🔄 Fase 3 - EM ANDAMENTO
- Views faltantes
- Integração de avisos
- Menu de navegação
- Testes

---

**Sistema Profissional de Gestão Condominial** 🏢
