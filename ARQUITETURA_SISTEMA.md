# 🏗️ ARQUITETURA DO SISTEMA
## Sistema de Gestão Condominial Profissional

---

## 📐 ESTRUTURA DO PROJETO

```
condominio/
├── src/
│   ├── app.js                    # Configuração Express
│   ├── server.js                 # Servidor principal
│   ├── config/
│   │   └── database.js           # Conexão PostgreSQL
│   ├── controllers/              # Controladores (lógica de requisições)
│   │   ├── authController.js
│   │   ├── sindicoController.js
│   │   ├── financeiroController.js
│   │   ├── administrativoController.js
│   │   ├── operacionalController.js
│   │   ├── inadimplenciaController.js
│   │   └── assemblyController.js
│   ├── services/                 # Lógica de negócio
│   │   ├── authService.js
│   │   ├── sindicoService.js
│   │   ├── financeiroService.js
│   │   ├── monthlyClosureService.js
│   │   ├── inadimplenciaService.js
│   │   ├── assemblyService.js
│   │   ├── reserveFundService.js
│   │   ├── reportService.js
│   │   └── notificationServiceEnhanced.js
│   ├── routes/                   # Rotas HTTP
│   │   ├── authRoutes.js
│   │   ├── sindicoRoutes.js
│   │   ├── financeiroRoutes.js
│   │   ├── administrativoRoutes.js
│   │   ├── operacionalRoutes.js
│   │   └── assemblyRoutes.js
│   ├── middlewares/              # Middlewares
│   │   ├── auth.js                # Autenticação JWT
│   │   ├── checkRole.js           # Verificação de roles
│   │   └── upload.js              # Upload de arquivos
│   ├── utils/                     # Utilitários
│   │   ├── logger.js              # Logs de auditoria
│   │   ├── validators.js          # Validações
│   │   └── queryHelper.js         # Helpers de query
│   └── database/                  # Scripts SQL
│       ├── init.js                # Inicialização
│       ├── init.sql               # Tabelas base
│       ├── extendTablesPhase*.sql # Extensões por fase
│       └── initPermissions.sql    # Permissões
├── views/                         # Templates EJS
│   ├── partials/                  # Partials reutilizáveis
│   ├── sindico/                   # Views do síndico
│   ├── administrativo/            # Views administrativas
│   │   ├── financeiro/            # Views financeiras
│   │   └── assembleias/           # Views de assembleias
│   └── operacional/               # Views operacionais
├── uploads/                       # Arquivos enviados
│   ├── receipts/                  # Comprovantes
│   ├── payments/                  # Pagamentos
│   ├── contracts/                 # Contratos
│   └── reports/                   # Relatórios PDF
└── public/                         # Arquivos estáticos
```

---

## 🔐 SISTEMA DE AUTENTICAÇÃO E AUTORIZAÇÃO

### Fluxo de Autenticação:
1. Usuário faz login em `/auth/login`
2. `authService.js` valida credenciais
3. Gera JWT token com roles do usuário
4. Token armazenado em cookie httpOnly
5. Middleware `auth.js` valida token em cada requisição
6. Middleware `checkRole.js` verifica permissões

### Roles e Permissões:
- **RBAC (Role-Based Access Control)**
- Cada role tem permissões específicas
- Permissões definidas em `initPermissions.sql`
- Validação em todas as rotas

---

## 💾 BANCO DE DADOS

### Estrutura:
- **PostgreSQL** como SGBD
- **Inicialização automática** via `init.js`
- **Migrations por fases** (Phase 1-24)
- **Soft delete** onde aplicável
- **Auditoria completa** via `audit_logs`

### Tabelas Principais:
- `condominiums` - Condomínios
- `users` - Usuários
- `roles` - Perfis
- `permissions` - Permissões
- `financial_entries` - Entradas
- `financial_exits` - Saídas
- `monthly_closures` - Fechamentos
- `apartments` - Apartamentos
- `monthly_fees` - Taxas
- `assemblies` - Assembleias
- `tasks` - Tarefas
- `occurrences` - Ocorrências
- `maintenances` - Manutenções
- `assets` - Patrimônio
- `audit_logs` - Logs de auditoria

---

## 🔄 FLUXOS PRINCIPAIS

### 1. Fluxo Financeiro Completo
```
FINANCEIRO cria entrada/saída
  ↓
Sistema valida e cria registro
  ↓
Se valor > limite: SINDICO aprova
Se valor <= limite: FINANCEIRO aprova
  ↓
FINANCEIRO marca como recebida/paga
  ↓
Sistema atualiza saldo automaticamente
  ↓
Fechamento mensal bloqueia edições
```

