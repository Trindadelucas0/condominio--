# 📘 GUIA COMPLETO DO USUÁRIO FINAL
## Sistema de Gestão Condominial

**Versão:** 1.0  
**Data:** Janeiro 2025

---

## 🎯 APRESENTAÇÃO

Este guia foi criado para você, **administrador ou síndico do condomínio**, que adquiriu nosso sistema de gestão condominial. Aqui você encontrará explicações detalhadas sobre os principais conceitos e funcionalidades do sistema, de forma simples e prática.

**Nossa missão:** Facilitar a gestão completa do seu condomínio de forma organizada, segura e eficiente.

---

## 📚 SUMÁRIO

1. [Conceitos Fundamentais](#1-conceitos-fundamentais)
   - O que é Centro de Custo?
   - O que é Financeiro?
   - O que é Ocorrência?
   - O que são Perfis e Permissões?

2. [Sistema Financeiro](#2-sistema-financeiro)
   - Entradas Financeiras
   - Saídas Financeiras
   - Orçamentos
   - Centro de Custo
   - Contas Recorrentes

3. [Sistema de Ocorrências](#3-sistema-de-ocorrências)
   - Como criar ocorrência
   - Fluxo de aprovação
   - Comunicação e acompanhamento
   - Resolução e finalização

4. [Checklists e Tarefas](#4-checklists-e-tarefas)
   - Checklists diários
   - Tarefas operacionais
   - Acompanhamento de execução

5. [Perfis do Sistema](#5-perfis-do-sistema)
   - SUPER_MASTER
   - SÍNDICO
   - FINANCEIRO
   - ADMINISTRATIVO
   - OPERACIONAL
   - LIMPEZA
   - CONSELHO

6. [Fluxos Principais](#6-fluxos-principais)
   - Fluxo de entrada financeira
   - Fluxo de orçamento
   - Fluxo de ocorrência
   - Fluxo de checklist

---

## 1. CONCEITOS FUNDAMENTAIS

### 💰 O que é CENTRO DE CUSTO?

**Centro de Custo** é uma forma de **organizar e categorizar** todas as despesas e receitas do condomínio. É como ter "pastas" ou "categorias" para classificar cada movimentação financeira.

**Exemplos práticos:**
- **Manutenção de Elevadores** - todas as despesas relacionadas a elevadores vão para esse centro
- **Limpeza e Conservação** - despesas com produtos de limpeza, contrato de limpeza, etc.
- **Segurança** - portaria, equipamentos de segurança, treinamentos
- **Infraestrutura** - obras, reformas, melhorias
- **Áreas Comuns** - manutenção de piscina, salão de festas, academia

**Por que usar Centro de Custo?**
✅ **Organização:** Você sabe exatamente quanto gastou em cada área  
✅ **Controle:** Identifica onde está gastando mais  
✅ **Planejamento:** Facilita criar orçamentos futuros  
✅ **Transparência:** Moradores podem ver para onde vai o dinheiro  
✅ **Relatórios:** Gera relatórios detalhados por área

**Como funciona no sistema:**
1. O **SÍNDICO** ou **FINANCEIRO** cria os centros de custo
2. Ao registrar uma entrada ou saída, você escolhe o centro de custo relacionado
3. O sistema agrupa todas as movimentações por centro de custo
4. Você pode ver relatórios mostrando o total gasto em cada área

---

### 💵 O que é FINANCEIRO?

O módulo **Financeiro** é o "cofre" e o "contador" do condomínio. É onde você registra **todo o dinheiro que entra** (receitas) e **todo o dinheiro que sai** (despesas) do condomínio.

**Principais funcionalidades:**

#### 📥 **ENTRADAS FINANCEIRAS** (Dinheiro que ENTRA)

São os valores que o condomínio recebe. Exemplos:
- Taxa de condomínio paga pelos moradores
- Multas e juros
- Aluguel de salão de festas
- Receitas eventuais (venda de materiais, etc.)

**Fluxo no sistema:**
1. **FINANCEIRO** registra a entrada (ex: "Taxa condomínio - Apartamento 101")
2. Sistema cria registro com status **"PENDENTE DE ANÁLISE"**
3. **SÍNDICO** recebe notificação para analisar
4. **SÍNDICO** aprova ou rejeita a entrada
5. Se aprovada, o valor é somado ao **saldo atual** do condomínio
6. **FINANCEIRO** marca como "Recebida" quando o dinheiro realmente entrar na conta

**Por que esse controle?**
- Garante que apenas entradas válidas sejam contabilizadas
- Síndico tem visibilidade de todas as receitas
- Mantém histórico completo de todas as entradas

#### 📤 **SAÍDAS FINANCEIRAS** (Dinheiro que SAI)

São as despesas do condomínio. Exemplos:
- Pagamento de funcionários
- Compra de materiais
- Manutenções
- Contas de água, luz, gás
- Contratos e serviços

**Fluxo no sistema:**
1. **FINANCEIRO** ou **ADMINISTRATIVO** registra a saída
2. Se o valor for **acima do limite de aprovação**, precisa de aprovação do **SÍNDICO**
3. **SÍNDICO** aprova ou rejeita
4. Se aprovada, o valor é **reservado** do saldo (comprometido)
5. Quando o pagamento é efetuado, **FINANCEIRO** marca como "Paga"
6. O valor é então **deduzido** do saldo

**Sistema de Aprovação:**
- **Valores baixos** (abaixo do limite): Aprovação automática
- **Valores altos** (acima do limite): Precisa aprovação do SÍNDICO
- Isso garante controle sobre gastos grandes

#### 📊 **ORÇAMENTOS**

Orçamentos são **pedidos de autorização para gastar** dinheiro em algo específico.

**Quando usar?**
- Quando precisa fazer uma obra
- Quando precisa comprar um equipamento caro
- Quando precisa contratar um serviço especializado

**Fluxo completo de orçamento:**
1. **ADMINISTRATIVO** identifica necessidade (ex: "Precisa reformar o portão")
2. **ADMINISTRATIVO** cria solicitação de orçamento no sistema
3. Anexa arquivos, fotos, descrição detalhada
4. Solicitação vai para **FINANCEIRO** para revisar
5. **FINANCEIRO** verifica se há verba disponível, adiciona observações
6. Solicitação vai para **SÍNDICO** para aprovação final
7. **SÍNDICO** aprova ou rejeita
8. Se aprovado, **FINANCEIRO** libera o orçamento para **OPERACIONAL** executar
9. **OPERACIONAL** executa o serviço/compra
10. Despesa é registrada como saída financeira

**Por que esse processo?**
✅ Evita gastos não autorizados  
✅ Garante que há verba disponível  
✅ Todos sabem o que está sendo feito  
✅ Mantém histórico completo  
✅ Facilita auditoria

---

### 🚨 O que é OCORRÊNCIA?

**Ocorrência** é um **registro de um problema, situação ou solicitação** que precisa ser resolvido no condomínio.

**Exemplos:**
- "Lâmpada queimada no corredor do 2º andar"
- "Portão elétrico não está funcionando"
- "Barulho excessivo no apartamento 305"
- "Vazamento na área da piscina"
- "Equipamento de limpeza quebrado"

**Tipos de Ocorrência no sistema:**

1. **OCORRÊNCIA ROTINEIRA**
   - Problemas simples e comuns
   - OPERACIONAL resolve diretamente
   - Não precisa aprovação

2. **OCORRÊNCIA NÃO ROTINEIRA**
   - Problemas que precisam análise
   - Pode precisar aprovação do SÍNDICO
   - Pode virar orçamento se necessário

3. **OCORRÊNCIA DE EMERGÊNCIA**
   - Situações urgentes (vazamento, segurança, etc.)
   - Precisa ação imediata
   - Notificações automáticas

4. **OCORRÊNCIA DE LIMPEZA**
   - Problemas relacionados à limpeza
   - Pode ser encaminhada para zeladoria se necessário

**Fluxo de uma Ocorrência:**

```
1. CRIAR
   ↓
2. TRIAGEM (ADMINISTRATIVO analisa e atribui responsável)
   ↓
3. EM ATENDIMENTO (OPERACIONAL/LIMPEZA trabalha na solução)
   ↓
4. COMUNICAÇÃO (se necessário, enviar de volta para mais informações)
   ↓
5. RESOLVIDA (problema foi solucionado)
   ↓
6. FINALIZADA (SÍNDICO confirma e encerra)
```

**Características importantes:**
- ✅ Toda ocorrência fica registrada no sistema
- ✅ Histórico completo de quem fez o quê e quando
- ✅ Comunicação entre setores fica documentada
- ✅ Síndico pode acompanhar todas as ocorrências
- ✅ Relatórios mostram problemas mais frequentes

---

### 👥 O que são PERFIS e PERMISSÕES?

O sistema tem **diferentes tipos de usuários**, cada um com **permissões específicas**. Isso garante que cada pessoa só acesse o que precisa para seu trabalho.

**Principais Perfis:**

1. **SUPER_MASTER** 👑
   - Administrador geral do sistema
   - Cria condomínios e usuários
   - Não está vinculado a um condomínio específico
   - Acesso total

2. **SÍNDICO** 🏛️
   - Responsável pelo condomínio
   - Aprova entradas e saídas financeiras
   - Aprova orçamentos
   - Visualiza tudo
   - **NÃO cria tarefas, não executa serviços**

3. **FINANCEIRO** 💰
   - Gerencia todo o dinheiro
   - Registra entradas e saídas
   - Cria centros de custo
   - Revisa orçamentos
   - **NÃO aprova valores altos** (isso é do SÍNDICO)

4. **ADMINISTRATIVO** 📋
   - Faz a "triagem" - organiza o trabalho
   - Cria tarefas para operacional
   - Solicita orçamentos
   - Gerencia documentos
   - **NÃO executa tarefas, não aprova valores**

5. **OPERACIONAL** 🔧
   - Executa tarefas práticas
   - Faz manutenções
   - Resolve ocorrências
   - Executa checklists
   - **NÃO acessa financeiro, não aprova nada**

6. **LIMPEZA** 🧹
   - Responsável pela limpeza
   - Cria ocorrências de limpeza
   - Executa checklists de limpeza
   - **NÃO acessa outras áreas**

7. **CONSELHO** 👀
   - Apenas **visualização**
   - Vê relatórios e dashboards
   - **NÃO pode criar, editar ou aprovar nada**
   - Apenas consulta

**Por que essa organização?**
✅ Segurança: cada um só vê o que precisa  
✅ Controle: ninguém pode fazer o que não deveria  
✅ Rastreabilidade: sabe exatamente quem fez o quê  
✅ Eficiência: cada um foca no seu trabalho  

---

## 2. SISTEMA FINANCEIRO

### 💰 Como funciona o Financeiro?

O módulo financeiro é o **coração da gestão do condomínio**. Tudo que envolve dinheiro passa por aqui.

### 2.1 Entradas Financeiras

**Quem pode criar:** FINANCEIRO  
**Quem aprova:** SÍNDICO

**Passo a passo:**

1. **Registrar Entrada**
   - FINANCEIRO acessa "Entradas" → "Nova Entrada"
   - Preenche:
     - **Descrição:** "Taxa condomínio - Apto 101 - Janeiro/2025"
     - **Valor:** R$ 500,00
     - **Data:** Data da entrada
     - **Categoria:** TAXA, RECEITA, OUTRA
     - **Centro de Custo:** (opcional) Para organizar
   - Salva

2. **Análise pelo SÍNDICO**
   - SÍNDICO recebe notificação
   - Vê no dashboard: "X entradas pendentes"
   - Clica para ver detalhes
   - **Aprova** ou **Rejeita** (com motivo se rejeitar)

3. **Aprovação**
   - Se aprovada: valor é adicionado ao saldo disponível
   - Status muda para "Aprovada"

4. **Marcar como Recebida**
   - FINANCEIRO marca quando o dinheiro realmente entrou na conta
   - Status muda para "Recebida"
   - Valor conta definitivamente no saldo

**Importante:**
- ⚠️ Entrada só conta no saldo após ser **aprovada pelo SÍNDICO**
- ⚠️ Se rejeitada, FINANCEIRO pode editar e reenviar
- ⚠️ Histórico completo fica salvo

---

### 2.2 Saídas Financeiras

**Quem pode criar:** FINANCEIRO, ADMINISTRATIVO  
**Quem aprova:** SÍNDICO (se valor acima do limite)

**Passo a passo:**

1. **Registrar Saída**
   - FINANCEIRO acessa "Saídas" → "Nova Saída"
   - Preenche:
     - **Descrição:** "Manutenção elevador"
     - **Valor:** R$ 1.500,00
     - **Data:** Data da saída
     - **Categoria:** MANUTENCAO, CONTA, CONTRATO, OUTRA
     - **Centro de Custo:** Manutenção de Elevadores
     - **Limite de Aprovação:** R$ 1.000,00
   - Se valor > limite, precisa aprovação do SÍNDICO

2. **Aprovação (se necessário)**
   - Se valor acima do limite, SÍNDICO recebe notificação
   - SÍNDICO analisa e aprova/rejeita
   - Se aprovada, valor é **reservado** do saldo (comprometido)

3. **Pagamento**
   - FINANCEIRO marca como "Paga" quando efetuou o pagamento
   - Valor é então deduzido do saldo

**Sistema de Limites:**
- Valores **abaixo do limite**: Aprovação automática
- Valores **acima do limite**: Precisa aprovação do SÍNDICO
- Limite é configurável pelo SÍNDICO

---

### 2.3 Orçamentos

**Fluxo completo:**

```
ADMINISTRATIVO (solicita)
    ↓
FINANCEIRO (revisa verba disponível)
    ↓
SÍNDICO (aprova ou rejeita)
    ↓
FINANCEIRO (libera para execução)
    ↓
OPERACIONAL (executa)
    ↓
FINANCEIRO (registra como saída)
```

**Detalhamento:**

1. **Solicitação (ADMINISTRATIVO)**
   - Identifica necessidade (ex: "Portão precisa de reforma")
   - Cria solicitação de orçamento
   - Anexa documentos, fotos, descrição detalhada
   - Define valor estimado

2. **Revisão (FINANCEIRO)**
   - Verifica se há verba disponível no saldo
   - Analisa se está dentro do orçamento anual
   - Pode vincular a um centro de custo
   - Adiciona observações técnicas/financeiras
   - Envia para SÍNDICO

3. **Aprovação (SÍNDICO)**
   - Analisa a necessidade
   - Verifica se está de acordo com planos do condomínio
   - Aprova ou rejeita
   - Pode adicionar observações

4. **Liberação (FINANCEIRO)**
   - Após aprovação, libera para OPERACIONAL executar
   - OPERACIONAL recebe notificação

5. **Execução (OPERACIONAL)**
   - OPERACIONAL executa o serviço/compra
   - Informa quando concluiu

6. **Registro (FINANCEIRO)**
   - FINANCEIRO registra a despesa real como saída
   - Vincula ao orçamento aprovado
   - Valor é deduzido do saldo

**Vantagens:**
✅ Controle total sobre gastos grandes  
✅ Todos sabem o que está sendo feito  
✅ Histórico completo de aprovações  
✅ Transparência total  

---

### 2.4 Centro de Custo

**Como criar e usar:**

1. **Criar Centro de Custo (SÍNDICO ou FINANCEIRO)**
   - Acessa "Centros de Custo" → "Novo"
   - Nome: "Manutenção de Elevadores"
   - Descrição: "Todas as despesas relacionadas a manutenção de elevadores"
   - Marca como "Ativo"

2. **Usar em Entradas/Saídas**
   - Ao criar entrada ou saída, escolhe o centro de custo
   - Exemplo: Compra de peça para elevador → Centro: "Manutenção de Elevadores"

3. **Visualizar Relatórios**
   - Pode ver quanto gastou em cada centro de custo
   - Facilita identificar onde está gastando mais
   - Ajuda no planejamento do próximo ano

**Dicas de uso:**
- 📌 Crie centros de custo para as principais áreas do condomínio
- 📌 Use sempre que registrar uma movimentação financeira
- 📌 Revise relatórios mensalmente para identificar padrões

---

### 2.5 Contas Recorrentes

São contas que se repetem todo mês, como água, luz, gás.

**Como cadastrar:**

1. FINANCEIRO acessa "Contas" → "Nova Conta"
2. Preenche:
   - Nome: "Conta de Água"
   - Tipo: ÁGUA, LUZ, GAS, OUTRA
   - Fornecedor: "Companhia de Saneamento"
   - Número da Conta: "123456789"
3. Marca como "Ativa"

**Registrar Consumo:**

1. Quando chega a conta, FINANCEIRO registra:
   - Conta: Seleciona "Conta de Água"
   - Valor do Consumo: Leitura atual
   - Data: Data da conta
   - Valor: Valor a pagar
2. Sistema cria saída financeira automaticamente

**Vantagens:**
✅ Histórico de consumo ao longo do tempo  
✅ Facilita identificar variações  
✅ Registro automático de pagamentos  

---

## 3. SISTEMA DE OCORRÊNCIAS

### 🚨 Como funciona?

O sistema de ocorrências é como uma "central de atendimento" do condomínio. Tudo que precisa ser resolvido passa por aqui.

### 3.1 Criar Ocorrência

**Quem pode criar:**
- OPERACIONAL (encontrou um problema)
- LIMPEZA (problema relacionado à limpeza)
- ADMINISTRATIVO (recebeu reclamação de morador)

**Passo a passo:**

1. Acessa "Ocorrências" → "Nova Ocorrência"
2. Preenche:
   - **Título:** "Lâmpada queimada - Corredor 2º andar"
   - **Descrição:** Descrição detalhada do problema
   - **Localização:** Onde está o problema
   - **Prioridade:** BAIXA, NORMAL, ALTA, URGENTE
   - **Tipo:** ROTINEIRA, NÃO_ROTINEIRA, EMERGÊNCIA
3. Se tipo é NÃO_ROTINEIRA ou EMERGÊNCIA:
   - Marca "Requer Aprovação"
   - Seleciona "Aprovação Necessária De": SINDICO
4. Salva

---

### 3.2 Triagem (ADMINISTRATIVO)

ADMINISTRATIVO recebe notificação de nova ocorrência e faz a triagem:

1. Analisa a ocorrência
2. Define:
   - **Responsável:** OPERACIONAL ou LIMPEZA
   - **Classificação:** Tipo de problema
   - **SLA:** Prazo para resolução (horas)
3. Pode converter em tarefa se necessário
4. Encaminha para o responsável

---

### 3.3 Atendimento (OPERACIONAL/LIMPEZA)

Responsável recebe a ocorrência:

1. **Iniciar Atendimento**
   - Status muda para "EM_ATENDIMENTO"
   - Trabalha na solução

2. **Se precisar de mais informações:**
   - Pode enviar de volta com mensagem
   - Quem criou pode complementar

3. **Resolver**
   - Quando problema está resolvido
   - Preenche "Notas de Resolução" (o que foi feito)
   - Status muda para "RESOLVIDA"

---

### 3.4 Aprovação e Comunicação

**Ocorrências que precisam aprovação (NÃO_ROTINEIRA ou EMERGÊNCIA):**

1. OPERACIONAL cria ocorrência
2. SÍNDICO recebe notificação
3. SÍNDICO pode:
   - **Aprovar:** Autoriza a solução
   - **Rejeitar:** Não autoriza, com motivo
   - **Enviar de volta:** Pede mais informações ou ajustes

**Comunicação:**
- Sistema permite comunicação entre setores
- Todas as mensagens ficam registradas
- Histórico completo de interações

---

### 3.5 Finalização (SÍNDICO)

Quando ocorrência está "RESOLVIDA":

1. SÍNDICO recebe notificação
2. Verifica se problema foi realmente resolvido
3. Pode:
   - **Finalizar:** Encerra a ocorrência (status: FINALIZADA)
   - **Enviar de volta:** Se não está satisfeito, volta para OPERACIONAL

**Registro Completo:**
- ✅ Tudo fica documentado
- ✅ Histórico completo de quem fez o quê
- ✅ Comunicações registradas
- ✅ Facilita identificar problemas recorrentes

---

## 4. CHECKLISTS E TAREFAS

### ✅ Checklists Diários

**O que são?**

Checklists são listas de atividades que devem ser executadas **diariamente** ou em dias específicos da semana.

**Exemplos:**
- Verificar funcionamento do portão
- Verificar elevadores
- Limpar área comum do 1º andar
- Verificar iluminação externa

**Como funciona:**

1. **SÍNDICO cria Modelo de Checklist**
   - Define nome: "Checklist Diário - Portaria"
   - Define dias da semana: Segunda a Sexta
   - Adiciona itens:
     - [ ] Verificar portão elétrico
     - [ ] Verificar interfone
     - [ ] Verificar câmeras
   - Define responsável: OPERACIONAL ou LIMPEZA

2. **Sistema gera checklist automaticamente**
   - Todo dia nos dias configurados
   - Aparece no dashboard do responsável

3. **Responsável executa**
   - Acessa "Checklists Diários"
   - Marca cada item como "Feito" ou "Não Feito"
   - Se "Não Feito", preenche justificativa obrigatória
   - Pode anexar foto como evidência
   - Finaliza checklist

4. **Acompanhamento**
   - SÍNDICO pode ver histórico
   - Identifica problemas recorrentes
   - Ajusta modelo se necessário

---

### 📋 Tarefas

**O que são?**

Tarefas são atividades específicas atribuídas a alguém com prazo definido.

**Diferença entre Checklist e Tarefa:**
- **Checklist:** Atividade rotineira, repetitiva, sem prazo específico
- **Tarefa:** Atividade única, com prazo, com objetivo específico

**Exemplos de Tarefas:**
- "Pintar portão principal - Prazo: 15/02/2025"
- "Revisar sistema de segurança - Prazo: 20/02/2025"
- "Organizar salão de festas para evento - Prazo: 10/02/2025"

**Como funciona:**

1. **ADMINISTRATIVO cria Tarefa**
   - Define título e descrição
   - Seleciona responsável: OPERACIONAL
   - Define data de vencimento
   - Define prioridade: BAIXA, NORMAL, ALTA, URGENTE
   - Pode adicionar itens de checklist (passos para concluir)

2. **Responsável recebe notificação**
   - Aparece no dashboard
   - Aparece na lista de tarefas pendentes

3. **Execução**
   - Responsável executa a tarefa
   - Quando concluir, marca como "Concluída"
   - Preenche:
     - Concluída com sucesso? (Sim/Não)
     - Notas de conclusão (o que foi feito)
     - Tempo gasto (opcional)
     - Qualidade do trabalho (opcional)

4. **Acompanhamento**
   - ADMINISTRATIVO e SÍNDICO podem acompanhar
   - Sistema alerta sobre tarefas atrasadas
   - Histórico completo de execução

---

## 5. PERFIS DO SISTEMA

### 👥 Detalhamento de cada Perfil

#### 👑 SUPER_MASTER

**Responsabilidades:**
- Administrar o sistema como um todo
- Criar condomínios
- Criar usuários para cada condomínio
- Atribuir perfis aos usuários

**O que pode fazer:**
✅ Criar, editar, visualizar condomínios  
✅ Criar, editar, visualizar usuários  
✅ Visualizar logs do sistema  
✅ Gerenciar perfis do sistema  

**O que NÃO pode fazer:**
❌ Não gerencia financeiro de condomínios  
❌ Não aprova entradas/saídas  
❌ Não executa tarefas operacionais  

---

#### 🏛️ SÍNDICO

**Responsabilidades:**
- Liderar a gestão do condomínio
- Aprovar movimentações financeiras
- Aprovar orçamentos
- Acompanhar tudo que acontece

**O que pode fazer:**
✅ **Visualizar tudo:** Dashboards, relatórios, estatísticas  
✅ **Aprovar/Rejeitar:**
   - Entradas financeiras
   - Saídas financeiras (acima do limite)
   - Orçamentos
   - Ocorrências que requerem aprovação
✅ **Criar:**
   - Modelos de checklist
   - Manutenções
   - Alertas
✅ **Visualizar logs** (versão filtrada)

**O que NÃO pode fazer:**
❌ Não cria tarefas operacionais  
❌ Não executa checklists  
❌ Não registra entradas/saídas financeiras diretamente  
❌ Não resolve ocorrências  

---

#### 💰 FINANCEIRO

**Responsabilidades:**
- Gerenciar todo o dinheiro do condomínio
- Registrar entradas e saídas
- Criar centros de custo
- Revisar orçamentos

**O que pode fazer:**
✅ **Entradas:**
   - Criar entradas
   - Editar entradas rejeitadas
   - Marcar como recebidas
✅ **Saídas:**
   - Criar saídas
   - Marcar como pagas
   - Editar (com restrições)
✅ **Orçamentos:**
   - Revisar orçamentos do ADMINISTRATIVO
   - Adicionar observações financeiras
   - Liberar para execução após aprovação
✅ **Centros de Custo:**
   - Criar e gerenciar
✅ **Contas:**
   - Cadastrar contas recorrentes
   - Registar consumos

**O que NÃO pode fazer:**
❌ Não aprova valores altos (isso é do SÍNDICO)  
❌ Não aprova orçamentos (revisa e envia para SÍNDICO)  
❌ Não cria tarefas  
❌ Não executa operações práticas  

---

#### 📋 ADMINISTRATIVO

**Responsabilidades:**
- Organizar e distribuir o trabalho
- Fazer triagem de ocorrências
- Criar tarefas
- Solicitar orçamentos

**O que pode fazer:**
✅ **Ocorrências:**
   - Visualizar ocorrências
   - Fazer triagem (atribuir responsável)
   - Converter ocorrência em tarefa
✅ **Tarefas:**
   - Criar tarefas
   - Atribuir responsáveis
   - Definir prazos
   - Acompanhar execução
✅ **Orçamentos:**
   - Solicitar orçamentos
   - Anexar documentos
   - Acompanhar aprovação
✅ **Documentos:**
   - Gerenciar documentos do condomínio

**O que NÃO pode fazer:**
❌ Não aprova valores financeiros  
❌ Não executa tarefas  
❌ Não resolve ocorrências diretamente  
❌ Não acessa detalhes financeiros (apenas visão geral)  

---

#### 🔧 OPERACIONAL

**Responsabilidades:**
- Executar tarefas práticas
- Fazer manutenções
- Resolver ocorrências
- Executar checklists

**O que pode fazer:**
✅ **Checklists:**
   - Ver checklists diários atribuídos
   - Executar checklists
   - Marcar itens como feito/não feito
   - Anexar fotos
✅ **Tarefas:**
   - Ver tarefas atribuídas
   - Concluir tarefas
   - Informar progresso
✅ **Ocorrências:**
   - Criar ocorrências
   - Ver ocorrências atribuídas
   - Iniciar atendimento
   - Resolver ocorrências
✅ **Manutenções:**
   - Ver manutenções atribuídas
   - Iniciar manutenções
   - Concluir manutenções

**O que NÃO pode fazer:**
❌ Não acessa módulo financeiro  
❌ Não aprova nada  
❌ Não cria tarefas (apenas executa)  
❌ Não visualiza orçamentos  

---

#### 🧹 LIMPEZA

**Responsabilidades:**
- Gerenciar limpeza do condomínio
- Criar ocorrências de limpeza
- Executar checklists de limpeza

**O que pode fazer:**
✅ **Ocorrências de Limpeza:**
   - Criar ocorrências relacionadas à limpeza
   - Ver ocorrências atribuídas
   - Resolver ocorrências de limpeza
✅ **Checklists:**
   - Executar checklists de limpeza
   - Anexar fotos
✅ **Dashboard:**
   - Ver checklist pendentes
   - Ver ocorrências de limpeza

**O que NÃO pode fazer:**
❌ Não acessa outras áreas (operações, financeiro)  
❌ Não aprova nada  
❌ Não cria tarefas  

---

#### 👀 CONSELHO

**Responsabilidades:**
- Acompanhar gestão do condomínio
- Visualizar relatórios
- Fiscalizar uso do sistema

**O que pode fazer:**
✅ **Visualização:**
   - Dashboard com informações gerais
   - Relatórios financeiros (sem edição)
   - Relatórios operacionais
   - Logs (versão filtrada, sem dados sensíveis)

**O que NÃO pode fazer:**
❌ **NÃO pode criar nada**  
❌ **NÃO pode editar nada**  
❌ **NÃO pode aprovar nada**  
❌ **NÃO pode excluir nada**  
❌ **Apenas visualiza**  

---

## 6. FLUXOS PRINCIPAIS

### 🔄 Fluxo Completo: Entrada Financeira

```
1. FINANCEIRO registra entrada
   └─ Descrição: "Taxa condomínio - Apto 101"
   └─ Valor: R$ 500,00
   └─ Status: PENDING_REVIEW

2. SÍNDICO recebe notificação
   └─ Acessa "Entradas Pendentes"
   └─ Analisa a entrada

3. SÍNDICO aprova
   └─ Status: APPROVED
   └─ Valor é somado ao saldo disponível

4. FINANCEIRO marca como recebida
   └─ Status: RECEIVED
   └─ Valor conta definitivamente no saldo
```

---

### 🔄 Fluxo Completo: Orçamento

```
1. ADMINISTRATIVO solicita orçamento
   └─ Descrição: "Reforma do portão"
   └─ Valor estimado: R$ 5.000,00
   └─ Anexa documentos
   └─ Status: PENDING_FINANCEIRO

2. FINANCEIRO revisa
   └─ Verifica verba disponível
   └─ Adiciona observações
   └─ Status: PENDING_SINDICO

3. SÍNDICO aprova
   └─ Status: APPROVED
   └─ Valor é reservado do saldo

4. FINANCEIRO libera
   └─ Status: LIBERATED
   └─ OPERACIONAL recebe notificação

5. OPERACIONAL executa
   └─ Informa conclusão

6. FINANCEIRO registra despesa
   └─ Cria saída financeira
   └─ Vincula ao orçamento
   └─ Valor é deduzido do saldo
```

---

### 🔄 Fluxo Completo: Ocorrência

```
1. OPERACIONAL cria ocorrência
   └─ Título: "Lâmpada queimada"
   └─ Tipo: ROTINEIRA
   └─ Status: ABERTA

2. ADMINISTRATIVO faz triagem
   └─ Atribui para OPERACIONAL
   └─ Define SLA: 24 horas

3. OPERACIONAL inicia atendimento
   └─ Status: EM_ATENDIMENTO

4. OPERACIONAL resolve
   └─ Notas: "Substituída lâmpada"
   └─ Status: RESOLVIDA

5. SÍNDICO finaliza
   └─ Status: FINALIZADA
```

---

### 🔄 Fluxo Completo: Checklist

```
1. SÍNDICO cria modelo
   └─ Nome: "Checklist Diário - Portaria"
   └─ Dias: Segunda a Sexta
   └─ Itens: [Verificar portão, Verificar interfone]
   └─ Responsável: OPERACIONAL

2. Sistema gera automaticamente
   └─ Todo dia útil
   └─ Aparece no dashboard do OPERACIONAL

3. OPERACIONAL executa
   └─ Marca itens como feito/não feito
   └─ Anexa fotos se necessário
   └─ Status: COMPLETED

4. SÍNDICO acompanha
   └─ Vê histórico
   └─ Identifica problemas recorrentes
```

---

## 📊 DASHBOARDS E RELATÓRIOS

### 📈 O que é Dashboard?

Dashboard é a **tela inicial** de cada perfil. Mostra um resumo do que é mais importante.

**O que cada perfil vê:**

- **SÍNDICO:**
  - Aprovações pendentes
  - Saldo financeiro
  - Ocorrências abertas
  - Orçamentos aguardando aprovação
  - Tarefas atrasadas

- **FINANCEIRO:**
  - Entradas pendentes
  - Saídas pendentes
  - Orçamentos aguardando revisão
  - Saldo atual
  - Contas vencendo

- **ADMINISTRATIVO:**
  - Tarefas pendentes
  - Ocorrências não triadas
  - Orçamentos solicitados

- **OPERACIONAL:**
  - Tarefas pendentes
  - Checklists do dia
  - Ocorrências atribuídas
  - Manutenções pendentes

---

## 🔔 NOTIFICAÇÕES

O sistema envia **notificações automáticas** para alertar sobre eventos importantes.

**Exemplos:**
- ✅ "Nova entrada financeira aguardando análise"
- ✅ "Orçamento aprovado pelo síndico"
- ✅ "Ocorrência atribuída para você"
- ✅ "Tarefa vencendo em 2 dias"
- ✅ "Checklist pendente de execução"

**Como funciona:**
- Aparecem no dashboard
- Pode clicar para ver detalhes
- Histórico de notificações fica salvo

---

## 📝 DICAS IMPORTANTES

### ✅ Boas Práticas

1. **Use sempre Centro de Custo**
   - Facilita organização
   - Melhora relatórios
   - Ajuda no planejamento

2. **Descreva bem ocorrências e tarefas**
   - Quanto mais detalhes, melhor
   - Anexe fotos quando necessário
   - Facilita resolução

3. **Respeite os prazos**
   - Tarefas têm prazos por um motivo
   - Sistema alerta sobre atrasos
   - Planeje bem o trabalho

4. **Comunique-se pelo sistema**
   - Use mensagens no sistema
   - Tudo fica registrado
   - Evita mal-entendidos

5. **Revise relatórios regularmente**
   - Identifique padrões
   - Planeje melhorias
   - Tome decisões baseadas em dados

---

### ⚠️ Erros Comuns a Evitar

1. ❌ **Não criar entrada sem aprovação do síndico**
   - Sempre aguarde aprovação antes de contar como recebido

2. ❌ **Não executar tarefa sem ser atribuído**
   - Respeite as atribuições
   - Evita trabalho duplicado

3. ❌ **Não marcar checklist como feito sem realmente fazer**
   - Seja honesto
   - Problemas aparecerão depois

4. ❌ **Não criar ocorrência de emergência para coisas rotineiras**
   - Use prioridade correta
   - Emergência é para casos realmente urgentes

---

## 🆘 SUPORTE E AJUDA

### 📞 Contato

Se tiver dúvidas ou problemas:

1. Consulte este guia primeiro
2. Veja os tutoriais no sistema
3. Entre em contato com o suporte

### 📚 Glossário Rápido

- **Saldo:** Dinheiro disponível no condomínio
- **Aprovação:** Autorização para uma ação
- **Status:** Estado atual de algo (pendente, aprovado, etc.)
- **Dashboard:** Tela inicial com resumo
- **Notificação:** Alerta sobre algo importante
- **SLA:** Prazo para resolução de algo
- **Triagem:** Análise e distribuição de trabalho

---

## ✅ CONCLUSÃO

Este sistema foi criado para **facilitar e organizar** a gestão do seu condomínio. Use todas as funcionalidades, siga os fluxos corretamente e aproveite os benefícios:

✅ **Organização total**  
✅ **Controle financeiro completo**  
✅ **Rastreabilidade de tudo**  
✅ **Transparência para todos**  
✅ **Eficiência operacional**  

**Bem-vindo ao sistema! 🎉**

---

**Última atualização:** Janeiro 2025  
**Versão do Guia:** 1.0
