# 📋 CHECKLIST DE FUNCIONALIDADES FALTANTES
## Sistema de Gestão Condominial - Versão Completa

---

## 🎯 OBJETIVO
Transformar o sistema em uma solução completa, operacional e funcional para gestão interna de condomínios.

---

## 📊 MÓDULO 1: FINANCEIRO COMPLETO

### ✅ 1.1 Fechamento Mensal Financeiro
**Status:** ❌ NÃO EXISTE

**O que precisa:**
- [ ] Tabela `monthly_closures` (id, condominium_id, month, year, status, closed_by, closed_at, notes)
- [ ] Botão "Fechar Mês" no dashboard financeiro (apenas FINANCEIRO ou SINDICO)
- [ ] Validação antes de fechar:
  - [ ] Todas as entradas do mês foram recebidas ou rejeitadas
  - [ ] Todas as saídas do mês foram pagas ou rejeitadas
  - [ ] Não há pendências críticas
- [ ] Após fechamento:
  - [ ] Bloqueia edição de lançamentos do mês fechado
  - [ ] Gera relatório automático
  - [ ] Cria registro imutável
- [ ] Visualização de meses fechados (somente leitura)
- [ ] Reabertura de mês (apenas SINDICO, com justificativa obrigatória)

**Fluxo Operacional:**
1. **Quem:** FINANCEIRO ou SINDICO
2. **Quando:** Último dia útil do mês ou início do mês seguinte
3. **O que faz:** Clica em "Fechar Mês [Mês/Ano]"
4. **Sistema valida:** Pendências, inconsistências
5. **Se aprovado:** Bloqueia edições, gera relatório, registra no log
6. **Se rejeitado:** Mostra lista de pendências para resolver

---

### ✅ 1.2 Inadimplência
**Status:** ❌ NÃO EXISTE

**O que precisa:**
- [ ] Tabela `apartments` (id, condominium_id, number, block, owner_name, owner_document)
- [ ] Tabela `monthly_fees` (id, apartment_id, month, year, amount, due_date, paid, paid_at, payment_method)
- [ ] Cálculo automático de inadimplência:
  - [ ] Taxa vencida há X dias = inadimplente
  - [ ] Percentual de inadimplência no condomínio
  - [ ] Valor total em aberto
- [ ] Dashboard mostra:
  - [ ] Taxa de inadimplência (%)
  - [ ] Valor total em aberto
  - [ ] Quantidade de apartamentos inadimplentes
  - [ ] Lista dos 10 maiores devedores
- [ ] Geração automática de avisos de atraso (configurável: 5, 10, 15, 30 dias)

**Fluxo Operacional:**
1. **Sistema calcula:** Diariamente, verifica taxas vencidas
2. **Gera alertas:** Automaticamente para apartamentos com X dias de atraso
3. **Dashboard mostra:** Síndico vê inadimplência em tempo real
4. **Ações disponíveis:** Enviar aviso, bloquear acesso, gerar relatório

---

### ✅ 1.3 Gastos do Mês Consolidados
**Status:** ⚠️ PARCIAL (existe consumo mensal, mas não gastos consolidados)

**O que precisa:**
- [ ] Query que consolida no dashboard:
  - [ ] Total de saídas pagas no mês atual
  - [ ] Total de saídas aprovadas (comprometidas) no mês atual
  - [ ] Comparativo com mês anterior (%)
  - [ ] Gráfico de evolução dos últimos 6 meses
  - [ ] Top 5 categorias de gastos do mês
- [ ] Card no dashboard do síndico mostrando:
  - [ ] "Gastos do Mês: R$ X.XXX,XX"
  - [ ] "Comparado ao mês anterior: +X% ou -X%"
  - [ ] Link para detalhamento

**Fluxo Operacional:**
1. **Sistema calcula:** Automaticamente ao carregar dashboard
2. **Atualiza:** Em tempo real conforme lançamentos são feitos
3. **Síndico vê:** Gastos consolidados do mês atual
4. **Pode clicar:** Para ver detalhamento por categoria/centro de custo

---

### ✅ 1.4 Fundo de Reserva e Rateio
**Status:** ❌ NÃO EXISTE

**O que precisa:**
- [ ] Tabela `reserve_fund` (id, condominium_id, current_balance, target_balance, monthly_contribution, last_updated)
- [ ] Tabela `expense_allocation` (id, financial_exit_id, apartment_id, amount, allocated_at)
- [ ] Configuração de fundo de reserva:
  - [ ] Meta de fundo (ex: 6 meses de despesas)
  - [ ] Contribuição mensal automática