### 2. Fluxo de Ocorrência
```
OPERACIONAL cria ocorrência (com foto)
  ↓
Sistema cria tarefa automática para ADMINISTRATIVO
  ↓
ADMINISTRATIVO tria e cria orçamento
  ↓
FINANCEIRO revisa orçamento
  ↓
SINDICO aprova orçamento
  ↓
FINANCEIRO libera valor
  ↓
OPERACIONAL executa (com foto)
  ↓
FINANCEIRO lança despesa
  ↓
SINDICO aprova despesa
  ↓
FINANCEIRO marca como paga
  ↓
Sistema atualiza patrimônio
```

### 3. Fluxo de Assembleia
```
SINDICO/ADMIN cria assembleia
  ↓
Sistema gera avisos (7 dias antes)
  ↓
Na assembleia: registra participantes
  ↓
Registra decisões e votação
  ↓
Anexa ata assinada (PDF)
  ↓
Finaliza assembleia
  ↓
Sistema gera registro imutável
```

---

## 🎯 REGRAS DE NEGÓCIO IMPLEMENTADAS

### ✅ Regra 1: Quem Executa Não Decide
- OPERACIONAL executa, mas não aprova
- Implementado via permissões

### ✅ Regra 2: Quem Decide Não Executa
- SINDICO aprova, mas não marca checklist
- Implementado via permissões

### ✅ Regra 3: Imutabilidade
- Mês fechado: bloqueio automático
- Logs: nunca apagados
- Assembleias finalizadas: não editáveis

### ✅ Regra 4: Dupla Aprovação
- Até limite: FINANCEIRO
- Acima: SINDICO
- Implementado em `financeiroService.js`

### ✅ Regra 5: Evidência Obrigatória
- Fotos em tarefas/ocorrências
- PDFs em pagamentos/recebimentos
- Validação em middlewares

### ✅ Regra 6: SLA e Escalonamento
- Tarefas sem prazo: não permitidas
- Alertas automáticos
- Escalonamento para SINDICO

---

## 📊 DASHBOARDS POR PERFIL

### SINDICO
- Inadimplência
- Saldo atual
- Gastos do mês
- Alertas críticos
- Aprovações pendentes

### FINANCEIRO
- Saldo atual
- Entradas pendentes
- Saídas pendentes
- Gastos do mês
- Inadimplência
- Consumo mensal

### ADMINISTRATIVO
- Tarefas pendentes
- Ocorrências abertas
- Documentos vencendo
- Orçamentos pendentes

### OPERACIONAL
- Tarefas atribuídas
- Tarefas atrasadas
- Checklists do dia
- Ocorrências abertas

---

## 🔔 SISTEMA DE AVISOS

### Tipos de Avisos:
- `BILLET_GENERATED` - Boleto gerado
- `PAYMENT_OVERDUE` - Pagamento em atraso
- `ASSEMBLY_SCHEDULED` - Assembleia agendada
- `MAINTENANCE_DUE` - Manutenção programada

### Severidade:
- **INFO** - Informativo
- **WARNING** - Aviso (5-15 dias)
- **CRITICAL** - Crítico (30+ dias)

### Geração Automática:
- Verificação diária via jobs
- Alertas baseados em regras
- Notificações no dashboard

---

## 📄 RELATÓRIOS

### Tipos:
- **Mensal Financeiro** - Entradas, saídas, saldo
- **Operacional** - Tarefas, ocorrências
- **Assembleias** - Decisões, participantes
- **Inadimplência** - Taxas em aberto

### Geração:
- PDF via PDFKit
- Download automático
- Histórico de relatórios gerados

---

## 🛡️ SEGURANÇA

### Implementado:
- ✅ Autenticação JWT
- ✅ Validação de roles
- ✅ Validação de condomínio
- ✅ Logs de auditoria
- ✅ Soft delete
- ✅ Validação de dados
- ✅ Sanitização de inputs
- ✅ Upload seguro (validação de tipo)

---

## 🚀 DEPLOYMENT

### Requisitos:
- Node.js 16+
- PostgreSQL 12+
- NPM ou Yarn

### Variáveis de Ambiente:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=senha
DB_DATABASE=condominio_db
JWT_SECRET=chave_secreta_forte
PORT=3000
NODE_ENV=production
```

### Instalação:
```bash
npm install
npm start
```

---

## 📈 MÉTRICAS E KPIs

### Dashboard Síndico:
- Taxa de inadimplência
- Saldo financeiro
- Gastos do mês
- Variação mensal
- Alertas críticos

### Dashboard Financeiro:
- Fluxo de caixa
- Entradas vs Saídas
- Consumo mensal
- Inadimplência
- Fundo de reserva

---

**Sistema Completo e Profissional** 🏢✨
