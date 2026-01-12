# 📊 FLUXO VISUAL DO SISTEMA DE GESTÃO CONDOMINIAL

## 🎯 VISÃO GERAL DO SISTEMA

```mermaid
graph TB
    A[Usuário Acessa Sistema] --> B{Autenticado?}
    B -->|Não| C[Página de Login]
    B -->|Sim| D[Middleware Autenticação]
    D --> E[Verifica JWT Token]
    E --> F{Token Válido?}
    F -->|Não| C
    F -->|Sim| G[Carrega Roles do Usuário]
    G --> H[Middleware Autorização]
    H --> I[Navbar Dinâmica]
    I --> J[Módulos Disponíveis]
    J --> K[Dashboard/Ações]
```

---

## 🔐 FLUXO DE AUTENTICAÇÃO E AUTORIZAÇÃO

```mermaid
sequenceDiagram
    participant U as Usuário
    participant L as Login Page
    participant A as Auth Service
    participant DB as Database
    participant M as Middleware Auth
    participant N as Navbar
    participant C as Controller

    U->>L: Acessa /auth/login
    L->>U: Exibe formulário
    U->>A: Envia credenciais
    A->>DB: Valida usuário/senha
    DB-->>A: Dados do usuário
    A->>DB: Busca roles do usuário
    DB-->>A: Array de roles
    A->>U: Cookie JWT + Redirect
    U->>M: Requisição autenticada
    M->>DB: Valida token + busca roles
    DB-->>M: Roles atualizadas
    M->>C: req.user (com roles)
    C->>N: Renderiza view + user
    N->>N: Verifica roles dinamicamente
    N->>U: Navbar com menus permitidos
```

---

## 👥 FLUXO DE ROLES E PERMISSÕES

### Estrutura de Roles

```mermaid
graph TD
    A[Usuário] --> B[user_roles]
    B --> C1[SUPER_MASTER]
    B --> C2[SINDICO/SUBSINDICO]
    B --> C3[FINANCEIRO]
    B --> C4[PATRIMONIO]
    B --> C5[ADMINISTRATIVO]
    B --> C6[OPERACIONAL]
    B --> C7[LIMPEZA]
    B --> C8[CONSELHO]
    
    C1 --> D1[Master Routes]
    C2 --> D2[Síndico Routes]
    C3 --> D3[Financeiro Routes]
    C4 --> D4[Patrimônio Routes]
    C5 --> D5[Administrativo Routes]
    C6 --> D6[Operacional Routes]
    C7 --> D6
    C8 --> D7[Conselho Routes]
```

### Regra: Permissões Somam, Nunca Subtraem

```mermaid
graph LR
    A[Usuário tem múltiplas roles] --> B[Roles: ADMINISTRATIVO + FINANCEIRO]
    B --> C[Navbar mostra: Admin + Financeiro]
    B --> D[Rotas: Admin + Financeiro acessíveis]
    B --> E[Permissões: Soma de ambas]
```

---

## 🚪 FLUXO DE NAVEGAÇÃO (NAVBAR DINÂMICA)

```mermaid
flowchart TD
    A[Usuário Logado] --> B[req.user.roles]
    B --> C{Role SUPER_MASTER?}
    C -->|Sim| D1[Master Dashboard<br/>Condomínios<br/>Usuários]
    C -->|Não| E{Role SINDICO/SUBSINDICO?}
    E -->|Sim| D2[Síndico Dashboard<br/>Aprovações<br/>Alertas<br/>Logs]
    E -->|Não| F{Role FINANCEIRO?}
    F -->|Sim| D3[Financeiro Dashboard<br/>Entradas<br/>Saídas<br/>Contas<br/>Centros de Custo]
    F -->|Não| G{Role PATRIMONIO?}
    G -->|Sim| D4[Patrimônio Dashboard<br/>Ativos]
    G -->|Não| H{Role ADMINISTRATIVO?}
    H -->|Sim| D5[Admin Dashboard<br/>Tarefas<br/>Documentos]
    H -->|Não| I{Role OPERACIONAL?}
    I -->|Sim| D6[Operacional Dashboard<br/>Checklist<br/>Ocorrências]
    I -->|Não| J{Role LIMPEZA?}
    J -->|Sim| D7[Limpeza Dashboard<br/>Checklist]
    J -->|Não| K{Role CONSELHO?}
    K -->|Sim| D8[Conselho Dashboard]
    
    D1 --> L[Todos os menus aparecem]
    D2 --> L
    D3 --> L
    D4 --> L
    D5 --> L
    D6 --> L
    D7 --> L
    D8 --> L
```

