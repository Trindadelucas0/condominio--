# Auditoria de Produção — Sistema de Gestão Condominial

**Data:** 05/02/2025  
**Escopo:** Análise completa do projeto como se fosse entrar em produção.  
**Stack:** Node.js, Express, EJS, PostgreSQL.

---

## 1️⃣ BUGS REAIS OU POTENCIAIS

### BUG 1: `req.user.role` em vez de `req.user.roles` (CRÍTICO)
- **Arquivos:** `src/routes/financeiroRoutes.js` (linha 626), `src/routes/sindicoRoutes.js` (linha 233).
- **O que acontece:** O objeto `req.user` exposto pelo middleware `auth.js` possui **`roles`** (array), não `role`. O código usa `req.user.role ? [req.user.role] : []` e `[req.user.role]`, resultando em `[undefined]`.
- **Impacto:** Em `financeiroService.updateExit()`, a variável `userRoles` é usada para `canChangeAmount = userRoles.includes('SINDICO') || userRoles.includes('SUBSINDICO')`. Com array `[undefined]`, síndico/subsíndico **nunca** terão permissão para alterar valor de saída já aprovada na tela de “Verificar saída”. Em `sindicoRoutes`, a aprovação de saída chama `approveExit(..., userRoles)`; o `approveExit` usa `permissionService.hasPermission(userId, ...)` e não `userRoles`, então o efeito imediato é menor, mas o parâmetro está errado e qualquer uso futuro de `userRoles` nessa função quebraria.
- **Correção:** Usar `req.user.roles` (array) em ambos os arquivos, por exemplo: `const userRoles = req.user.roles || [];`.

### BUG 2: Erro `no_role` sem mensagem amigável no login
- **Arquivo:** `src/controllers/authController.js` (redireciona para `?error=no_role`) e `views/auth/login.ejs`.
- **O que acontece:** Quando o usuário tem login válido mas **nenhum perfil** conhecido, o controller redireciona com `error=no_role`. O `showLogin` não inclui a chave `no_role` no objeto `errorMessages`. Na view, `errorMessages[error]` fica `undefined`, então cai no `else if (error)` e exibe **literalmente** a string `no_role` para o usuário.
- **Correção:** No `authController.showLogin`, adicionar `no_role: 'Seu usuário não possui perfil de acesso. Entre em contato com o administrador.'` (ou equivalente) em `errorMessages`. Ou tratar no `processLogin` e redirecionar com uma chave já mapeada.

### BUG 3: Rota POST `/taxas/:id/pagar` — comprovante opcional na rota, obrigatório no fluxo
- **Arquivos:** `src/routes/financeiroRoutes.js` (linha 551), `src/controllers/inadimplenciaController.js` (markFeeAsPaid).
- **O que acontece:** A rota usa `uploadPayment` (multer). Se o usuário não enviar arquivo, `req.file` é `undefined` e `paymentReceiptPath` fica `null`. O `inadimplenciaService.markFeeAsPaid` aceita `paymentReceiptPath` opcional e usa fallback `'taxa_paga_sem_comprovante.pdf'`. Ou seja, **não é bug de quebra**, mas a UX é inconsistente: em “receber entrada” e “pagar saída” o comprovante é obrigatório e há validação explícita; em “pagar taxa” não há validação nem mensagem “Comprovante obrigatório”, e o sistema grava um path fictício.
- **Sugestão:** Definir regra de negócio: comprovante obrigatório ou não. Se obrigatório, validar `req.file` antes de chamar o service e exibir mensagem clara; se opcional, documentar e manter fallback consistente.

### BUG 4: IDs numéricos em rotas sem validação
- **Onde:** Várias rotas usam `req.params.id` em `parseInt(req.params.id)` ou em `exits.find(e => e.id === parseInt(req.params.id))`.
- **O que acontece:** Se o usuário acessar `/financeiro/saidas/abc/pagar`, `parseInt('abc')` é `NaN`. Comparações com `NaN` falham; `find` retorna `undefined` e o código tende a retornar 404 ou “Saída não encontrada”. Não há vazamento de dados, mas não há mensagem específica de “ID inválido”.
- **Sugestão:** Criar middleware ou helper que valide `req.params.id` (e similares) como inteiro positivo e responda 400 com mensagem clara quando inválido, evitando propagar `NaN` em toda a aplicação.

