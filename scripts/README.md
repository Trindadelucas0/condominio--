# Scripts one-off / manutenção

Scripts de correção ou migração executados manualmente, **não** no startup da aplicação.

| Script | Descrição | Como executar |
|--------|-----------|----------------|
| `fix_monthly_closures_constraint.js` | Remove a constraint de unicidade `monthly_closures_condominium_id_month_year_key` da tabela `monthly_closures`. One-off: executar apenas se precisar permitir múltiplas comandas do mesmo mês. | Na raiz do projeto: `node scripts/fix_monthly_closures_constraint.js` |

**Nota:** Execute sempre a partir da raiz do projeto (onde está o `.env`), pois os scripts usam `require('../src/...')`.