- [ ] Rateio de despesas:
  - [ ] Por fração ideal (se tiver cadastro)
  - [ ] Por igual (todos pagam igual)
  - [ ] Manual (escolhe apartamentos)
- [ ] Dashboard mostra:
  - [ ] Saldo atual do fundo de reserva
  - [ ] % da meta atingida
  - [ ] Próxima contribuição

**Fluxo Operacional:**
1. **Configuração inicial:** SINDICO define meta e % de contribuição
2. **Sistema calcula:** Automaticamente a contribuição mensal
3. **Ao lançar despesa:** FINANCEIRO pode escolher ratear ou não
4. **Dashboard mostra:** Status do fundo de reserva

---

## 📄 MÓDULO 2: RELATÓRIOS E PDF

### ✅ 2.1 Relatório Mensal em PDF
**Status:** ❌ NÃO EXISTE

**O que precisa:**
- [ ] Instalar biblioteca PDF (pdfkit ou puppeteer)
- [ ] Rota `/financeiro/relatorios/mensal/:month/:year/pdf`
- [ ] Template de relatório contendo:
  - [ ] Cabeçalho com logo e dados do condomínio
  - [ ] Resumo executivo (entradas, saídas, saldo)
  - [ ] Detalhamento de entradas (tabela)
  - [ ] Detalhamento de saídas (tabela)
  - [ ] Gráficos (Chart.js exportado ou imagem)
  - [ ] Rodapé com data de geração e assinatura
- [ ] Botão "Baixar PDF" no dashboard financeiro
- [ ] Histórico de relatórios gerados (tabela `generated_reports`)

**Fluxo Operacional:**
1. **Quem:** FINANCEIRO ou SINDICO
2. **Onde:** Dashboard financeiro ou página de relatórios
3. **Ação:** Seleciona mês/ano e clica "Gerar Relatório PDF"
4. **Sistema:** Gera PDF com todos os dados do mês
5. **Resultado:** Download automático do arquivo
6. **Registro:** Salva no histórico de relatórios gerados

---

### ✅ 2.2 Relatórios Operacionais em PDF
**Status:** ❌ NÃO EXISTE

**O que precisa:**
- [ ] Relatório de Ocorrências (período, status, responsável)
- [ ] Relatório de Tarefas (período, status, responsável, SLA)
- [ ] Relatório de Manutenções (período, tipo, custo)
- [ ] Relatório de Patrimônio (ativos, depreciação, histórico)
- [ ] Todos com opção de download em PDF

**Fluxo Operacional:**
1. **Quem:** ADMINISTRATIVO, SINDICO
2. **Onde:** Páginas de listagem (ocorrências, tarefas, etc.)
3. **Ação:** Filtra período e clica "Gerar Relatório PDF"
4. **Sistema:** Gera PDF com dados filtrados
5. **Resultado:** Download automático

---

## 🏛️ MÓDULO 3: ASSEMBLEIAS

### ✅ 3.1 Módulo Completo de Assembleias
**Status:** ❌ NÃO EXISTE (só existe tipo ATA em documentos)

**O que precisa:**
- [ ] Tabela `assemblies` (id, condominium_id, date, type, location, quorum, status, created_by)
- [ ] Tabela `assembly_participants` (id, assembly_id, apartment_id, owner_name, present, signed_at)
- [ ] Tabela `assembly_decisions` (id, assembly_id, title, description, votes_for, votes_against, votes_abstention, approved, decision_number)
- [ ] Tabela `assembly_documents` (id, assembly_id, document_type, file_path, file_name, signed)
- [ ] Funcionalidades:
  - [ ] Criar assembleia (data, tipo, local, pauta)
  - [ ] Registrar participantes (presença, assinatura)
  - [ ] Registrar decisões (título, descrição, votação)
  - [ ] Anexar ata assinada (PDF)
  - [ ] Gerar relatório da assembleia (PDF)
  - [ ] Histórico de assembleias
- [ ] Aviso automático de assembleia agendada (X dias antes)

**Fluxo Operacional:**
1. **Quem cria:** SINDICO ou ADMINISTRATIVO
2. **O que faz:** Preenche formulário (data, tipo, local, pauta)
3. **Sistema:** Gera avisos automáticos (X dias antes)
4. **Na assembleia:** Registra participantes e decisões
5. **Após assembleia:** Anexa ata assinada (PDF)
6. **Sistema:** Gera relatório completo em PDF
7. **Registro:** Fica imutável no histórico

---

## 🔔 MÓDULO 4: AVISOS ESPECÍFICOS

### ✅ 4.1 Sistema de Avisos Específicos
**Status:** ⚠️ PARCIAL (existe sistema genérico de alertas)