**Regra:** Se usuário tem múltiplas roles, TODOS os menus aparecem simultaneamente.

---

## 📝 FLUXO DE CRIAÇÃO/EDIÇÃO DE USUÁRIO

```mermaid
sequenceDiagram
    participant SM as SUPER_MASTER
    participant MC as Master Controller
    participant MS as Master Service
    participant DB as Database
    participant U as Usuário Criado

    SM->>MC: Cria/Edita Usuário
    MC->>MS: Dados + Roles selecionadas
    MS->>DB: INSERT/UPDATE users
    DB-->>MS: Usuário criado/atualizado
    MS->>DB: DELETE user_roles (antigas)
    MS->>DB: INSERT user_roles (novas)
    DB-->>MS: Roles atualizadas
    MS-->>MC: Sucesso
    MC-->>SM: Redirect
    
    Note over U: Próximo login do usuário
    U->>DB: Login
    DB-->>U: Roles atualizadas
    U->>U: Navbar mostra novos menus automaticamente
```

---

## 🔄 FLUXO DE APROVAÇÃO DE DESPESAS

```mermaid
flowchart TD
    A[FINANCEIRO cria despesa] --> B[Status: Pendente]
    B --> C[Salva no banco]
    C --> D[Alerta gerado]
    D --> E[SINDICO recebe notificação]
    E --> F{SINDICO aprova?}
    F -->|Sim| G[Status: Aprovada]
    F -->|Não| H[Status: Rejeitada]
    G --> I[FINANCEIRO pode marcar como paga]
    H --> J[Fim do fluxo]
    I --> K[Status: Paga]
    K --> L[Despesa bloqueada para edição]
    
    style G fill:#90EE90
    style K fill:#90EE90
    style H fill:#FFB6C1
    style L fill:#FFD700
```

**Regras:**
- ❌ FINANCEIRO NÃO pode aprovar
- ✅ Apenas SINDICO/SUBSINDICO pode aprovar
- 🔒 Despesa aprovada/paga NÃO pode ser editada

---

## 🏢 FLUXO POR MÓDULO

### SUPER_MASTER

```mermaid
graph LR
    A[SUPER_MASTER] --> B[Criar Condomínios]
    A --> C[Criar Usuários]
    A --> D[Ver Logs]
    A --> E[NÃO tem acesso operacional]
    A --> F[NÃO interfere em operações diárias]
    
    style E fill:#FFB6C1
    style F fill:#FFB6C1
```

### SINDICO / SUBSINDICO

```mermaid
graph LR
    A[SINDICO/SUBSINDICO] --> B[Aprovar Despesas]
    A --> C[Aprovar Contratos]
    A --> D[Aprovar Manutenções Críticas]
    A --> E[Ver Alertas]
    A --> F[Ver Logs]
    A --> G[NÃO executa tarefas]
    A --> H[NÃO cria usuários comuns]
    
    style G fill:#FFB6C1
    style H fill:#FFB6C1
```

### FINANCEIRO

```mermaid
graph LR
    A[FINANCEIRO] --> B[Criar Despesas]
    A --> C[Criar Receitas]
    A --> D[Gerenciar Contas]
    A --> E[Gerenciar Centros de Custo]
    A --> F[NÃO aprova valores altos]
    A --> G[NÃO executa tarefas]
    
    B --> H[Status: Pendente]
        G[LIMPEZA<br/>Limpeza]
        H[CONSELHO<br/>Leitura]
    end
    
    A -->|Cria| B
    A -->|Cria| C
    A -->|Cria| D
    A -->|Cria| E
    A -->|Cria| F
    A -->|Cria| G
    A -->|Cria| H
    
    B -->|Aprova| D
    B -->|Aprova| E
    C -->|Cria tarefas para| F
    C -->|Cria tarefas para| G
    D -->|Cria despesas para| B
    E -->|Vincula manutenções| F
```

