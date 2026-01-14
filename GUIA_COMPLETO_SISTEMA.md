# GUIA COMPLETO DO SISTEMA DE GESTÃO CONDOMINIAL

## 📑 SUMÁRIO

1. [Introdução](#introdução)
2. [Dicionário de Termos](#dicionário-de-termos)
3. [Estrutura do Sistema](#estrutura-do-sistema)
4. [Perfis e Permissões](#perfis-e-permissões)
5. [Módulos do Sistema](#módulos-do-sistema)
6. [Fluxos de Validação](#fluxos-de-validação)
7. [Tutorial de Uso](#tutorial-de-uso)
8. [Glossário de Botões e Ações](#glossário-de-botões-e-ações)

---

## 1. INTRODUÇÃO

### O que é este sistema?
Sistema web para gestão completa de condomínios, que permite:
- Gerenciar tarefas e checklists diários
- Controlar finanças (entradas e saídas)
- Registrar ocorrências e problemas
- Gerenciar patrimônio e ativos
- Aprovar orçamentos e despesas
- Manter histórico e auditoria de todas as ações

### Para quem é?
- **Síndicos**: Aprovam, analisam e tomam decisões
- **Financeiro**: Controla receitas e despesas
- **Administrativo**: Organiza tarefas e documentos
- **Operacional**: Executa tarefas e checklists
- **Limpeza**: Executa checklists de limpeza
- **Patrimônio**: Gerencia ativos do condomínio

---

## 2. DICIONÁRIO DE TERMOS

### 📊 **Centro de Custo**
**O que é:** Categoria que agrupa despesas por tipo de gasto (ex: Manutenção, Contas, Contratos, Limpeza).

**Como funciona:**
- Financeiro cria centros de custo
- Ao criar uma entrada ou saída, pode vincular a um centro de custo
- Facilita relatórios e controle de gastos por categoria
- Exemplo: Todas as despesas de "Manutenção de Elevadores" vão para o centro de custo "Manutenção"

**Onde usar:** Ao criar entradas/saídas financeiras, há um campo "Centro de Custo" para selecionar.

---

### 🚨 **Ocorrência**
**O que é:** Registro de um problema ou situação que precisa ser resolvida (ex: vazamento, lâmpada queimada, barulho).

**Como funciona:**
- Operacional ou Limpeza cria ocorrência descrevendo o problema
- Pode ser de rotina (já está no checklist) ou fora de rotina (algo inesperado)
- Pode requerer aprovação antes de ser resolvida (se for algo que custa dinheiro)
- Administrativo faz triagem (atribui responsável, define prazo)
- Operacional resolve e marca como resolvida
- Síndico pode aprovar/rejeitar se requerer aprovação

**Estados possíveis:**
- **ABERTA**: Criada, aguardando triagem
- **EM_ATENDIMENTO**: Atribuída e sendo resolvida
- **AGUARDANDO_TERCEIRO**: Depende de ação externa
- **RESOLVIDA**: Problema resolvido
- **ENCERRADA**: Fechada definitivamente

**Onde usar:** Menu "Ocorrências" no módulo Operacional ou Limpeza.

---

### ✅ **Checklist Diário**
**O que é:** Lista de tarefas que devem ser executadas diariamente (ex: verificar elevadores, limpar áreas comuns).

**Como funciona:**
- Síndico cria **Modelo de Checklist** (regra que define o que fazer)
- Sistema gera automaticamente um **Checklist Diário** baseado nos modelos
- Operacional executa o checklist do dia (marca itens como feito/não feito)
- Pode adicionar fotos como evidência
- Se item não foi feito, deve justificar (comentário obrigatório)

**Tipos:**
- **Checklist de Zeladoria**: Operacional executa
- **Checklist de Limpeza**: Limpeza executa

**Onde usar:** Menu "Checklists Diários" no módulo Operacional.

---

### 💰 **Entrada Financeira**
**O que é:** Registro de dinheiro que entra no condomínio (ex: taxa de condomínio, receitas diversas).

**Como funciona:**
- Financeiro cria entrada com descrição, valor e data
- **Sempre** vai para o Síndico analisar
- Síndico pode:
  - **Aprovar**: Entrada entra no cálculo financeiro
  - **Rejeitar**: Financeiro pode editar/excluir e reenviar
- Se aprovada, pode ser marcada como "Recebida" (quando o dinheiro realmente entra)

**Fluxo:** Financeiro cria → Síndico analisa → Aprova/Rejeita → Se aprovada, entra no saldo

**Onde usar:** Menu "Entradas" no módulo Financeiro.

---

### 💸 **Saída Financeira**
**O que é:** Registro de dinheiro que sai do condomínio (ex: pagamento de contas, manutenções, salários).

**Como funciona:**
- Financeiro cria saída com descrição, valor e data
- Se valor for maior que o limite de aprovação (padrão: R$ 1.000), **requer aprovação do Síndico**
- Se valor for menor, é aprovada automaticamente
- Síndico aprova ou rejeita
- Se aprovada, Financeiro pode marcar como "Paga"

**Estados:**
- **PENDING**: Aguardando aprovação (se valor > limite)
- **APPROVED**: Aprovada, aguardando pagamento
- **PAID**: Paga (final)
- **REJECTED**: Rejeitada pelo síndico

**Onde usar:** Menu "Saídas" no módulo Financeiro.

---

### 📋 **Tarefa**
**O que é:** Trabalho específico atribuído ao Operacional pelo Administrativo (ex: "Trocar lâmpada do corredor", "Verificar sistema de incêndio").

**Como funciona:**
- Administrativo cria tarefa com título, descrição, responsável e prazo
- Pode incluir itens de checklist (subtarefas)
- Operacional vê a tarefa no dashboard
- Operacional executa e marca como concluída
- Administrativo pode reabrir se necessário

**Estados:**
- **PENDING**: Criada, aguardando execução
- **IN_PROGRESS**: Em andamento
- **COMPLETED**: Concluída
- **CANCELLED**: Cancelada

**Diferença de Checklist:** Tarefa é única e específica. Checklist é rotina diária que se repete.

**Onde usar:** Menu "Tarefas" no módulo Administrativo (criar) e Operacional (executar).

---

### 🔧 **Manutenção**
**O que é:** Trabalho de manutenção preventiva ou corretiva em equipamentos/áreas do condomínio.

**Tipos:**
- **PREVENTIVA**: Agendada (ex: manutenção mensal do elevador)
- **CORRETIVA**: Reparo (ex: consertar portão quebrado)

**Como funciona:**
- Síndico cria manutenção e atribui ao Operacional
- Operacional inicia quando começar o trabalho
- Operacional conclui quando terminar (pode informar custo)
- Síndico vê manutenção concluída

**Estados:**
- **PENDING**: Criada, aguardando início
- **IN_PROGRESS**: Em execução
- **COMPLETED**: Concluída
- **CANCELLED**: Cancelada

**Onde usar:** Menu "Manutenções" no módulo Síndico (criar) e Operacional (executar).

---

### 💵 **Orçamento (Solicitação de Orçamento)**
**O que é:** Pedido de autorização para gastar dinheiro em algo específico (ex: comprar equipamento, contratar serviço).

**Como funciona:**
1. **Administrativo** cria solicitação de orçamento (descreve o que precisa, valor estimado)
2. **Financeiro** revisa e preenche informações financeiras (centro de custo, observações)
3. **Síndico** aprova ou rejeita (pode aprovar valor diferente do solicitado)
4. **Financeiro** libera o valor para o Operacional executar
5. **Operacional** vê orçamento liberado e pode usar o valor

**Estados:**
- **PENDING_FINANCEIRO**: Aguardando análise do financeiro
- **PENDING_SINDICO**: Aguardando aprovação do síndico
- **APPROVED**: Aprovado pelo síndico
- **LIBERATED**: Valor liberado para operacional
- **REJECTED**: Rejeitado

**Onde usar:** Menu "Orçamentos" em cada módulo (cada um vê o que precisa fazer).

---

### 📄 **Conta (Conta Recorrente)**
**O que é:** Conta que se repete mensalmente (ex: conta de água, luz, gás, telefone).

**Como funciona:**
- Financeiro cadastra a conta (nome, tipo, fornecedor, número da conta)
- Ao criar uma saída financeira, pode vincular a uma conta
- Facilita controle de contas recorrentes
- Permite registrar consumo mensal (ex: consumo de água em m³)

**Onde usar:** Menu "Contas" no módulo Financeiro.

---

### 📦 **Consumo Mensal**
**O que é:** Registro do consumo e valor de uma conta em um mês específico (ex: consumo de água em janeiro: 150m³, R$ 250,00).

**Como funciona:**
- Financeiro seleciona a conta (ex: "Conta de Água")
- Informa o valor do consumo (ex: 150m³)
- Informa o valor pago (ex: R$ 250,00)
- Sistema registra para histórico

**Onde usar:** Menu "Consumo" no módulo Financeiro.

---

### 🏢 **Ativo (Patrimônio)**
**O que é:** Bem do condomínio que tem valor (ex: elevador, sistema de incêndio, portão automático).

**Como funciona:**
- Patrimônio cadastra ativo (nome, valor de aquisição, data de compra, vida útil)
- Sistema calcula depreciação automaticamente (valor atual = valor original - depreciação)
- Pode vincular manutenções ao ativo
- Síndico vê valor total do patrimônio

**Onde usar:** Menu "Ativos" no módulo Patrimônio.

---

### 📝 **Documento**
**O que é:** Arquivo importante do condomínio (ex: contrato, laudo, manual).

**Como funciona:**
- Administrativo cadastra documento (nome, categoria, arquivo PDF)
- Pode definir data de vencimento (ex: contrato que expira)
- Sistema alerta quando está próximo do vencimento
- Documentos ficam organizados por categoria

**Onde usar:** Menu "Documentos" no módulo Administrativo.

---

### 🔔 **Notificação**
**O que é:** Alerta interno do sistema para o usuário (ex: "Nova tarefa atribuída", "Entrada aprovada", "Orçamento aguardando análise").

**Como funciona:**
- Sistema cria notificação automaticamente quando algo acontece
- Aparece no badge do menu (contador de não lidas)
- Usuário clica e vê detalhes
- Pode marcar como lida
- Não pode ser deletada (apenas marcada como lida)

**Tipos:**
- Tarefa atribuída
- Ocorrência criada
- Aprovação pendente
- Orçamento aguardando
- Manutenção atribuída
- E outros...

**Onde usar:** Ícone de sino no menu superior (navbar).

---

### 📊 **Log de Auditoria**
**O que é:** Registro imutável de todas as ações importantes no sistema (quem fez, o que fez, quando fez).

**Como funciona:**
- Sistema registra automaticamente:
  - Criação, edição, exclusão de registros
  - Aprovações e rejeições
  - Logins
  - Mudanças de estado
- Registra estado ANTES e DEPOIS da alteração
- Nunca é deletado
- Síndico pode visualizar logs do condomínio

**Onde usar:** Menu "Logs" no módulo Síndico.

---

### ⚙️ **Modelo de Checklist**
**O que é:** Regra/template que define como gerar checklists diários automaticamente.

**Como funciona:**
- Síndico cria modelo (nome, departamento, dias da semana, itens)
- Sistema gera checklist diário automaticamente nos dias configurados
- Exemplo: Modelo "Inspeção Zeladoria - Semanal" gera checklist toda segunda-feira

**Campos importantes:**
- **Dias da semana**: Quais dias gerar (ex: Segunda, Quarta, Sexta)
- **Itens**: O que verificar (ex: "Verificar elevadores", "Verificar portão")
- **Requer foto**: Se precisa de foto como evidência
- **Requer justificativa**: Se item não feito, precisa justificar

**Onde usar:** Menu "Modelos de Checklist" no módulo Síndico.

---

### 🎯 **SLA (Service Level Agreement)**
**O que é:** Prazo máximo para resolver uma tarefa ou ocorrência (ex: 24 horas para ocorrência urgente).

**Como funciona:**
- Administrativo define SLA ao triar ocorrência
- Sistema alerta se está próximo do prazo
- Sistema alerta se passou do prazo (atrasado)
- Síndico vê no dashboard quantas estão atrasadas

**Onde usar:** Ao triar ocorrência, campo "SLA (horas)".

---

### 🔄 **Triagem**
**O que é:** Processo de analisar uma ocorrência e decidir o que fazer com ela.

**Como funciona:**
- Administrativo vê ocorrências não triadas
- Analisa a ocorrência
- Pode:
  - Atribuir responsável (operacional)
  - Classificar (preventiva, corretiva, etc)
  - Definir SLA (prazo)
  - Converter em tarefa (se necessário)

**Onde usar:** Menu "Ocorrências" → "Pendentes" no módulo Administrativo.

---

### 📌 **Centro de Custo vs Categoria**
**Centro de Custo:**
- Agrupa despesas por tipo de gasto
- Exemplo: "Manutenção", "Contas", "Contratos"
- Criado pelo Financeiro
- Usado para relatórios e controle

**Categoria:**
- Tipo específico da entrada/saída
- Exemplo: "TAXA", "RECEITA", "MANUTENCAO", "CONTA", "OUTRA"
- Pré-definida no sistema
- Usada para classificação rápida

---

## 3. ESTRUTURA DO SISTEMA

### Organização por Módulos
O sistema está dividido em módulos independentes, cada um com seu próprio menu e funcionalidades:

1. **Master** (SUPER_MASTER): Gerencia sistema (condomínios, usuários)
2. **Síndico**: Aprova, analisa, visualiza
3. **Financeiro**: Controla dinheiro
4. **Administrativo**: Organiza tarefas e documentos
5. **Operacional**: Executa trabalhos
6. **Limpeza**: Executa limpeza
7. **Patrimônio**: Gerencia ativos
8. **Conselho**: Apenas visualização

### Navegação
- **Menu superior (Navbar)**: Aparece automaticamente conforme seu perfil
- **Dashboard**: Primeira tela ao fazer login (resumo do módulo)
- **Breadcrumbs**: Não existe (use o menu para navegar)

---

## 4. PERFIS E PERMISSÕES

### SUPER_MASTER
**O que pode fazer:**
- Criar e editar condomínios
- Criar e editar usuários
- Atribuir perfis aos usuários
- Ver logs de todo o sistema

**O que NÃO pode fazer:**
- Acessar módulos operacionais (síndico, financeiro, etc)
- Governar um condomínio específico

**Regra:** Quem governa o sistema não governa o condomínio.

---

### SINDICO / SUBSINDICO
**O que pode fazer:**
- Aprovar/rejeitar entradas financeiras
- Aprovar/rejeitar saídas financeiras (acima do limite)
- Aprovar/rejeitar orçamentos
- Aprovar/rejeitar ocorrências (se requerer aprovação)
- Criar manutenções
- Criar modelos de checklist
- Ver dashboards e relatórios
- Ver logs do condomínio

**O que NÃO pode fazer:**
- Criar usuários
- Executar tarefas operacionais
- Registrar entradas/saídas financeiras

**Regra:** Quem decide não executa.

---

### FINANCEIRO
**O que pode fazer:**
- Criar entradas financeiras
- Criar saídas financeiras
- Cadastrar contas
- Cadastrar centros de custo
- Registrar consumo mensal
- Revisar orçamentos (preencher informações financeiras)
- Liberar orçamentos aprovados
- Ver dashboards financeiros

**O que NÃO pode fazer:**
- Aprovar valores altos (só síndico)
- Executar tarefas operacionais
- Criar tarefas

---

### ADMINISTRATIVO
**O que pode fazer:**
- Criar tarefas para operacional
- Criar documentos
- Triar ocorrências
- Solicitar orçamentos
- Criar comunicados operacionais
- Reabrir tarefas concluídas

**O que NÃO pode fazer:**
- Executar tarefas
- Aprovar valores altos
- Acessar módulo financeiro (separado)
- Acessar módulo patrimônio (separado)

---

### OPERACIONAL
**O que pode fazer:**
- Executar checklists diários
- Executar tarefas atribuídas
- Criar ocorrências
- Resolver ocorrências
- Executar manutenções atribuídas
- Ver orçamentos liberados

**O que NÃO pode fazer:**
- Ver dados financeiros
- Criar tarefas
- Aprovar nada
- Criar modelos de checklist

**Regra:** Quem executa não decide.

---

### LIMPEZA
**O que pode fazer:**
- Executar checklists de limpeza
- Criar ocorrências de limpeza
- Ver ocorrências de limpeza

**O que NÃO pode fazer:**
- Criar ocorrências de zeladoria (sistema converte automaticamente se for problema técnico)
- Ver dados financeiros
- Executar tarefas de zeladoria

---

### PATRIMONIO
**O que pode fazer:**
- Cadastrar ativos
- Editar ativos
- Calcular depreciação
- Vincular manutenções a ativos
- Ver dashboards patrimoniais

**O que NÃO pode fazer:**
- Criar despesas
- Aprovar valores

---

### CONSELHO
**O que pode fazer:**
- Ver dashboards (apenas leitura)
- Ver relatórios

**O que NÃO pode fazer:**
- Criar, editar ou aprovar nada
- Apenas visualização

---

## 5. MÓDULOS DO SISTEMA

### 5.1 MÓDULO MASTER (SUPER_MASTER)

#### Dashboard Master
**O que mostra:**
- Total de condomínios ativos
- Total de condomínios inativos
- Total de usuários ativos
- Logs nas últimas 24 horas

**Botões:**
- Links para outras telas do módulo

---

#### Condomínios
**Lista de Condomínios:**
- Mostra todos os condomínios cadastrados
- Colunas: Nome, Endereço, CNPJ, Telefone, Email, Status

**Botão "Novo Condomínio":**
- Abre formulário de criação
- Campos: Nome (obrigatório), Endereço, CNPJ, Telefone, Email, Ativo (checkbox)

**Botão "Editar" (por linha):**
- Abre formulário preenchido
- Permite alterar todos os campos
- Botão "Salvar" atualiza no banco

**Validações:**
- Nome obrigatório
- CNPJ válido (se preenchido)
- Email válido (se preenchido)

---

#### Usuários
**Lista de Usuários:**
- Mostra todos os usuários cadastrados
- Colunas: Username, Email, Nome, Condomínio, Perfis, Status

**Botão "Novo Usuário":**
- Abre formulário de criação
- Campos:
  - Username (obrigatório, único)
  - Email (obrigatório, único, validado)
  - Senha (obrigatório na criação)
  - Nome Completo (obrigatório)
  - Condomínio (select, opcional - NULL para SUPER_MASTER)
  - Ativo (checkbox)
  - Perfis (checkboxes múltiplos)

**Botão "Editar" (por linha):**
- Abre formulário preenchido
- Senha é opcional na edição (só atualiza se preenchida)
- Permite alterar perfis

**Validações:**
- Username único
- Email único e válido
- Senha obrigatória na criação

---

### 5.2 MÓDULO SÍNDICO

#### Dashboard Síndico
**O que mostra:**
- Aprovações pendentes (contador + valor total)
- Alertas críticos
- Alertas de warning
- Saldo financeiro
- Tarefas atrasadas
- Ocorrências abertas
- Entradas pendentes de análise
- Orçamentos aguardando aprovação
- Manutenções concluídas
- Ocorrências pendentes de aprovação

**Botões:**
- Links para módulos específicos

---

#### Entradas Pendentes
**O que mostra:**
- Lista de entradas financeiras com `review_status = 'PENDING_REVIEW'`
- Para cada entrada: Descrição, Valor, Data, Categoria, Centro de Custo, Criada por, Data de criação

**Botão "Aprovar" (por entrada):**
- Campo opcional: Observações (textarea)
- Ao clicar:
  - Atualiza `review_status = 'APPROVED'`
  - Preenche `reviewed_by`, `reviewed_at`, `review_notes`
  - Notifica financeiro
  - Registra log
  - Entrada entra no cálculo financeiro
  - Redireciona com mensagem de sucesso

**Botão "Rejeitar" (por entrada):**
- Campo obrigatório: Motivo da Rejeição (textarea)
- Ao clicar:
  - Atualiza `review_status = 'REJECTED'`
  - Preenche `rejection_reason`
  - Notifica financeiro
  - Registra log
  - Financeiro pode editar/excluir entrada rejeitada
  - Redireciona com mensagem de sucesso

---

#### Ocorrências Pendentes de Aprovação
**O que mostra:**
- Lista de ocorrências com `requires_approval = true` e `approval_status = 'PENDING'`
- Para cada ocorrência: Título, Descrição, Localização, Prioridade, Tipo, Criada por

**Botão "Aprovar" (por ocorrência):**
- Ao clicar:
  - Atualiza `approval_status = 'APPROVED'`
  - Preenche `approved_by`, `approved_at`
  - Notifica operacional
  - Registra log
  - Operacional pode resolver ocorrência
  - Redireciona com mensagem de sucesso

**Botão "Rejeitar" (por ocorrência):**
- Campo obrigatório: Motivo da Rejeição (textarea)
- Ao clicar:
  - Atualiza `approval_status = 'REJECTED'`
  - Preenche `approval_rejection_reason`
  - Notifica operacional
  - Registra log
  - Redireciona com mensagem de sucesso

---

#### Modelos de Checklist
**Lista de Modelos:**
- Mostra todos os modelos criados
- Colunas: Nome, Departamento, Dias da Semana, Status (Ativo/Inativo)

**Botão "Novo Modelo":**
- Abre formulário de criação
- Campos:
  - Nome (obrigatório)
  - Descrição (opcional)
  - Departamento (select: ZELADORIA, LIMPEZA, obrigatório)
  - Dias da Semana (checkboxes: Segunda a Domingo, pelo menos um obrigatório)
  - Modelo Ativo (checkbox)
  - Requer Foto (checkbox)
  - Requer Justificativa (checkbox)
  - Responsável Padrão (select: OPERACIONAL, LIMPEZA)
  - Itens do Modelo (array dinâmico):
    - Nome do Item (text)
    - Ordem (number)
    - Requer Foto neste item (checkbox)

**Botão "Editar" (por modelo):**
- Abre formulário preenchido
- Permite alterar todos os campos

**Botão "Ativar/Desativar" (por modelo):**
- Alterna status ativo/inativo
- Modelo inativo não gera checklists automaticamente

**Como funciona:**
- Modelo ativo + dias da semana selecionados = sistema gera checklist automaticamente nesses dias
- Itens do modelo são copiados para o checklist do dia
- Operacional executa checklist gerado

---

#### Manutenções
**Lista de Manutenções:**
- Mostra todas as manutenções criadas pelo síndico
- Colunas: Tipo, Título, Status, Responsável, Data Prevista

**Botão "Nova Manutenção":**
- Abre formulário de criação
- Campos:
  - Tipo (select: PREVENTIVA, CORRETIVA, obrigatório)
  - Título (text, obrigatório)
  - Descrição (textarea, obrigatório)
  - Localização (text, opcional)
  - Prioridade (select: BAIXA, NORMAL, ALTA, URGENTE)
  - Data Prevista (date, opcional)
  - Responsável (select: operacionais do condomínio, obrigatório)
  - Ativo Relacionado (select: ativos, opcional)

**Botão "Ver Detalhes" (por manutenção):**
- Mostra informações completas
- Mostra histórico de execução

---

### 5.3 MÓDULO FINANCEIRO

#### Dashboard Financeiro
**O que mostra:**
- Entradas pendentes de análise
- Saídas pendentes
- Orçamentos aguardando análise
- Saldo atual
- Contas vencendo

---

#### Entradas Financeiras
**Lista de Entradas:**
- Mostra todas as entradas criadas
- Colunas: Descrição, Valor, Data, Categoria, Status de Análise

**Botão "Nova Entrada":**
- Abre formulário de criação
- Campos:
  - Descrição (text, obrigatório)
  - Valor (number, obrigatório, > 0)
  - Data (date, obrigatório)
  - Centro de Custo (select, opcional)
  - Categoria (select: TAXA, RECEITA, OUTRA)
  - Vincular a (select: outras entradas/saídas, opcional)
  - Tipo de Vínculo (select: ENTRY, EXIT, se vinculado)

**Botão "Editar" (só aparece se entrada estiver rejeitada):**
- Abre formulário preenchido
- Permite alterar todos os campos
- Ao salvar, reseta `review_status = 'PENDING_REVIEW'`
- Notifica síndico novamente

**Botão "Excluir" (só aparece se entrada estiver rejeitada):**
- Confirma exclusão
- Deleta entrada fisicamente
- Registra log

**Fluxo:**
1. Financeiro cria → Status: PENDING_REVIEW
2. Síndico aprova → Status: APPROVED → Entra no cálculo
3. Síndico rejeita → Status: REJECTED → Financeiro pode editar/excluir

---

#### Entradas Rejeitadas
**Lista de Entradas Rejeitadas:**
- Mostra entradas com `review_status = 'REJECTED'`
- Mostra motivo da rejeição
- Botões: Editar, Excluir

---

#### Saídas Financeiras
**Lista de Saídas:**
- Mostra todas as saídas criadas
- Colunas: Descrição, Valor, Data, Status de Pagamento

**Botão "Nova Saída":**
- Abre formulário de criação
- Campos:
  - Descrição (text, obrigatório)
  - Valor (number, obrigatório, > 0)
  - Data (date, obrigatório)
  - Centro de Custo (select, opcional)
  - Categoria (select: MANUTENCAO, CONTA, CONTRATO, OUTRA)
  - Conta Vinculada (select: contas cadastradas, opcional)
  - Requer Aprovação (checkbox)
  - Limite de Aprovação (number, padrão: 1000.00)
  - É Recorrente (checkbox)
  - Tipo de Recorrência (select, se recorrente)
  - Valor Variável (checkbox, se recorrente)
  - Valor Médio (number, se variável)

**Botão "Pagar" (só aparece se saída estiver aprovada):**
- Abre formulário de pagamento
- Permite anexar comprovante (PDF)
- Marca como paga

**Fluxo:**
1. Financeiro cria
2. Se `requires_approval = true` e `valor > limite` → Status: PENDING → Vai para síndico
3. Se não → Status: APPROVED → Pode pagar
4. Síndico aprova → Status: APPROVED → Financeiro pode pagar
5. Financeiro paga → Status: PAID (final)

---

#### Orçamentos Pendentes (Aguardando Financeiro)
**Lista de Orçamentos:**
- Mostra orçamentos com `status = 'PENDING_FINANCEIRO'`
- Criados pelo Administrativo

**Botão "Revisar e Enviar para Síndico" (por orçamento):**
- Campos:
  - Observações do Financeiro (textarea, obrigatório)
  - Centro de Custo (select, opcional)
- Ao clicar:
  - Atualiza `financeiro_reviewed = true`
  - Preenche `financeiro_reviewed_by`, `financeiro_reviewed_at`, `financeiro_notes`
  - Atualiza `status = 'PENDING_SINDICO'`
  - Notifica síndico
  - Registra log
  - Redireciona com sucesso

---

#### Orçamentos Aprovados (Aguardando Liberação)
**Lista de Orçamentos:**
- Mostra orçamentos com `status = 'APPROVED'` (aprovados pelo síndico)

**Botão "Liberar para Operacional" (por orçamento):**
- Campo opcional: Observações (textarea)
- Ao clicar:
  - Atualiza `released_to_operational = true`
  - Preenche `released_at`, `released_by`
  - Atualiza `status = 'LIBERATED'`
  - Notifica operacional
  - Registra log
  - Operacional vê orçamento liberado

**Botão "Retornar para Síndico" (por orçamento):**
- Campo obrigatório: Motivo (textarea)
- Ao clicar:
  - Atualiza `status = 'PENDING_SINDICO'`
  - Notifica síndico
  - Registra log

---

#### Contas
**Lista de Contas:**
- Mostra todas as contas cadastradas
- Colunas: Nome, Tipo, Fornecedor, Número da Conta, Status

**Botão "Nova Conta":**
- Campos:
  - Nome (text, obrigatório)
  - Tipo (select: AGUA, LUZ, GAS, TELEFONE, INTERNET, OUTRA, obrigatório)
  - Centro de Custo (select, opcional)
  - Fornecedor (text, opcional)
  - Número da Conta (text, opcional)
  - É Recorrente (checkbox, padrão: true)
  - Ativa (checkbox, padrão: true)

**Botão "Editar" (por conta):**
- Permite alterar todos os campos

---

#### Centros de Custo
**Lista de Centros de Custo:**
- Mostra todos os centros de custo
- Colunas: Nome, Descrição, Status

**Botão "Novo Centro de Custo":**
- Campos:
  - Nome (text, obrigatório)
  - Descrição (textarea, opcional)
  - Ativo (checkbox, padrão: true)

---

#### Consumo Mensal
**Formulário de Registro:**
- Campos:
  - Conta (select: contas cadastradas, obrigatório)
  - Valor do Consumo (number, obrigatório, ex: 150m³)
  - Data do Consumo (date, obrigatório)
  - Valor Pago (number, obrigatório, > 0)

**Botão "Registrar":**
- Cria registro de consumo
- Pode criar saída financeira automaticamente vinculada à conta

---

### 5.4 MÓDULO ADMINISTRATIVO

#### Dashboard Administrativo
**O que mostra:**
- Tarefas pendentes
- Ocorrências não triadas
- Documentos
- Orçamentos

---

#### Tarefas
**Lista de Tarefas:**
- Mostra todas as tarefas criadas
- Colunas: Título, Responsável, Vencimento, Prioridade, Status

**Botão "Nova Tarefa":**
- Campos:
  - Título (text, obrigatório)
  - Descrição (textarea, opcional)
  - Responsável (select: operacionais, obrigatório)
  - Data de Vencimento (date, obrigatório)
  - Prioridade (select: BAIXA, NORMAL, ALTA, URGENTE)
  - Itens de Checklist (array dinâmico: nome do item)

**Botão "Reabrir" (só aparece se tarefa estiver concluída):**
- Campo obrigatório: Motivo da Reabertura (textarea)
- Ao clicar:
  - Atualiza `status = 'PENDING'`
  - Marca `reopened = true`
  - Notifica operacional
  - Registra log especial (REOPEN)

---

#### Triagem de Ocorrências
**Lista de Ocorrências Pendentes:**
- Mostra ocorrências com `triaged = false`

**Botão "Triar" (por ocorrência):**
- Abre formulário de triagem
- Campos:
  - Atribuir a (select: operacionais, opcional)
  - Classificação (select, opcional)
  - SLA (horas) (number, opcional)
  - Converter em Tarefa (checkbox)
- Ao clicar "Triar":
  - Atualiza `triaged = true`
  - Preenche `triaged_by`, `triaged_at`
  - Se atribuído, atualiza `status = 'EM_ATENDIMENTO'`
  - Se convertida em tarefa, cria tarefa vinculada
  - Notifica operacional (se atribuído)
  - Registra log

---

#### Solicitação de Orçamento
**Lista de Orçamentos:**
- Mostra orçamentos criados pelo administrativo

**Botão "Novo Orçamento":**
- Campos:
  - Título (text, obrigatório)
  - Descrição (textarea, obrigatório)
  - Valor Estimado (number, opcional)
  - Prioridade (select)
  - Ocorrência Relacionada (select, opcional)
  - Tarefa Relacionada (select, opcional)
  - Anexos (file upload, PDFs, máximo 10, até 50MB cada)

**Fluxo:**
1. Administrativo cria → Status: PENDING_FINANCEIRO
2. Financeiro revisa → Status: PENDING_SINDICO
3. Síndico aprova → Status: APPROVED
4. Financeiro libera → Status: LIBERATED
5. Operacional vê liberado

---

### 5.5 MÓDULO OPERACIONAL

#### Dashboard Operacional
**O que mostra:**
- Tarefas pendentes
- Tarefas atrasadas
- Ocorrências abertas
- Manutenções pendentes
- Manutenções em andamento
- Orçamentos liberados

---

#### Checklists Diários
**Lista de Checklists:**
- Mostra checklists gerados automaticamente
- Filtro por data (padrão: hoje)
- Para cada checklist: Modelo, Data, Status, Progresso

**Botão "Executar" (por checklist):**
- Abre tela de execução

---

#### Execução de Checklist
**O que mostra:**
- Status do checklist (PENDING, IN_PROGRESS, COMPLETED, LATE)
- Progresso (%)
- Lista de itens:
  - Nome do item
  - Status (PENDING, DONE, NOT_DONE)
  - Comentário (se NOT_DONE)
  - Foto (se adicionada)

**Botão "Iniciar Checklist" (se status PENDING):**
- Atualiza `status = 'IN_PROGRESS'`
- Preenche `started_at`
- Registra log

**Botão "Atualizar Item" (por item):**
- Campos:
  - Status (select: DONE, NOT_DONE)
  - Comentário (textarea, obrigatório se NOT_DONE e requires_justification)
- Atualiza item
- Atualiza progresso do checklist

**Botão "Adicionar Foto" (por item ou checklist geral):**
- Upload de imagem (máximo 10MB)
- Salva em `uploads/checklists/`
- Cria registro em `checklist_evidences`

**Botão "Finalizar Checklist":**
- Valida se todos os itens têm status
- Atualiza `status = 'COMPLETED'`
- Preenche `completed_at`, `completed_by`
- Registra log

---

#### Ocorrências
**Lista de Ocorrências:**
- Mostra ocorrências reportadas pelo operacional
- Colunas: Título, Status, Prioridade, Localização

**Botão "Nova Ocorrência":**
- Campos:
  - Título (text, obrigatório)
  - Descrição (textarea, obrigatório)
  - Localização (text, opcional)
  - Prioridade (select: BAIXA, NORMAL, ALTA, URGENTE)
  - Tipo de Ocorrência (select: ROUTINE, NON_ROUTINE, EMERGENCY)
  - Requer Aprovação (checkbox, aparece se NON_ROUTINE ou EMERGENCY)
  - Aprovação Requerida de (select: SINDICO, ADMINISTRATIVO, FINANCEIRO, se requiresApproval)
  - Enviar para Usuário Específico (select, opcional)
  - Enviar para Perfil (select, opcional)

**Botão "Resolver" (por ocorrência):**
- Campo obrigatório: Notas da Resolução (textarea)
- Ao clicar:
  - Valida transição de estado (via stateValidator)
  - Atualiza `status = 'RESOLVIDA'`
  - Preenche `resolved_at`, `resolved_by`, `resolution_notes`
  - Notifica síndico
  - Registra log

---

#### Manutenções
**Lista de Manutenções:**
- Mostra manutenções atribuídas ao operacional
- Colunas: Tipo, Título, Status, Data Prevista

**Botão "Iniciar" (se status PENDING):**
- Atualiza `status = 'IN_PROGRESS'`
- Preenche `started_at`
- Registra log

**Botão "Concluir" (se status IN_PROGRESS):**
- Abre formulário de conclusão
- Campos:
  - Notas de Conclusão (textarea, obrigatório)
  - Custo (number, opcional)
- Ao salvar:
  - Atualiza `status = 'COMPLETED'`
  - Preenche `completed_at`, `completed_by`, `completion_notes`, `cost`
  - Notifica síndico
  - Registra log

---

### 5.6 MÓDULO LIMPEZA

#### Dashboard Limpeza
**O que mostra:**
- Checklists pendentes
- Ocorrências de limpeza

---

#### Ocorrências de Limpeza
**Lista de Ocorrências:**
- Mostra ocorrências de limpeza (tipo LIMPEZA)

**Botão "Nova Ocorrência":**
- Campos:
  - Título (text, obrigatório)
  - Descrição (textarea, obrigatório)
  - Localização (text, opcional)
  - Tipo de Limpeza (select: AREA_IMPROPRIA, SUJEIRA_EXCESSIVA, FALTA_MATERIAL, EQUIPAMENTO_DEFEITO)

**Comportamento especial:**
- Se tipo = EQUIPAMENTO_DEFEITO:
  - Sistema cria automaticamente ocorrência de ZELADORIA
  - Notifica operacional
  - Limpeza não pode resolver ocorrência de zeladoria

---

### 5.7 NOTIFICAÇÕES

#### Lista de Notificações
**O que mostra:**
- Todas as notificações do usuário
- Filtro: Lidas / Não Lidas

**Botão "Marcar como Lida" (por notificação):**
- Atualiza `read = true`, `read_at`
- Retorna JSON `{success: true}` (AJAX) ou redireciona

**Botão "Marcar Todas como Lidas":**
- Atualiza todas não lidas
- Retorna JSON ou redireciona

**Link para Detalhes:**
- Se notificação tem `entity_type` e `entity_id`:
  - Redireciona para tela específica da entidade
  - Exemplo: notificação de tarefa → `/operacional/tarefas/:id`

---

## 6. FLUXOS DE VALIDAÇÃO

### FLUXO 1: Entrada Financeira (Criação → Análise → Aprovação)

**Objetivo:** Validar que o fluxo de entrada financeira funciona corretamente.

**Passos:**

1. **Financeiro cria entrada:**
   - [ ] Login como FINANCEIRO
   - [ ] Acessar `/financeiro/entradas/nova`
   - [ ] Preencher: Descrição "Taxa de Condomínio - Janeiro", Valor "5000.00", Data "2025-01-15", Categoria "TAXA"
   - [ ] Clicar em "Salvar"
   - [ ] **Verificar:** Entrada criada com `review_status = 'PENDING_REVIEW'`
   - [ ] **Verificar:** Notificação enviada ao síndico

2. **Síndico analisa:**
   - [ ] Login como SINDICO
   - [ ] Acessar `/sindico/entradas-pendentes`
   - [ ] **Verificar:** Entrada aparece na lista
   - [ ] **Verificar:** Informações corretas (descrição, valor, data)
   - [ ] Clicar em "Aprovar"
   - [ ] Preencher observações (opcional): "Aprovado conforme previsto"
   - [ ] Clicar em "Aprovar"
   - [ ] **Verificar:** Status atualizado para `APPROVED`
   - [ ] **Verificar:** Notificação enviada ao financeiro
   - [ ] **Verificar:** Log de auditoria registrado

3. **Financeiro vê entrada aprovada:**
   - [ ] Login como FINANCEIRO
   - [ ] Acessar `/financeiro/entradas`
   - [ ] **Verificar:** Entrada aparece com status "Aprovada"
   - [ ] **Verificar:** Observações do síndico visíveis

**Cenário Alternativo - Rejeição:**

1. **Síndico rejeita:**
   - [ ] Clicar em "Rejeitar"
   - [ ] Preencher motivo: "Valor incorreto, verificar"
   - [ ] Clicar em "Rejeitar"
   - [ ] **Verificar:** Status atualizado para `REJECTED`
   - [ ] **Verificar:** Notificação enviada ao financeiro

2. **Financeiro corrige:**
   - [ ] Acessar `/financeiro/entradas-rejeitadas`
   - [ ] **Verificar:** Entrada aparece na lista
   - [ ] **Verificar:** Motivo da rejeição visível
   - [ ] Clicar em "Editar"
   - [ ] Corrigir valor para "5500.00"
   - [ ] Clicar em "Salvar"
   - [ ] **Verificar:** Status resetado para `PENDING_REVIEW`
   - [ ] **Verificar:** Notificação enviada ao síndico novamente

3. **Síndico aprova correção:**
   - [ ] Ver entrada corrigida em pendentes
   - [ ] Aprovar
   - [ ] **Verificar:** Entrada aprovada

---

### FLUXO 2: Orçamento Completo (ADM → Financeiro → Síndico → Financeiro → Operacional)

**Objetivo:** Validar fluxo completo de solicitação de orçamento.

**Passos:**

1. **Administrativo solicita orçamento:**
   - [ ] Login como ADMINISTRATIVO
   - [ ] Acessar `/administrativo/orcamentos/novo`
   - [ ] Preencher:
     - Título: "Troca de Portão Automático"
     - Descrição: "Portão está com defeito, precisa trocar"
     - Valor Estimado: "15000.00"
     - Prioridade: "ALTA"
   - [ ] Anexar PDF (opcional)
   - [ ] Clicar em "Solicitar"
   - [ ] **Verificar:** Orçamento criado com `status = 'PENDING_FINANCEIRO'`
   - [ ] **Verificar:** Notificação enviada ao financeiro

2. **Financeiro revisa:**
   - [ ] Login como FINANCEIRO
   - [ ] Acessar `/financeiro/orcamentos-pendentes`
   - [ ] **Verificar:** Orçamento aparece na lista
   - [ ] Clicar em "Revisar e Enviar para Síndico"
   - [ ] Preencher:
     - Observações: "Orçamento analisado, valor dentro do esperado"
     - Centro de Custo: "Manutenção"
   - [ ] Clicar em "Revisar"
   - [ ] **Verificar:** Status atualizado para `PENDING_SINDICO`
   - [ ] **Verificar:** `financeiro_reviewed = true`
   - [ ] **Verificar:** Notificação enviada ao síndico

3. **Síndico aprova:**
   - [ ] Login como SINDICO
   - [ ] Acessar `/sindico/orcamentos-pendentes` (ou similar)
   - [ ] **Verificar:** Orçamento aparece na lista
   - [ ] Ver observações do financeiro
   - [ ] Clicar em "Aprovar"
   - [ ] Preencher:
     - Observações: "Aprovado, pode liberar"
     - Valor Aprovado: "15000.00"
   - [ ] Clicar em "Aprovar"
   - [ ] **Verificar:** Status atualizado para `APPROVED`
   - [ ] **Verificar:** `budget_approved_amount = 15000.00`
   - [ ] **Verificar:** Notificação enviada ao financeiro

4. **Financeiro libera:**
   - [ ] Login como FINANCEIRO
   - [ ] Acessar `/financeiro/orcamentos-aprovados`
   - [ ] **Verificar:** Orçamento aparece na lista
   - [ ] Clicar em "Liberar para Operacional"
   - [ ] Preencher observações (opcional)
   - [ ] Clicar em "Liberar"
   - [ ] **Verificar:** Status atualizado para `LIBERATED`
   - [ ] **Verificar:** `released_to_operational = true`
   - [ ] **Verificar:** Notificação enviada ao operacional

5. **Operacional vê orçamento liberado:**
   - [ ] Login como OPERACIONAL
   - [ ] Acessar `/operacional/dashboard`
   - [ ] **Verificar:** Orçamento liberado aparece no dashboard
   - [ ] **Verificar:** Valor aprovado visível

**Cenário Alternativo - Retorno:**

1. **Financeiro retorna para síndico:**
   - [ ] Em orçamentos aprovados, clicar em "Retornar"
   - [ ] Preencher motivo: "Precisa revisar valor"
   - [ ] Clicar em "Retornar"
   - [ ] **Verificar:** Status atualizado para `PENDING_SINDICO`
   - [ ] **Verificar:** Notificação enviada ao síndico

---

### FLUXO 3: Checklist Diário (Geração → Execução → Finalização)

**Objetivo:** Validar geração automática e execução de checklists.

**Passos:**

1. **Síndico cria modelo:**
   - [ ] Login como SINDICO
   - [ ] Acessar `/sindico/checklist-modelos/novo`
   - [ ] Preencher:
     - Nome: "Inspeção Zeladoria - Diária"
     - Departamento: "ZELADORIA"
     - Dias: Segunda, Terça, Quarta, Quinta, Sexta (checkboxes)
     - Modelo Ativo: checked
     - Requer Foto: checked
     - Requer Justificativa: checked
     - Responsável Padrão: "OPERACIONAL"
   - [ ] Adicionar itens:
     - Item 1: "Verificar elevadores"
     - Item 2: "Verificar portão"
     - Item 3: "Verificar sistema de incêndio"
   - [ ] Clicar em "Salvar"
   - [ ] **Verificar:** Modelo criado

2. **Sistema gera checklist (manual ou automático):**
   - [ ] Executar job de geração: GET `/automation/generate-checklists` (como ADMINISTRATIVO)
   - [ ] **Verificar:** Checklist criado para hoje (se hoje é dia da semana configurado)
   - [ ] **Verificar:** Itens copiados do modelo
   - [ ] **Verificar:** Status inicial: PENDING

3. **Operacional executa checklist:**
   - [ ] Login como OPERACIONAL
   - [ ] Acessar `/operacional/checklists-diarios`
   - [ ] **Verificar:** Checklist aparece na lista
   - [ ] Clicar em "Executar"
   - [ ] Clicar em "Iniciar Checklist"
   - [ ] **Verificar:** Status atualizado para IN_PROGRESS
   - [ ] Para cada item:
     - [ ] Marcar como DONE ou NOT_DONE
     - [ ] Se NOT_DONE, preencher justificativa (obrigatório)
     - [ ] Adicionar foto (se necessário)
   - [ ] Clicar em "Finalizar Checklist"
   - [ ] **Verificar:** Status atualizado para COMPLETED
   - [ ] **Verificar:** Progresso = 100%
   - [ ] **Verificar:** Log registrado

---

### FLUXO 4: Ocorrência com Aprovação

**Objetivo:** Validar ocorrência que requer aprovação antes de ser resolvida.

**Passos:**

1. **Operacional cria ocorrência com aprovação:**
   - [ ] Login como OPERACIONAL
   - [ ] Acessar `/operacional/ocorrencias/nova`
   - [ ] Preencher:
     - Título: "Necessário trocar portão"
     - Descrição: "Portão automático quebrou, precisa trocar"
     - Localização: "Portão Principal"
     - Prioridade: "ALTA"
     - Tipo: "NON_ROUTINE"
     - Requer Aprovação: checked
     - Aprovação Requerida de: "SINDICO"
   - [ ] Clicar em "Criar"
   - [ ] **Verificar:** Ocorrência criada com `approval_status = 'PENDING'`
   - [ ] **Verificar:** Notificação enviada ao síndico

2. **Síndico aprova:**
   - [ ] Login como SINDICO
   - [ ] Acessar `/sindico/ocorrencias-pendentes-aprovacao`
   - [ ] **Verificar:** Ocorrência aparece na lista
   - [ ] Clicar em "Aprovar"
   - [ ] **Verificar:** Status atualizado para `APPROVED`
   - [ ] **Verificar:** Notificação enviada ao operacional

3. **Operacional resolve:**
   - [ ] Login como OPERACIONAL
   - [ ] Acessar `/operacional/ocorrencias/:id/resolver`
   - [ ] **Verificar:** Botão "Resolver" aparece (só aparece se aprovada)
   - [ ] Preencher notas: "Portão trocado com sucesso"
   - [ ] Clicar em "Resolver"
   - [ ] **Verificar:** Status atualizado para RESOLVIDA
   - [ ] **Verificar:** Notificação enviada ao síndico

**Cenário Alternativo - Rejeição:**

1. **Síndico rejeita:**
   - [ ] Clicar em "Rejeitar"
   - [ ] Preencher motivo: "Aguardar orçamento primeiro"
   - [ ] Clicar em "Rejeitar"
   - [ ] **Verificar:** Status atualizado para `REJECTED`
   - [ ] **Verificar:** Operacional não pode resolver

---

### FLUXO 5: Manutenção (Criação → Execução → Conclusão)

**Objetivo:** Validar fluxo completo de manutenção.

**Passos:**

1. **Síndico cria manutenção:**
   - [ ] Login como SINDICO
   - [ ] Acessar `/sindico/manutencoes/novo`
   - [ ] Preencher:
     - Tipo: "PREVENTIVA"
     - Título: "Manutenção Mensal do Elevador"
     - Descrição: "Manutenção preventiva conforme contrato"
     - Responsável: [Selecionar operacional]
     - Data Prevista: "2025-02-01"
   - [ ] Clicar em "Criar"
   - [ ] **Verificar:** Manutenção criada com status PENDING
   - [ ] **Verificar:** Notificação enviada ao operacional

2. **Operacional inicia:**
   - [ ] Login como OPERACIONAL
   - [ ] Acessar `/operacional/manutencoes`
   - [ ] **Verificar:** Manutenção aparece na lista
   - [ ] Clicar em "Iniciar"
   - [ ] **Verificar:** Status atualizado para IN_PROGRESS
   - [ ] **Verificar:** `started_at` preenchido

3. **Operacional conclui:**
   - [ ] Clicar em "Concluir"
   - [ ] Preencher:
     - Notas: "Manutenção realizada com sucesso, todos os sistemas funcionando"
     - Custo: "500.00"
   - [ ] Clicar em "Concluir"
   - [ ] **Verificar:** Status atualizado para COMPLETED
   - [ ] **Verificar:** Notificação enviada ao síndico

4. **Síndico vê manutenção concluída:**
   - [ ] Login como SINDICO
   - [ ] Acessar `/sindico/manutencoes`
   - [ ] **Verificar:** Manutenção aparece como concluída
   - [ ] **Verificar:** Notas e custo visíveis

---

### FLUXO 6: Saída Financeira com Aprovação

**Objetivo:** Validar saída que requer aprovação do síndico.

**Passos:**

1. **Financeiro cria saída acima do limite:**
   - [ ] Login como FINANCEIRO
   - [ ] Acessar `/financeiro/saidas/nova`
   - [ ] Preencher:
     - Descrição: "Pagamento de Manutenção do Elevador"
     - Valor: "5000.00"
     - Data: "2025-01-20"
     - Categoria: "MANUTENCAO"
     - Requer Aprovação: checked
     - Limite de Aprovação: "1000.00"
   - [ ] Clicar em "Salvar"
   - [ ] **Verificar:** Saída criada com `payment_status = 'PENDING'`
   - [ ] **Verificar:** Registro criado em `approvals`
   - [ ] **Verificar:** Notificação enviada ao síndico

2. **Síndico aprova:**
   - [ ] Login como SINDICO
   - [ ] Acessar `/sindico/aprovacoes` (ou dashboard)
   - [ ] **Verificar:** Saída aparece em aprovações pendentes
   - [ ] Clicar em "Aprovar"
   - [ ] Preencher observações (opcional)
   - [ ] Clicar em "Aprovar"
   - [ ] **Verificar:** Status atualizado para `APPROVED`
   - [ ] **Verificar:** Notificação enviada ao financeiro

3. **Financeiro paga:**
   - [ ] Login como FINANCEIRO
   - [ ] Acessar `/financeiro/saidas`
   - [ ] **Verificar:** Saída aparece como aprovada
   - [ ] Clicar em "Pagar"
   - [ ] Anexar comprovante (PDF)
   - [ ] Clicar em "Pagar"
   - [ ] **Verificar:** Status atualizado para PAID
   - [ ] **Verificar:** Comprovante salvo

**Cenário Alternativo - Saída abaixo do limite:**

1. **Financeiro cria saída abaixo do limite:**
   - [ ] Valor: "500.00"
   - [ ] Requer Aprovação: checked
   - [ ] Limite: "1000.00"
   - [ ] Clicar em "Salvar"
   - [ ] **Verificar:** Saída criada com `payment_status = 'APPROVED'` (automático)
   - [ ] **Verificar:** Não cria registro em `approvals`
   - [ ] **Verificar:** Financeiro pode pagar diretamente

---

### FLUXO 7: Tarefa com Checklist

**Objetivo:** Validar criação e execução de tarefa com itens de checklist.

**Passos:**

1. **Administrativo cria tarefa:**
   - [ ] Login como ADMINISTRATIVO
   - [ ] Acessar `/administrativo/tarefas/nova`
   - [ ] Preencher:
     - Título: "Verificar Sistema de Incêndio"
     - Descrição: "Verificar todos os extintores e alarmes"
     - Responsável: [Selecionar operacional]
     - Data de Vencimento: "2025-01-25"
     - Prioridade: "ALTA"
   - [ ] Adicionar itens de checklist:
     - Item 1: "Verificar extintores do térreo"
     - Item 2: "Verificar extintores do 1º andar"
     - Item 3: "Testar alarme de incêndio"
   - [ ] Clicar em "Criar"
   - [ ] **Verificar:** Tarefa criada com status PENDING
   - [ ] **Verificar:** Itens de checklist criados
   - [ ] **Verificar:** Notificação enviada ao operacional

2. **Operacional executa tarefa:**
   - [ ] Login como OPERACIONAL
   - [ ] Acessar `/operacional/checklist` (ou dashboard)
   - [ ] **Verificar:** Tarefa aparece na lista
   - [ ] Clicar na tarefa
   - [ ] **Verificar:** Itens de checklist aparecem
   - [ ] Para cada item:
     - [ ] Marcar como DONE ou NOT_DONE
     - [ ] Se NOT_DONE, preencher comentário
   - [ ] Clicar em "Completar Tarefa"
   - [ ] **Verificar:** Status atualizado para COMPLETED
   - [ ] **Verificar:** Log registrado

---

### FLUXO 8: Ocorrência de Limpeza que Vira Zeladoria

**Objetivo:** Validar conversão automática de ocorrência de limpeza para zeladoria.

**Passos:**

1. **Limpeza cria ocorrência de equipamento com defeito:**
   - [ ] Login como LIMPEZA
   - [ ] Acessar `/limpeza/ocorrencias/nova`
   - [ ] Preencher:
     - Título: "Aspirador quebrado"
     - Descrição: "Aspirador não está funcionando"
     - Tipo de Limpeza: "EQUIPAMENTO_DEFEITO"
   - [ ] Clicar em "Criar"
   - [ ] **Verificar:** Ocorrência de limpeza criada
   - [ ] **Verificar:** Ocorrência de zeladoria criada automaticamente
   - [ ] **Verificar:** Ocorrência de zeladoria vinculada à de limpeza
   - [ ] **Verificar:** Notificação enviada ao operacional

2. **Operacional resolve ocorrência de zeladoria:**
   - [ ] Login como OPERACIONAL
   - [ ] Acessar `/operacional/ocorrencias`
   - [ ] **Verificar:** Ocorrência de zeladoria aparece (não a de limpeza)
   - [ ] Resolver ocorrência
   - [ ] **Verificar:** Ambas as ocorrências atualizadas

---

## 7. TUTORIAL DE USO

### 7.1 Como Fazer Login

1. Acesse a URL do sistema (ex: `http://localhost:3000`)
2. Você será redirecionado para `/auth/login`
3. Digite seu **username** (não é email)
4. Digite sua **senha**
5. Clique em "Entrar"
6. Você será redirecionado automaticamente para o dashboard do seu perfil

**Problemas comuns:**
- "Credenciais inválidas": Verifique username e senha
- "Usuário inativo": Contate o SUPER_MASTER
- Redirecionamento para login: Token expirado, faça login novamente

---

### 7.2 Como Criar uma Entrada Financeira (Financeiro)

1. Faça login como FINANCEIRO
2. No menu, clique em "Entradas"
3. Clique em "Nova Entrada"
4. Preencha:
   - **Descrição**: O que é (ex: "Taxa de Condomínio - Janeiro")
   - **Valor**: Quanto (ex: 5000.00)
   - **Data**: Quando (ex: 15/01/2025)
   - **Categoria**: TAXA, RECEITA ou OUTRA
   - **Centro de Custo**: (opcional) Selecione se houver
5. Clique em "Salvar"
6. A entrada será enviada automaticamente para o síndico analisar
7. Você receberá notificação quando o síndico aprovar ou rejeitar

---

### 7.3 Como Aprovar uma Entrada (Síndico)

1. Faça login como SINDICO
2. No dashboard, veja o card "Entradas Pendentes" ou clique em "Entradas Pendentes" no menu
3. Você verá a lista de entradas aguardando análise
4. Para cada entrada:
   - Leia a descrição e valor
   - Se estiver correta:
     - Clique em "Aprovar"
     - Adicione observações (opcional)
     - Clique em "Aprovar"
   - Se estiver incorreta:
     - Clique em "Rejeitar"
     - **Obrigatório:** Preencha o motivo da rejeição
     - Clique em "Rejeitar"
5. O financeiro será notificado da sua decisão

---

### 7.4 Como Criar uma Tarefa (Administrativo)

1. Faça login como ADMINISTRATIVO
2. No menu, clique em "Tarefas"
3. Clique em "Nova Tarefa"
4. Preencha:
   - **Título**: Nome da tarefa (ex: "Trocar lâmpada do corredor")
   - **Descrição**: Detalhes (opcional)
   - **Responsável**: Selecione um operacional
   - **Data de Vencimento**: Quando deve ser feita
   - **Prioridade**: BAIXA, NORMAL, ALTA ou URGENTE
5. (Opcional) Adicione itens de checklist:
   - Clique em "Adicionar Item"
   - Digite o nome do item
   - Repita para cada item
6. Clique em "Criar"
7. O operacional será notificado

---

### 7.5 Como Executar um Checklist Diário (Operacional)

1. Faça login como OPERACIONAL
2. No menu, clique em "Checklists Diários"
3. Você verá os checklists do dia (ou selecione uma data no filtro)
4. Clique em "Executar" no checklist desejado
5. Clique em "Iniciar Checklist"
6. Para cada item:
   - Marque como "Feito" ou "Não Feito"
   - Se "Não Feito", **obrigatório** preencher justificativa
   - Se necessário, adicione foto clicando em "Adicionar Foto"
7. Quando terminar todos os itens, clique em "Finalizar Checklist"
8. O checklist será marcado como concluído

---

### 7.6 Como Criar uma Ocorrência (Operacional)

1. Faça login como OPERACIONAL
2. No menu, clique em "Ocorrências"
3. Clique em "Nova Ocorrência"
4. Preencha:
   - **Título**: Resumo do problema (ex: "Vazamento no corredor")
   - **Descrição**: Detalhes do problema
   - **Localização**: Onde está (ex: "Corredor do 2º andar")
   - **Prioridade**: BAIXA, NORMAL, ALTA ou URGENTE
   - **Tipo**: 
     - ROUTINE: Está na rotina normal
     - NON_ROUTINE: Fora da rotina
     - EMERGENCY: Emergência
5. Se tipo for NON_ROUTINE ou EMERGENCY:
   - Marque "Requer Aprovação" se necessário
   - Selecione quem deve aprovar (SINDICO, ADMINISTRATIVO ou FINANCEIRO)
6. Clique em "Criar"
7. A ocorrência será criada e notificará quem precisa ver

---

### 7.7 Como Solicitar um Orçamento (Administrativo)

1. Faça login como ADMINISTRATIVO
2. No menu, clique em "Orçamentos"
3. Clique em "Novo Orçamento"
4. Preencha:
   - **Título**: O que precisa (ex: "Troca de Portão Automático")
   - **Descrição**: Detalhes da necessidade
   - **Valor Estimado**: Quanto acha que vai custar (opcional)
   - **Prioridade**: BAIXA, NORMAL, ALTA ou URGENTE
5. (Opcional) Anexe documentos (PDFs, máximo 10, até 50MB cada)
6. Clique em "Solicitar"
7. O orçamento será enviado para o financeiro revisar

---

### 7.8 Como Criar um Modelo de Checklist (Síndico)

1. Faça login como SINDICO
2. No menu, clique em "Modelos de Checklist"
3. Clique em "Novo Modelo"
4. Preencha:
   - **Nome**: Nome do modelo (ex: "Inspeção Zeladoria - Semanal")
   - **Descrição**: Para que serve (opcional)
   - **Departamento**: ZELADORIA ou LIMPEZA
   - **Dias da Semana**: Selecione os dias (ex: Segunda, Quarta, Sexta)
   - **Modelo Ativo**: Marque para gerar checklists automaticamente
   - **Requer Foto**: Se precisa de foto como evidência
   - **Requer Justificativa**: Se item não feito, precisa justificar
5. Adicione itens:
   - Clique em "Adicionar Item"
   - Digite o nome (ex: "Verificar elevadores")
   - Defina a ordem
   - Marque "Requer Foto" se este item específico precisa de foto
6. Clique em "Salvar"
7. O sistema gerará checklists automaticamente nos dias configurados

---

## 8. GLOSSÁRIO DE BOTÕES E AÇÕES

### Botões Comuns

#### "Salvar" / "Criar" / "Atualizar"
- **O que faz:** Salva os dados do formulário no banco de dados
- **Onde aparece:** Em todos os formulários
- **O que valida:** Campos obrigatórios, formatos, regras de negócio
- **O que acontece após:** Redireciona para lista ou detalhes com mensagem de sucesso

#### "Cancelar"
- **O que faz:** Volta para a tela anterior sem salvar
- **Onde aparece:** Em todos os formulários
- **O que acontece após:** Redireciona para lista

#### "Editar"
- **O que faz:** Abre formulário preenchido para edição
- **Onde aparece:** Em listas, ao lado de cada registro
- **Restrições:** Só aparece se usuário tem permissão e registro pode ser editado

#### "Excluir" / "Deletar"
- **O que faz:** Remove registro do banco (físico ou lógico)
- **Onde aparece:** Em listas, ao lado de registros que podem ser deletados
- **Restrições:** Só permite se registro está em estado que permite exclusão
- **Validação:** Alguns registros nunca podem ser deletados (ex: logs de auditoria)

#### "Aprovar"
- **O que faz:** Aprova uma solicitação (entrada, saída, orçamento, ocorrência)
- **Onde aparece:** Em telas de aprovação (síndico)
- **O que valida:** Se usuário tem permissão para aprovar
- **O que acontece após:** Atualiza status, notifica interessados, registra log

#### "Rejeitar"
- **O que faz:** Rejeita uma solicitação
- **Onde aparece:** Em telas de aprovação (síndico)
- **Campo obrigatório:** Motivo da rejeição
- **O que acontece após:** Atualiza status, notifica interessados, permite correção

#### "Iniciar" / "Começar"
- **O que faz:** Marca trabalho como iniciado (checklist, manutenção, tarefa)
- **Onde aparece:** Em checklists pendentes, manutenções pendentes
- **O que acontece após:** Atualiza status para IN_PROGRESS, registra `started_at`

#### "Finalizar" / "Completar" / "Concluir"
- **O que faz:** Marca trabalho como concluído
- **Onde aparece:** Em checklists em execução, manutenções em execução, tarefas
- **Validações:** Pode exigir que todos os itens estejam preenchidos
- **O que acontece após:** Atualiza status para COMPLETED, registra `completed_at`

#### "Resolver"
- **O que faz:** Marca ocorrência como resolvida
- **Onde aparece:** Em ocorrências abertas ou em atendimento
- **Campo obrigatório:** Notas da resolução
- **Validações:** Verifica se transição de estado é permitida
- **O que acontece após:** Atualiza status para RESOLVIDA, notifica síndico

#### "Reabrir"
- **O que faz:** Reabre tarefa ou ocorrência que estava concluída
- **Onde aparece:** Em tarefas concluídas (administrativo), ocorrências resolvidas (síndico)
- **Campo obrigatório:** Motivo da reabertura
- **Restrições:** Só pode reabrir uma vez (flag `reopened`)
- **O que acontece após:** Reseta status para PENDING, notifica responsável

#### "Triar"
- **O que faz:** Analisa e organiza ocorrência (atribui, classifica, define SLA)
- **Onde aparece:** Em ocorrências não triadas (administrativo)
- **O que acontece após:** Marca como triada, pode criar tarefa, notifica operacional

#### "Revisar"
- **O que faz:** Financeiro analisa orçamento e preenche informações
- **Onde aparece:** Em orçamentos pendentes (financeiro)
- **Campo obrigatório:** Observações do financeiro
- **O que acontece após:** Envia para síndico aprovar

#### "Liberar"
- **O que faz:** Financeiro libera valor aprovado para operacional usar
- **Onde aparece:** Em orçamentos aprovados (financeiro)
- **O que acontece após:** Marca como liberado, notifica operacional

#### "Retornar"
- **O que faz:** Financeiro retorna orçamento para síndico revisar
- **Onde aparece:** Em orçamentos aprovados (financeiro)
- **Campo obrigatório:** Motivo do retorno
- **O que acontece após:** Volta status para PENDING_SINDICO, notifica síndico

#### "Pagar" / "Receber"
- **O que faz:** Marca saída como paga ou entrada como recebida
- **Onde aparece:** Em saídas aprovadas (financeiro), entradas aprovadas (financeiro)
- **O que acontece após:** Atualiza status para PAID/RECEIVED, pode anexar comprovante

#### "Marcar como Lida"
- **O que faz:** Marca notificação como lida
- **Onde aparece:** Em cada notificação
- **O que acontece após:** Atualiza `read = true`, remove do contador de não lidas

#### "Marcar Todas como Lidas"
- **O que faz:** Marca todas as notificações não lidas como lidas
- **Onde aparece:** Na lista de notificações
- **O que acontece após:** Atualiza todas de uma vez

#### "Ativar" / "Desativar" / "Toggle"
- **O que faz:** Alterna status ativo/inativo
- **Onde aparece:** Em modelos de checklist, contas, centros de custo
- **O que acontece após:** Atualiza status, pode afetar geração automática

---

### Ações Especiais

#### Upload de Arquivo
- **Tipos aceitos:**
  - PDFs: Comprovantes, contratos, documentos (até 50MB)
  - Imagens: Fotos de evidências (até 10MB)
- **Onde aparece:** Em formulários que permitem anexos
- **Validações:** Tipo de arquivo, tamanho máximo
- **O que acontece após:** Arquivo salvo em `uploads/`, registro criado no banco

#### Filtros
- **O que faz:** Filtra lista por critérios (data, status, etc)
- **Onde aparece:** Em listas (checklists, ocorrências, tarefas)
- **Como usar:** Preencha campos e clique em "Filtrar"
- **O que acontece após:** Lista atualizada com resultados filtrados

#### Links de Detalhes
- **O que faz:** Abre tela de detalhes do registro
- **Onde aparece:** Em listas, notificações
- **O que mostra:** Informações completas, histórico, ações disponíveis

---

## 9. VALIDAÇÕES E REGRAS DE NEGÓCIO

### Regras de Aprovação Financeira

**Entradas:**
- **Sempre** requerem aprovação do síndico
- Síndico pode aprovar ou rejeitar
- Se rejeitada, financeiro pode editar/excluir

**Saídas:**
- Se valor > limite de aprovação → requer aprovação do síndico
- Se valor <= limite → aprovada automaticamente
- Limite padrão: R$ 1.000,00 (configurável)

### Regras de Estado

**Não pode pular estados:**
- Tarefa: PENDING → IN_PROGRESS → COMPLETED (não pode ir direto de PENDING para COMPLETED)
- Ocorrência: ABERTA → EM_ATENDIMENTO → RESOLVIDA (não pode ir direto de ABERTA para RESOLVIDA, exceto se operacional resolver diretamente)
- Saída: PENDING → APPROVED → PAID (não pode ir direto de PENDING para PAID)

**Validação de transições:**
- Sistema valida se transição é permitida (tabela `state_transitions`)
- Sistema valida se usuário tem permissão para fazer a transição
- Se não permitida, retorna erro

### Regras de Permissão

**Multi-tenant:**
- Usuário só vê dados do seu condomínio
- Não pode acessar dados de outro condomínio (mesmo manipulando URL)
- Validação sempre no backend

**Por perfil:**
- Cada perfil tem acesso apenas ao seu módulo
- Botões aparecem apenas se tiver permissão
- Backend valida sempre (não confia no frontend)

---

## 10. CHECKLIST DE VALIDAÇÃO DO SISTEMA

Use este checklist para validar se o sistema está funcionando corretamente:

### Autenticação
- [ ] Login funciona com credenciais válidas
- [ ] Login falha com credenciais inválidas
- [ ] Logout remove cookies
- [ ] Redirecionamento por perfil funciona
- [ ] Token expira e renova corretamente

### Autorização
- [ ] Usuário sem permissão não acessa rotas protegidas
- [ ] Botões aparecem apenas se tiver permissão
- [ ] Backend valida permissão sempre

### Entradas Financeiras
- [ ] Financeiro cria entrada
- [ ] Síndico vê em pendentes
- [ ] Síndico aprova
- [ ] Entrada entra no cálculo
- [ ] Síndico rejeita
- [ ] Financeiro edita entrada rejeitada
- [ ] Financeiro exclui entrada rejeitada

### Saídas Financeiras
- [ ] Financeiro cria saída abaixo do limite → aprovada automaticamente
- [ ] Financeiro cria saída acima do limite → vai para síndico
- [ ] Síndico aprova
- [ ] Financeiro paga
- [ ] Status atualizado corretamente

### Orçamentos
- [ ] Administrativo cria orçamento
- [ ] Financeiro revisa
- [ ] Síndico aprova
- [ ] Financeiro libera
- [ ] Operacional vê liberado

### Checklists
- [ ] Síndico cria modelo
- [ ] Sistema gera checklist automaticamente
- [ ] Operacional executa checklist
- [ ] Operacional finaliza checklist
- [ ] Progresso calculado corretamente

### Ocorrências
- [ ] Operacional cria ocorrência
- [ ] Se requer aprovação, síndico aprova
- [ ] Operacional resolve
- [ ] Status atualizado corretamente

### Manutenções
- [ ] Síndico cria manutenção
- [ ] Operacional inicia
- [ ] Operacional conclui
- [ ] Síndico vê concluída

### Notificações
- [ ] Notificações são criadas automaticamente
- [ ] Badge mostra contador correto
- [ ] Marcar como lida funciona
- [ ] Links de detalhes funcionam

### Logs
- [ ] Todas as ações são registradas
- [ ] Logs são imutáveis
- [ ] Síndico vê logs do condomínio

---

## 11. TROUBLESHOOTING (Solução de Problemas)

### Problema: "Página não encontrada"
**Causas possíveis:**
- URL incorreta
- Rota não existe
- Permissão insuficiente

**Solução:**
- Verifique a URL
- Verifique se tem permissão para acessar
- Use o menu para navegar (não digite URLs manualmente)

---

### Problema: "Acesso negado"
**Causas possíveis:**
- Não tem permissão para a ação
- Perfil não tem acesso ao módulo

**Solução:**
- Verifique seu perfil
- Contate SUPER_MASTER para atribuir perfil
- Faça logout e login novamente após atribuir perfil

---

### Problema: "Transição de estado não permitida"
**Causas possíveis:**
- Tentando pular estados
- Não tem permissão para a transição
- Estado atual não permite a transição desejada

**Solução:**
- Verifique o estado atual
- Siga o fluxo correto de estados
- Verifique se tem permissão

---

### Problema: "Campo obrigatório não preenchido"
**Causas possíveis:**
- Campo marcado com * (asterisco) não foi preenchido
- Validação no backend

**Solução:**
- Preencha todos os campos obrigatórios
- Campos obrigatórios estão marcados com * (asterisco vermelho)

---

### Problema: "Notificação não aparece"
**Causas possíveis:**
- Notificação foi marcada como lida
- Filtro de "Lidas" está ativo
- Notificação não foi criada

**Solução:**
- Verifique filtro na lista de notificações
- Verifique se ação que deveria criar notificação foi executada
- Verifique logs de auditoria

---

### Problema: "Checklist não foi gerado"
**Causas possíveis:**
- Modelo está inativo
- Hoje não é um dos dias configurados
- Job de geração não foi executado

**Solução:**
- Verifique se modelo está ativo
- Verifique dias da semana configurados
- Execute geração manualmente: `/automation/generate-checklists` (como ADMINISTRATIVO)

---

## 12. CONCLUSÃO

Este guia documenta **exatamente** como o sistema funciona hoje, sem sugestões de melhorias.

Use este documento para:
- Entender cada funcionalidade
- Aprender a usar o sistema
- Validar se os fluxos estão funcionando
- Treinar novos usuários
- Documentar processos

**Lembre-se:**
- O sistema valida permissões sempre (backend)
- Dados são isolados por condomínio (multi-tenant)
- Todas as ações são registradas em logs (auditoria)
- Estados seguem regras rígidas (state machines)

---

**FIM DO GUIA COMPLETO**
