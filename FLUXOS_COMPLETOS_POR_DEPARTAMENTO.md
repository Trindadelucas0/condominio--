# 🔄 FLUXOS COMPLETOS POR DEPARTAMENTO
## Sistema de Gestão Condominial - Guia de Testes e Operação

**Versão:** 1.0  
**Data:** Janeiro 2026  
**Objetivo:** Guia completo de como cada funcionário age no sistema, passo a passo

---

## 📋 ÍNDICE

1. [DEPARTAMENTO OPERACIONAL](#1-departamento-operacional)
2. [DEPARTAMENTO FINANCEIRO](#2-departamento-financeiro)
3. [DEPARTAMENTO ADMINISTRATIVO](#3-departamento-administrativo)
4. [SÍNDICO/SUBSÍNDICO](#4-síndicosubsíndico)
5. [DEPARTAMENTO LIMPEZA](#5-departamento-limpeza)
6. [DEPARTAMENTO PATRIMÔNIO](#6-departamento-patrimônio)
7. [FLUXOS INTEGRADOS (Multi-Departamento)](#7-fluxos-integrados-multi-departamento)

---

## 1. DEPARTAMENTO OPERACIONAL

### 👤 **Perfil do Funcionário:**
- **Cargo:** Zelador/Operacional
- **Responsabilidades:** Executar tarefas, fazer checklists, reportar ocorrências
- **Permissões:** Execução (não aprova)

---

### 📅 **ROTINA DIÁRIA DO OPERACIONAL**

#### 🌅 **MANHÃ (08:00 - 12:00)**

**1. Login no Sistema**
- Acessa `/auth/login`
- Usuário: `operacional01`
- Senha: `[senha]`
- Sistema redireciona para `/operacional/dashboard`

**2. Dashboard Operacional**
- **O que vê:**
  - Widget: "Minhas Tarefas Pendentes" (ex: 3 tarefas)
  - Widget: "Tarefas Atrasadas" (ex: 0 tarefas)
  - Widget: "Checklists do Dia" (ex: 1 checklist pendente)
  - Widget: "Ocorrências Abertas" (ex: 2 ocorrências)

**3. Executar Checklist Diário (PRIMEIRA AÇÃO)**

**Passo a Passo:**
1. Clica em **"Checklist"** no menu ou acessa `/operacional/checklists-diarios`
2. Vê lista de checklists:
   - Checklist do dia: 15/01/2026 - Status: PENDING
   - Clica em **"Iniciar Checklist"** ou **"Ver Detalhes"**
3. Abre tela de execução do checklist (`/operacional/checklists-diarios/:id`)
4. Vê itens do checklist:
   ```
   ☐ Verificar portões elétricos
   ☐ Verificar iluminação externa
   ☐ Inspecionar elevadores
   ☐ Verificar sistema de água
   ☐ Limpar área comum
   ```
5. Para cada item:
   - **Marca checkbox** quando conclui
   - **Adiciona observação** (se necessário): Campo de texto abaixo do item
   - **Adiciona foto como evidência** (opcional): Botão "Adicionar Foto" → Seleciona foto → Upload
   - Clica **"Salvar Item"** (salva progresso)
6. Após concluir todos os itens:
   - Clica **"Finalizar Checklist"**
   - Sistema marca como COMPLETED
   - Recebe mensagem: "Checklist finalizado com sucesso!"

**4. Verificar Tarefas Atribuídas**

**Passo a Passo:**
1. Acessa **"Tarefas"** no dashboard ou `/operacional/checklist` (sistema antigo)
2. Vê lista de tarefas:
   - Tarefa 1: "Trocar lâmpada corredor 3º andar" - Status: PENDING
   - Tarefa 2: "Verificar vazamento banheiro social" - Status: PENDING
3. Clica em uma tarefa para ver detalhes
4. **Se tarefa tem checklist:**
   - Marca itens do checklist conforme executa
   - Adiciona fotos como evidência
5. **Para completar tarefa:**
   - Clica em **"Concluir Tarefa"**
   - Preenche formulário:
     - ✅ Conclusão bem sucedida? (Sim/Não)
     - Observações finais (obrigatório se houver problemas)
     - Tempo gasto (minutos)
     - Qualidade da execução (Excelente/Bom/Regular)
     - Teve problemas? (Sim/Não) → Se sim, descreve
   - Faz upload de foto do resultado (obrigatório)
   - Clica **"Confirmar Conclusão"**

**5. Reportar Ocorrências Encontradas**

**Passo a Passo:**
1. Durante a ronda, encontra problema (ex: vazamento)
2. Acessa `/operacional/ocorrencias` ou clica **"Ocorrências"** no menu
3. Clica **"Nova Ocorrência"**
4. Preenche formulário:
   - **Título:** "Vazamento no 3º Andar" (obrigatório)
   - **Descrição:** "Vazamento no corredor próximo ao apartamento 301" (obrigatório)
   - **Localização:** "Corredor 3º Andar, Bloco A" (obrigatório)
   - **Tipo:** Seleciona "Hidráulica" ou "Elétrica", etc.
   - **Prioridade:** Seleciona URGENT (ou HIGH, MEDIUM, LOW)
   - **Foto da Ocorrência:** **OBRIGATÓRIO** - Upload de 1 ou mais fotos
   - **Observações:** Informações adicionais
5. Clica **"Salvar"**
6. Sistema cria ocorrência com status:
   - Se prioridade = URGENT → "PENDING_SINDICO_APPROVAL"
   - Caso contrário → Status ABERTA (vai direto para ADMINISTRATIVO triar)

---

#### 🌆 **TARDE (13:00 - 17:00)**

**1. Resolver Ocorrências Atribuídas**

**Passo a Passo:**
1. Recebe notificação ou vê na lista de ocorrências
2. Acessa `/operacional/ocorrencias`
3. Vê ocorrência com status "EM_ATENDIMENTO" ou "ABERTA"
4. Clica em **"Ver Detalhes"** ou **"Resolver"**
5. Vê informações:
   - Fotos da ocorrência original
   - Descrição do problema
   - Observações do ADMINISTRATIVO/SINDICO
6. Executa correção/conserto
7. Clica em **"Resolver Ocorrência"** (`/operacional/ocorrencias/:id/resolver`)
8. Preenche formulário de resolução:
   - **Descrição da Resolução:** "Vazamento corrigido, trocada válvula danificada" (obrigatório)
   - **Foto(s) da Resolução:** **OBRIGATÓRIO** - Upload de foto mostrando problema resolvido
   - **Custo:** R$ 150,00 (se houver)
   - **Tempo Gasto:** 45 minutos
   - **Observações:** Detalhes adicionais
9. Clica **"Confirmar Resolução"**
10. Sistema marca ocorrência como RESOLVIDA

**2. Executar Manutenções Programadas**

**Passo a Passo:**
1. Acessa `/operacional/manutencoes`
2. Vê lista de manutenções atribuídas:
   - Manutenção 1: "Manutenção preventiva elevador 1" - Status: PENDING
   - Manutenção 2: "Troca filtro sistema de água" - Status: PENDING
3. Clica em **"Ver Detalhes"** da manutenção
4. Vê informações:
   - Tipo de manutenção
   - Orçamento aprovado (se houver)
   - Materiais necessários
5. Clica **"Iniciar Manutenção"** → Status muda para IN_PROGRESS
6. Executa manutenção
7. Clica **"Concluir Manutenção"**
8. Preenche formulário:
   - **Descrição do Trabalho:** O que foi feito
   - **Foto(s) do Resultado:** **OBRIGATÓRIO** - Upload de fotos
   - **Materiais Utilizados:** Lista de materiais
   - **Horas Trabalhadas:** 2 horas
   - **Observações:** Notas finais
9. Clica **"Confirmar Conclusão"**

**3. Ver Orçamentos Liberados**

**Passo a Passo:**
1. Acessa `/operacional/orcamentos`
2. Vê lista de orçamentos com status LIBERATED
3. Clica em **"Ver Detalhes"** para ver:
   - Valor liberado
   - Descrição do serviço
   - Observações do financeiro
4. Pode executar serviço quando orçamento estiver liberado

---

#### 🌙 **FINAL DO DIA**

**1. Verificar Pendências**
- Dashboard mostra tarefas/ocorrências não concluídas
- Anota para próximo dia se necessário

**2. Logout**
- Clica **"Sair"** no menu superior

---

### 🎯 **AÇÕES DISPONÍVEIS AO OPERACIONAL**

| Ação | Como Acessar | O Que Faz |
|------|--------------|-----------|
| **Executar Checklist** | Menu "Checklist" → "Checklists Diários" | Marca itens, adiciona fotos |
| **Ver Tarefas** | Dashboard → "Minhas Tarefas" | Vê tarefas atribuídas |
| **Concluir Tarefa** | Detalhes da tarefa → "Concluir" | Finaliza tarefa com evidências |
| **Criar Ocorrência** | Menu "Ocorrências" → "Nova" | Reporta problema com foto |
| **Resolver Ocorrência** | Detalhes da ocorrência → "Resolver" | Marca como resolvida |
| **Ver Manutenções** | Menu "Manutenções" | Vê manutenções atribuídas |
| **Concluir Manutenção** | Detalhes → "Concluir" | Finaliza manutenção |
| **Ver Orçamentos** | Menu → "Orçamentos Liberados" | Vê orçamentos para execução |

---

### ⚠️ **RESTRIÇÕES DO OPERACIONAL**

- ❌ **NÃO pode** aprovar entradas/saídas financeiras
- ❌ **NÃO pode** criar orçamentos
- ❌ **NÃO pode** aprovar ocorrências
- ❌ **NÃO pode** marcar pagamentos como recebidos
- ✅ **PODE** apenas executar tarefas, checklists e reportar ocorrências

---

## 2. DEPARTAMENTO FINANCEIRO

### 👤 **Perfil do Funcionário:**
- **Cargo:** Assistente/Coordenador Financeiro
- **Responsabilidades:** Gestão de entradas, saídas, fechamento mensal
- **Permissões:** Aprova até limite, marca como recebido/pago

---

### 📅 **ROTINA DIÁRIA DO FINANCEIRO**

#### 🌅 **MANHÃ (08:00 - 12:00)**

**1. Login e Dashboard**
- Acessa `/auth/login` → Credenciais financeiro
- Redirecionado para `/financeiro/dashboard`
- **Vê widgets:**
  - Saldo Atual: R$ 25.000,00
  - Entradas Pendentes: 5
  - Saídas Pendentes: 3
  - Gastos do Mês: R$ 8.500,00
  - Inadimplência: R$ 1.200,00

**2. Processar Entradas (Recebimentos)**

**Passo a Passo:**
1. Acessa `/financeiro/entradas`
2. Vê lista de entradas:
   - Entrada 1: "Taxa Apartamento 101" - Status: APPROVED
   - Entrada 2: "Taxa Apartamento 102" - Status: APPROVED
3. Para cada entrada com status APPROVED:
   - Clica em **"Receber"**
   - Preenche formulário (`/financeiro/entradas/:id/receber`):
     - **Método de Recebimento:** Seleciona (Dinheiro, Transferência, Boleto)
     - **Data de Recebimento:** 15/01/2026
     - **Comprovante em PDF:** **OBRIGATÓRIO** - Upload do comprovante
     - **Detalhes:** Número da transação, etc.
     - **Observações:** Notas adicionais
   - Clica **"Confirmar Recebimento"**
4. Sistema:
   - Marca entrada como RECEIVED
   - Atualiza saldo do condomínio automaticamente
   - Registra no histórico

**3. Criar Novas Entradas (Taxas, etc.)**

**Passo a Passo:**
1. Clica **"Nova Entrada"**
2. Preenche (`/financeiro/entradas/nova`):
   - **Descrição:** "Taxa Condomínio - Apartamento 103"
   - **Valor:** R$ 500,00
   - **Data Esperada:** 20/01/2026
   - **Categoria:** "Taxa Mensal"
   - **Centro de Custo:** Seleciona
   - **Observações:** Referente a janeiro/2026
3. Clica **"Salvar"**
4. Sistema verifica valor:
   - **Se valor ≤ limite (ex: R$ 1.000,00):** Aprovação automática (status = APPROVED)
   - **Se valor > limite:** Marca como PENDING_SINDICO (síndico aprova)

**4. Processar Saídas (Pagamentos)**

**Passo a Passo:**
1. Acessa `/financeiro/saidas`
2. Vê saídas com status APPROVED
3. Para cada saída aprovada:
   - Clica **"Pagar"**
   - Preenche (`/financeiro/saidas/:id/pagar`):
     - **Comprovante em PDF:** **OBRIGATÓRIO** - Upload
     - **Método de Pagamento:** Transferência, Boleto, etc.
     - **Data de Pagamento:** 15/01/2026
     - **Detalhes:** Dados da transação
   - Clica **"Confirmar Pagamento"**
4. Sistema marca como PAID e atualiza saldo

**5. Criar Nova Saída (Pagamento a Fornecedor)**

**Passo a Passo:**
1. Clica **"Nova Saída"**
2. Preenche (`/financeiro/saidas/nova`):
   - **Descrição:** "Pagamento Fornecedor Limpeza"
   - **Valor:** R$ 800,00
   - **Data de Vencimento:** 20/01/2026
   - **Fornecedor:** "Limpeza ABC Ltda"
   - **Categoria:** "Manutenção"
   - **Centro de Custo:** "Limpeza"
3. Clica **"Salvar"**
4. Sistema verifica:
   - **Se valor ≤ limite:** Aprovação automática (FINANCEIRO)
   - **Se valor > limite:** Marca como PENDING_SINDICO

---

#### 🌆 **TARDE (13:00 - 17:00)**

**1. Gestão de Taxas Mensais**

**Passo a Passo:**
1. Acessa `/financeiro/taxas`
2. **Criar taxas mensais:**
   - Clica **"Nova Taxa"**
   - Seleciona apartamento
   - Preenche mês (janeiro), ano (2026), valor (R$ 500)
   - Data de vencimento: 10/02/2026
   - Salva
3. **Marcar taxas como pagas:**
   - Na lista, clica **"Pagar"** na taxa recebida
   - Preenche data e método
   - Confirma

**2. Gestão de Apartamentos**

**Passo a Passo:**
1. Acessa `/financeiro/apartamentos`
2. **Novo apartamento:**
   - Clica **"Novo Apartamento"**
   - Preenche: Bloco A, Nº 101, Proprietário "João Silva", CPF, Telefone
   - Salva
3. **Editar:** Clica em "Editar" para atualizar dados

**3. Revisar Orçamentos (Fluxo com ADMINISTRATIVO/SINDICO)**

**Passo a Passo:**
1. Acessa `/financeiro/orcamentos-pendentes`
2. Vê solicitações de orçamento aguardando revisão
3. Para cada orçamento:
   - Clica **"Revisar"**
   - Preenche:
     - **Observações do Financeiro:** "Orçamento dentro do esperado"
     - **Centro de Custo:** Seleciona (ex: "Manutenção")
   - Clica **"Enviar para Síndico"**
4. Sistema marca como PENDING_SINDICO

**4. Liberar Orçamentos Aprovados**

**Passo a Passo:**
1. Acessa `/financeiro/orcamentos-aprovados`
2. Vê orçamentos aprovados pelo síndico
3. Para liberar:
   - Clica **"Liberar"**
   - Adiciona observações (opcional)
   - Clica **"Confirmar Liberação"**
4. Sistema marca como LIBERATED → OPERACIONAL pode executar

---

#### 📊 **FINAL DO MÊS**

**1. Fechamento Mensal**

**Passo a Passo:**
1. Acessa `/financeiro/fechamento-mensal`
2. Sistema mostra:
   - Resumo do mês (Janeiro/2026)
   - Validações:
     - ✅ Entradas não recebidas: 0
     - ⚠️ Saídas não pagas: 2 (verificar antes de fechar)
   - Total Entradas: R$ 15.000,00
   - Total Saídas: R$ 10.000,00
   - Saldo Final: R$ 5.000,00
3. **Antes de fechar:**
   - Verifica e paga saídas pendentes
   - Marca entradas como recebidas
4. **Fechar mês:**
   - Clica **"Fechar Mês"**
   - Preenche observações (opcional): "Mês fechado normalmente"
   - Clica **"Confirmar Fechamento"**
5. Sistema:
   - Cria registro imutável
   - Bloqueia edições no mês fechado
   - Marca como FECHED

**2. Gerar Relatórios Mensais**

**Passo a Passo:**
1. Acessa `/financeiro/relatorios`
2. Clica **"Gerar Relatório Mensal"**
3. Seleciona:
   - Mês: Janeiro
   - Ano: 2026
   - Formato: PDF ou Excel
4. Clica **"Gerar Relatório"**
5. Sistema gera e disponibiliza para download

---

### 🎯 **AÇÕES DISPONÍVEIS AO FINANCEIRO**

| Ação | URL/Menu | O Que Faz |
|------|----------|-----------|
| **Criar Entrada** | `/financeiro/entradas/nova` | Registra recebimento esperado |
| **Marcar como Recebida** | `/financeiro/entradas/:id/receber` | Confirma recebimento com comprovante |
| **Criar Saída** | `/financeiro/saidas/nova` | Registra pagamento a fazer |
| **Marcar como Paga** | `/financeiro/saidas/:id/pagar` | Confirma pagamento com comprovante |
| **Criar Taxa** | `/financeiro/taxas/nova` | Gera taxa mensal para apartamento |
| **Aprovar (até limite)** | Automático se valor ≤ limite | Sistema aprova automaticamente |
| **Revisar Orçamento** | `/financeiro/orcamentos-pendentes` | Adiciona centro de custo |
| **Liberar Orçamento** | `/financeiro/orcamentos-aprovados` | Libera valor para execução |
| **Fechar Mês** | `/financeiro/fechamento-mensal` | Finaliza mês (imutável) |
| **Gerar Relatório** | `/financeiro/relatorios` | PDF/Excel do mês |

---

### ⚠️ **RESTRIÇÕES DO FINANCEIRO**

- ❌ **NÃO pode** aprovar valores acima do limite (SINDICO aprova)
- ❌ **NÃO pode** criar tarefas para operacional
- ❌ **NÃO pode** triar ocorrências
- ✅ **PODE** aprovar até limite definido
- ✅ **PODE** marcar como recebido/pago
- ✅ **PODE** criar entradas/saídas/taxas

---

## 3. DEPARTAMENTO ADMINISTRATIVO

### 👤 **Perfil do Funcionário:**
- **Cargo:** Coordenador Administrativo
- **Responsabilidades:** Coordenar tarefas, triar ocorrências, criar orçamentos
- **Permissões:** Coordenação operacional

---

### 📅 **ROTINA DIÁRIA DO ADMINISTRATIVO**

#### 🌅 **MANHÃ (08:00 - 12:00)**

**1. Login e Dashboard**
- Acessa `/administrativo/dashboard`
- **Vê widgets:**
  - Tarefas Pendentes: 5
  - Ocorrências Abertas: 3
  - Documentos Vencendo: 2
  - Orçamentos Pendentes: 1

**2. Triar Ocorrências (AÇÃO PRINCIPAL)**

**Passo a Passo:**
1. Acessa `/administrativo/ocorrencias/pendentes`
2. Vê ocorrências aguardando triagem:
   - Ocorrência 1: "Vazamento 3º Andar" - Status: ABERTA (aprovada pelo síndico)
   - Ocorrência 2: "Lâmpada queimada" - Status: ABERTA
3. Para cada ocorrência:
   - Clica em **"Triar"** ou acessa `/administrativo/ocorrencias/:id/triar`
4. Preenche formulário de triagem:
   - **Classificação:** Tipo de problema (Hidráulico, Elétrico, etc.)
   - **Prioridade:** URGENT, HIGH, MEDIUM, LOW
   - **Criar Tarefa?** ☑ Sim
     - Se marcado, aparecem campos:
       - **Responsável:** Seleciona OPERACIONAL (ex: "João - Zelador")
       - **Prazo:** 2 horas
       - **Descrição:** Automática (pode editar)
   - **Criar Orçamento?** ☑ Sim (se necessário)
     - Se marcado, aparecem campos:
       - **Valor Estimado:** R$ 500,00
       - **Tipo:** Material, Serviço
       - **Upload Orçamento PDF:** Anexa PDF
   - **Observações da Triagem:** "Priorizar devido ao risco de infiltração"
5. Clica **"Confirmar Triagem"**
6. Sistema:
   - Atualiza status da ocorrência para "EM_ANALISE"
   - Cria tarefa automaticamente (se marcado)
   - Cria solicitação de orçamento (se marcado)
   - Notifica OPERACIONAL (se tarefa criada)

**3. Criar Tarefas Manualmente**

**Passo a Passo:**
1. Acessa `/administrativo/tarefas`
2. Clica **"Nova Tarefa"**
3. Preenche (`/administrativo/tarefas/nova`):
   - **Título:** "Verificar sistema de segurança"
   - **Descrição:** "Checar câmeras e sensores"
   - **Responsável:** Seleciona OPERACIONAL
   - **Prioridade:** HIGH
   - **Data de Vencimento:** 20/01/2026 17:00
   - **Tipo:** "Manutenção"
   - **Itens de Checklist** (opcional):
     - Item 1: "Verificar câmeras"
     - Item 2: "Testar sensores"
     - Item 3: "Checar gravações"
4. Clica **"Salvar"**
5. Sistema cria tarefa e notifica OPERACIONAL

**4. Verificar Tarefas em Andamento**

**Passo a Passo:**
1. Acessa `/administrativo/tarefas`
2. Vê lista:
   - Tarefas PENDING (aguardando execução)
   - Tarefas IN_PROGRESS (em execução)
   - Tarefas COMPLETED (concluídas)
3. Clica em tarefa COMPLETED para verificar:
   - Fotos do resultado
   - Observações do operacional
   - Tempo gasto
4. **Se necessário reabrir:**
   - Clica **"Reabrir Tarefa"**
   - Preenche motivo: "Precisa correção adicional"
   - Confirma → Tarefa volta para PENDING

---

#### 🌆 **TARDE (13:00 - 17:00)**

**1. Criar Solicitação de Orçamento**

**Passo a Passo:**
1. Acessa `/administrativo/orcamentos`
2. Clica **"Nova Solicitação"**
3. Preenche (`/administrativo/orcamentos/novo`):
   - **Descrição:** "Troca de portão elétrico - Entrada principal"
   - **Valor Estimado:** R$ 3.500,00
   - **Tipo:** "Serviço"
   - **Anexar Orçamento PDF:** **OBRIGATÓRIO** - Upload do PDF
   - **Observações:** "Orçamento recebido do fornecedor XYZ"
   - **Urgência:** ALTA
4. Clica **"Salvar"**
5. Sistema:
   - Marca como PENDING_FINANCEIRO
   - Notifica FINANCEIRO para revisar
   - FINANCEIRO revisa → SINDICO aprova → FINANCEIRO libera

**2. Gestão de Documentos**

**Passo a Passo:**
1. Acessa `/administrativo/documentos`
2. **Criar documento:**
   - Clica **"Novo Documento"**
   - Preenche:
     - **Nome:** "Contrato Limpeza 2026"
     - **Categoria:** Seleciona "Contratos"
     - **Arquivo PDF:** Upload
     - **Data de Vencimento:** 31/12/2026
   - Salva
3. **Criar categoria:**
   - Menu "Categorias" → "Nova Categoria"
   - Preenche nome e descrição
   - Salva
4. Sistema alerta quando documento próximo ao vencimento

**3. Verificar Ocorrências Triadas**

**Passo a Passo:**
1. Acessa `/administrativo/ocorrencias`
2. Vê ocorrências:
   - Em análise (aguardando execução)
   - Resolvidas (aguardando verificação)
3. Clica em ocorrência RESOLVIDA para verificar:
   - Fotos da resolução
   - Descrição do trabalho
   - Custo (se houver)
4. Pode fechar ocorrência se estiver OK

---

### 🎯 **AÇÕES DISPONÍVEIS AO ADMINISTRATIVO**

| Ação | URL/Menu | O Que Faz |
|------|----------|-----------|
| **Triar Ocorrência** | `/administrativo/ocorrencias/:id/triar` | Classifica e cria tarefa/orçamento |
| **Criar Tarefa** | `/administrativo/tarefas/nova` | Atribui tarefa ao operacional |
| **Reabrir Tarefa** | Detalhes da tarefa → "Reabrir" | Reabre tarefa concluída |
| **Criar Orçamento** | `/administrativo/orcamentos/novo` | Solicita aprovação financeira |
| **Gerir Documentos** | `/administrativo/documentos` | Cadastra e controla documentos |
| **Aprovar (até limite)** | `/administrativo/aprovacoes-financeiras` | Aprova entradas/saídas até limite |

---

### ⚠️ **RESTRIÇÕES DO ADMINISTRATIVO**

- ❌ **NÃO tem** acesso direto a financeiro/patrimônio (módulos separados)
- ❌ **NÃO pode** aprovar valores acima do limite
- ❌ **NÃO pode** marcar pagamentos como recebidos
- ✅ **PODE** criar tarefas e orçamentos
- ✅ **PODE** triar ocorrências

---

## 4. SÍNDICO/SUBSÍNDICO

### 👤 **Perfil do Funcionário:**
- **Cargo:** Síndico/Subsíndico
- **Responsabilidades:** Aprovações, supervisão geral
- **Permissões:** Aprova tudo acima do limite

---

### 📅 **ROTINA DIÁRIA DO SÍNDICO**

#### 🌅 **MANHÃ (09:00 - 12:00)**

**1. Login e Dashboard**
- Acessa `/sindico/dashboard`
- **Vê widgets principais:**
  - **Inadimplência:** R$ 1.200,00 (3 apartamentos)
  - **Saldo Atual:** R$ 25.000,00
  - **Gastos do Mês:** R$ 8.500,00
  - **Alertas Críticos:** 2 alertas
  - **Aprovações Pendentes:** 5 itens

**2. Aprovar Entradas Financeiras (Valores Acima do Limite)**

**Passo a Passo:**
1. Clica em widget "Aprovações Pendentes" ou acessa `/sindico/aprovacoes`
2. Vê resumo:
   - Entradas pendentes: 2
   - Saídas pendentes: 2
   - Orçamentos pendentes: 1
3. Clica **"Ver Entradas Pendentes"** ou acessa `/sindico/entradas-pendentes`
4. Vê lista de entradas aguardando aprovação (valores > limite)
5. Para cada entrada:
   - Clica em **"Ver Detalhes"** (se houver botão)
   - Clica **"Aprovar"**
   - Preenche (se solicitado):
     - **Observações de Aprovação:** "Aprovado conforme orçamento"
   - Clica **"Confirmar Aprovação"**
   - OU clica **"Rejeitar"**:
     - Preenche **"Motivo da Rejeição"** (obrigatório): "Valor inconsistente"
     - Clica **"Confirmar Rejeição"**
6. Sistema atualiza status e notifica FINANCEIRO

**3. Aprovar Saídas Financeiras (Valores Acima do Limite)**

**Passo a Passo:**
1. Acessa `/sindico/saidas-pendentes`
2. Vê saídas aguardando aprovação
3. Para cada saída:
   - Clica **"Aprovar"** ou **"Rejeitar"**
   - Se rejeitar: Preenche motivo (obrigatório)
   - Confirma

**4. Aprovar/Rejeitar Ocorrências**

**Passo a Passo:**
1. Acessa `/sindico/ocorrencias-pendentes-aprovacao`
2. Vê ocorrências criadas pelo OPERACIONAL aguardando aprovação
3. Para cada ocorrência:
   - Vê detalhes:
     - Título, descrição, fotos
     - Prioridade, localização
   - Clica **"Aprovar Ocorrência"**:
     - Botão verde "Confirmar Aprovação"
     - Sistema marca como aprovada → ADMINISTRATIVO pode triar
   - OU clica **"Rejeitar"**:
     - Preenche **"Motivo da Rejeição"** (obrigatório)
     - Clica "Confirmar Rejeição"
     - Sistema notifica OPERACIONAL

**5. Aprovar/Rejeitar Orçamentos**

**Passo a Passo:**
1. Acessa `/sindico/orcamentos-pendentes`
2. Vê orçamentos já revisados pelo FINANCEIRO
3. Para cada orçamento:
   - Vê:
     - Descrição do serviço
     - Valor solicitado
     - Valor aprovado pelo financeiro
     - PDF anexado
     - Observações do financeiro
   - Clica **"Aprovar"**:
     - Preenche **"Valor Aprovado"** (pode ser diferente do solicitado): R$ 3.000,00
     - **Observações de Aprovação:** "Aprovar com ajuste de valor"
     - Clica "Confirmar Aprovação"
   - OU clica **"Rejeitar"**:
     - **Motivo da Rejeição:** "Orçamento acima do esperado"
     - Confirma
4. Sistema marca como APPROVED → FINANCEIRO libera

---

#### 🌆 **TARDE (14:00 - 17:00)**

**1. Visualizar e Adicionar Observações em Tarefas**

**Passo a Passo:**
1. Acessa `/sindico/tarefas`
2. Vê lista de todas as tarefas do condomínio
3. Clica em uma tarefa para ver detalhes (`/sindico/tarefas/:id`)
4. **Na tela de detalhes:**
   - Vê seção **"Observações do Síndico"**
   - **Se houver observações:** Vê lista de observações anteriores
   - **Para adicionar:**
     - Rola até seção "Observações do Síndico"
     - Preenche campo **"Adicionar Observação"**:
       ```
       "Favor verificar com atenção os sensores do portão elétrico.
       Foi reportado problema anterior."
       ```
     - Clica **"Adicionar Observação"**
     - Sistema salva e exibe na lista
     - OPERACIONAL vê observação na tarefa

**2. Visualizar e Adicionar Observações em Ocorrências**

**Passo a Passo:**
1. Acessa `/sindico/ocorrencias`
2. Vê lista de ocorrências
3. Clica em ocorrência para ver detalhes (`/sindico/ocorrencias/:id`)
4. **Na tela de detalhes:**
   - Vê seção **"Observações do Síndico"**
   - **Para adicionar:**
     - Preenche campo de texto "Adicionar Observação"
     - Clica **"Adicionar Observação"**
   - Observação aparece para ADMINISTRATIVO e OPERACIONAL

**3. Verificar Alertas Críticos**

**Passo a Passo:**
1. Acessa `/sindico/alertas`
2. Vê lista de alertas:
   - Alerta 1: "SLA Violado - Tarefa #123" (CRITICAL)
   - Alerta 2: "Documento vencendo - Contrato Limpeza" (WARNING)
3. Para cada alerta:
   - Clica **"Ver Detalhes"** (abre item relacionado)
   - OU clica **"Resolver"** (marca alerta como resolvido)

**4. Ver Logs de Auditoria**

**Passo a Passo:**
1. Acessa `/sindico/logs`
2. Vê histórico de ações no sistema
3. Filtra por:
   - Data inicial/final
   - Usuário
   - Tipo de ação
4. Analisa auditoria de operações críticas

**5. Gestão de Modelos de Checklist**

**Passo a Passo:**
1. Acessa `/sindico/checklist-modelos`
2. **Criar novo modelo:**
   - Clica **"Novo Modelo"**
   - Preenche:
     - **Nome:** "Checklist Diário - Manhã"
     - **Descrição:** "Itens a verificar pela manhã"
     - **Itens do Checklist:**
       - Item 1: "Verificar portões"
       - Item 2: "Verificar elevadores"
       - Item 3: "Inspecionar área comum"
     - **Status:** Ativo
   - Clica **"Salvar"**
3. Sistema usa modelo para gerar checklists diários automaticamente

---

### 🎯 **AÇÕES DISPONÍVEIS AO SÍNDICO**

| Ação | URL/Menu | O Que Faz |
|------|----------|-----------|
| **Aprovar Entrada** | `/sindico/entradas-pendentes` | Aprova valores > limite |
| **Aprovar Saída** | `/sindico/saidas-pendentes` | Aprova valores > limite |
| **Aprovar Ocorrência** | `/sindico/ocorrencias-pendentes-aprovacao` | Aprova ocorrências reportadas |
| **Aprovar Orçamento** | `/sindico/orcamentos-pendentes` | Aprova valor final |
| **Adicionar Observação (Tarefa)** | `/sindico/tarefas/:id` → Seção Observações | Orienta execução |
| **Adicionar Observação (Ocorrência)** | `/sindico/ocorrencias/:id` → Seção Observações | Comenta ocorrência |
| **Ver Alertas** | `/sindico/alertas` | Monitora problemas |
| **Ver Logs** | `/sindico/logs` | Auditoria |
| **Criar Modelo Checklist** | `/sindico/checklist-modelos` | Define checklists diários |

---

### ⚠️ **OBSERVAÇÕES IMPORTANTES**

- ✅ **PODE** aprovar qualquer valor (não tem limite)
- ✅ **PODE** adicionar observações em tarefas/ocorrências
- ❌ **NÃO executa** tarefas (regra: quem decide não executa)
- ✅ **Visualiza** tudo, mas não faz execução prática

---

## 5. DEPARTAMENTO LIMPEZA

### 👤 **Perfil do Funcionário:**
- **Cargo:** Equipe de Limpeza
- **Responsabilidades:** Checklists de limpeza, reportar problemas
- **Permissões:** Execução (similar ao operacional)

---

### 📅 **ROTINA DA LIMPEZA**

**1. Login e Dashboard**
- Acessa `/limpeza/dashboard`
- Vê widgets de limpeza

**2. Executar Checklist de Limpeza**
- Acessa `/operacional/checklists-diarios` (compartilhado)
- Executa itens de limpeza do checklist

**3. Reportar Ocorrências de Limpeza**
- Acessa `/limpeza/ocorrencias/nova`
- Cria ocorrência específica de limpeza
- **Se for problema técnico:** Sistema redireciona automaticamente para OPERACIONAL

---

## 6. DEPARTAMENTO PATRIMÔNIO

### 👤 **Perfil do Funcionário:**
- **Cargo:** Gestor Patrimonial
- **Responsabilidades:** Cadastro de ativos, manutenções

---

### 📅 **ROTINA DO PATRIMÔNIO**

**1. Cadastrar Ativos**
- Acessa `/patrimonio/ativos/novo`
- Preenche dados do ativo, foto, valor

**2. Criar Manutenção de Ativo**
- Acessa `/patrimonio/ativos/:id/manutencao/nova`
- Agenda manutenção preventiva/corretiva

---

## 7. FLUXOS INTEGRADOS (Multi-Departamento)

### 🔄 **FLUXO 1: Ocorrência → Tarefa → Resolução Completa**

**Cenário:** Vazamento no condomínio

**Passo a Passo:**

1. **OPERACIONAL (08:30)**
   - Encontra vazamento
   - Cria ocorrência com foto
   - Prioridade: URGENT
   - Sistema marca como PENDING_SINDICO_APPROVAL

2. **SINDICO (09:00)**
   - Recebe notificação
   - Acessa `/sindico/ocorrencias-pendentes-aprovacao`
   - Vê ocorrência, clica "Aprovar"
   - Sistema marca como aprovada → Status: ABERTA

3. **ADMINISTRATIVO (09:30)**
   - Vê ocorrência aprovada em `/administrativo/ocorrencias/pendentes`
   - Clica "Triar"
   - Preenche:
     - Classificação: Hidráulico
     - Prioridade: URGENT
     - ☑ Criar Tarefa:
       - Responsável: OPERACIONAL "João"
       - Prazo: 1 hora
     - ☑ Criar Orçamento:
       - Valor: R$ 500,00
       - Upload PDF
   - Clica "Confirmar Triagem"
   - Sistema cria tarefa e orçamento automaticamente

4. **FINANCEIRO (10:00)**
   - Vê orçamento em `/financeiro/orcamentos-pendentes`
   - Clica "Revisar"
   - Adiciona centro de custo: "Manutenção"
   - Clica "Enviar para Síndico"

5. **SINDICO (10:30)**
   - Vê orçamento em `/sindico/orcamentos-pendentes`
   - Clica "Aprovar"
   - Valor aprovado: R$ 500,00
   - Confirma

6. **FINANCEIRO (11:00)**
   - Vê orçamento aprovado em `/financeiro/orcamentos-aprovados`
   - Clica "Liberar"
   - Sistema marca como LIBERATED

7. **OPERACIONAL (11:30)**
   - Vê tarefa atribuída no dashboard
   - Executa correção
   - Acessa ocorrência em `/operacional/ocorrencias/:id`
   - Clica "Resolver Ocorrência"
   - Preenche:
     - Descrição: "Vazamento corrigido"
     - Foto da resolução
     - Custo: R$ 450,00
   - Confirma → Status: RESOLVIDA

8. **ADMINISTRATIVO (12:00)**
   - Verifica ocorrência resolvida
   - Fecha ocorrência se OK

---

### 🔄 **FLUXO 2: Fechamento Mensal Completo**

**Cenário:** Fechar janeiro/2026

**Participantes:** FINANCEIRO

**Passo a Passo:**

1. **Semana antes do fechamento:**
   - Verifica entradas não recebidas
   - Verifica saídas não pagas
   - Faz ajustes necessários

2. **Último dia do mês:**
   - Acessa `/financeiro/fechamento-mensal`
   - Sistema mostra:
     - Entradas: R$ 15.000,00 (todas recebidas ✅)
     - Saídas: R$ 10.000,00 (todas pagas ✅)
     - Saldo: R$ 5.000,00
   - Validações OK

3. **Fechar:**
   - Clica "Fechar Mês"
   - Observações: "Janeiro/2026 fechado normalmente"
   - Confirma

4. **Pós-fechamento:**
   - Mês fica bloqueado para edição
   - Relatório mensal pode ser gerado
   - Dados imutáveis

---

## 🎯 **CHECKLIST DE TESTE POR DEPARTAMENTO**

Use este checklist para testar cada departamento:

### ✅ **OPERACIONAL:**
- [ ] Login funciona
- [ ] Dashboard carrega widgets
- [ ] Checklist diário pode ser executado
- [ ] Fotos podem ser adicionadas no checklist
- [ ] Tarefa pode ser concluída com evidências
- [ ] Ocorrência pode ser criada com foto
- [ ] Ocorrência pode ser resolvida com foto

### ✅ **FINANCEIRO:**
- [ ] Dashboard carrega saldo/entradas/saídas
- [ ] Entrada pode ser criada
- [ ] Entrada pode ser marcada como recebida (com PDF)
- [ ] Saída pode ser criada
- [ ] Saída pode ser marcada como paga (com PDF)
- [ ] Taxa pode ser criada
- [ ] Taxa pode ser marcada como paga
- [ ] Fechamento mensal funciona
- [ ] Relatório mensal é gerado

### ✅ **ADMINISTRATIVO:**
- [ ] Dashboard carrega estatísticas
- [ ] Ocorrência pode ser triada
- [ ] Tarefa pode ser criada na triagem
- [ ] Orçamento pode ser criado na triagem
- [ ] Tarefa manual pode ser criada
- [ ] Tarefa pode ser reaberta
- [ ] Documento pode ser cadastrado

### ✅ **SINDICO:**
- [ ] Dashboard carrega com widgets
- [ ] Entradas pendentes aparecem e podem ser aprovadas/rejeitadas
- [ ] Saídas pendentes aparecem e podem ser aprovadas/rejeitadas
- [ ] Ocorrências pendentes aparecem e podem ser aprovadas/rejeitadas
- [ ] Orçamentos pendentes aparecem e podem ser aprovados/rejeitados
- [ ] **Observação em tarefa pode ser adicionada** ⚠️ TESTAR
- [ ] **Observação em ocorrência pode ser adicionada** ⚠️ TESTAR
- [ ] Modelo de checklist pode ser criado
- [ ] Alertas aparecem
- [ ] Logs podem ser visualizados

---

## ⚠️ **PROBLEMAS IDENTIFICADOS**

### 🔴 **CRÍTICO:**

1. **Observações em Tarefas/Ocorrências:**
   - **Problema:** Usuário não consegue ver/adicionar observações
   - **Verificar:**
     - Rota `/sindico/tarefas/:id/observacao` existe?
     - Rota `/sindico/ocorrencias/:id/observacao` existe?
     - Controller `addTaskObservation` funciona?
     - Controller `addOccurrenceObservation` funciona?
   - **Solução:** Verificar código em `src/controllers/sindicoController.js` e rotas

---

**Última Atualização:** Janeiro 2026  
**Versão:** 1.0