### BUG 5: Inicialização do servidor com erro em desenvolvimento
- **Arquivo:** `src/server.js` (bloco catch do `startServer`, linhas 36–48).
- **O que acontece:** Em caso de erro (ex.: falha em `ensureCorrectionsApplied()`), em **production** o processo encerra com `process.exit(1)`; em **development** o código imprime o aviso e **ainda chama `app.listen(PORT, ...)`** dentro do catch. Ou seja, em dev o servidor sobe mesmo com falha na inicialização do banco/correções. Se o erro for em `initializeDatabase()`, o banco pode estar incompleto e o servidor ficará em estado inconsistente.
- **Sugestão:** Em qualquer ambiente, em caso de falha na inicialização, não subir o servidor. Se quiser “tentar subir assim mesmo” em dev, que seja explícito (ex.: variável ALLOW_STARTUP_FAILURE) e documentado.

---

## 2️⃣ PROCESSOS QUE NÃO FAZEM SENTIDO

### 2.1 Duplicação de lógica de “verificar condomínio” em dezenas de rotas
- **Onde:** Em quase toda rota protegida há `if (!req.user.condominiumId) return res.status(400).send('...')`.
- **Problema:** A mesma verificação se repete em dezenas de handlers. Quem não tem `condominiumId` é basicamente só SUPER_MASTER; para todos os outros módulos (sindico, financeiro, etc.) faz mais sentido garantir isso **uma vez** em um middleware por grupo de rotas (ou por rota de módulo), em vez de repetir em cada função.
- **Sugestão:** Middleware `requireCondominium` que, para rotas que não são `/master/*`, verifica `req.user.condominiumId` e responde 400/redirect se ausente. Aplicar nas rotas de sindico, financeiro, administrativo, etc., e remover os `if (!req.user.condominiumId)` repetidos.

### 2.2 Duas formas de “autorização”: role vs permissão
- **Onde:** Uso de `authorize('SINDICO', 'SUBSINDICO')` em rotas e, em outros pontos, `authorizeAction` / `authorizeTransition` com `permissionService`.
- **Problema:** Para o mesmo recurso (ex.: aprovar saída) às vezes a regra é “ter role SINDICO/SUBSINDICO” e em outros “ter permissão X na entidade Y”. Isso gera confusão: fica difícil saber se uma ação é controlada por role ou por permissão, e há risco de brecha (ex.: role liberada mas permissão não configurada no banco).
- **Sugestão:** Definir uma estratégia única: ou tudo por roles (e remover uso de permissionService nas rotas), ou tudo por permissões (e as roles apenas carregam um conjunto de permissões). Documentar e aplicar de forma consistente.

### 2.3 Rota de relatório “visualizar” e “download” com mesma verificação repetida
- **Arquivo:** `src/routes/financeiroRoutes.js` (relatorios/visualizar e relatorios/download).
- **Problema:** Duas rotas com lógica quase idêntica (normalizar nome do arquivo, checar existência, path traversal, enviar arquivo). Qualquer correção ou nova regra de segurança precisa ser duplicada.
- **Sugestão:** Extrair um helper (ex.: `serveReportFile(req, res, { disposition: 'inline' | 'attachment' })`) e usar nas duas rotas, garantindo uma única fonte de regras (path, extensão, tamanho, etc.).

---

## 3️⃣ PROCESSOS QUE ESTÃO MAL IMPLEMENTADOS

### 3.1 Lógica de “verificar saída” e “atualizar saída” na rota em vez do controller
- **Arquivo:** `src/routes/financeiroRoutes.js` (ex.: POST /saidas/:id/verificar, GET/POST entradas e saidas receber/pagar).
- **Problema:** Vários handlers com dezenas de linhas estão **dentro do arquivo de rotas**: chamadas a service, render, redirect, tratamento de erro. Rotas viram “controllers disfarçados”, dificultando teste e reuso.
- **Sugestão:** Mover toda a lógica para o `financeiroController` (ou controller dedicado). Rotas devem apenas mapear método HTTP + path para função do controller e middlewares (auth, upload, etc.).