---

## 🔄 FLUXO COMPLETO: ADIÇÃO DE ROLE AO USUÁRIO

```mermaid
sequenceDiagram
    participant SM as SUPER_MASTER
    participant UI as Interface
    participant API as API/Controller
    participant DB as Database
    participant U as Usuário Afetado
    participant N as Navbar

    SM->>UI: Acessa edição de usuário
    UI->>SM: Formulário com roles
    SM->>UI: Seleciona nova role (ex: FINANCEIRO)
    UI->>API: POST /master/usuarios/:id
    API->>DB: UPDATE user_roles
    DB-->>API: Roles atualizadas
    API-->>SM: Sucesso
    
    Note over U: Usuário faz logout/login
    U->>API: Login
    API->>DB: Busca roles
    DB-->>API: Roles incluem FINANCEIRO
    API->>U: Cookie JWT com roles atualizadas
    U->>N: Renderiza página
    N->>N: Verifica user.roles.includes('FINANCEIRO')
    N->>U: Navbar mostra menus Financeiro
    
    Note over U: Automaticamente funcionando!
```

---

## 📋 RESUMO DAS REGRAS DO SISTEMA

### ✅ Regras Fundamentais

1. **Não existe cargo fixo** → Usuário possui conjunto de permissões (roles)
2. **Permissões somam, nunca subtraem** → Múltiplas roles = soma de permissões
3. **Views não definem acesso** → Apenas refletem permissões (middleware controla)
    H --> I[SINDICO aprova]
    
    style F fill:#FFB6C1
    style G fill:#FFB6C1
```

### ADMINISTRATIVO

```mermaid
graph LR
    A[ADMINISTRATIVO] --> B[Criar Tarefas]
    A --> C[Gerenciar Documentos]
    A --> D[Criar Ocorrências]
    A --> E[Definir SLA]
    A --> F[NÃO executa checklists]
    A --> G[NÃO tem acesso financeiro direto]
    A --> H[NÃO tem acesso patrimonial direto]
    
    style F fill:#FFB6C1
    style G fill:#FFB6C1
    style H fill:#FFB6C1
```

### OPERACIONAL

```mermaid
graph LR
    A[OPERACIONAL] --> B[Executar Checklists]
    A --> C[Criar Ocorrências]
    A --> D[Registrar Justificativas]
    A --> E[Enviar Fotos]
    A --> F[NÃO vê dados financeiros]
    A --> G[NÃO aprova nada]
    
    style F fill:#FFB6C1
    style G fill:#FFB6C1
```

### LIMPEZA

```mermaid
graph LR
    A[LIMPEZA] --> B[Executar Checklists Limpeza]
    A --> C[Enviar Fotos]
    A --> D[Justificar Não Execução]
    A --> E[NÃO cria ocorrências]
    A --> F[NÃO vê financeiro]
    A --> G[NÃO vê patrimônio]
    
    style E fill:#FFB6C1
    style F fill:#FFB6C1
    style G fill:#FFB6C1
```

### PATRIMONIO

```mermaid
graph LR
    A[PATRIMONIO] --> B[Cadastrar Ativos]
    A --> C[Atualizar Status]
    A --> D[Vincular Manutenções]
    A --> E[Anexar Notas Fiscais]
    A --> F[NÃO cria despesas]
    A --> G[NÃO aprova compras]
    
    style F fill:#FFB6C1
    style G fill:#FFB6C1
```

### CONSELHO

```mermaid
graph LR
    A[CONSELHO] --> B[Visualizar Tudo]
    A --> C[Ver Relatórios]
    A --> D[Ver Logs]
    A --> E[NÃO cria]
    A --> F[NÃO edita]
    A --> G[NÃO aprova]
    
    style E fill:#FFB6C1
    style F fill:#FFB6C1
    style G fill:#FFB6C1
