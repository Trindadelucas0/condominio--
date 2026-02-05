# 📋 RELATÓRIO COMPLETO DO SISTEMA DE GESTÃO CONDOMINIAL

## 📌 ÍNDICE
1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Tecnologias Utilizadas](#tecnologias-utilizadas)
3. [Arquitetura e Estrutura](#arquitetura-e-estrutura)
4. [Módulos e Funcionalidades](#módulos-e-funcionalidades)
5. [Sistema de Perfis e Permissões](#sistema-de-perfis-e-permissões)
6. [Fluxos de Aprovação](#fluxos-de-aprovação)
7. [Guia de Uso por Módulo](#guia-de-uso-por-módulo)
8. [Fluxos Completos de Trabalho](#fluxos-completos-de-trabalho)
9. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
10. [Segurança e Autenticação](#segurança-e-autenticação)

---

## 🎯 VISÃO GERAL DO SISTEMA

### O que o Sistema Faz

Este é um **Sistema Completo de Gestão Condominial** desenvolvido para gerenciar todas as operações de um condomínio de forma integrada e digital. O sistema permite:

- ✅ **Gestão Financeira Completa**: Controle de entradas, saídas, inadimplência, fechamento mensal, fundo de reserva
- ✅ **Gestão Operacional**: Checklists diários, tarefas, ocorrências, manutenções
- ✅ **Gestão Administrativa**: Documentos, contratos, orçamentos, triagem de ocorrências
- ✅ **Gestão de Patrimônio**: Cadastro de ativos, controle de depreciação
- ✅ **Gestão de Estoque**: Controle de materiais e insumos
- ✅ **Gestão de Limpeza**: Checklists específicos para equipe de limpeza
- ✅ **Assembleias**: Gestão de assembleias e atas
- ✅ **Sistema de Aprovações**: Fluxos de aprovação hierárquicos com multi-aprovação
- ✅ **Dashboards e Relatórios**: Visualizações e relatórios em PDF/Excel
- ✅ **Notificações e Alertas**: Sistema de alertas SLA e notificações

### Características Principais

- **Multi-condomínio**: Um único sistema pode gerenciar múltiplos condomínios
- **Controle de Acesso por Perfis**: 9 perfis diferentes com permissões específicas
- **Auditoria Completa**: Todos os logs de ações são registrados
- **Multi-aprovação**: Valores altos requerem múltiplas aprovações
- **Interface Web Responsiva**: Acessível de qualquer dispositivo

---

## 🛠️ TECNOLOGIAS UTILIZADAS

### Backend
- **Node.js**: Runtime JavaScript do servidor
- **Express.js**: Framework web para Node.js
- **PostgreSQL**: Banco de dados relacional
- **JWT (JSON Web Tokens)**: Autenticação e autorização
- **bcrypt**: Criptografia de senhas
- **Multer**: Upload de arquivos
- **PDFKit**: Geração de PDFs
- **ExcelJS**: Geração de planilhas Excel
- **Puppeteer**: Geração de PDFs avançados (atas de assembleia)

### Frontend
- **EJS (Embedded JavaScript)**: Template engine para views
- **CSS Personalizado**: Design system próprio
- **JavaScript Vanilla**: Interatividade no cliente
- **Chart.js**: Gráficos e visualizações

### Infraestrutura
- **dotenv**: Gerenciamento de variáveis de ambiente
- **node-cache**: Cache em memória para performance
- **cookie-parser**: Gerenciamento de cookies

### Desenvolvimento
- **Nodemon**: Auto-reload em desenvolvimento
- **Testes**: Suíte de testes automatizados

---

## 🏗️ ARQUITETURA E ESTRUTURA

### Estrutura de Diretórios

```
condominio/
├── src/
│   ├── config/          # Configurações (banco de dados)
│   ├── controllers/     # Lógica de controle (recebe requisições)
│   ├── services/        # Lógica de negócio (regras de negócio)
│   ├── routes/          # Definição de rotas HTTP
│   ├── middlewares/     # Middlewares (auth, upload, etc)
│   ├── database/        # Scripts SQL e inicialização
│   ├── utils/           # Utilitários (helpers, validators)
│   ├── jobs/            # Tarefas agendadas
│   ├── app.js           # Configuração do Express
│   └── server.js        # Ponto de entrada do servidor
├── views/               # Templates EJS (HTML)
├── public/              # Arquivos estáticos (CSS, JS, imagens)
├── uploads/             # Arquivos enviados pelos usuários
├── tests/               # Testes automatizados
└── package.json         # Dependências do projeto
```

### Padrão MVC (Model-View-Controller)

1. **Routes** (`src/routes/`): Define as rotas HTTP e qual controller chamar
2. **Controllers** (`src/controllers/`): Recebe requisições, valida dados, chama services
3. **Services** (`src/services/`): Contém a lógica de negócio, acesso ao banco
4. **Views** (`views/`): Templates HTML que são renderizados para o usuário

### Fluxo de uma Requisição

```
1. Cliente faz requisição HTTP (ex: GET /financeiro/entradas)
   ↓
2. Express roteia para a rota correta (financeiroRoutes.js)
   ↓
3. Middleware de autenticação verifica se usuário está logado
   ↓
4. Middleware de autorização verifica se usuário tem permissão
   ↓
5. Controller recebe a requisição (financeiroController.js)
   ↓
6. Controller chama o Service (financeiroService.js)
   ↓
7. Service executa queries no banco de dados
   ↓
8. Service retorna dados para o Controller
   ↓
9. Controller renderiza a View (EJS) com os dados
   ↓
10. HTML é enviado para o cliente
```

---

## 📦 MÓDULOS E FUNCIONALIDADES

### 1. MÓDULO MASTER (SUPER_MASTER)

**Perfil**: `SUPER_MASTER`  
**Acesso**: `/master/*`

#### Funcionalidades
- **Gerenciamento de Condomínios**
  - Criar novos condomínios
  - Editar informações de condomínios
  - Listar todos os condomínios do sistema
  - Ativar/desativar condomínios

- **Gerenciamento de Usuários**
  - Criar usuários para qualquer condomínio
  - Atribuir perfis (roles) aos usuários
  - Editar informações de usuários
  - Listar todos os usuários

#### Quando Usar
- Primeira configuração do sistema
- Criar novos condomínios
- Criar usuários administrativos
- Gerenciar acesso global

---

### 2. MÓDULO SÍNDICO

**Perfil**: `SINDICO`, `SUBSINDICO`  
**Acesso**: `/sindico/*`

#### Funcionalidades

**Dashboard**
- Visão geral do condomínio
- Estatísticas financeiras (entradas, saídas, inadimplência)
- Estatísticas operacionais (tarefas, ocorrências)
- Gráficos comparativos
- Configuração personalizada de widgets

**Aprovações**
- Aprovar/rejeitar saídas financeiras
- Aprovar/rejeitar entradas financeiras
- Aprovar/rejeitar orçamentos
- Aprovar/rejeitar ocorrências
- Sistema de multi-aprovação (valores altos)

**Alertas**
- Visualizar alertas do sistema
- Resolver alertas
- Alertas de SLA, vencimentos, pendências

**Tarefas**
- Visualizar todas as tarefas do condomínio
- Adicionar observações em tarefas
- Gerar relatórios de tarefas (PDF/Excel)

**Ocorrências**
- Visualizar todas as ocorrências
- Adicionar observações
- Aprovar/rejeitar ocorrências

**Checklists**
- Criar modelos de checklist
- Editar modelos de checklist
- Acompanhar checklists executados
- Questionar itens não realizados

**Manutenções**
- Criar manutenções preventivas
- Visualizar manutenções
- Acompanhar execução

**Logs**
- Visualizar histórico de ações
- Auditoria completa do sistema

#### Quando Aprovar

**Saídas Financeiras:**
- ✅ **Aprovar quando**: Valor está correto, descrição clara, centro de custo adequado
- ❌ **Rejeitar quando**: Valor suspeito, descrição vaga, sem comprovante necessário

**Orçamentos:**
- ✅ **Aprovar quando**: Orçamento está dentro do esperado, fornecedor confiável, valor justo
- ❌ **Rejeitar quando**: Valor muito alto, fornecedor desconhecido, orçamento incompleto

**Ocorrências:**
- ✅ **Aprovar quando**: Ocorrência é válida, precisa de ação, está documentada
- ❌ **Rejeitar quando**: Ocorrência duplicada, já resolvida, sem necessidade

**Multi-Aprovação:**
- Valores ≥ R$ 10.000: Requerem 2 aprovações
- Valores ≥ R$ 50.000: Requerem 3 aprovações
- Cada síndico/subsíndico pode aprovar uma vez

---

### 3. MÓDULO FINANCEIRO

**Perfil**: `FINANCEIRO`, `SINDICO`, `SUBSINDICO`  
**Acesso**: `/financeiro/*`

#### Funcionalidades

**Entradas (Receitas)**
- Criar novas entradas
- Listar entradas
- Marcar como recebida (com comprovante PDF)
- Editar entradas
- Excluir entradas
- Entradas rejeitadas (para correção)

**Saídas (Despesas)**
- Criar novas saídas
- Listar saídas
- Marcar como paga (com comprovante PDF)
- Editar saídas
- Verificar saídas criadas de orçamentos
- Saídas pendentes de aprovação

**Contas (Contas a Pagar/Receber)**
- Cadastrar contas
- Listar contas
- Gerenciar vencimentos

**Consumo Mensal**
- Registrar consumo de contas (água, luz, etc)
- Visualizar histórico de consumo
- Filtrar por mês/ano/conta

**Centros de Custo**
- Criar centros de custo
- Listar centros de custo
- Associar despesas a centros de custo

**Orçamentos**
- Revisar orçamentos pendentes (análise financeira)
- Liberar orçamentos aprovados
- Retornar orçamentos para correção
- Visualizar orçamentos aprovados/rejeitados

**Fechamento Mensal**
- Fechar mês financeiro
- Validar fechamento (verifica pendências)
- Reabrir mês fechado (com motivo)
- Visualizar histórico de fechamentos
- Criar múltiplos fechamentos do mesmo mês

**Inadimplência**
- Cadastrar apartamentos
- Criar taxas mensais
- Marcar taxas como pagas
- Visualizar inadimplentes
- Calcular juros e multas

**Relatórios**
- Gerar relatório mensal financeiro (PDF)
- Visualizar relatórios gerados
- Baixar relatórios
- Excluir relatórios antigos

**Fundo de Reserva**
- Configurar fundo de reserva
- Visualizar saldo atual
- Histórico de movimentações

#### Fluxo de Trabalho Financeiro

1. **Criar Entrada/Saída**
   - Financeiro cria registro
   - Se valor alto, vai para aprovação do síndico

2. **Aprovação**
   - Síndico aprova/rejeita
   - Se rejeitada, volta para financeiro corrigir

3. **Pagamento/Recebimento**
   - Financeiro marca como pago/recebido
   - Upload de comprovante PDF obrigatório

4. **Fechamento Mensal**
   - No final do mês, financeiro fecha
   - Sistema valida se há pendências
   - Gera relatório automático

---

### 4. MÓDULO ADMINISTRATIVO

**Perfil**: `ADMINISTRATIVO`  
**Acesso**: `/administrativo/*`

#### Funcionalidades

**Tarefas**
- Criar tarefas para equipe operacional
- Listar tarefas
- Reabrir tarefas concluídas
- Visualizar status de tarefas

**Documentos**
- Cadastrar documentos
- Criar categorias de documentos
- Upload de contratos (PDF)
- Listar documentos
- Editar documentos

**Ocorrências (Triagem)**
- Listar ocorrências pendentes de triagem
- Triar ocorrências (classificar)
- Converter ocorrência em tarefa
- Encaminhar para setor específico

**Orçamentos**
- Criar solicitação de orçamento
- Adicionar múltiplos orçamentos (quotes)
- Upload de anexos
- Acompanhar status (PENDING_FINANCEIRO → PENDING_SINDICO → APPROVED/REJECTED)

**Comunicados**
- Criar comunicados operacionais
- Listar comunicados ativos
- Desativar comunicados

**Aprovações Financeiras**
- Aprovar saídas até limite configurado
- Visualizar aprovações pendentes

**Alertas SLA**
- Visualizar alertas de SLA
- Tarefas e ocorrências com prazo vencido

#### Fluxo de Triagem de Ocorrências

1. **Operacional cria ocorrência**
   - Ocorrência fica pendente de triagem

2. **Administrativo tria**
   - Classifica a ocorrência
   - Decide: converter em tarefa ou apenas documentar

3. **Se convertida em tarefa**
   - Tarefa é criada automaticamente
   - Operacional recebe notificação

---

### 5. MÓDULO OPERACIONAL

**Perfil**: `OPERACIONAL`  
**Acesso**: `/operacional/*`

#### Funcionalidades

**Checklists Diários**
- Visualizar checklists do dia
- Iniciar checklist
- Marcar itens como feitos
- Adicionar evidências (fotos)
- Responder questionamentos do síndico
- Finalizar checklist

**Tarefas**
- Visualizar tarefas atribuídas
- Ver detalhes da tarefa
- Concluir tarefa (com upload de fotos)
- Adicionar observações

**Ocorrências**
- Criar ocorrências (com fotos)
- Listar ocorrências
- Resolver ocorrências
- Visualizar status

**Manutenções**
- Visualizar manutenções atribuídas
- Iniciar manutenção
- Concluir manutenção (com fotos e observações)

**Orçamentos Liberados**
- Visualizar orçamentos liberados pelo financeiro
- Acompanhar execução

#### Fluxo de Checklist Diário

1. **Síndico cria modelo de checklist**
   - Define itens e regras

2. **Sistema gera checklist diário automaticamente**
   - Baseado no modelo

3. **Operacional executa**
   - Inicia checklist
   - Marca itens como feitos
   - Adiciona fotos como evidência

4. **Síndico acompanha**
   - Visualiza checklist completo
   - Questiona itens não feitos
   - Operacional responde

---

### 6. MÓDULO LIMPEZA

**Perfil**: `LIMPEZA`  
**Acesso**: `/operacional/*` (compartilhado com OPERACIONAL)

#### Funcionalidades

**Checklists de Limpeza**
- Visualizar checklists de limpeza
- Executar checklists
- Adicionar evidências

**Tarefas de Limpeza**
- Visualizar tarefas de limpeza
- Concluir tarefas

**Restrições**
- ❌ Não pode criar ocorrências
- ❌ Não vê dados financeiros
- ✅ Apenas checklists e tarefas de limpeza

---

### 7. MÓDULO PATRIMÔNIO

**Perfil**: `PATRIMONIO`  
**Acesso**: `/patrimonio/*`

#### Funcionalidades

**Ativos**
- Cadastrar ativos do condomínio
- Editar informações
- Listar ativos
- Calcular depreciação automática
- Upload de fotos/documentos

**Categorias**
- Criar categorias de ativos
- Gerenciar categorias

**Restrições**
- ❌ Não pode criar despesas
- ✅ Apenas gestão patrimonial

---

### 8. MÓDULO ESTOQUE

**Perfil**: `ESTOQUE` (ou outros conforme configurado)  
**Acesso**: `/estoque/*`

#### Funcionalidades

**Materiais**
- Cadastrar materiais
- Controlar estoque
- Registrar entradas/saídas
- Alertas de estoque baixo

**Fornecedores**
- Cadastrar fornecedores
- Listar fornecedores

---

### 9. MÓDULO CONSELHO

**Perfil**: `CONSELHO`  
**Acesso**: `/conselho/*`

#### Funcionalidades

**Apenas Visualização**
- Visualizar dashboards
- Visualizar relatórios
- Visualizar documentos públicos

**Restrições**
- ❌ Não pode criar nada
- ❌ Não pode editar nada
- ❌ Não pode aprovar nada
- ✅ Apenas leitura

---

### 10. MÓDULO ASSEMBLEIAS

**Perfil**: `SINDICO`, `SUBSINDICO`  
**Acesso**: `/assembleias/*`

#### Funcionalidades

**Assembleias**
- Criar assembleias
- Editar assembleias
- Listar assembleias

**Atas**
- Gerar ata de assembleia (PDF)
- Visualizar atas
- Baixar atas

---

## 👥 SISTEMA DE PERFIS E PERMISSÕES

### Perfis Disponíveis

| Perfil | Descrição | Pode Aprovar? | Vê Financeiro? | Executa Tarefas? |
|--------|-----------|--------------|----------------|------------------|
| **SUPER_MASTER** | Administrador do sistema | ❌ | ✅ | ❌ |
| **SINDICO** | Síndico do condomínio | ✅ (tudo) | ✅ | ❌ |
| **SUBSINDICO** | Subsíndico | ✅ (tudo) | ✅ | ❌ |
| **ADMINISTRATIVO** | Equipe administrativa | ✅ (até limite) | ✅ | ❌ |
| **OPERACIONAL** | Zeladoria | ❌ | ❌ | ✅ |
| **FINANCEIRO** | Equipe financeira | ✅ (até limite) | ✅ | ❌ |
| **PATRIMONIO** | Controle patrimonial | ❌ | ✅ | ❌ |
| **LIMPEZA** | Equipe de limpeza | ❌ | ❌ | ✅ (só limpeza) |
| **CONSELHO** | Membro do conselho | ❌ | ✅ (só leitura) | ❌ |

### Matriz de Permissões

```
                    | Criar | Editar | Aprovar | Executar | Ver Financeiro |
--------------------|-------|--------|---------|----------|---------------|
SUPER_MASTER        |  ✅   |   ✅   |    ❌   |    ❌    |      ✅       |
SINDICO             |  ✅   |   ✅   |    ✅   |    ❌    |      ✅       |
SUBSINDICO          |  ✅   |   ✅   |    ✅   |    ❌    |      ✅       |
ADMINISTRATIVO      |  ✅   |   ✅   |   ⚠️    |    ❌    |      ✅       |
OPERACIONAL         |  ✅   |   ✅   |    ❌   |    ✅   |      ❌       |
FINANCEIRO          |  ✅   |   ✅   |   ⚠️    |    ❌    |      ✅       |
PATRIMONIO          |  ✅   |   ✅   |    ❌   |    ❌    |      ✅       |
LIMPEZA             |  ✅   |   ✅   |    ❌   |    ✅   |      ❌       |
CONSELHO            |  ❌   |   ❌   |    ❌   |    ❌    |      ✅       |
```

⚠️ = Aprova até limite configurado (valores baixos)

---

## 🔄 FLUXOS DE APROVAÇÃO

### 1. Aprovação de Saída Financeira

```
1. FINANCEIRO cria saída
   ↓
2. Sistema verifica valor:
   - < R$ 1.000: Aprovado automaticamente
   - R$ 1.000 - R$ 5.000: Requer aprovação do FINANCEIRO
   - R$ 5.000 - R$ 10.000: Requer aprovação do SINDICO
   - ≥ R$ 10.000: Requer multi-aprovação (2 síndicos)
   - ≥ R$ 50.000: Requer multi-aprovação (3 síndicos)
   ↓
3. Se requer aprovação:
   - Vai para fila de aprovação do SINDICO
   - SINDICO visualiza em /sindico/saidas-pendentes
   ↓
4. SINDICO aprova ou rejeita:
   - Se aprovar: Status muda para APPROVED
   - Se rejeitar: Volta para FINANCEIRO corrigir
   ↓
5. FINANCEIRO marca como paga:
   - Upload de comprovante PDF obrigatório
   - Status muda para PAID
```

### 2. Aprovação de Orçamento

```
1. ADMINISTRATIVO cria solicitação de orçamento
   - Adiciona múltiplos orçamentos (quotes)
   - Upload de anexos
   ↓
2. Status: PENDING_FINANCEIRO
   - FINANCEIRO revisa
   - Analisa viabilidade financeira
   - Atribui centro de custo
   ↓
3. FINANCEIRO libera ou retorna:
   - Se liberar: Status → PENDING_SINDICO
   - Se retornar: Volta para ADMINISTRATIVO corrigir
   ↓
4. Status: PENDING_SINDICO
   - SINDICO visualiza em /sindico/orcamentos-pendentes
   - Seleciona qual orçamento aprovar
   ↓
5. SINDICO aprova ou rejeita:
   - Se aprovar: Status → APPROVED
     - Sistema cria saída financeira automaticamente
     - Saída vai para verificação do FINANCEIRO
   - Se rejeitar: Status → REJECTED
   ↓
6. FINANCEIRO verifica saída criada:
   - Completa informações faltantes
   - Verifica valores
   - Marca como verificada
```

### 3. Multi-Aprovação

Para valores altos, o sistema requer múltiplas aprovações:

**Regras:**
- **R$ 10.000 - R$ 49.999**: 2 aprovações necessárias
- **≥ R$ 50.000**: 3 aprovações necessárias

**Fluxo:**
```
1. Primeira aprovação (SINDICO 1)
   - Sistema cria registro de multi-aprovação
   - Status: PENDING (aguardando mais aprovações)
   ↓
2. Segunda aprovação (SINDICO 2)
   - Se 2 aprovações suficientes: Status → APPROVED
   - Se precisa de 3: Continua PENDING
   ↓
3. Terceira aprovação (SINDICO 3) - se necessário
   - Status → APPROVED
```

**Importante:**
- Cada síndico/subsíndico só pode aprovar uma vez
- Não pode aprovar a mesma saída duas vezes
- Se um síndico rejeitar, processo é cancelado

---

## 📖 GUIA DE USO POR MÓDULO

### Como Criar um Usuário (SUPER_MASTER)

1. Acesse `/master/usuarios/novo`
2. Preencha:
   - Username (único)
   - Email
   - Nome completo
   - Senha
   - Condomínio (selecionar)
   - Perfil(s) (pode selecionar múltiplos)
3. Clique em "Criar"
4. Usuário recebe acesso imediatamente

### Como Criar uma Entrada Financeira (FINANCEIRO)

1. Acesse `/financeiro/entradas/nova`
2. Preencha:
   - Descrição
   - Valor
   - Data
   - Centro de custo (opcional)
   - Categoria
3. Clique em "Criar"
4. Se valor alto, aguarda aprovação do síndico
5. Após aprovação, marque como recebida:
   - Acesse a entrada
   - Clique em "Marcar como Recebida"
   - Faça upload do comprovante PDF
   - Preencha método de recebimento

### Como Criar uma Saída Financeira (FINANCEIRO)

1. Acesse `/financeiro/saidas/nova`
2. Preencha:
   - Descrição
   - Valor
   - Data
   - Centro de custo
   - Categoria
3. Clique em "Criar"
4. Sistema verifica se requer aprovação:
   - Valores baixos: Aprovado automaticamente
   - Valores médios: Aguarda aprovação do síndico
   - Valores altos: Requer multi-aprovação
5. Após aprovação, marque como paga:
   - Acesse a saída
   - Clique em "Marcar como Paga"
   - Faça upload do comprovante PDF
   - Preencha método de pagamento

### Como Aprovar uma Saída (SINDICO)

1. Acesse `/sindico/saidas-pendentes`
2. Visualize lista de saídas pendentes
3. Clique em uma saída para ver detalhes
4. Analise:
   - Valor está correto?
   - Descrição está clara?
   - Centro de custo adequado?
   - Há comprovante/documentação?
5. Decida:
   - **Aprovar**: Clique em "Aprovar", adicione observações (opcional)
   - **Rejeitar**: Clique em "Rejeitar", informe motivo (obrigatório)
6. Se valor alto (≥ R$ 10.000):
   - Primeira aprovação cria processo de multi-aprovação
   - Aguarda segunda/terceira aprovação
   - Status só muda para APPROVED quando tiver aprovações suficientes

### Como Criar um Orçamento (ADMINISTRATIVO)

1. Acesse `/administrativo/orcamentos/novo`
2. Preencha:
   - Título da solicitação
   - Descrição
   - Valor estimado
   - Categoria
3. Adicione orçamentos (quotes):
   - Fornecedor
   - Valor
   - Prazo
   - Observações
   - Upload de anexos (opcional)
4. Clique em "Criar"
5. Status inicial: PENDING_FINANCEIRO
6. Acompanhe o fluxo:
   - FINANCEIRO revisa
   - SINDICO aprova/rejeita
   - Se aprovado, saída é criada automaticamente

### Como Revisar um Orçamento (FINANCEIRO)

1. Acesse `/financeiro/orcamentos-pendentes`
2. Visualize orçamentos aguardando análise
3. Clique em um orçamento para ver detalhes
4. Analise:
   - Viabilidade financeira
   - Centro de custo adequado
   - Orçamentos (quotes) recebidos
5. Decida:
   - **Liberar**: Clique em "Liberar", adicione observações
     - Status muda para PENDING_SINDICO
   - **Retornar**: Clique em "Retornar", informe motivo
     - Status volta para ADMINISTRATIVO corrigir

### Como Aprovar um Orçamento (SINDICO)

1. Acesse `/sindico/orcamentos-pendentes`
2. Visualize orçamentos aguardando aprovação
3. Clique em um orçamento para ver detalhes
4. Analise todos os quotes recebidos
5. Selecione qual quote aprovar (radio button)
6. Decida:
   - **Aprovar**: Clique em "Aprovar", selecione quote, adicione observações
     - Sistema cria saída financeira automaticamente
     - Saída vai para verificação do FINANCEIRO
   - **Rejeitar**: Clique em "Rejeitar", informe motivo
     - Status muda para REJECTED

### Como Criar um Checklist (SINDICO)

1. Acesse `/sindico/checklist-modelos/novo`
2. Preencha:
   - Nome do checklist
   - Descrição
   - Frequência (diário, semanal, mensal)
3. Adicione itens:
   - Descrição do item
   - Tipo (checkbox, texto, número)
   - Obrigatório (sim/não)
4. Salve o modelo
5. Sistema gera checklists automaticamente baseado na frequência

### Como Executar um Checklist (OPERACIONAL)

1. Acesse `/operacional/checklists-diarios`
2. Visualize checklists do dia
3. Clique em um checklist para iniciar
4. Marque itens como feitos:
   - Checkbox: Marque/desmarque
   - Texto: Digite valor
   - Número: Digite número
5. Adicione evidências (fotos):
   - Clique em "Adicionar Evidência"
   - Faça upload de foto
6. Finalize checklist:
   - Clique em "Finalizar"
   - Checklist fica disponível para síndico acompanhar

### Como Triar uma Ocorrência (ADMINISTRATIVO)

1. Acesse `/administrativo/ocorrencias/pendentes`
2. Visualize ocorrências pendentes de triagem
3. Clique em uma ocorrência para triar
4. Classifique:
   - Tipo de ocorrência
   - Prioridade
   - Setor responsável
5. Decida:
   - **Converter em Tarefa**: Sistema cria tarefa automaticamente
   - **Apenas Documentar**: Apenas registra a ocorrência
6. Salve a triagem
7. Se convertida em tarefa, operacional recebe notificação

### Como Fechar o Mês (FINANCEIRO)

1. Acesse `/financeiro/fechamento-mensal`
2. Sistema valida:
   - Há entradas não recebidas?
   - Há saídas não pagas?
   - Há pendências?
3. Se houver pendências:
   - Sistema mostra lista
   - Corrija antes de fechar
4. Se tudo OK:
   - Clique em "Fechar Mês"
   - Adicione observações (opcional)
   - Defina valor para fundo de reserva (opcional)
5. Sistema:
   - Gera relatório mensal (PDF)
   - Bloqueia edições do mês fechado
   - Registra fechamento
6. Para reabrir (se necessário):
   - Clique em "Reabrir"
   - Informe motivo (obrigatório)
   - Mês volta a ser editável

---

## 🔄 FLUXOS COMPLETOS DE TRABALHO

### Fluxo 1: Manutenção Preventiva Completa

```
1. SINDICO cria manutenção preventiva
   - Define equipamento
   - Define frequência
   - Define checklist
   ↓
2. Sistema agenda manutenção
   ↓
3. OPERACIONAL recebe notificação
   ↓
4. OPERACIONAL inicia manutenção
   ↓
5. OPERACIONAL executa checklist
   - Marca itens
   - Adiciona fotos
   ↓
6. OPERACIONAL conclui manutenção
   - Adiciona observações
   - Upload de fotos finais
   ↓
7. SINDICO visualiza manutenção concluída
   ↓
8. Se necessário, cria orçamento para peças
```

### Fluxo 2: Ocorrência → Tarefa → Orçamento → Pagamento

```
1. OPERACIONAL cria ocorrência
   - Descrição do problema
   - Upload de fotos
   - Localização
   ↓
2. ADMINISTRATIVO tria ocorrência
   - Classifica
   - Converte em tarefa
   ↓
3. OPERACIONAL recebe tarefa
   ↓
4. OPERACIONAL tenta resolver
   - Se consegue: Conclui tarefa
   - Se não consegue: Solicita orçamento
   ↓
5. ADMINISTRATIVO cria orçamento
   - Solicita quotes de fornecedores
   ↓
6. FINANCEIRO revisa orçamento
   - Analisa viabilidade
   - Libera para síndico
   ↓
7. SINDICO aprova orçamento
   - Seleciona melhor quote
   ↓
8. Sistema cria saída financeira
   ↓
9. FINANCEIRO verifica saída
   - Completa informações
   ↓
10. FINANCEIRO marca como paga
    - Upload de comprovante
    ↓
11. OPERACIONAL executa serviço
    - Conclui tarefa original
```

### Fluxo 3: Fechamento Mensal Completo

```
1. FINANCEIRO verifica pendências
   - Entradas não recebidas
   - Saídas não pagas
   - Aprovações pendentes
   ↓
2. FINANCEIRO resolve pendências
   - Marca entradas como recebidas
   - Marca saídas como pagas
   - Aguarda aprovações
   ↓
3. FINANCEIRO fecha mês
   - Sistema valida tudo
   - Gera relatório PDF
   - Bloqueia edições
   ↓
4. SINDICO revisa fechamento
   - Visualiza relatório
   - Verifica totais
   ↓
5. Se necessário, reabre mês
   - Informa motivo
   - Corrige problemas
   - Fecha novamente
```

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Tabelas Principais

**Gestão de Usuários e Acesso**
- `condominiums`: Condomínios cadastrados
- `users`: Usuários do sistema
- `roles`: Perfis disponíveis
- `user_roles`: Relação usuário-perfil

**Financeiro**
- `financial_entries`: Entradas (receitas)
- `financial_exits`: Saídas (despesas)
- `accounts`: Contas a pagar/receber
- `monthly_consumption`: Consumo mensal
- `cost_centers`: Centros de custo
- `monthly_fees`: Taxas mensais (inadimplência)
- `apartments`: Apartamentos
- `monthly_closures`: Fechamentos mensais
- `reserve_fund`: Fundo de reserva

**Operacional**
- `tasks`: Tarefas
- `occurrences`: Ocorrências
- `checklist_models`: Modelos de checklist
- `daily_checklists`: Checklists executados
- `checklist_items`: Itens de checklist
- `maintenances`: Manutenções

**Administrativo**
- `documents`: Documentos
- `document_categories`: Categorias de documentos
- `budget_requests`: Solicitações de orçamento
- `budget_quotes`: Orçamentos recebidos
- `communications`: Comunicados

**Aprovações**
- `approvals`: Aprovações gerais
- `multi_approvals`: Multi-aprovações
- `multi_approval_votes`: Votos de multi-aprovação

**Auditoria**
- `action_logs`: Logs de ações
- `alerts`: Alertas do sistema

**Outros**
- `assets`: Ativos patrimoniais
- `inventory`: Estoque
- `assemblies`: Assembleias
- `contracts`: Contratos

### Relacionamentos Principais

```
condominiums (1) ──→ (N) users
users (N) ──→ (N) roles (via user_roles)
condominiums (1) ──→ (N) financial_entries
condominiums (1) ──→ (N) financial_exits
condominiums (1) ──→ (N) tasks
condominiums (1) ──→ (N) occurrences
budget_requests (1) ──→ (N) budget_quotes
financial_exits (N) ──→ (1) cost_centers
```

---

## 🔒 SEGURANÇA E AUTENTICAÇÃO

### Autenticação

**JWT (JSON Web Tokens)**
- Access Token: Válido por 15 minutos
- Refresh Token: Válido por 7 dias
- Tokens armazenados em cookies HTTP-only
- Renovação automática de tokens

**Fluxo de Login:**
1. Usuário faz login com username/senha
2. Sistema valida credenciais
3. Sistema gera JWT (access + refresh)
4. Tokens são salvos em cookies
5. Cada requisição valida o token
6. Se token expirar, sistema tenta renovar com refresh token

### Autorização

**RBAC (Role-Based Access Control)**
- Cada usuário tem um ou mais perfis
- Cada rota verifica se usuário tem perfil necessário
- Middleware `authenticate`: Verifica se está logado
- Middleware `authorize`: Verifica se tem perfil correto

**Exemplo:**
```javascript
// Rota protegida
router.get('/dashboard', 
  authenticate,  // Verifica se está logado
  authorize('SINDICO', 'SUBSINDICO'),  // Verifica se tem perfil
  controller.showDashboard
);
```

### Segurança de Dados

- **Senhas**: Criptografadas com bcrypt (10 rounds)
- **SQL Injection**: Prevenido com queries parametrizadas
- **XSS**: Prevenido com escape de dados nas views
- **CSRF**: Protegido com cookies SameSite
- **Upload de Arquivos**: Validado (tipo, tamanho)
- **Logs de Auditoria**: Todas as ações são registradas

### Variáveis de Ambiente

Arquivo `.env` necessário:
```
# Banco de Dados
DATABASE_URL=postgresql://user:pass@host:port/database
# ou
DB_HOST=localhost
DB_PORT=5432
DB_USER=usuario
DB_PASSWORD=senha
DB_DATABASE=nome_banco

# JWT
JWT_SECRET=chave_secreta_aleatoria

# Servidor
PORT=3000
NODE_ENV=development
```

---

## 📊 DASHBOARDS E RELATÓRIOS

### Dashboard do Síndico

**Métricas Exibidas:**
- Total de entradas do mês
- Total de saídas do mês
- Saldo atual
- Taxa de inadimplência
- Tarefas pendentes
- Ocorrências abertas
- Alertas ativos
- Comparativo com mês anterior

**Gráficos:**
- Entradas vs Saídas (mensal)
- Evolução de gastos
- Distribuição por centro de custo
- Status de tarefas

**Configuração:**
- Síndico pode personalizar widgets
- Mostrar/ocultar métricas
- Reordenar widgets

### Relatórios Disponíveis

**Relatório Mensal Financeiro (PDF)**
- Resumo de entradas
- Resumo de saídas
- Saldo do mês
- Inadimplência
- Fechamento mensal

**Relatório de Tarefas (PDF/Excel)**
- Lista de tarefas
- Status
- Responsáveis
- Prazos

**Relatório de Aprovações (PDF/Excel)**
- Aprovações do período
- Valores aprovados
- Aprovadores

---

## ⚙️ CONFIGURAÇÕES E AUTOMAÇÕES

### Tarefas Agendadas

**Checklist Diário Automático**
- Sistema gera checklists automaticamente
- Baseado em modelos configurados
- Frequência: diária, semanal, mensal

### Alertas Automáticos

**SLA de Tarefas**
- Alerta quando tarefa está próxima do prazo
- Alerta quando tarefa está vencida

**Financeiro**
- Alerta de vencimentos próximos
- Alerta de inadimplência alta
- Alerta de saldo baixo

### Notificações

**Sistema de Notificações**
- Notificações em tempo real
- Email (se configurado)
- Notificações no dashboard

---

## 🧪 TESTES

### Suíte de Testes

O sistema possui testes automatizados em `tests/`:

- `01-auth.test.js`: Testes de autenticação
- `02-financeiro.test.js`: Testes financeiros
- `03-inadimplencia.test.js`: Testes de inadimplência
- `04-assembleias.test.js`: Testes de assembleias
- `05-fundo-reserva.test.js`: Testes de fundo de reserva
- `06-relatorios.test.js`: Testes de relatórios
- `07-dashboards.test.js`: Testes de dashboards
- `08-permissoes.test.js`: Testes de permissões
- `09-fluxos-completos.test.js`: Testes de fluxos end-to-end
- E mais...

**Executar Testes:**
```bash
npm test
```

---

## 🚀 INSTALAÇÃO E CONFIGURAÇÃO

### Pré-requisitos

- Node.js 16+ instalado
- PostgreSQL 12+ instalado e rodando
- NPM ou Yarn

### Passos de Instalação

1. **Clone o repositório**
   ```bash
   git clone <repo-url>
   cd condominio
   ```

2. **Instale dependências**
   ```bash
   npm install
   ```

3. **Configure variáveis de ambiente**
   - Crie arquivo `.env` na raiz
   - Configure `DATABASE_URL` ou variáveis `DB_*`
   - Configure `JWT_SECRET`
   - Configure `PORT` (opcional, padrão: 3000)

4. **Inicialize banco de dados**
   - O sistema inicializa automaticamente na primeira execução
   - Cria todas as tabelas
   - Cria perfis (roles)
   - Cria usuário master padrão:
     - Username: `admin`
     - Senha: `admin123`
     - ⚠️ **ALTERE A SENHA APÓS PRIMEIRO LOGIN!**

5. **Inicie o servidor**
   ```bash
   npm start
   # ou em desenvolvimento:
   npm run dev
   ```

6. **Acesse o sistema**
   - Abra navegador em `http://localhost:3000`
   - Faça login com usuário master
   - Crie seu primeiro condomínio
   - Crie usuários para o condomínio

---

## 📝 OBSERVAÇÕES IMPORTANTES

### Boas Práticas

1. **Sempre faça upload de comprovantes**
   - Entradas: Comprovante de recebimento
   - Saídas: Comprovante de pagamento

2. **Use descrições claras**
   - Facilita aprovações
   - Facilita auditoria
   - Facilita relatórios

3. **Atribua centros de custo**
   - Facilita análise de gastos
   - Facilita relatórios

4. **Feche o mês corretamente**
   - Verifique todas as pendências
   - Não feche com pendências
   - Reabra se necessário

5. **Use multi-aprovação corretamente**
   - Valores altos requerem múltiplas aprovações
   - Não tente burlar o sistema

### Limitações Conhecidas

- Upload máximo: 10MB por arquivo
- Valores monetários: 15 dígitos, 2 decimais
- Cache: 5 minutos para dashboards
- Tokens: Access token expira em 15 minutos

### Suporte

Para problemas ou dúvidas:
1. Verifique os logs do servidor
2. Verifique os logs de ação no sistema
3. Consulte este relatório
4. Entre em contato com o desenvolvedor

---

## 📚 GLOSSÁRIO

- **Entrada**: Receita do condomínio (ex: taxas pagas)
- **Saída**: Despesa do condomínio (ex: pagamento de fornecedor)
- **Triagem**: Classificação de ocorrência pelo administrativo
- **Quote**: Orçamento recebido de um fornecedor
- **Multi-aprovação**: Sistema que requer múltiplas aprovações para valores altos
- **SLA**: Service Level Agreement (prazo para resolução)
- **Fechamento Mensal**: Bloqueio de edições do mês após fechamento
- **Centro de Custo**: Categoria para agrupar despesas (ex: Manutenção, Limpeza)
- **Checklist**: Lista de itens a serem verificados/executados
- **Ocorrência**: Problema ou situação reportada
- **Tarefa**: Trabalho atribuído a um operacional

---

## ✅ CHECKLIST DE TESTE COMPLETO

Use este checklist para testar todo o sistema:

### Configuração Inicial
- [ ] Criar condomínio (SUPER_MASTER)
- [ ] Criar usuários para cada perfil
- [ ] Fazer login com cada perfil
- [ ] Verificar acesso correto por perfil

### Módulo Financeiro
- [ ] Criar entrada financeira
- [ ] Marcar entrada como recebida (com PDF)
- [ ] Criar saída financeira (valor baixo)
- [ ] Criar saída financeira (valor médio - requer aprovação)
- [ ] Criar saída financeira (valor alto - requer multi-aprovação)
- [ ] Aprovar saída como síndico
- [ ] Marcar saída como paga (com PDF)
- [ ] Criar centro de custo
- [ ] Registrar consumo mensal
- [ ] Fechar mês
- [ ] Reabrir mês
- [ ] Gerar relatório mensal

### Módulo Administrativo
- [ ] Criar tarefa
- [ ] Criar documento
- [ ] Criar categoria de documento
- [ ] Triar ocorrência
- [ ] Converter ocorrência em tarefa
- [ ] Criar solicitação de orçamento
- [ ] Adicionar múltiplos quotes ao orçamento

### Módulo Operacional
- [ ] Criar ocorrência (com fotos)
- [ ] Visualizar tarefas atribuídas
- [ ] Concluir tarefa (com fotos)
- [ ] Executar checklist diário
- [ ] Adicionar evidências ao checklist
- [ ] Iniciar manutenção
- [ ] Concluir manutenção

### Módulo Síndico
- [ ] Visualizar dashboard
- [ ] Aprovar saída financeira
- [ ] Rejeitar saída financeira
- [ ] Aprovar orçamento
- [ ] Rejeitar orçamento
- [ ] Criar modelo de checklist
- [ ] Acompanhar checklist executado
- [ ] Questionar item de checklist
- [ ] Visualizar logs

### Fluxos Completos
- [ ] Ocorrência → Triagem → Tarefa → Conclusão
- [ ] Orçamento → Revisão Financeiro → Aprovação Síndico → Saída → Pagamento
- [ ] Checklist → Execução → Questionamento → Resposta
- [ ] Fechamento Mensal → Validação → Relatório → Reabertura (se necessário)

### Multi-Aprovação
- [ ] Criar saída ≥ R$ 10.000
- [ ] Primeira aprovação (SINDICO 1)
- [ ] Segunda aprovação (SINDICO 2)
- [ ] Verificar status APPROVED
- [ ] Testar rejeição (deve cancelar processo)

### Relatórios
- [ ] Gerar relatório mensal financeiro (PDF)
- [ ] Gerar relatório de tarefas (PDF)
- [ ] Gerar relatório de tarefas (Excel)
- [ ] Gerar relatório de aprovações (PDF)
- [ ] Visualizar relatórios gerados
- [ ] Baixar relatórios

---

## 🎉 CONCLUSÃO

Este sistema de gestão condominial é uma solução completa e integrada para gerenciar todas as operações de um condomínio. Com módulos especializados, sistema de aprovações robusto, e interface intuitiva, o sistema oferece:

✅ **Controle Total**: Todas as operações em um único lugar  
✅ **Segurança**: Autenticação e autorização robustas  
✅ **Auditoria**: Todos os logs registrados  
✅ **Flexibilidade**: Múltiplos perfis e permissões  
✅ **Automação**: Tarefas agendadas e notificações  
✅ **Relatórios**: PDFs e Excel para análise  

**Próximos Passos:**
1. Teste todos os módulos usando o checklist acima
2. Configure usuários e permissões
3. Personalize dashboards
4. Configure alertas e notificações
5. Treine os usuários

**Boa sorte com o sistema! 🚀**

---

*Documento gerado automaticamente - Sistema de Gestão Condominial v1.0*