### 3.2 financeiroRoutes com ~700 linhas e mistura de responsabilidades
- **Arquivo:** `src/routes/financeiroRoutes.js`.
- **Problema:** O arquivo concentra definição de rotas, lógica de negócio inline, require de services no meio do handler, e render de views. Qualquer mudança em fluxo financeiro exige mexer nesse arquivo gigante.
- **Sugestão:** Quebrar em sub-rotas (ex.: `financeiro/entradas.js`, `financeiro/saidas.js`, `financeiro/fechamento.js`) e/ou mover toda a lógica para o controller e services, deixando nas rotas só `router.get('/path', controller.method)`.

### 3.3 queryHelper.validateCondominiumOwnership com nome de tabela interpolado
- **Arquivo:** `src/utils/queryHelper.js` (linha 12): `SELECT condominium_id FROM ${tableName} WHERE id = $1`.
- **Problema:** `tableName` é concatenado na SQL. Hoje todos os callers passam literal fixo ('financial_exits', 'financial_entries'), então não há SQL injection na prática. Porém a API aceita qualquer string; se no futuro alguém passar `tableName` vindo de input (req, config), vira vetor de SQL injection.
- **Sugestão:** Restringir a uma whitelist de tabelas (ex.: array de nomes permitidos e `if (!whitelist.includes(tableName)) throw new Error(...)`).

### 3.4 Tratamento de erro no app.js não repassa `next`
- **Arquivo:** `src/app.js` (middleware de erro de 4 parâmetros).
- **Problema:** O middleware faz `res.status(...).render(...)` mas **não chama `next(err)`**. No Express, isso é correto para “encerrar a cadeia” após enviar a resposta. Porém, se por engano o middleware não cobrir algum caso (ex.: erro antes de render) ou `res.render` falhar, a requisição pode ficar pendurada. Garantir que, após enviar resposta, não há mais chamadas assíncronas que possam chamar `res.send` de novo.
- **Observação:** O padrão atual está aceitável; o ponto é evitar que dentro do middleware exista lógica assíncrona que chame `res` novamente após o `render`.

---

## 4️⃣ FLUXOS QUE NÃO SE CONECTAM

### 4.1 Usuário sem perfil após login
- **Onde:** `authController.processLogin` — se o usuário não tem nenhum dos roles conhecidos, redireciona para `/auth/login?error=no_role`.
- **Problema:** O fluxo “termina” no login de novo, sem nenhuma ação possível para o usuário além de “entrar em contato com o administrador”. Não há tela de “solicitar acesso” ou “sem perfil configurado” nem link para suporte/admin.
- **Sugestão:** Pelo menos exibir mensagem clara (corrigindo o bug do `no_role`) e, se fizer sentido, uma tela intermediária “Acesso pendente” com instruções, em vez de voltar direto ao formulário de login.

### 4.2 Config e automation
- **Onde:** Rotas `/config` e `/automation` montadas no `app.js`; existem `configController`, `configService`, `automationService`.
- **Problema:** Não foi auditado em profundidade se todas as telas de “configuração” e “automação” estão ligadas a algum fluxo (ex.: usuário configura algo e em outro módulo isso é usado). Há risco de telas órfãs ou dados configurados que não são lidos em nenhum lugar.
- **Sugestão:** Mapear cada tela de config/automation para “quem lê isso” e garantir que o ciclo está fechado (ex.: configuração de limite de aprovação usada no financeiroService).

