# 📚 TUTORIAL COMPLETO DO SISTEMA
## Sistema de Gestão Condominial - ÊXITO CONDOMÍNIOS

**Versão:** 1.0  
**Data:** Janeiro 2026  
**Propósito:** Documentação completa para treinamento de clientes e identificação de funcionalidades

---

## 📋 ÍNDICE

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Acesso e Autenticação](#2-acesso-e-autenticação)
3. [Módulo SÍNDICO](#3-módulo-síndico)
4. [Módulo FINANCEIRO](#4-módulo-financeiro)
5. [Módulo ADMINISTRATIVO](#5-módulo-administrativo)
6. [Módulo OPERACIONAL](#6-módulo-operacional)
7. [Módulo LIMPEZA](#7-módulo-limpeza)
8. [Módulo PATRIMÔNIO](#8-módulo-patrimônio)
9. [Módulo ESTOQUE](#9-módulo-estoque)
10. [Módulo MASTER](#10-módulo-master)
11. [Módulo CONSELHO](#11-módulo-conselho)
12. [Fluxos Principais Completos](#12-fluxos-principais-completos)
13. [Cenários de Treinamento](#13-cenários-de-treinamento)
14. [Checklist de Funcionalidades](#14-checklist-de-funcionalidades)

---

## 1. VISÃO GERAL DO SISTEMA

### 1.1 Estrutura de Perfis (Roles)

O sistema possui **10 perfis** principais com permissões específicas:

| Perfil | Descrição | Acesso Principal |
|--------|-----------|------------------|
| **SUPER_MASTER** | Administrador do sistema (multi-condomínio) | Gestão de condomínios e usuários |
| **SINDICO** | Síndico do condomínio | Aprovações, visualização geral |
| **SUBSINDICO** | Substituto do síndico | Mesmas permissões do SINDICO |
| **FINANCEIRO** | Gestão financeira | Entradas, saídas, fechamento mensal |
| **ADMINISTRATIVO** | Coordenação operacional | Tarefas, ocorrências, documentos |
| **OPERACIONAL** | Zeladoria | Checklists, execução de tarefas |
| **LIMPEZA** | Equipe de limpeza | Checklists de limpeza, ocorrências |
| **PATRIMONIO** | Gestão patrimonial | Ativos, manutenções |
| **CONSELHO** | Conselho fiscal | Visualização e relatórios |
| **ESTOQUE** | Gestão de insumos | Cadastro e movimentação |

### 1.2 Principais Regras de Negócio

1. **Quem Executa Não Decide**: OPERACIONAL executa, mas não aprova
2. **Quem Decide Não Executa**: SINDICO aprova, mas não marca checklist
3. **Imutabilidade**: Mês fechado = bloqueio automático
4. **Dupla Aprovação**: Até limite = FINANCEIRO, Acima = SINDICO
5. **Evidência Obrigatória**: Fotos em tarefas, PDFs em pagamentos
6. **SLA e Escalonamento**: Tarefas têm prazo e alertas automáticos

---

## 2. ACESSO E AUTENTICAÇÃO

### 2.1 Tela de Login

**URL:** `/auth/login` ou `/`

**Campos:**
- **Usuário (username)**: Nome de usuário cadastrado
- **Senha**: Senha do usuário

**Botões:**
- **Entrar**: Submete credenciais e autentica

**Fluxo:**
1. Usuário acessa a URL inicial
2. Sistema redireciona para `/auth/login`
3. Usuário preenche credenciais
4. Sistema valida e gera token JWT
5. Redireciona para dashboard conforme perfil

**Dashboard de Redirecionamento:**
- SUPER_MASTER → `/master/dashboard`
- SINDICO/SUBSINDICO → `/sindico/dashboard`
- FINANCEIRO → `/financeiro/dashboard`
- ADMINISTRATIVO → `/administrativo/dashboard`
- OPERACIONAL → `/operacional/dashboard`
- LIMPEZA → `/limpeza/dashboard`
- PATRIMONIO → `/patrimonio/dashboard`
- CONSELHO → `/conselho/dashboard`

### 2.2 Logout

**Localização:** Menu superior (canto direito)

**Botão:** "Sair"

**Ação:** Remove cookie de autenticação e redireciona para login

---

## 3. MÓDULO SÍNDICO

### 3.1 Dashboard do Síndico

**URL:** `/sindico/dashboard`

**Widgets Exibidos:**
- **Inadimplência**: Taxa e valor total em aberto
- **Saldo Atual**: Saldo financeiro do condomínio
- **Gastos do Mês**: Despesas do mês atual
- **Alertas Críticos**: Alertas pendentes de ação
- **Aprovações Pendentes**: Quantidade de itens aguardando aprovação
- **Gráficos**: Variação mensal, distribuição de gastos

**Ações Disponíveis:**
- Visualizar estatísticas em tempo real
- Clicar em widgets para detalhes
- Configurar widgets visíveis (arrastar e soltar)

### 3.2 Menu de Navegação

**Itens do Menu:**
1. Síndico - Dashboard
2. Tarefas
3. Ocorrências
4. Aprovações
5. Manutenções
6. Alertas
7. Logs
8. Assembleias

---

### 3.3 GESTÃO DE TAREFAS

#### 3.3.1 Listar Tarefas

**URL:** `/sindico/tarefas`

**Tela Mostra:**
- Lista de todas as tarefas do condomínio
- Filtros: Status, Busca textual, Data
- Paginação
- Ordenação por prioridade

**Botões/Ações:**
- **Ver Detalhes** (em cada tarefa): Abre detalhes da tarefa
- **Buscar**: Filtra tarefas por texto
- **Filtrar**: Por status, data, prioridade
- **Exportar Relatório**: Botão "Gerar Relatório"
  - Formato: Excel ou PDF
  - Filtros aplicados são mantidos no relatório

**Campos Visíveis:**
- ID da Tarefa
- Título
- Responsável
- Status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- Prioridade (LOW, MEDIUM, HIGH, URGENT)
- Data de Vencimento
- Status SLA (se implementado)

#### 3.3.2 Detalhes da Tarefa

**URL:** `/sindico/tarefas/:id`

**Tela Mostra:**
- Informações completas da tarefa
- Histórico de alterações
- Observações do operacional
- Fotos/evidências anexadas
- Status atual

**Botões/Ações:**
- **Adicionar Observação** (SINDICO/SUBSINDICO):
  - Campo de texto para observação
  - Botão "Salvar Observação"
- **Voltar**: Retorna à lista
- **Gerar Relatório**: Exporta detalhes da tarefa

**Fluxo:**
1. Síndico visualiza tarefa
2. Pode adicionar observações para orientar execução
3. Observações aparecem para o operacional

---

### 3.4 GESTÃO DE OCORRÊNCIAS

#### 3.4.1 Listar Ocorrências

**URL:** `/sindico/ocorrencias`

**Tela Mostra:**
- Lista de todas as ocorrências
- Filtros por status, tipo, data
- Status de aprovação

**Botões/Ações:**
- **Ver Detalhes**: Abre detalhes da ocorrência
- **Filtrar/Buscar**: Similar a tarefas

#### 3.4.2 Detalhes da Ocorrência

**URL:** `/sindico/ocorrencias/:id`

**Tela Mostra:**
- Descrição completa
- Fotos da ocorrência
- Status (ABERTA, EM_ANALISE, RESOLVIDA, FECHADA)
- Aprovação pendente (se aplicável)

**Botões/Ações:**
- **Adicionar Observação**: Campo e botão para comentários do síndico
- **Aprovar Ocorrência**: Se estiver pendente de aprovação
- **Rejeitar Ocorrência**: Se precisar ser rejeitada

#### 3.4.3 Ocorrências Pendentes de Aprovação

**URL:** `/sindico/ocorrencias-pendentes-aprovacao`

**Tela Mostra:**
- Lista de ocorrências aguardando aprovação do síndico

**Botões/Ações (por ocorrência):**
- **Aprovar**:
  - Abre modal/formulário
  - Botão "Confirmar Aprovação"
- **Rejeitar**:
  - Campo obrigatório: "Motivo da Rejeição"
  - Botão "Confirmar Rejeição"

**Fluxo:**
1. OPERACIONAL cria ocorrência
2. Sistema marca como "PENDING_SINDICO_APPROVAL"
3. Aparece nesta tela para o síndico
4. Síndico aprova ou rejeita
5. Se aprovada, pode gerar tarefa automaticamente

---

### 3.5 APROVAÇÕES FINANCEIRAS

#### 3.5.1 Aprovações Gerais

**URL:** `/sindico/aprovacoes`

**Tela Mostra:**
- Resumo de todas as aprovações pendentes
- Entradas financeiras pendentes
- Saídas financeiras pendentes
- Orçamentos pendentes

**Botões/Ações:**
- **Ver Entradas Pendentes**: Link para `/sindico/entradas-pendentes`
- **Ver Saídas Pendentes**: Link para `/sindico/saidas-pendentes`
- **Ver Orçamentos Pendentes**: Link para `/sindico/orcamentos-pendentes`
- **Gerar Relatório**: Exporta relatório de aprovações (PDF/Excel)

#### 3.5.2 Entradas Pendentes

**URL:** `/sindico/entradas-pendentes`

**Tela Mostra:**
- Lista de entradas financeiras aguardando aprovação do síndico
- Valores acima do limite de aprovação do financeiro

**Botões/Ações (por entrada):**
- **Aprovar**:
  - Campo opcional: "Observações de Aprovação"
  - Botão "Confirmar Aprovação"
- **Rejeitar**:
  - Campo obrigatório: "Motivo da Rejeição"
  - Botão "Confirmar Rejeição"

**Campos Visíveis:**
- Número da entrada
- Descrição
- Valor
- Data esperada
- Criado por (FINANCEIRO)

#### 3.5.3 Saídas Pendentes

**URL:** `/sindico/saidas-pendentes`

**Tela Mostra:**
- Lista de saídas financeiras aguardando aprovação
- Valores acima do limite

**Botões/Ações (por saída):**
- **Aprovar**: Botão com formulário
- **Rejeitar**: Botão com campo de motivo obrigatório

**Fluxo:**
1. FINANCEIRO cria saída
2. Se valor > limite → Sistema marca como "PENDING_SINDICO"
3. Aparece aqui para aprovação
4. Síndico aprova ou rejeita
5. Se aprovada, FINANCEIRO pode marcar como paga

---

### 3.6 ORÇAMENTOS

#### 3.6.1 Orçamentos Pendentes

**URL:** `/sindico/orcamentos-pendentes`

**Tela Mostra:**
- Lista de solicitações de orçamento aguardando aprovação do síndico
- Status: "PENDING_SINDICO"

**Botões/Ações (por orçamento):**
- **Aprovar**:
  - Campo: "Valor Aprovado" (pode diferir do solicitado)
  - Campo: "Observações de Aprovação"
  - Botão "Confirmar Aprovação"
- **Rejeitar**:
  - Campo obrigatório: "Motivo da Rejeição"
  - Botão "Confirmar Rejeição"

**Campos Visíveis:**
- Número da solicitação
- Descrição
- Valor solicitado
- Valor aprovado pelo financeiro (se houver)
- Status do fluxo
- Anexos (PDFs de orçamentos)

**Fluxo Completo:**
1. ADMINISTRATIVO cria solicitação de orçamento
2. FINANCEIRO revisa e aprova/rejeita
3. Se aprovado pelo financeiro → vai para SINDICO
4. SINDICO aprova valor final
5. FINANCEIRO libera o valor
6. OPERACIONAL pode executar

---

### 3.7 MANUTENÇÕES

**URL:** `/sindico/manutencoes`

**Tela Mostra:**
- Lista de manutenções cadastradas
- Status, tipo, localização

**Botões/Ações:**
- **Ver Detalhes**: Abre detalhes da manutenção

---

### 3.8 ALERTAS

**URL:** `/sindico/alertas`

**Tela Mostra:**
- Lista de alertas críticos do sistema
- Tipos: Inadimplência, SLA violado, Documentos vencendo, etc.

**Botões/Ações (por alerta):**
- **Resolver**: Marca alerta como resolvido
- **Ver Detalhes**: Abre item relacionado ao alerta

---

### 3.9 LOGS DE AUDITORIA

**URL:** `/sindico/logs`

**Tela Mostra:**
- Histórico completo de ações no sistema
- Filtros: Data, Usuário, Tipo de ação

**Campos:**
- Data/Hora
- Usuário
- Ação realizada
- IP Address
- Detalhes

**Filtros:**
- Data inicial e final
- Usuário
- Tipo de ação
- Botão "Filtrar"

---

### 3.10 CHECKLIST MODELOS

#### 3.10.1 Listar Modelos

**URL:** `/sindico/checklist-modelos`

**Tela Mostra:**
- Lista de modelos de checklist cadastrados
- Status (ativo/inativo)

**Botões/Ações:**
- **Novo Modelo**: Abre formulário de criação
- **Editar** (por modelo): Abre formulário de edição
- **Ativar/Desativar**: Toggle de status

#### 3.10.2 Criar/Editar Modelo

**URL:** `/sindico/checklist-modelos/novo` ou `/sindico/checklist-modelos/:id/editar`

**Campos:**
- Nome do Modelo
- Descrição
- Itens do Checklist (adicionar/remover dinamicamente)
  - Descrição do item
  - Tipo (checkbox, texto, numérico)
- Status (ativo/inativo)

**Botões:**
- **Adicionar Item**: Adiciona novo item ao checklist
- **Remover Item**: Remove item do checklist
- **Salvar**: Salva modelo
- **Cancelar**: Volta para lista

**Fluxo:**
1. Síndico cria modelo de checklist
2. Sistema usa modelo para gerar checklists diários
3. OPERACIONAL executa checklists baseados no modelo

---

### 3.11 ASSEMBLEIAS

**Acesso via menu:** `/assembleias`

**Nota:** Assembleias são compartilhadas entre SINDICO e ADMINISTRATIVO (mesma funcionalidade)

**Funcionalidades:**
- Criar assembleia
- Listar assembleias
- Registrar participantes
- Registrar decisões
- Anexar ata (PDF)
- Finalizar assembleia

---

## 4. MÓDULO FINANCEIRO

### 4.1 Dashboard Financeiro

**URL:** `/financeiro/dashboard`

**Widgets:**
- Saldo Atual
- Entradas Pendentes
- Saídas Pendentes
- Gastos do Mês
- Inadimplência
- Consumo Mensal

---

### 4.2 Menu de Navegação

**Itens:**
1. Financeiro - Dashboard
2. Entradas
3. Saídas
4. Apartamentos
5. Taxas
6. Fechamento Mensal
7. Relatórios
8. Fundo de Reserva
9. Contas
10. Orçamentos
11. Centros de Custo

---

### 4.3 GESTÃO DE ENTRADAS

#### 4.3.1 Listar Entradas

**URL:** `/financeiro/entradas`

**Tela Mostra:**
- Lista de todas as entradas financeiras
- Filtros: Status, Data, Busca

**Botões/Ações:**
- **Nova Entrada**: Cria nova entrada
- **Editar** (se não recebida): Edita entrada
- **Receber** (se não recebida): Marca como recebida
- **Ver Detalhes**: Abre detalhes
- **Excluir** (se não recebida): Remove entrada

**Status:**
- PENDING: Aguardando aprovação
- APPROVED: Aprovada, aguardando recebimento
- RECEIVED: Recebida
- REJECTED: Rejeitada

#### 4.3.2 Criar Nova Entrada

**URL:** `/financeiro/entradas/nova`

**Campos:**
- Descrição (obrigatório)
- Valor (obrigatório, numérico)
- Data Esperada (obrigatório)
- Categoria
- Centro de Custo (opcional)
- Observações

**Botões:**
- **Salvar**: Cria entrada
- **Cancelar**: Volta para lista

**Fluxo:**
1. FINANCEIRO preenche formulário
2. Sistema verifica valor:
   - Se valor ≤ limite → Aprovação automática (FINANCEIRO)
   - Se valor > limite → Pending para SINDICO
3. Entrada criada com status correspondente

#### 4.3.3 Editar Entrada

**URL:** `/financeiro/entradas/:id/editar`

**Restrições:**
- Só pode editar se status = PENDING ou APPROVED
- Não pode editar se status = RECEIVED ou mês fechado

**Botões:**
- **Salvar Alterações**
- **Cancelar**

#### 4.3.4 Marcar Entrada como Recebida

**URL:** `/financeiro/entradas/:id/receber`

**Campos:**
- Método de Recebimento (obrigatório): Dinheiro, Transferência, Boleto, etc.
- Data de Recebimento
- **Comprovante em PDF** (obrigatório): Upload de arquivo
- Detalhes do Recebimento
- Observações

**Botões:**
- **Confirmar Recebimento**: Marca como recebida e atualiza saldo
- **Cancelar**

**Fluxo:**
1. Entrada precisa estar APPROVED
2. FINANCEIRO faz upload do comprovante PDF
3. Sistema marca como RECEIVED
4. Saldo do condomínio é atualizado automaticamente

#### 4.3.5 Entradas Rejeitadas

**URL:** `/financeiro/entradas-rejeitadas`

**Tela Mostra:**
- Lista de entradas rejeitadas pelo síndico

**Botões/Ações:**
- **Corrigir**: Permite editar e reenviar para aprovação
- **Ver Motivo**: Mostra motivo da rejeição

---

### 4.4 GESTÃO DE SAÍDAS

#### 4.4.1 Listar Saídas

**URL:** `/financeiro/saidas`

**Tela Mostra:**
- Lista de todas as saídas financeiras
- Status: PENDING, APPROVED, PAID, REJECTED

**Botões/Ações:**
- **Nova Saída**: Cria nova saída
- **Pagar** (se APPROVED): Marca como paga
- **Ver Detalhes**

#### 4.4.2 Criar Nova Saída

**URL:** `/financeiro/saidas/nova`

**Campos:**
- Descrição (obrigatório)
- Valor (obrigatório)
- Data de Vencimento (obrigatório)
- Fornecedor
- Categoria
- Centro de Custo
- Observações

**Botões:**
- **Salvar**: Cria saída
- **Cancelar**

**Fluxo de Aprovação:**
1. Se valor ≤ limite → FINANCEIRO aprova
2. Se valor > limite → SINDICO aprova

#### 4.4.3 Marcar Saída como Paga

**URL:** `/financeiro/saidas/:id/pagar`

**Campos:**
- **Comprovante em PDF** (obrigatório)
- Método de Pagamento
- Data de Pagamento
- Detalhes do Pagamento
- Observações

**Botões:**
- **Confirmar Pagamento**
- **Cancelar**

**Fluxo:**
1. Saída precisa estar APPROVED
2. Upload de comprovante PDF obrigatório
3. Sistema marca como PAID
4. Saldo atualizado

---

### 4.5 GESTÃO DE APARTAMENTOS

#### 4.5.1 Listar Apartamentos

**URL:** `/financeiro/apartamentos`

**Tela Mostra:**
- Lista de apartamentos cadastrados
- Bloco, Número, Proprietário

**Botões:**
- **Novo Apartamento**: Cadastra novo apartamento
- **Editar**: Edita apartamento

#### 4.5.2 Criar/Editar Apartamento

**URL:** `/financeiro/apartamentos/novo` ou `/financeiro/apartamentos/:id/editar`

**Campos:**
- Bloco
- Número/Andar
- Proprietário (nome)
- CPF/CNPJ
- Telefone
- Email
- Observações

**Botões:**
- **Salvar**
- **Cancelar**

---

### 4.6 GESTÃO DE TAXAS MENSais

#### 4.6.1 Listar Taxas

**URL:** `/financeiro/taxas`

**Tela Mostra:**
- Lista de taxas mensais de condomínio
- Apartamento, Mês/Ano, Valor, Status (PAGA/NÃO PAGA)

**Botões/Ações:**
- **Nova Taxa**: Cria taxa mensal
- **Pagar** (por taxa): Marca como paga

**Filtros:**
- Mês/Ano
- Apartamento
- Status (paga/não paga)

#### 4.6.2 Criar Taxa Mensal

**URL:** `/financeiro/taxas/nova`

**Campos:**
- Apartamento (seletor)
- Mês (1-12)
- Ano
- Valor (obrigatório)
- Data de Vencimento
- Observações

**Botões:**
- **Salvar**: Cria taxa
- **Cancelar**

**Fluxo:**
1. FINANCEIRO cria taxa para apartamento
2. Sistema pode gerar boleto automaticamente (se integrado)
3. Aparece na lista de inadimplência se não paga

#### 4.6.3 Marcar Taxa como Paga

**URL:** `/financeiro/taxas/:id/pagar`

**Campos:**
- Data de Pagamento
- Método de Pagamento
- Observações

**Botões:**
- **Confirmar Pagamento**
- **Cancelar**

---

### 4.7 FECHAMENTO MENSAL

#### 4.7.1 Tela de Fechamento

**URL:** `/financeiro/fechamento-mensal`

**Tela Mostra:**
- Resumo do mês atual
- Validações: Entradas não recebidas, Saídas não pagas
- Total de entradas
- Total de saídas
- Saldo final
- Histórico de fechamentos (últimos 12 meses)

**Botões/Ações:**
- **Fechar Mês**: Botão principal para fechar mês atual
  - Abre formulário com:
    - Mês/Ano (já preenchido com atual)
    - Observações
    - Botão "Confirmar Fechamento"
- **Reabrir Mês** (em fechamentos antigos):
  - Campo obrigatório: "Motivo da Reabertura"
  - Botão "Confirmar Reabertura"

**Validações:**
- Sistema verifica se há entradas não recebidas
- Sistema verifica se há saídas não pagas
- Avisos são exibidos antes de fechar

**Consequências do Fechamento:**
- Após fechar, entradas/saídas do mês não podem ser editadas
- Registro imutável é criado
- Relatórios mensais podem ser gerados

---

### 4.8 RELATÓRIOS FINANCEIROS

#### 4.8.1 Listar Relatórios

**URL:** `/financeiro/relatorios`

**Tela Mostra:**
- Lista de relatórios já gerados
- Nome, Data de Geração, Tipo, Download

**Botões/Ações:**
- **Gerar Relatório Mensal**: Botão para gerar novo relatório
  - Abre formulário:
    - Mês (1-12)
    - Ano
    - Formato (PDF ou Excel)
    - Botão "Gerar Relatório"
- **Download** (por relatório): Baixa arquivo PDF/Excel

**Conteúdo do Relatório Mensal:**
- Resumo financeiro do mês
- Entradas detalhadas
- Saídas detalhadas
- Saldo inicial e final
- Inadimplência

---

### 4.9 FUNDO DE RESERVA

**URL:** `/financeiro/fundo-reserva`

**Tela Mostra:**
- Configurações do fundo de reserva
- Valor atual do fundo
- Percentual sobre taxas

**Campos (se não configurado):**
- Percentual sobre taxas mensais (ex: 5%)
- Valor mínimo
- Valor máximo

**Botões:**
- **Salvar Configuração**: Salva ou atualiza fundo de reserva

**Funcionamento:**
- Sistema calcula automaticamente contribuição ao fundo
- Aparece nas entradas automáticas

---

### 4.10 CONTAS BANCÁRIAS

#### 4.10.1 Listar Contas

**URL:** `/financeiro/contas`

**Tela Mostra:**
- Lista de contas bancárias cadastradas

**Botões:**
- **Nova Conta**: Cadastra conta bancária

#### 4.10.2 Criar Conta

**URL:** `/financeiro/contas/novo`

**Campos:**
- Nome da Conta
- Banco
- Agência
- Conta (número)
- Tipo (Corrente, Poupança)
- Saldo Inicial
- Observações

**Botões:**
- **Salvar**
- **Cancelar**

---

### 4.11 CONSUMO MENSAL

#### 4.11.1 Listar Consumo

**URL:** `/financeiro/consumo`

**Tela Mostra:**
- Lista de registros de consumo (água, energia, gás)

**Botões:**
- **Novo Consumo**: Registra novo consumo

#### 4.11.2 Criar Consumo

**URL:** `/financeiro/consumo/novo`

**Campos:**
- Tipo (Água, Energia, Gás)
- Mês
- Ano
- Valor Total
- Consumo (quantidade)
- Leitura Anterior
- Leitura Atual
- Observações

**Botões:**
- **Salvar**
- **Cancelar**

---

### 4.12 CENTROS DE CUSTO

#### 4.12.1 Listar Centros

**URL:** `/financeiro/centros-custo`

**Tela Mostra:**
- Lista de centros de custo (Administração, Manutenção, Limpeza, etc.)

**Botões:**
- **Novo Centro**: Cria centro de custo

#### 4.12.2 Criar Centro de Custo

**URL:** `/financeiro/centros-custo/novo`

**Campos:**
- Nome (obrigatório)
- Descrição
- Status (Ativo/Inativo)

**Botões:**
- **Salvar**
- **Cancelar**

---

### 4.13 ORÇAMENTOS (Revisão pelo Financeiro)

#### 4.13.1 Orçamentos Pendentes de Análise

**URL:** `/financeiro/orcamentos-pendentes`

**Tela Mostra:**
- Lista de orçamentos aguardando revisão do financeiro
- Status: "PENDING_FINANCEIRO"

**Botões/Ações (por orçamento):**
- **Revisar**: Abre formulário de revisão
  - Campos:
    - Observações do Financeiro
    - Centro de Custo (seletor)
  - Botão "Enviar para Síndico" (aprova revisão)
  - Botão "Rejeitar" (rejeita orçamento)

**Fluxo:**
1. ADMINISTRATIVO cria solicitação de orçamento
2. Aparece aqui para FINANCEIRO revisar
3. FINANCEIRO adiciona observações e centro de custo
4. Envia para SINDICO aprovar valor

#### 4.13.2 Orçamentos Aprovados

**URL:** `/financeiro/orcamentos-aprovados`

**Tela Mostra:**
- Lista de orçamentos já aprovados pelo síndico
- Status: "APPROVED"

**Botões/Ações (por orçamento):**
- **Liberar**: Libera valor para execução
  - Campo: Observações
  - Botão "Confirmar Liberação"
- **Retornar**: Retorna orçamento (se necessário)
  - Campo: Motivo
  - Botão "Confirmar Retorno"

**Fluxo:**
1. Após síndico aprovar, aparece aqui
2. FINANCEIRO libera valor
3. OPERACIONAL pode executar

---

## 5. MÓDULO ADMINISTRATIVO

### 5.1 Dashboard Administrativo

**URL:** `/administrativo/dashboard`

**Widgets:**
- Tarefas Pendentes
- Ocorrências Abertas
- Documentos Vencendo
- Orçamentos Pendentes

---

### 5.2 Menu de Navegação

**Itens:**
1. Admin - Dashboard
2. Tarefas
3. Ocorrências
4. Documentos
5. Assembleias

---

### 5.3 GESTÃO DE TAREFAS

#### 5.3.1 Listar Tarefas

**URL:** `/administrativo/tarefas`

**Tela Mostra:**
- Lista de tarefas
- Filtros e busca

**Botões:**
- **Nova Tarefa**: Cria tarefa
- **Reabrir Tarefa** (se concluída): Reabre para correções

#### 5.3.2 Criar Tarefa

**URL:** `/administrativo/tarefas/nova`

**Campos:**
- Título (obrigatório)
- Descrição
- Responsável (seletor de usuário OPERACIONAL)
- Prioridade (LOW, MEDIUM, HIGH, URGENT)
- Data de Vencimento (obrigatório)
- Tipo de Tarefa
- Observações

**Botões:**
- **Salvar**: Cria tarefa e atribui ao operacional
- **Cancelar**

**Fluxo:**
1. ADMINISTRATIVO cria tarefa
2. Atribui a um OPERACIONAL
3. OPERACIONAL recebe notificação
4. OPERACIONAL executa e marca como concluída

#### 5.3.3 Reabertura de Tarefa

**Ação:** Botão "Reabrir" em tarefa concluída

**Campos:**
- Motivo da Reabertura (obrigatório)

**Botões:**
- **Confirmar Reabertura**
- **Cancelar**

---

### 5.4 GESTÃO DE OCORRÊNCIAS

#### 5.4.1 Listar Ocorrências

**URL:** `/administrativo/ocorrencias`

**Tela Mostra:**
- Lista de ocorrências criadas
- Status de triagem

**Botões:**
- **Triar Ocorrência**: Processa ocorrência

#### 5.4.2 Ocorrências Pendentes de Triagem

**URL:** `/administrativo/ocorrencias/pendentes`

**Tela Mostra:**
- Ocorrências aguardando triagem do administrativo

**Botões:**
- **Triar**: Abre formulário de triagem

#### 5.4.3 Triar Ocorrência

**URL:** `/administrativo/ocorrencias/:id/triar`

**Campos:**
- Classificação: Tipo de problema
- Prioridade
- Criar Tarefa? (checkbox)
  - Se marcado, campos de tarefa aparecem:
    - Responsável
    - Prazo
- Criar Orçamento? (checkbox)
  - Se marcado, campos de orçamento aparecem
- Observações da Triagem

**Botões:**
- **Confirmar Triagem**: Processa ocorrência
- **Cancelar**

**Fluxo:**
1. OPERACIONAL cria ocorrência com foto
2. Aparece para ADMINISTRATIVO triar
3. ADMINISTRATIVO classifica e pode criar tarefa/orçamento
4. Sistema atualiza status da ocorrência

---

### 5.5 GESTÃO DE DOCUMENTOS

#### 5.5.1 Listar Documentos

**URL:** `/administrativo/documentos`

**Tela Mostra:**
- Lista de documentos cadastrados
- Categoria, Data de Vencimento, Status

**Botões:**
- **Novo Documento**: Cadastra documento
- **Categorias**: Gerencia categorias

#### 5.5.2 Criar Documento

**URL:** `/administrativo/documentos/novo`

**Campos:**
- Nome (obrigatório)
- Categoria (seletor)
- **Arquivo PDF** (obrigatório): Upload
- Data de Vencimento (se aplicável)
- Observações

**Botões:**
- **Salvar**: Salva documento
- **Cancelar**

#### 5.5.3 Categorias de Documentos

**URL:** `/administrativo/documentos/categorias`

**Tela Mostra:**
- Lista de categorias (Contratos, Certidões, Licenças, etc.)

**Botões:**
- **Nova Categoria**: Cria categoria

**URL:** `/administrativo/documentos/categorias/nova`

**Campos:**
- Nome da Categoria
- Descrição

**Botões:**
- **Salvar**
- **Cancelar**

---

### 5.6 SOLICITAÇÕES DE ORÇAMENTO

#### 5.6.1 Listar Orçamentos

**URL:** `/administrativo/orcamentos`

**Tela Mostra:**
- Lista de solicitações de orçamento criadas
- Status: PENDING_FINANCEIRO, PENDING_SINDICO, APPROVED, REJECTED

**Botões:**
- **Nova Solicitação**: Cria solicitação

#### 5.6.2 Criar Solicitação de Orçamento

**URL:** `/administrativo/orcamentos/novo`

**Campos:**
- Descrição (obrigatório)
- Valor Estimado
- Tipo de Serviço/Material
- **Anexar Orçamento PDF** (obrigatório): Upload
- Observações
- Urgência

**Botões:**
- **Salvar**: Cria solicitação e envia para FINANCEIRO
- **Cancelar**

**Fluxo Completo:**
1. ADMINISTRATIVO cria solicitação
2. Sistema marca como "PENDING_FINANCEIRO"
3. FINANCEIRO revisa e envia para SINDICO
4. SINDICO aprova/rejeita
5. Se aprovado, FINANCEIRO libera valor
6. OPERACIONAL executa

---

### 5.7 COMUNICADOS OPERACIONAIS

**URL:** `/administrativo/comunicados`

**Tela Mostra:**
- Lista de comunicados ativos

**Botões:**
- **Novo Comunicado**: Cria comunicado
- **Desativar**: Desativa comunicado

---

### 5.8 APROVAÇÕES FINANCEIRAS (Até Limite)

**URL:** `/administrativo/aprovacoes-financeiras`

**Tela Mostra:**
- Entradas e saídas que ADMINISTRATIVO pode aprovar (até limite)

**Botões (por item):**
- **Aprovar**: Aprova item
- **Rejeitar**: Rejeita item

---

## 6. MÓDULO OPERACIONAL

### 6.1 Dashboard Operacional

**URL:** `/operacional/dashboard`

**Widgets:**
- Tarefas Atribuídas (minhas tarefas)
- Tarefas Atrasadas
- Checklists do Dia
- Ocorrências Abertas

---

### 6.2 Menu de Navegação

**Itens:**
1. Operacional - Dashboard
2. Checklist
3. Ocorrências
4. Manutenções

---

### 6.3 CHECKLISTS

#### 6.3.1 Checklist Antigo (Compatibilidade)

**URL:** `/operacional/checklist`

**Nota:** Este é o sistema antigo. Existe também o novo sistema em `/operacional/checklists-diarios`

**Tela Mostra:**
- Lista de itens de checklist
- Status de cada item (feito/não feito)

**Botões/Ações:**
- Checkbox por item: Marca item como concluído
- **Completar Checklist**: Finaliza checklist do dia

#### 6.3.2 Checklists Diários (Sistema Novo)

**URL:** `/operacional/checklists-diarios`

**Tela Mostra:**
- Lista de checklists gerados diariamente
- Data, Status (PENDING, IN_PROGRESS, COMPLETED)

**Botões:**
- **Iniciar Checklist**: Inicia execução
- **Ver Detalhes**: Abre checklist para executar

**URL:** `/operacional/checklists-diarios/:id`

**Tela Mostra:**
- Itens do checklist (baseado em modelo)
- Status de cada item

**Botões/Ações (por item):**
- Checkbox: Marca como concluído
- Campo de observação (se necessário)
- **Adicionar Evidência (Foto)**: Upload de foto
- **Salvar Item**: Salva alterações do item
- **Finalizar Checklist**: Finaliza checklist completo

**Fluxo:**
1. Sistema gera checklist diário baseado em modelos
2. OPERACIONAL vê lista de checklists
3. Clica em "Iniciar Checklist"
4. Marca itens como concluídos
5. Pode adicionar fotos como evidência
6. Finaliza checklist

---

### 6.4 OCORRÊNCIAS

#### 6.4.1 Listar Ocorrências

**URL:** `/operacional/ocorrencias`

**Tela Mostra:**
- Lista de ocorrências criadas pelo operacional
- Status: ABERTA, EM_ANALISE, RESOLVIDA, FECHADA

**Botões:**
- **Nova Ocorrência**: Cria ocorrência
- **Ver Detalhes**: Abre detalhes
- **Resolver**: Se aplicável

#### 6.4.2 Criar Ocorrência

**URL:** `/operacional/ocorrencias/nova`

**Campos:**
- Título (obrigatório)
- Descrição (obrigatório)
- Localização (obrigatório)
- Tipo de Ocorrência
- Prioridade (LOW, MEDIUM, HIGH, URGENT)
- **Foto(s) da Ocorrência** (obrigatório): Upload de imagens
- Observações

**Botões:**
- **Salvar**: Cria ocorrência
- **Cancelar**

**Fluxo:**
1. OPERACIONAL encontra problema
2. Cria ocorrência com foto
3. Sistema marca como "PENDING_SINDICO_APPROVAL" (se requer aprovação)
4. Aparece para ADMINISTRATIVO triar
5. Pode gerar tarefa automaticamente

#### 6.4.3 Resolver Ocorrência

**URL:** `/operacional/ocorrencias/:id/resolver`

**Campos:**
- Descrição da Resolução (obrigatório)
- **Foto(s) da Resolução** (obrigatório): Upload
- Custo (se houver)
- Observações

**Botões:**
- **Confirmar Resolução**: Marca como resolvida
- **Cancelar**

**Fluxo:**
1. Ocorrência está em análise ou aprovada
2. OPERACIONAL resolve o problema
3. Adiciona foto da resolução
4. Marca como resolvida
5. ADMINISTRATIVO/SINDICO pode verificar e fechar

---

### 6.5 MANUTENÇÕES

#### 6.5.1 Listar Manutenções

**URL:** `/operacional/manutencoes`

**Tela Mostra:**
- Lista de manutenções atribuídas ao operacional
- Status, Tipo, Localização

**Botões:**
- **Ver Detalhes**: Abre detalhes
- **Iniciar Manutenção**: Se pendente
- **Concluir Manutenção**: Se em andamento

#### 6.5.2 Detalhes da Manutenção

**URL:** `/operacional/manutencoes/:id`

**Tela Mostra:**
- Informações completas da manutenção
- Orçamento aprovado (se houver)
- Materiais necessários

**Botões:**
- **Iniciar**: Marca como em andamento
- **Concluir**: Abre formulário de conclusão

#### 6.5.3 Concluir Manutenção

**URL:** `/operacional/manutencoes/:id/concluir`

**Campos:**
- Descrição do Trabalho Realizado
- **Foto(s) do Resultado** (obrigatório)
- Materiais Utilizados
- Horas Trabalhadas
- Observações

**Botões:**
- **Confirmar Conclusão**: Finaliza manutenção
- **Cancelar**

---

### 6.6 ORÇAMENTOS LIBERADOS

**URL:** `/operacional/orcamentos`

**Tela Mostra:**
- Lista de orçamentos liberados pelo financeiro
- Status: LIBERATED

**Botões:**
- **Ver Detalhes**: Abre detalhes do orçamento

**Nota:** OPERACIONAL pode ver orçamentos liberados para execução

---

## 7. MÓDULO LIMPEZA

### 7.1 Dashboard Limpeza

**URL:** `/limpeza/dashboard`

**Widgets:**
- Checklist do Dia
- Ocorrências de Limpeza

---

### 7.2 Menu de Navegação

**Itens:**
1. Limpeza - Dashboard
2. Checklist (compartilhado com operacional)
3. Ocorrências de Limpeza

---

### 7.3 OCORRÊNCIAS DE LIMPEZA

#### 7.3.1 Listar Ocorrências

**URL:** `/limpeza/ocorrencias`

**Tela Mostra:**
- Ocorrências específicas de limpeza

**Botões:**
- **Nova Ocorrência**: Cria ocorrência de limpeza

**Nota:** LIMPEZA pode criar ocorrências de limpeza. Se for problema técnico, sistema redireciona para zeladoria.

#### 7.3.2 Criar Ocorrência de Limpeza

**URL:** `/limpeza/ocorrencias/nova`

**Campos:**
- Similar ao operacional, mas focado em limpeza

**Fluxo:**
1. LIMPEZA reporta problema de limpeza
2. Se for problema técnico, sistema cria ocorrência para OPERACIONAL automaticamente

---

## 8. MÓDULO PATRIMÔNIO

### 8.1 Dashboard Patrimônio

**URL:** `/patrimonio/dashboard`

**Widgets:**
- Total de Ativos
- Valor Total do Patrimônio
- Manutenções Pendentes

---

### 8.2 Menu de Navegação

**Itens:**
1. Patrimônio - Dashboard
2. Ativos

---

### 8.3 GESTÃO DE ATIVOS

#### 8.3.1 Listar Ativos

**URL:** `/patrimonio/ativos`

**Tela Mostra:**
- Lista de ativos cadastrados
- Nome, Localização, Valor, Estado

**Botões:**
- **Novo Ativo**: Cadastra ativo
- **Ver Detalhes**: Abre detalhes
- **Editar**: Edita ativo

#### 8.3.2 Criar Ativo

**URL:** `/patrimonio/ativos/novo`

**Campos:**
- Nome (obrigatório)
- Categoria
- Localização
- Valor de Aquisição
- Data de Aquisição
- Fornecedor
- Descrição
- **Foto(s)**: Upload

**Botões:**
- **Salvar**: Cria ativo
- **Cancelar**

#### 8.3.3 Editar Ativo

**URL:** `/patrimonio/ativos/:id/editar`

**Campos:**
- Similar à criação

**Botões:**
- **Salvar Alterações**
- **Cancelar**

#### 8.3.4 Criar Manutenção de Ativo

**URL:** `/patrimonio/ativos/:id/manutencao/nova`

**Campos:**
- Tipo de Manutenção (Preventiva, Corretiva)
- Descrição
- Data Programada
- Fornecedor
- Custo Estimado
- Observações

**Botões:**
- **Salvar**: Cria manutenção
- **Cancelar**

---

## 9. MÓDULO ESTOQUE

### 9.1 Dashboard Estoque

**URL:** `/estoque/` ou `/estoque/items`

**Tela Mostra:**
- Resumo de itens em estoque
- Itens com estoque baixo

---

### 9.2 Menu de Navegação

**Acesso:** ADMINISTRATIVO, FINANCEIRO, OPERACIONAL

---

### 9.3 GESTÃO DE ITENS

#### 9.3.1 Listar Itens

**URL:** `/estoque/items`

**Tela Mostra:**
- Lista de itens cadastrados
- Nome, Quantidade em Estoque, Unidade, Categoria

**Botões:**
- **Novo Item**: Cadastra item
- **Ver Detalhes**: Abre detalhes
- **Editar**: Edita item
- **Movimentação**: Registra entrada/saída

#### 9.3.2 Criar Item

**URL:** `/estoque/items/novo`

**Campos:**
- Nome (obrigatório)
- Categoria
- Unidade de Medida (kg, litro, unidade, etc.)
- Quantidade Mínima (estoque mínimo)
- Preço Unitário
- Fornecedor
- Descrição

**Botões:**
- **Salvar**: Cria item
- **Cancelar**

#### 9.3.3 Movimentação de Estoque

**URL:** `/estoque/items/:id/movimentacao`

**Campos:**
- Tipo de Movimentação: Entrada ou Saída
- Quantidade (obrigatório)
- Motivo (obrigatório)
- Observações

**Botões:**
- **Registrar Movimentação**: Atualiza estoque
- **Cancelar**

**Fluxo:**
1. OPERACIONAL ou ADMINISTRATIVO registra movimentação
2. Sistema atualiza quantidade automaticamente
3. Se quantidade < mínimo, gera alerta

---

## 10. MÓDULO MASTER

### 10.1 Dashboard Master

**URL:** `/master/dashboard`

**Tela Mostra:**
- Visão geral de todos os condomínios
- Estatísticas globais

---

### 10.2 Menu de Navegação

**Itens:**
1. Master - Dashboard
2. Condomínios
3. Usuários

---

### 10.3 GESTÃO DE CONDOMÍNIOS

#### 10.3.1 Listar Condomínios

**URL:** `/master/condominios`

**Tela Mostra:**
- Lista de todos os condomínios cadastrados

**Botões:**
- **Novo Condomínio**: Cria condomínio

#### 10.3.2 Criar/Editar Condomínio

**Campos:**
- Nome (obrigatório)
- CNPJ
- Endereço
- Telefone
- Email
- Observações

**Botões:**
- **Salvar**
- **Cancelar**

---

### 10.4 GESTÃO DE USUÁRIOS

#### 10.4.1 Listar Usuários

**URL:** `/master/usuarios`

**Tela Mostra:**
- Lista de todos os usuários do sistema

**Botões:**
- **Novo Usuário**: Cria usuário

#### 10.4.2 Criar/Editar Usuário

**Campos:**
- Nome Completo (obrigatório)
- Username (obrigatório, único)
- Email
- Senha (obrigatório na criação)
- Condomínio (seletor)
- Perfis/Roles (checkboxes): Pode ter múltiplos perfis
- Status (Ativo/Inativo)

**Botões:**
- **Salvar**
- **Cancelar**

---

## 11. MÓDULO CONSELHO

### 11.1 Dashboard Conselho

**URL:** `/conselho/dashboard`

**Tela Mostra:**
- Relatórios financeiros
- Visualização de aprovações
- Relatórios de assembleias

**Permissões:** Apenas visualização (read-only)

---

## 12. FLUXOS PRINCIPAIS COMPLETOS

### 12.1 FLUXO FINANCEIRO COMPLETO

#### Cenário: Receber Taxa de Condomínio

1. **FINANCEIRO** acessa `/financeiro/taxas`
2. Clica em **"Nova Taxa"**
3. Seleciona apartamento, preenche mês/ano/valor
4. Clica **"Salvar"** → Taxa criada
5. Proprietário paga (fora do sistema)
6. FINANCEIRO acessa `/financeiro/taxas`
7. Clica **"Pagar"** na taxa
8. Preenche data de pagamento e método
9. Clica **"Confirmar Pagamento"** → Saldo atualizado

#### Cenário: Pagar Fornecedor (Valor Acima do Limite)

1. **FINANCEIRO** acessa `/financeiro/saidas/nova`
2. Preenche: Descrição "Pagamento Fornecedor X", Valor R$ 5.000
3. Clica **"Salvar"** → Sistema marca como "PENDING_SINDICO" (valor > limite)
4. **SINDICO** acessa `/sindico/saidas-pendentes`
5. Vê a saída pendente, clica **"Aprovar"**
6. Preenche observações (opcional), clica **"Confirmar Aprovação"**
7. Sistema marca como "APPROVED"
8. **FINANCEIRO** acessa `/financeiro/saidas`
9. Vê saída como "APPROVED", clica **"Pagar"**
10. Faz upload do comprovante PDF
11. Preenche método de pagamento
12. Clica **"Confirmar Pagamento"** → Marca como PAID, saldo atualizado

---

### 12.2 FLUXO DE OCORRÊNCIA COMPLETO

#### Cenário: Vazamento no Condomínio

1. **OPERACIONAL** encontra vazamento
2. Acessa `/operacional/ocorrencias/nova`
3. Preenche:
   - Título: "Vazamento no 3º Andar"
   - Localização: "Corredor 3º Andar, Bloco A"
   - Prioridade: URGENT
   - Adiciona foto do vazamento
4. Clica **"Salvar"** → Ocorrência criada como "PENDING_SINDICO_APPROVAL"
5. **SINDICO** acessa `/sindico/ocorrencias-pendentes-aprovacao`
6. Vê ocorrência, clica **"Aprovar"**
7. Sistema marca como aprovada
8. **ADMINISTRATIVO** acessa `/administrativo/ocorrencias/pendentes`
9. Vê ocorrência aprovada, clica **"Triar"**
10. Preenche classificação, prioridade
11. Marca checkbox **"Criar Tarefa"**:
    - Atribui a OPERACIONAL "João"
    - Define prazo: 2 horas
12. Marca checkbox **"Criar Orçamento"**:
    - Valor estimado: R$ 500
    - Anexa orçamento PDF
13. Clica **"Confirmar Triagem"**
14. Sistema cria tarefa e orçamento automaticamente
15. **OPERACIONAL** vê tarefa no dashboard, executa
16. **FINANCEIRO** revisa orçamento em `/financeiro/orcamentos-pendentes`
17. Adiciona centro de custo, clica **"Enviar para Síndico"**
18. **SINDICO** aprova orçamento em `/sindico/orcamentos-pendentes`
19. **FINANCEIRO** libera valor em `/financeiro/orcamentos-aprovados`
20. **OPERACIONAL** resolve ocorrência em `/operacional/ocorrencias/:id/resolver`
21. Adiciona foto da resolução, clica **"Confirmar Resolução"**
22. Sistema marca ocorrência como RESOLVIDA

---

### 12.3 FLUXO DE FECHAMENTO MENSAL

1. **FINANCEIRO** acessa `/financeiro/fechamento-mensal`
2. Sistema mostra validações:
   - Entradas não recebidas: 2
   - Saídas não pagas: 1
3. FINANCEIRO verifica e corrige pendências
4. Clica **"Fechar Mês"**
5. Preenche observações (opcional)
6. Clica **"Confirmar Fechamento"**
7. Sistema:
   - Cria registro imutável do fechamento
   - Bloqueia edições no mês fechado
   - Gera relatório mensal (se configurado)
8. **SINDICO** pode visualizar fechamento em relatórios

---

### 12.4 FLUXO DE CHECKLIST DIÁRIO

1. **Sistema** gera checklist diário automaticamente (baseado em modelos)
2. **OPERACIONAL** acessa `/operacional/checklists-diarios`
3. Vê checklist do dia, clica **"Iniciar Checklist"**
4. Para cada item:
   - Marca checkbox quando concluído
   - Adiciona observação (se necessário)
   - Adiciona foto como evidência (opcional)
   - Clica **"Salvar Item"**
5. Após concluir todos os itens, clica **"Finalizar Checklist"**
6. Sistema marca checklist como COMPLETED
7. **ADMINISTRATIVO/SINDICO** pode visualizar checklists concluídos

---

## 13. CENÁRIOS DE TREINAMENTO

### Cenário 1: Primeiro Acesso do Cliente

**Objetivo:** Familiarizar com login e dashboard

**Passos:**
1. Acessar `/auth/login`
2. Fazer login com credenciais fornecidas
3. Verificar redirecionamento para dashboard correto
4. Explorar widgets do dashboard
5. Navegar pelo menu superior
6. Fazer logout

---

### Cenário 2: Cadastro de Apartamento e Taxa

**Objetivo:** Entender cadastro básico financeiro

**Perfil:** FINANCEIRO

**Passos:**
1. Acessar `/financeiro/apartamentos`
2. Clicar "Novo Apartamento"
3. Preencher: Bloco A, Nº 101, Proprietário "João Silva"
4. Salvar
5. Acessar `/financeiro/taxas`
6. Clicar "Nova Taxa"
7. Selecionar apartamento criado
8. Preencher: Janeiro/2026, R$ 500
9. Salvar
10. Verificar taxa na lista

---

### Cenário 3: Fluxo Completo de Ocorrência

**Objetivo:** Entender ciclo completo de ocorrência

**Perfis:** OPERACIONAL → ADMINISTRATIVO → FINANCEIRO → SINDICO

**Passos:**
1. **OPERACIONAL:** Criar ocorrência com foto
2. **SINDICO:** Aprovar ocorrência
3. **ADMINISTRATIVO:** Triar e criar tarefa
4. **OPERACIONAL:** Executar tarefa e marcar como concluída
5. **ADMINISTRATIVO:** Verificar tarefa concluída

---

### Cenário 4: Aprovação Financeira

**Objetivo:** Entender fluxo de aprovações

**Perfis:** FINANCEIRO → SINDICO

**Passos:**
1. **FINANCEIRO:** Criar saída de R$ 6.000 (acima do limite)
2. Verificar que aparece como "PENDING_SINDICO"
3. **SINDICO:** Acessar `/sindico/saidas-pendentes`
4. Verificar detalhes da saída
5. Aprovar com observações
6. **FINANCEIRO:** Verificar que saída está "APPROVED"
7. Marcar como paga com comprovante

---

### Cenário 5: Checklist Diário

**Objetivo:** Executar checklist operacional

**Perfil:** OPERACIONAL

**Passos:**
1. Acessar `/operacional/checklists-diarios`
2. Ver checklist do dia atual
3. Clicar "Iniciar Checklist"
4. Marcar itens como concluídos
5. Adicionar foto em um item (opcional)
6. Finalizar checklist
7. Verificar checklist marcado como concluído

---

## 14. CHECKLIST DE FUNCIONALIDADES

Use esta lista para verificar o que está funcionando e o que precisa ser implementado:

### ✅ Funcionalidades Básicas

- [x] Login/Logout
- [x] Dashboards por perfil
- [x] Navegação por menu
- [x] Gestão de usuários (MASTER)

### ✅ Módulo Financeiro

- [x] Criar entrada financeira
- [x] Aprovar entrada (SINDICO)
- [x] Marcar entrada como recebida
- [x] Criar saída financeira
- [x] Aprovar saída (SINDICO)
- [x] Marcar saída como paga
- [x] Cadastrar apartamentos
- [x] Criar taxas mensais
- [x] Marcar taxa como paga
- [x] Fechamento mensal
- [x] Reabertura de mês fechado
- [x] Relatórios mensais (PDF/Excel)
- [x] Fundo de reserva
- [x] Contas bancárias
- [x] Consumo mensal
- [x] Centros de custo
- [x] Entradas rejeitadas (corrigir)

### ✅ Módulo Síndico

- [x] Dashboard com widgets
- [x] Listar tarefas
- [x] Ver detalhes de tarefa
- [x] Adicionar observação em tarefa
- [x] Listar ocorrências
- [x] Aprovar/rejeitar ocorrência
- [x] Aprovar/rejeitar entrada financeira
- [x] Aprovar/rejeitar saída financeira
- [x] Aprovar/rejeitar orçamento
- [x] Visualizar alertas
- [x] Ver logs de auditoria
- [x] Gestão de modelos de checklist

### ✅ Módulo Administrativo

- [x] Dashboard
- [x] Criar tarefa
- [x] Listar tarefas
- [x] Reabrir tarefa
- [x] Triar ocorrência
- [x] Criar solicitação de orçamento
- [x] Gestão de documentos
- [x] Categorias de documentos
- [x] Criar comunicado

### ✅ Módulo Operacional

- [x] Dashboard
- [x] Checklists diários (novo sistema)
- [x] Checklist antigo (compatibilidade)
- [x] Criar ocorrência
- [x] Resolver ocorrência
- [x] Visualizar manutenções
- [x] Concluir manutenção
- [x] Ver orçamentos liberados

### ✅ Módulo Limpeza

- [x] Dashboard
- [x] Checklists (compartilhado)
- [x] Ocorrências de limpeza

### ✅ Módulo Patrimônio

- [x] Dashboard
- [x] Listar ativos
- [x] Criar ativo
- [x] Editar ativo
- [x] Criar manutenção de ativo

### ✅ Módulo Estoque

- [x] Dashboard
- [x] Listar itens
- [x] Criar item
- [x] Editar item
- [x] Movimentação de estoque

### ⚠️ Funcionalidades Pendentes/Incompletas

- [ ] SLA visível nas views (SLA-002)
- [ ] Alertas automáticos de SLA (SLA-003)
- [ ] Relatório de SLA (SLA-004)
- [ ] Operacional criar tarefas para si (FLU-001)
- [ ] Ocorrência gerar tarefa automaticamente (FLU-002)
- [ ] Unificar sistemas de checklist (TEC-001)
- [ ] Revisão de tarefas concluídas (REV-002)
- [ ] Relatório de produtividade (REP-001)

---

## 15. ANEXOS

### 15.1 URLs Principais por Módulo

**Autenticação:**
- Login: `/auth/login`
- Logout: `/auth/logout` (POST)

**Síndico:**
- Dashboard: `/sindico/dashboard`
- Tarefas: `/sindico/tarefas`
- Ocorrências: `/sindico/ocorrencias`
- Aprovações: `/sindico/aprovacoes`

**Financeiro:**
- Dashboard: `/financeiro/dashboard`
- Entradas: `/financeiro/entradas`
- Saídas: `/financeiro/saidas`
- Fechamento: `/financeiro/fechamento-mensal`

**Administrativo:**
- Dashboard: `/administrativo/dashboard`
- Tarefas: `/administrativo/tarefas`
- Ocorrências: `/administrativo/ocorrencias`

**Operacional:**
- Dashboard: `/operacional/dashboard`
- Checklists: `/operacional/checklists-diarios`
- Ocorrências: `/operacional/ocorrencias`

---

### 15.2 Tipos de Status

**Tarefas:**
- PENDING: Pendente
- IN_PROGRESS: Em andamento
- COMPLETED: Concluída
- CANCELLED: Cancelada

**Ocorrências:**
- ABERTA: Aberta
- EM_ANALISE: Em análise
- RESOLVIDA: Resolvida
- FECHADA: Fechada

**Financeiro:**
- PENDING: Aguardando aprovação
- APPROVED: Aprovada
- RECEIVED/PAID: Recebida/Paga
- REJECTED: Rejeitada

---

### 15.3 Prioridades

- LOW: Baixa
- MEDIUM: Média
- HIGH: Alta
- URGENT: Urgente

---

## 🎯 CONCLUSÃO

Este tutorial mapeia **todos os botões, fluxos e funcionalidades** do sistema. Use para:

1. **Treinar clientes**: Seguir cenários passo a passo
2. **Identificar bugs**: Comparar comportamento esperado vs real
3. **Implementar melhorias**: Ver o que falta (seção 14)
4. **Documentação**: Referência completa do sistema

**Próximos Passos:**
- Testar cada fluxo documentado
- Marcar funcionalidades que não estão funcionando
- Priorizar implementações faltantes
- Criar vídeos tutoriais baseados neste documento

---

**Última Atualização:** Janeiro 2026  
**Versão do Sistema:** 1.0
