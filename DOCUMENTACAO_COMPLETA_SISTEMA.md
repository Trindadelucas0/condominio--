# 📘 DOCUMENTAÇÃO COMPLETA DO SISTEMA DE GESTÃO CONDOMINIAL

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Regras Fundamentais do Sistema](#regras-fundamentais-do-sistema)
3. [Módulos e Responsabilidades](#módulos-e-responsabilidades)
4. [Permissões e Restrições](#permissões-e-restrições)
5. [Como Funciona a Atribuição de Permissões](#como-funciona-a-atribuição-de-permissões)
6. [Fluxos Principais](#fluxos-principais)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Perguntas Frequentes](#perguntas-frequentes)

---

## 🎯 VISÃO GERAL

O sistema de gestão condominial é uma plataforma completa para gerenciar todas as operações de um condomínio, desde questões financeiras até operacionais e administrativas.

### Características Principais

- ✅ **Sistema Baseado em Permissões (Roles)**: Cada usuário pode ter uma ou múltiplas permissões
- ✅ **Separação de Responsabilidades**: Quem executa não aprova, quem aprova não executa
- ✅ **Auditoria Completa**: Todas as ações são registradas em logs
- ✅ **Interface Dinâmica**: O menu aparece automaticamente conforme as permissões do usuário
- ✅ **Flexível**: Usuários podem ter múltiplas funções simultaneamente

---

## 🔐 REGRAS FUNDAMENTAIS DO SISTEMA

### 1. **Não Existe Cargo Fixo**

O sistema **NÃO** trabalha com cargos fixos. Ao invés disso, funciona com um **conjunto de permissões** (roles) que podem ser atribuídas a qualquer usuário.

**Exemplo:**
- Um usuário pode ser "João Silva" com permissões de: FINANCEIRO + ADMINISTRATIVO
- Outro usuário pode ser "Maria Santos" com apenas: OPERACIONAL
- Um terceiro pode ser "Pedro Costa" com: SINDICO + FINANCEIRO

### 2. **Permissões Somam, Nunca Subtraem**

Quando um usuário possui múltiplas permissões, ele tem acesso a **TODAS** as funcionalidades de cada permissão.

**Exemplo:**
- Usuário com FINANCEIRO + ADMINISTRATIVO:
  - ✅ Pode acessar módulo Financeiro (criar despesas, receitas, etc.)
  - ✅ Pode acessar módulo Administrativo (criar tarefas, documentos, etc.)
  - ✅ Vê ambos os menus na barra de navegação

### 3. **Interface Reflete Permissões, Não Define Acesso**

A barra de navegação (navbar) mostra apenas os menus que o usuário **já tem permissão** para acessar. O acesso real é controlado pelos middlewares de segurança.

**Como funciona:**
- Se um usuário tem a permissão FINANCEIRO, o menu Financeiro aparece automaticamente
- Se a permissão é removida, o menu desaparece na próxima visualização
- **Não precisa alterar código** - tudo é automático

### 4. **Quem Executa Não Aprova, Quem Aprova Não Executa**

Separação clara de responsabilidades:

- **OPERACIONAL/LIMPEZA**: Executa tarefas e checklists, mas **NÃO aprova** nada
- **FINANCEIRO**: Cria despesas, mas **NÃO aprova** valores altos
- **SINDICO/SUBSINDICO**: Aprova despesas, mas **NÃO executa** tarefas operacionais

### 5. **Tudo Deve Ser Auditável**

Todas as ações importantes no sistema são registradas em logs de auditoria, incluindo:
- Quem fez a ação
- Quando foi feita
- O que foi alterado (antes e depois)
- Endereço IP e navegador usado

---

## 👥 MÓDULOS E RESPONSABILIDADES

### 🟦 SUPER_MASTER (Administrador do Sistema)

**O que faz:**
- Gerencia o sistema como um todo
- Cria condomínios no sistema
- Cria e gerencia usuários
- Visualiza logs gerais do sistema

**O que NÃO faz:**
- ❌ Não interfere nas operações diárias de nenhum condomínio
- ❌ Não cria despesas
- ❌ Não executa tarefas
- ❌ Não aprova nada
- ❌ Não tem acesso operacional

**Princípio:** "Quem governa o sistema não governa o condomínio"

---

### 🟩 SINDICO / SUBSINDICO (Gestão Executiva)

**O que faz:**
- ✅ **Aprova despesas** acima do limite definido
- ✅ **Aprova contratos** e manutenções críticas
- ✅ Visualiza dashboards executivos
- ✅ Visualiza alertas e notificações importantes
- ✅ Acessa logs de auditoria do condomínio
- ✅ Visualiza relatórios financeiros e operacionais

**O que NÃO faz:**
- ❌ Não executa tarefas operacionais
- ❌ Não preenche checklists
- ❌ Não lança contas financeiras
- ❌ Não cria usuários comuns (apenas SUPER_MASTER)
- ❌ Não executa manutenções

**Princípio:** "Decide e aprova, mas não executa"

---

### 🟨 FINANCEIRO (Gestão Financeira)

**O que faz:**
- ✅ **Cria despesas** (gastos do condomínio)
- ✅ **Cria receitas** (entradas de dinheiro)
- ✅ Gerencia contas (água, luz, gás)
- ✅ Gerencia centros de custo
- ✅ Marca entradas como recebidas
- ✅ Marca saídas como pagas (apenas se aprovadas)
- ✅ Gera relatórios financeiros

**O que NÃO faz:**
- ❌ **NÃO aprova valores altos** (apenas SINDICO/SUBSINDICO aprova)
- ❌ Não executa tarefas operacionais
- ❌ Não altera dados patrimoniais
- ❌ Não fecha ocorrências
- ❌ Não aprova compras

**Fluxo de Despesas:**
1. FINANCEIRO cria despesa → Status: **Pendente**
2. SINDICO/SUBSINDICO aprova → Status: **Aprovada**
3. FINANCEIRO marca como paga → Status: **Paga**
4. Despesa **bloqueada** para edição (imutável)

---

### 🟧 PATRIMONIO (Controle Patrimonial)

**O que faz:**
- ✅ Cadastra ativos (equipamentos, elevadores, bombas, etc.)
- ✅ Atualiza status dos ativos
- ✅ Vincula manutenções aos ativos
- ✅ Anexa notas fiscais
- ✅ Monitora vida útil e depreciação
- ✅ Gerencia histórico de manutenções

**O que NÃO faz:**
- ❌ Não cria despesas financeiras
- ❌ Não aprova compras
- ❌ Não altera dados financeiros
- ❌ Não executa manutenções (apenas registra)

**Princípio:** "Registra e controla, mas não cria despesas"

---

### 🟪 ADMINISTRATIVO (Gestão Administrativa)

**O que faz:**
- ✅ **Cria tarefas** para equipe operacional
- ✅ Define prazos (SLA) para tarefas
- ✅ Atribui responsáveis às tarefas
- ✅ Gerencia documentos (contratos, certidões, etc.)
- ✅ Cria ocorrências administrativas
- ✅ Cria categorias de documentos
- ✅ Configura alertas de vencimento
- ✅ Executa automações do sistema

**O que NÃO faz:**
- ❌ Não executa checklists operacionais
- ❌ Não tem acesso direto ao módulo financeiro
- ❌ Não tem acesso direto ao módulo patrimonial
- ❌ Não aprova valores altos
- ❌ Não altera dados financeiros fechados
- ❌ Não mexe em logs

**Princípio:** "Organiza e coordena, mas não executa operações"

---

### 🟥 OPERACIONAL (Zeladoria)

**O que faz:**
- ✅ **Executa checklists** diários
- ✅ Marca tarefas como feitas/não feitas
- ✅ Registra justificativas quando não faz
- ✅ Envia fotos como evidência
- ✅ **Cria ocorrências** operacionais
- ✅ Registra leituras de consumo (água, luz, etc.)
- ✅ Visualiza suas tarefas atribuídas

**O que NÃO faz:**
- ❌ **NÃO aprova nada**
- ❌ Não vê dados financeiros
- ❌ Não edita valores
- ❌ Não cria tarefas globais
- ❌ Não acessa módulo financeiro (bloqueado)

**Princípio:** "Executa e registra, mas não aprova"

---

### 🟫 LIMPEZA (Subset Operacional)

**O que faz:**
- ✅ Executa checklists de limpeza
- ✅ Envia fotos
- ✅ Justifica não execução

**O que NÃO faz:**
- ❌ **NÃO cria ocorrências** (apenas OPERACIONAL cria)
- ❌ Não vê dados financeiros
- ❌ Não vê dados patrimoniais
- ❌ Não aprova nada

**Princípio:** "Subset do OPERACIONAL com menos permissões"

---

### ⬛ CONSELHO / AUDITOR (Leitura Apenas)

**O que faz:**
- ✅ Visualiza tudo (somente leitura)
- ✅ Visualiza relatórios
- ✅ Visualiza logs de auditoria
- ✅ Visualiza dados financeiros (read-only)
- ✅ Visualiza dados operacionais (read-only)

**O que NÃO faz:**
- ❌ **NÃO cria nada**
- ❌ **NÃO edita nada**
- ❌ **NÃO aprova nada**

**Princípio:** "Apenas visualiza para auditoria e transparência"

---

## 🔒 PERMISSÕES E RESTRIÇÕES DETALHADAS

### Tabela Comparativa de Permissões

| Ação | SUPER_MASTER | SINDICO | FINANCEIRO | PATRIMONIO | ADMINISTRATIVO | OPERACIONAL | LIMPEZA | CONSELHO |
|------|--------------|---------|------------|------------|----------------|-------------|---------|----------|
| **Criar Condomínios** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Criar Usuários** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Aprovar Despesas** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Criar Despesas** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Criar Receitas** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Cadastrar Ativos** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Criar Tarefas** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Executar Checklists** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Criar Ocorrências** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Visualizar Financeiro** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ (read-only) |
| **Visualizar Patrimônio** | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ (read-only) |
| **Visualizar Logs** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🔄 COMO FUNCIONA A ATRIBUIÇÃO DE PERMISSÕES

### Processo de Criação/Edição de Usuário

1. **SUPER_MASTER acessa**: `/master/usuarios`
2. **Seleciona permissões**: Marca as permissões desejadas (pode selecionar múltiplas)
3. **Salva**: Sistema atualiza as permissões no banco de dados
4. **Automático**: Na próxima vez que o usuário fizer login:
   - ✅ Rotas ficam acessíveis automaticamente
   - ✅ Menu aparece automaticamente na barra de navegação
   - ✅ Permissões são verificadas em tempo real

### Exemplo Prático

**Cenário:** Maria trabalha como secretária e precisa acessar tarefas administrativas E finanças.

**Solução:**
1. SUPER_MASTER edita usuário "Maria"
2. Marca as permissões: ✅ ADMINISTRATIVO + ✅ FINANCEIRO
3. Salva

**Resultado:**
- Maria faz login
- Vê na barra de navegação:
  - Menu "Admin - Dashboard", "Tarefas", "Documentos"
  - Menu "Financeiro - Dashboard", "Entradas", "Saídas", "Contas", "Centros de Custo"
- Pode acessar todos os módulos conforme suas permissões

### Múltiplas Permissões

Um usuário pode ter quantas permissões forem necessárias:

- **Exemplo 1:** João = OPERACIONAL + LIMPEZA → Acesso completo operacional
- **Exemplo 2:** Ana = ADMINISTRATIVO + FINANCEIRO → Acesso administrativo e financeiro
- **Exemplo 3:** Carlos = SINDICO + FINANCEIRO → Pode aprovar E criar despesas (cuidado com separação de responsabilidades!)

---

## 🔄 FLUXOS PRINCIPAIS

### 1. Fluxo de Aprovação de Despesa

```
┌─────────────┐
│  FINANCEIRO │
│   Cria      │
│  Despesa    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Status: PENDENTE│
└──────┬──────────┘
       │
       ▼
┌──────────────┐
│  SISTEMA     │
│  Gera Alerta │
└──────┬───────┘
       │
       ▼
┌─────────────┐
│  SINDICO    │
│  Recebe     │
│  Notificação│
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│  SINDICO    │────▶│ Status:      │
│  Aprova?    │     │ APROVADA     │
└──────┬──────┘     └──────┬───────┘
       │                    │
       │ Não                │ Sim
       ▼                    ▼
┌──────────────┐     ┌─────────────┐
│ Status:      │     │ FINANCEIRO  │
│ REJEITADA    │     │ Marca como  │
└──────────────┘     │ PAGA        │
                     └──────┬──────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ Status: PAGA │
                     │ (BLOQUEADA   │
                     │  para edição)│
                     └──────────────┘
```

**Regras:**
- ❌ FINANCEIRO NÃO pode aprovar (apenas criar)
- ✅ Apenas SINDICO/SUBSINDICO pode aprovar
- 🔒 Despesa aprovada/paga NÃO pode ser editada
- 📝 Tudo é registrado em logs

### 2. Fluxo de Criação de Tarefa

```
┌─────────────────┐
│ ADMINISTRATIVO  │
│ Cria Tarefa     │
│ Define:         │
│ - Prazo (SLA)   │
│ - Responsável   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Tarefa criada   │
│ Status: PENDENTE│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ OPERACIONAL     │
│ Recebe tarefa   │
│ em seu checklist│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ OPERACIONAL     │
│ Executa/        │
│ Marca como      │
│ feito/não feito │
└─────────────────┘
```

**Regras:**
- ✅ ADMINISTRATIVO cria, OPERACIONAL executa
- ✅ ADMINISTRATIVO NÃO executa checklists
- ✅ OPERACIONAL NÃO cria tarefas globais
- 📝 Tudo é registrado em logs

### 3. Fluxo de Cadastro de Ativo

```
┌──────────────┐
│  PATRIMONIO  │
│  Cadastra    │
│  Ativo       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Ativo        │
│ Registrado   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ PATRIMONIO   │
│ Vincula      │
│ Manutenções  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Sistema      │
│ Calcula      │
│ Depreciação  │
└──────────────┘
```

**Regras:**
- ✅ PATRIMONIO registra ativos
- ✅ PATRIMONIO vincula manutenções
- ❌ PATRIMONIO NÃO cria despesas (despesa é criada pelo FINANCEIRO)
- 📝 Histórico de depreciação é imutável

---

## 💡 EXEMPLOS PRÁTICOS

### Exemplo 1: Funcionário Multifunção

**Cenário:** José trabalha meio período como zelador (OPERACIONAL) e meio período na limpeza (LIMPEZA).

**Solução:**
- SUPER_MASTER atribui: OPERACIONAL + LIMPEZA
- José vê: Menu Operacional completo
- Pode: Executar checklists de zeladoria E limpeza
- Pode: Criar ocorrências (porque tem OPERACIONAL)
- Não vê: Dados financeiros

### Exemplo 2: Secretária Financeira

**Cenário:** Ana é secretária e precisa criar tarefas administrativas E lançar contas financeiras.

**Solução:**
- SUPER_MASTER atribui: ADMINISTRATIVO + FINANCEIRO
- Ana vê: Menu Admin (Tarefas, Documentos) + Menu Financeiro (Entradas, Saídas, Contas)
- Pode: Criar tarefas, documentos, despesas, receitas
- Não pode: Aprovar despesas altas (precisa do SINDICO)
- Não pode: Executar checklists operacionais

### Exemplo 3: Síndico que também Cuida das Finanças

**Cenário:** Pedro é síndico e também cuida pessoalmente das finanças.

**Solução:**
- SUPER_MASTER atribui: SINDICO + FINANCEIRO
- Pedro vê: Menu Síndico (Aprovações, Alertas) + Menu Financeiro (Entradas, Saídas)
- Pode: Criar despesas E aprovar despesas (mesma pessoa)
- ⚠️ **Atenção:** Isso quebra a separação de responsabilidades! Recomenda-se evitar.

**Recomendação:** Manter SINDICO apenas para aprovação, e FINANCEIRO para criação de despesas.

### Exemplo 4: Conselheiro Fiscal

**Cenário:** Carlos é conselheiro e precisa ver tudo, mas não pode alterar nada.

**Solução:**
- SUPER_MASTER atribui: CONSELHO
- Carlos vê: Dashboard do conselho
- Pode: Visualizar relatórios, logs, dados financeiros
- Não pode: Criar, editar ou aprovar nada
- Propósito: Transparência e auditoria

---

## ❓ PERGUNTAS FREQUENTES

### 1. Posso dar múltiplas permissões para um usuário?

**Sim!** O sistema foi projetado para permitir múltiplas permissões. Quando um usuário tem várias permissões, ele tem acesso a todas as funcionalidades correspondentes.

### 2. O que acontece quando adiciono uma permissão a um usuário?

Automaticamente:
- ✅ As rotas ficam acessíveis (na próxima requisição)
- ✅ O menu aparece na barra de navegação (na próxima visualização)
- ✅ Não precisa alterar código ou fazer deploy

### 3. E se remover uma permissão?

O usuário perde acesso imediatamente:
- ❌ Rotas ficam bloqueadas
- ❌ Menu desaparece da navbar
- ✅ Logs de auditoria são mantidos (histórico preservado)

### 4. Um usuário pode aprovar e criar despesas ao mesmo tempo?

Tecnicamente **SIM** (se tiver SINDICO + FINANCEIRO), mas **NÃO É RECOMENDADO** porque:
- ❌ Quebra a separação de responsabilidades
- ❌ Remove o controle interno
- ❌ Dificulta auditoria

**Recomendação:** Manter separado (FINANCEIRO cria, SINDICO aprova)

### 5. OPERACIONAL pode ver dados financeiros?

**NÃO!** OPERACIONAL tem acesso financeiro bloqueado no middleware. Mesmo que tente acessar diretamente a URL, será bloqueado.

### 6. LIMPEZA pode criar ocorrências?

**NÃO!** LIMPEZA é um subset do OPERACIONAL com menos permissões. Apenas OPERACIONAL pode criar ocorrências.

### 7. ADMINISTRATIVO tem acesso a Financeiro e Patrimônio?

**NÃO!** Esses módulos foram separados. ADMINISTRATIVO tem acesso apenas a:
- ✅ Tarefas
- ✅ Documentos

Para acessar Financeiro ou Patrimônio, o usuário precisa ter as permissões específicas (FINANCEIRO ou PATRIMONIO).

### 8. Como funciona a auditoria?

Todas as ações importantes são registradas automaticamente:
- ✅ Quem fez (usuário)
- ✅ Quando foi feito (data/hora)
- ✅ O que foi alterado (antes/depois em JSON)
- ✅ Endereço IP e navegador
- ✅ Logs são **imutáveis** (não podem ser apagados)

### 9. SUPER_MASTER pode interferir nas operações do condomínio?

**NÃO!** SUPER_MASTER gerencia o sistema (cria condomínios e usuários), mas não tem acesso a:
- ❌ Operações financeiras
- ❌ Tarefas operacionais
- ❌ Aprovações
- ❌ Automações operacionais

### 10. O sistema permite que um usuário tenha todas as permissões?

Tecnicamente **SIM**, mas **NÃO É RECOMENDADO** por questões de:
- 🔒 Segurança
- 📋 Separação de responsabilidades
- 🔍 Auditoria
- 🛡️ Controle interno

---

## 📊 RESUMO EXECUTIVO

### Princípios do Sistema

1. ✅ **Flexibilidade**: Usuários podem ter múltiplas permissões
2. ✅ **Separação de Responsabilidades**: Quem executa não aprova, quem aprova não executa
3. ✅ **Automação**: Menus e acessos aparecem automaticamente
4. ✅ **Auditoria**: Tudo é registrado e imutável
5. ✅ **Segurança**: Acesso controlado em múltiplas camadas (rotas + navbar + middleware)

### Vantagens

- 🎯 **Adaptável**: Fácil de ajustar permissões conforme necessidade
- 🔒 **Seguro**: Múltiplas camadas de segurança
- 📝 **Rastreável**: Tudo é auditado
- 🚀 **Automático**: Não precisa alterar código ao adicionar permissões
- 👥 **Flexível**: Um usuário pode ter múltiplas funções

### Recomendações de Uso

1. ⚠️ Evite dar SINDICO + FINANCEIRO ao mesmo usuário (quebra separação)
2. ✅ Use múltiplas permissões para funcionários multifunção
3. ✅ Mantenha CONSELHO separado (apenas leitura)
4. ✅ Use LIMPEZA para funcionários que só fazem limpeza
5. ✅ Mantenha SUPER_MASTER apenas para administradores do sistema

---

## 📞 CONTATO PARA DÚVIDAS

Esta documentação descreve como o sistema **ESTÁ IMPLEMENTADO**. 

Se alguma regra ou comportamento não estiver de acordo com o esperado, por favor, informe para que possamos ajustar.

---

**Versão do Documento:** 1.0  
**Data:** 2024  
**Sistema:** Gestão Condominial