### 4.3 Relatório gerado e “sucesso” com parâmetro file
- **Onde:** `res.redirect('/financeiro/relatorios?success=generated&file=' + report.filePath)`.
- **Problema:** O `filePath` pode conter caracteres que quebram a query string ou que expõem caminho interno. A listagem de relatórios provavelmente usa outra fonte (ex.: banco ou listagem de diretório); não está claro se o `file` na URL é usado de forma segura na view.
- **Sugestão:** Não colocar caminho completo na URL. Usar identificador (id ou nome normalizado) e, na página de relatórios, construir o link de visualização/download com esse id, validando no backend que o arquivo pertence ao condomínio do usuário (já há verificação de path; garantir que o “nome” passado na URL seja sempre o `normalizedFileName` e nunca path absoluto).

---

## 5️⃣ VALIDAÇÕES QUE ESTÃO FALTANDO

### 5.1 Login
- **Onde:** `authController.processLogin`, `authService.login`.
- **Faltando:** Limite de tentativas (rate limit) por IP ou por usuário; bloqueio temporário após N falhas. Sem isso, o sistema fica exposto a força bruta na senha.
- **Faltando:** Validação de tamanho/caracteres em `username` e `password` (evitar payloads gigantes ou caracteres especiais que possam afetar log ou downstream).

### 5.2 Entrada de valores e datas no financeiro
- **Onde:** Vários formulários (entradas, saídas, taxas, fechamento).
- **Faltando:** Validação centralizada no backend para todos os campos (valor, data, centro de custo, etc.). O `financeiroService` usa `validateFinancialAmount` e `validateDate` em pontos específicos; nem toda rota que recebe body passa por esse service com os mesmos critérios. Ex.: criar entrada pode receber `amount` como string; garantir que sempre há parse e validação antes de persistir.

### 5.3 Permissão por recurso (condomínio)
- **Onde:** Rotas que recebem `id` (de saída, entrada, orçamento, etc.).
- **Faltando:** Em várias rotas a verificação de “este recurso pertence ao condomínio do usuário” é feita indiretamente (ex.: listar tudo do condomínio e fazer `find(id)`). Se houver erro de filtro ou outra rota que busque por id sem condominium_id, pode vazar dado de outro condomínio. O padrão correto é: em toda operação que usa `entityId`, passar também `condominiumId` e o service/query filtrar por ambos.
- **Já existe:** `validateCondominiumOwnership` e uso em parte do financeiroService; falta aplicar de forma sistemática em todos os endpoints que alteram/deletam por id.

### 5.4 Upload de arquivos
- **Onde:** Multer em financeiro (receipts, payments), orçamentos, contratos, etc.
- **Faltando:** Validação de tipo por conteúdo (magic bytes), não só por extensão/mimetype do cliente. Limite de tamanho está definido; falta garantir que nomes de arquivo salvos não permitem path traversal (já há uso de `path.basename` em relatórios; revisar todos os pontos que gravam `req.file.originalname` ou `req.file.filename` em banco ou em disco).

### 5.5 Feedback ao usuário
- **Onde:** Vários `res.redirect('...?error=' + encodeURIComponent(error.message))`.
- **Problema:** Mensagens de erro genéricas (“Erro ao processar”) ou técnicas (exceção) podem aparecer na URL e na tela. Em produção, o usuário não deve ver stack trace nem mensagem interna; o log deve ter o detalhe.
- **Sugestão:** Mapear erros conhecidos para mensagens amigáveis e usar um código (ex.: `error=invalid_amount`) na URL; na view, exibir texto fixo por código. Para erros inesperados, exibir “Ocorreu um erro. Tente novamente.” e logar o erro completo no servidor.

---

## 6️⃣ PROBLEMAS DE ARQUITETURA

### 6.1 Regras de negócio em rotas
- **Onde:** `financeiroRoutes.js` e outros arquivos de rota com lógica inline.
- **Problema:** Regras como “saída já aprovada não pode ser paga duas vezes”, “comprovante obrigatório”, “condominiumId obrigatório” estão espalhadas entre rotas e services. Não há uma “camada de aplicação” clara (casos de uso) entre rota e service.
- **Sugestão:** Manter rotas finas; controllers orquestrando e chamando services; regras de negócio apenas em services (e eventualmente em validators reutilizáveis).

