# Gestão Condominial — Documentação do Sistema

| Item | Valor |
|------|--------|
| Versão do sistema | 1.1.0 — Excluir cópias duplicadas |
| Última atualização | 08/10/2026 (exclusão de cópias em Despesas; filtro mês/ano) |
| Fonte oficial | Este arquivo |

## 1. Como usar este documento

Fonte única de comportamento. Antes de alterar código: localizar tela → regra → path abaixo. Não inventar rota, permissão ou regra que não esteja no código.

## 2. Tecnologias utilizadas

| Camada | Tecnologia | Função |
|--------|------------|--------|
| Servidor | Express + EJS | Telas e rotas HTTP |
| Banco | PostgreSQL (`pg`) | Dados do condomínio |
| Auth | JWT + papéis | `authenticate` + `authorize` |

### 2.1 Histórico de versões

| Versão | Nome | O que mudou | Rotas |
|--------|------|-------------|-------|
| 1.1.0 | Excluir cópias duplicadas | Aviso de repetição com **Excluir cópia** e atalho por grupo; original = cadastro mais antigo; servidor bloqueia exclusão da original no fluxo `duplicateCleanup` | `/financeiro/saidas`, `POST /financeiro/saidas/:id/excluir`, `POST /financeiro/saidas/excluir-copias-duplicadas` |
| 1.0.0 | Base | Sistema de gestão condominial | — |

## 3. Mapa de telas / conexões

- **Despesas** (`/financeiro/saidas`) → **Boletos a pagar** (`/financeiro/contas-a-pagar`) pelo mesmo mês/ano.
- Pagar boleto gera despesa (fluxo existente de contas a pagar).
- Excluir despesa (incluindo cópia) usa `financeiroService.deleteExit` (mês fechado bloqueia; paga desfaz pagamento antes).

## 4. Papéis e acesso

Rotas `/financeiro/*`: autenticação + papéis `FINANCEIRO`, `SINDICO` ou `SUBSINDICO` + condomínio associado (`requireCondominium`). Exclusão filtra `condominium_id` no SQL.

## 5. Índice de rotas (Despesas / boletos)

| Tela / ação | Rota | Código |
|-------------|------|--------|
| Lista Despesas | `GET /financeiro/saidas?mes=&ano=` | `listExits`, `views/administrativo/financeiro/saidas/list.ejs` |
| Excluir despesa | `POST /financeiro/saidas/:id/excluir` | `deleteExit` → `financeiroService.deleteExit` |
| Excluir cópias do grupo | `POST /financeiro/saidas/excluir-copias-duplicadas` | `deleteDuplicateCopiesInGroup` |
| Boletos a pagar | `GET /financeiro/contas-a-pagar?mes=&ano=` | lista por `due_date` |

## 6. Telas e fluxos

### 6.1 Despesas (`/financeiro/saidas`)

| Aba / seção | Campo | O que é | Obrigatório | Quem preenche | De onde vem | Para onde conecta | Como funciona | Regra / bloqueio | Onde olhar no código |
|-------------|-------|---------|-------------|---------------|-------------|-------------------|---------------|------------------|----------------------|
| Filtro | Mês / Ano | Competência da lista | Sim (redirect se inválido) | Usuário | Query `mes`, `ano` | Recarrega a lista | Filtra por `exit_date` no mês | Sem mês válido → mês atual | `listExits`, `resolveListMonthFromQuery` |
| Aviso | Repetições neste mês | Grupos com mesma descrição + valor | — | Sistema | `buildExitDuplicateMeta` | Exclusão de cópias | Original = `created_at` mais antigo | Só cópias têm **Excluir cópia** | `financeiroController.js`, `list.ejs` |
| Aviso | Excluir cópia | Form por cópia | — | Usuário | Hidden `duplicateCleanup=1` | `POST .../:id/excluir` | Motivo fixo de duplicata | Keeper bloqueado no servidor | `assertExitIsDuplicateCopy` |
| Aviso | Excluir N cópias e manter a original | Lote do grupo | — | Usuário | `keeperExitId`, `mes`, `ano` | `POST .../excluir-copias-duplicadas` | Remove cada cópia; original permanece | Falha parcial: conta sucessos e mostra erro das que falharam | `deleteDuplicateCopiesInGroup` |
| Tabela | Original deste grupo | Selo na linha keeper | — | Sistema | `exitDuplicateMeta.isKeeper` | — | Sem botão **Excluir cópia** | Excluir genérico da linha ainda existe | `list.ejs` |
| Tabela | Excluir cópia | Ação extra na linha duplicata | — | Usuário | `isDuplicate && !isKeeper` | Mesmo POST com `duplicateCleanup=1` | Confirma no JS | Mês fechado: `deleteExit` recusa | `list.ejs`, `financeiroService.deleteExit` |

