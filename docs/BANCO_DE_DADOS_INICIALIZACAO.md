# Banco de dados: salvamento e inicialização

## 1. Os dados estão sendo salvos nas tabelas certas?

**Sim.** O código persiste nas tabelas corretas. Exemplos:

| Onde salva | Tabela | Arquivo / trecho |
|------------|--------|-------------------|
| Nova entrada financeira | `financial_entries` | `financeiroService.js` – INSERT em `financial_entries` |
| Nova saída financeira | `financial_exits` | `financeiroService.js` – INSERT em `financial_exits` |
| Aprovação (saída) | `approvals` | `financeiroService.js` – INSERT em `approvals` |
| Condomínio (master) | `condominiums` | `masterServiceEnhanced.js` – INSERT em `condominiums` |
| Usuário (master / init) | `users` | `init.js`, `createMasterUser.js`, `masterServiceEnhanced.js` – INSERT em `users` |
| Centro de custo | `cost_centers` | `financeiroService.js` – INSERT em `cost_centers` |
| Conta (água, luz, etc.) | `bills` | `financeiroService.js` – INSERT em `bills` |
| Consumo mensal | `monthly_consumption` | `financeiroService.js` – INSERT em `monthly_consumption` |

As tabelas `financial_entries` e `financial_exits` são criadas nos scripts do banco (`extendTables.sql` e `extendTablesPhase8.sql`) e os services usam exatamente esses nomes nas queries.

---

## 2. As tabelas inicializam sozinhas quando o servidor liga?

**Sim.** Na subida do servidor acontece o seguinte:

### Ordem no `server.js`

1. **`initializeDatabase()`** (`src/database/init.js`)
   - Verifica se as tabelas existem (por exemplo, `condominiums`, `roles`, `tasks`, `financial_exits`, etc.).
   - Se **não** existirem, executa os arquivos SQL na ordem correta:
     - **init.sql** – tabelas base: `condominiums`, `roles`, `users`, `user_roles`, `audit_logs`
     - **initRoles.sql** – perfis (SUPER_MASTER, SINDICO, FINANCEIRO, etc.)
     - **extendTablesPhase6.sql** – operacional (ex.: `tasks`)
     - **extendTablesPhase7.sql** – administrativo (ex.: `documents`)
     - **extendTables.sql** + **extendTablesPhase8.sql** – financeiro (`financial_exits`, `financial_entries`, `cost_centers`, `bills`, etc.)
     - E as demais fases (9 a 34) para patrimônio, notificações, orçamentos, checklists, consumo, permissões, state machines, etc.
   - No final, cria o usuário master inicial (`admin` / `admin123`) se ainda não existir.

2. **`ensureCorrectionsApplied()`** (`src/database/applyCorrections.js`)
   - Garante colunas e dados de “correção” (ex.: `deleted_at` em `financial_entries`, comprovante em `financial_exits`, state machines, permissões).
   - Roda correções idempotentes em todo startup (ex.: colunas de comprovante, permissão `occurrences:resolve`).

3. **Só depois** o servidor HTTP sobe (`app.listen(PORT)`).

### Se der erro

- Se **inicialização do banco** ou **aplicação de correções** falhar, o processo encerra com `process.exit(1)` e o servidor **não** sobe.
- Assim, ao ver o servidor rodando, as tabelas base e correções já foram aplicadas (ou já estavam aplicadas).

### Resumo

| Pergunta | Resposta |
|----------|----------|
| Dados salvos nas tabelas certas? | Sim (ex.: `financial_entries`, `financial_exits`, `condominiums`, `users`, etc.). |
| Tabelas criadas sozinhas ao ligar o servidor? | Sim, via `initializeDatabase()` em `server.js`. |
| Correções (colunas, permissões) aplicadas ao ligar? | Sim, via `ensureCorrectionsApplied()` em `server.js`. |
| Servidor sobe se o banco falhar? | Não; o processo termina com código 1. |

---

## 3. Onde está a lógica no código

- **Início do servidor:** `src/server.js` (chama `initializeDatabase` e `ensureCorrectionsApplied`).
- **Criação das tabelas:** `src/database/init.js` (ordem das fases) + arquivos em `src/database/*.sql`.
- **Correções no startup:** `src/database/applyCorrections.js` (`ensureCorrectionsApplied`).

Para conferir no deploy: ao subir o servidor, os logs devem mostrar as mensagens de “Inicializando banco de dados…”, “Verificando tabelas…”, “Correções…” e, ao final, “Servidor rodando em…”.

---

## 4. Vários condomínios ao mesmo tempo (multi-tenant)

**Sim.** O sistema foi feito para administrar **vários condomínios ao mesmo tempo**, no **mesmo banco e na mesma aplicação**, **sem conflito** entre eles.

### Como funciona

- **Um banco, uma instalação:** Todas as tabelas ficam no mesmo PostgreSQL. Cada tabela que guarda dados “por condomínio” tem a coluna **`condominium_id`**.
- **Isolamento por condomínio:** Em todas as operações (listar, criar, editar, excluir), o código usa o **`condominium_id`** do usuário logado (`req.user.condominiumId`). As queries incluem `WHERE condominium_id = $1` (ou equivalente), então cada condomínio só enxerga e altera **seus próprios** dados.
- **Um condomínio por usuário (operacional):** Cada usuário (síndico, financeiro, operacional, etc.) está vinculado a **um único condomínio** na tabela `users` (coluna `condominium_id`). No login, o sistema carrega esse condomínio e ele define todo o escopo do que o usuário vê e pode alterar.
- **SUPER_MASTER:** O perfil master não tem condomínio fixo (`condominium_id` NULL). Ele acessa o painel master (estatísticas gerais, lista de condomínios, criação de condomínios e usuários). As rotas normais de síndico/financeiro/etc. exigem condomínio; por isso o master não usa as mesmas telas “por condomínio” que os outros usuários.

### Resumo

| Pergunta | Resposta |
|----------|----------|
| Dá para administrar vários condomínios ao mesmo tempo? | **Sim.** |
| Os dados de um condomínio misturam com os de outro? | **Não.** O isolamento é por `condominium_id` em todas as queries dos services. |
| Um mesmo usuário pode ser síndico de dois condomínios? | Na estrutura atual, **não**: cada usuário tem um único `condominium_id`. Para atuar em outro condomínio, seria preciso outro usuário ou evoluir o sistema (ex.: tabela user_condominiums). |
| O que garantir na manutenção? | Em qualquer nova funcionalidade que leia ou escreva dados “por condomínio”, sempre passar e usar `condominiumId` (e, quando for o caso, `validateCondominiumOwnership` ou `validateUserBelongsToCondominium`) para não vazar dados entre condomínios. |