### 6.2 Serviços com require interno de outros serviços
- **Onde:** Vários services fazem `require('./outroService')` dentro de funções.
- **Problema:** Dificulta teste unitário (mock) e obscurece dependências. Ciclos de dependência podem aparecer (A chama B, B chama A).
- **Sugestão:** Injetar dependências no topo do módulo ou passar como parâmetro onde fizer sentido; evitar require dinâmico dentro de função.

### 6.3 Organização de pastas
- **Estrutura atual:** `controllers`, `services`, `routes`, `database` (com muitos SQL e scripts de migração/correção), `utils`.
- **Problema:** `database` mistura init, migrations, corrections e scripts avulsos (ex.: `fix_monthly_closures_constraint.js`). Não fica claro o que rodar em qual ordem em um deploy novo.
- **Sugestão:** Separar: `database/schema` (init), `database/migrations` (com ordem definida), `database/scripts` (one-off) e documentar no README o fluxo de deploy (init → migrations → aplicação).

### 6.4 Views recebendo objeto `req` inteiro
- **Onde:** Várias chamadas `res.render(..., { ..., req: req })`.
- **Problema:** O objeto `req` contém headers, cookies, body, query, etc. Expor `req` inteiro na view aumenta risco de vazamento acidental de dados sensíveis na página (ex.: token em debug) e dificulta saber quais dados a view realmente usa.
- **Sugestão:** Passar apenas o necessário, ex.: `user`, `query` (ou `filters`), `flash`, etc., nunca `req` inteiro.

---

## 7️⃣ RISCOS EM PRODUÇÃO

### 7.1 Sessão / JWT
- **Onde:** Cookies `accessToken`, `refreshToken`, `token`; middleware `authenticate`.
- **Riscos:** Em produção, `secure: process.env.NODE_ENV === 'production'` deve estar true (está). Falta garantir que em produção não se usa `sameSite: 'lax'` em contexto que exija `strict` (já está `strict`). Refresh em alta concorrência: várias abas renovando ao mesmo tempo podem gerar múltiplas chamadas a `refreshAccessToken`; garantir que o refresh token não é reutilizável de forma que quebre sessões (comportamento do jwtHelper não foi auditado em detalhe).
- **Recomendação:** Revisar política de rotação de refresh token e expiração; considerar blacklist de tokens em logout se necessário.

### 7.2 Concorrência
- **Onde:** Fechamento mensal, aprovação de saída, “marcar como pago”.
- **Já existe:** `SELECT ... FOR UPDATE` em `approveExit` no financeiroService, o que evita duas aprovações simultâneas da mesma saída.
- **Risco:** Outros fluxos (ex.: fechamento do mesmo mês por dois usuários, ou duas marcações de pagamento da mesma taxa) podem não estar com lock ou validação otimista. Revisar `monthlyClosureService.closeMonth` e `markFeeAsPaid` para cenários de dois requests simultâneos.

### 7.3 Múltiplos usuários / multi-tenant
- **Onde:** Queries que filtram por `condominium_id`.
- **Risco:** Qualquer query que liste ou atualize dados sem incluir `condominium_id` no WHERE pode vazar ou alterar dados de outro condomínio. A auditoria não percorreu todas as queries; há uso de `validateCondominiumOwnership` e `validateUserBelongsToCondominium` em parte do fluxo financeiro. Garantir que **toda** operação que toca em dados por id inclui filtro por condomínio (preferencialmente via service que sempre recebe `condominiumId`).

### 7.4 Segurança básica
- **Senha padrão:** `database/init.js` cria usuário `admin` / `admin123`. Em produção, esse usuário não deve existir com essa senha ou deve ser desativado/removido após primeiro acesso.
- **JWT_SECRET:** Comentário no .env.example pede “mude em produção”; garantir que em produção há secret forte e único, nunca commitado.
- **Headers:** Não foi verificado uso de helmet ou CSP; recomenda-se adicionar helmet para headers de segurança (X-Frame-Options, etc.).
- **Uploads:** Pasta `uploads` servida como estático em `/uploads`. Garantir que não há acesso a arquivos de outro condomínio (ex.: por nome previsível). Hoje os nomes incluem id e timestamp; ideal é que o backend sirva o arquivo apenas após validar que o recurso associado pertence ao condomínio do usuário, em vez de expor diretório estático com todos os PDFs.