### 6.2 Boletos a pagar (`/financeiro/contas-a-pagar`)

- Mesmo seletor de **mês e ano**; filtro pelo **vencimento** (`due_date`).
- Link **Ver despesas deste mês** abre Despesas com o mesmo mês/ano.
- Pagar um boleto continua gerando a despesa na data do pagamento (fluxo existente).

## 7. Regras de negócio

- Lista de Despesas: até **1000** linhas do mês, ordem por data da despesa.
- Repetição: mesma descrição (trim + minúsculas) e mesmo valor (`amount` com 2 casas) no mês filtrado.
- Original (keeper): menor `created_at` do grupo. Cópias = demais IDs.
- `duplicateCleanup=1`: só apaga se o ID for cópia do grupo daquele mês; original responde erro e a linha permanece.
- Exclusão avulsa (sem `duplicateCleanup`) permanece igual: `deleteExit` com motivo, ownership, mês fechado, desfaz pagamento se `PAID`.
- Lote: não apaga o keeper; cada cópia passa por `deleteExit`; se todas falharem, redirect com `error`; se algumas saírem, `success=duplicates_removed&removed=N` e `error` com as falhas.
- Segmento `excluir-copias-duplicadas` está na whitelist de `validateNumericIdParam` (não é `:id`).

## 8. Como usar o sistema (guia do dia a dia)

1. **Despesas** → escolher mês/ano → **Ver este mês**.
2. Se aparecer o aviso amarelo **Repetições neste mês**, a linha **Original (mantida)** é o cadastro mais antigo.
3. Em cada cópia, **Excluir cópia**, ou no grupo **Excluir N cópias e manter a original** (confirme; se a cópia estiver paga, o pagamento é desfeito antes).
4. A URL permanece com o mesmo `mes` e `ano`.
5. Compare com **Boletos a pagar** pelo link no topo (boletos não são despesas até pagar).
6. Mês fechado: o botão pode aparecer, mas a exclusão é recusada no servidor.

## 9. Checklist de validação

- Janeiro com grupo 3×: original sem **Excluir cópia**; cópias com o botão.
- Atalho do grupo remove só as cópias; URL com `mes` e `ano`.
- POST forjado `duplicateCleanup=1` na original → erro; linha intacta.
- Mês fechado: `deleteExit` devolve erro na lista.
- Exclusão avulsa sem `duplicateCleanup` continua funcionando.

## 10. Segurança (só o que existe)

- Auth + papel + condomínio nas rotas financeiras.
- `deleteExit` usa `id` + `condominium_id` no SQL (anti-IDOR).
- Lote revalida o grupo no mês do condomínio autenticado; não confia só no `keeperExitId` do formulário.
- EJS usa `<%= %>` nas descrições (escape). CSRF de login não se aplica às rotas financeiras autenticadas (padrão já existente nestes POSTs).

## 11. Deploy / ambiente (sem secrets)

Variáveis de banco (`DB_*` ou `DATABASE_URL`) via `.env`. App PM2 em produção: `condominio`. Esta entrega é código local até haver pull + restart.

## 12. Ao atualizar este documento

Na mesma entrega em que mudar tela, rota ou regra: capa, §2.1, ficha, regras, guia.