**O que precisa:**
- [ ] Tipos específicos de avisos:
  - [ ] `BILLET_GENERATED` - Boleto gerado
  - [ ] `PAYMENT_OVERDUE` - Pagamento em atraso
  - [ ] `ASSEMBLY_SCHEDULED` - Assembleia agendada
  - [ ] `MAINTENANCE_DUE` - Manutenção programada
- [ ] Configuração de avisos:
  - [ ] Quando gerar (dias antes/depois)
  - [ ] Para quem enviar (apartamento, síndico, etc.)
  - [ ] Método (notificação interna, email futuro)
- [ ] Dashboard mostra avisos pendentes
- [ ] Histórico de avisos enviados

**Fluxo Operacional:**
1. **Sistema detecta:** Evento (ex: boleto gerado, manutenção próxima)
2. **Verifica regras:** Quando e para quem avisar
3. **Gera aviso:** Cria notificação no sistema
4. **Usuário vê:** No dashboard ou página de notificações
5. **Marca como lido:** Quando visualizado

---

## 📎 MÓDULO 5: ANEXOS ESPECÍFICOS

### ✅ 5.1 Anexos Específicos
**Status:** ⚠️ PARCIAL (existe upload genérico)

**O que precisa:**
- [ ] Campo específico para nota fiscal em saídas financeiras
- [ ] Campo específico para foto de serviço feito em manutenções
- [ ] Campo específico para ata assinada em assembleias
- [ ] Validação de tipo de arquivo por contexto
- [ ] Visualização organizada por tipo

**Fluxo Operacional:**
1. **Ao criar saída:** FINANCEIRO pode anexar nota fiscal
2. **Ao finalizar manutenção:** OPERACIONAL anexa foto do serviço
3. **Ao finalizar assembleia:** SINDICO anexa ata assinada
4. **Sistema valida:** Tipo de arquivo permitido
5. **Armazena:** Com link permanente e imutável

---

## 🔐 MÓDULO 6: PERMISSÕES E SEGURANÇA

### ✅ 6.1 Definição Clara de Permissões
**Status:** ⚠️ PARCIAL (existe RBAC básico)

**O que precisa:**
- [ ] Documentação clara de permissões por role:
  - [ ] SUPER_MASTER: O que pode/não pode
  - [ ] SINDICO: O que pode/não pode
  - [ ] SUBSINDICO: O que pode/não pode
  - [ ] FINANCEIRO: O que pode/não pode
  - [ ] ADMINISTRATIVO: O que pode/não pode
  - [ ] OPERACIONAL: O que pode/não pode
  - [ ] CONSELHO: O que pode/não pode
- [ ] Validação em todas as rotas
- [ ] Mensagens de erro claras quando sem permissão

---

## 📝 MÓDULO 7: DOCUMENTAÇÃO OPERACIONAL

### ✅ 7.1 Fluxos Operacionais Documentados
**Status:** ❌ NÃO EXISTE

**O que precisa:**
- [ ] Documento com fluxos passo a passo:
  - [ ] Fluxo de fechamento mensal
  - [ ] Fluxo de aprovação de despesa
  - [ ] Fluxo de ocorrência → tarefa → pagamento
  - [ ] Fluxo de assembleia
  - [ ] Fluxo de geração de relatórios
- [ ] Cada fluxo com:
  - [ ] Quem inicia
  - [ ] O que acontece em cada passo
  - [ ] Quem valida
  - [ ] O que acontece se rejeitado
  - [ ] O que acontece se aprovado

---

## 🎯 PRIORIZAÇÃO

### 🔴 CRÍTICO (Fazer Primeiro)
1. Fechamento Mensal Financeiro
2. Inadimplência
3. Relatório Mensal em PDF
4. Gastos do Mês no Dashboard

### 🟠 IMPORTANTE (Fazer Depois)
5. Módulo de Assembleias
6. Avisos Específicos
7. Fundo de Reserva e Rateio

### 🟡 DESEJÁVEL (Fazer Por Último)
8. Anexos Específicos
9. Relatórios Operacionais em PDF
10. Documentação Operacional Completa

---

## ✅ PRÓXIMOS PASSOS

1. ✅ Criar este checklist
2. ⏭️ Implementar Fechamento Mensal
3. ⏭️ Implementar Inadimplência
4. ⏭️ Implementar Relatórios PDF
5. ⏭️ Implementar Assembleias
6. ⏭️ Implementar Avisos Específicos
7. ⏭️ Implementar Fundo de Reserva
8. ⏭️ Criar Documentação Operacional