```

---

## 🔒 FLUXO DE MIDDLEWARE DE AUTORIZAÇÃO

```mermaid
flowchart TD
    A[Requisição HTTP] --> B[Middleware: authenticate]
    B --> C{Token JWT válido?}
    C -->|Não| D[Redirect /auth/login]
    C -->|Sim| E[Carrega req.user.roles]
    E --> F[Middleware: authorize]
    F --> G{User tem role necessária?}
    G -->|Não| H[403 Forbidden]
    G -->|Sim| I[Controller executa]
    I --> J[View renderizada]
    J --> K[Navbar verifica roles]
    K --> L[HTML com menus corretos]
    
    style D fill:#FFB6C1
    style H fill:#FFB6C1
    style L fill:#90EE90
```

---

## 🎨 FLUXO DE RENDERIZAÇÃO DA NAVBAR

```mermaid
flowchart TD
    A[Controller renderiza view] --> B[Passa user: req.user]
    B --> C[View inclui navbar partial]
    C --> D[Navbar recebe user.roles]
    D --> E{Verifica roles.includes}
    E --> F1[SUPER_MASTER? → Mostra Master]
    E --> F2[SINDICO? → Mostra Síndico]
    E --> F3[FINANCEIRO? → Mostra Financeiro]
    E --> F4[PATRIMONIO? → Mostra Patrimônio]
    E --> F5[ADMINISTRATIVO? → Mostra Admin]
    E --> F6[OPERACIONAL? → Mostra Operacional]
    E --> F7[LIMPEZA? → Mostra Limpeza]
    E --> F8[CONSELHO? → Mostra Conselho]
    
    F1 --> G[HTML Final]
    F2 --> G
    F3 --> G
    F4 --> G
    F5 --> G
    F6 --> G
    F7 --> G
    F8 --> G
    G --> H[Navegador exibe navbar]
    
    style G fill:#90EE90
```

**Regra:** Se usuário tem múltiplas roles, TODOS os blocos correspondentes são renderizados.

---

## 📊 DIAGRAMA DE HIERARQUIA DE PERMISSÕES

```mermaid
graph TB
    subgraph "Níveis de Acesso"
        A[SUPER_MASTER<br/>Sistema]
        B[SINDICO/SUBSINDICO<br/>Aprovações]
        C[ADMINISTRATIVO<br/>Organização]
        D[FINANCEIRO<br/>Financeiro]
        E[PATRIMONIO<br/>Patrimonial]
        F[OPERACIONAL<br/>Execução]
4. **Quem executa não aprova** → Separação de responsabilidades
5. **Quem aprova não executa** → Separação de responsabilidades
6. **Tudo é auditável** → Logs de todas as ações
7. **Navbar dinâmica** → Aparece automaticamente conforme roles

### 🔒 Restrições Principais

- SUPER_MASTER: Não interfere em operações diárias
- FINANCEIRO: Cria despesas, mas SINDICO aprova
- ADMINISTRATIVO: Não executa, não tem acesso financeiro/patrimonial direto
- OPERACIONAL: Não vê financeiro, não aprova
- LIMPEZA: Não cria ocorrências, não vê financeiro/patrimônio
- PATRIMONIO: Não cria despesas, não aprova compras
- CONSELHO: Apenas leitura

---

## 🎯 CONCLUSÃO

O sistema funciona de forma **dinâmica e automática**:

1. ✅ Roles são verificadas em tempo real (a cada requisição)
2. ✅ Navbar se adapta automaticamente às roles do usuário
3. ✅ Rotas são protegidas por middleware
4. ✅ Permissões são cumulativas (múltiplas roles)
5. ✅ Tudo é auditado (logs)

**Quando uma role é adicionada ao usuário:**
- ✅ Rotas ficam acessíveis automaticamente
- ✅ Navbar mostra os menus automaticamente
- ✅ Não precisa alterar código