---

## 8️⃣ O QUE SIMPLIFICAR AGORA

### 8.1 Remover ou isolar scripts e arquivos que não são parte do app
- **Arquivos:** `bash.exe.stackdump`, `fix_monthly_closures_constraint.js` (se for one-off), possivelmente `CORRECAO_OCORRENCIAS.md` se for só histórico.
- **Ação:** Mover scripts one-off para pasta `scripts/` ou removê-los do repositório; não rodar correções automáticas no startup sem versionamento claro (já existe `applyCorrections`; manter um único fluxo documentado).

### 8.2 Reduzir duplicação de handlers nas rotas
- **Onde:** financeiroRoutes (entradas/saídas receber/pagar, consumo, centros-custo, fechamento, relatórios, fundo-reserva, etc.).
- **Ação:** Mover toda a lógica para o controller (e services). Rotas ficam como “roteamento puro”. Isso reduz complexidade e facilita testes.

### 8.3 Unificar tratamento de erro e flash
- **Onde:** Vários redirects com `?success=...` e `?error=...` e leitura em views.
- **Ação:** Introduzir um mecanismo simples de flash (cookie ou session) para “success” e “error”, e um helper na view para exibir. Assim as URLs não carregam mensagens longas e o padrão fica único.

### 8.4 Consolidação de “listagens com filtro”
- **Onde:** Várias listagens (entradas, saídas, taxas, consumo) com filtros em query string e lógica repetida (condominiumId, parse de month/year, etc.).
- **Ação:** Criar um helper ou middleware que normaliza `req.query` para um objeto de filtro (com validação de tipos) e que garante `condominiumId`; os controllers só recebem o filtro pronto e chamam o service.

---

## 9️⃣ CHECKLIST FINAL (PRIORIZADO)

### Crítico (fazer antes de produção)
1. **Corrigir `req.user.role` → `req.user.roles`** em `financeiroRoutes.js` e `sindicoRoutes.js`.
2. **Adicionar mensagem para `error=no_role`** no login (authController + view).
3. **Garantir que usuário admin/senha padrão** não exista ou esteja inativo em produção; forçar troca de senha no primeiro login se manter.
4. **Revisar acesso a `/uploads`:** garantir que não é possível acessar arquivos de outro condomínio (por URL direta). Se necessário, servir arquivos via rota que valida condomínio antes de enviar o arquivo.
5. **Rate limit ou bloqueio** na rota POST `/auth/login` (por IP e/ou por usuário).

### Alto impacto
6. **Middleware `requireCondominium`** e remoção dos `if (!req.user.condominiumId)` repetidos nas rotas.
7. **Validação de `req.params.id`** numérico em rotas que usam :id (middleware ou helper).
8. **Mover lógica das rotas financeiras** para o controller (e manter rotas finas).
9. **Documentar e, se necessário, corrigir** fluxo de relatórios (success + file na URL) para não expor path e manter segurança.

### Médio impacto
10. **Unificar estratégia de autorização:** apenas roles ou apenas permissões (e documentar).
11. **Whitelist de tabelas** em `validateCondominiumOwnership`.
12. **Não subir servidor** em caso de falha na inicialização do banco (ou tratar como decisão explícita e documentada).
13. **Deixar de passar `req` inteiro** para as views; passar apenas `user`, `query`, etc.
14. **Revisar concorrência** em fechamento mensal e marcação de taxa como paga.

### Melhoria contínua
15. Organizar `database/` (schema vs migrations vs scripts) e documentar ordem de execução no deploy.
16. Extrair helper para servir relatórios (visualizar/download) e usar nas duas rotas.
17. Flash messages para success/error em vez de query string longa.
18. Adicionar helmet (ou equivalentes) para headers de segurança em produção.

---

*Fim da auditoria. Recomenda-se tratar pelo menos os itens “Crítico” e “Alto impacto” antes de considerar o sistema pronto para produção.*
