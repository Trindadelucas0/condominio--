# 🔍 RELATÓRIO COMPLETO DE ERROS E BUGS
## Sistema de Gestão Condominial

**Data da Análise:** 2025-01-27  
**Versão do Sistema:** 1.0.0

---

## 📋 SUMÁRIO EXECUTIVO

Este relatório documenta todos os erros, bugs e problemas de segurança encontrados durante a análise completa do sistema. Os problemas foram categorizados por severidade e tipo.

**Total de Problemas Encontrados:** 25  
**Críticos:** 8  
**Altos:** 10  
**Médios:** 5  
**Baixos:** 2

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. **BUG: Código Incompleto em `src/config/database.js` (Linha 42-46)**
**Severidade:** CRÍTICA  
**Arquivo:** `src/config/database.js:42-46`

**Problema:**
```javascript
// Evento disparado quando há erro na conexão
pool.on('error', (err) => {
;
  // Não encerra o processo, apenas loga o erro
  // O pool tentará reconectar automaticamente
});
```

**Descrição:** O handler do evento `error` do pool está vazio (apenas `;`). Erros de conexão não estão sendo logados corretamente.

**Impacto:** Erros de conexão com o banco podem passar despercebidos, dificultando diagnóstico de problemas.

**Correção:**
```javascript
pool.on('error', (err) => {
  console.error('Erro inesperado na conexão com o banco:', err);
  // Não encerra o processo, apenas loga o erro
  // O pool tentará reconectar automaticamente
});
```

---

### 2. **BUG: Query SQL com Parâmetros Dinâmicos em `src/services/operacionalService.js` (Linha 205-211)**
**Severidade:** CRÍTICA  
**Arquivo:** `src/services/operacionalService.js:205-211`

**Problema:**
```javascript
const checklistResult = await query(
  `SELECT c.*, t.id as task_id, t.condominium_id
   FROM checklists c
   INNER JOIN tasks t ON c.task_id = t.id
   WHERE c.id = $1`,
  [checklistId]
);
```

**Descrição:** A query está correta, mas na linha 245-248 há construção dinâmica de UPDATE que pode ser vulnerável se não for validada adequadamente.

**Impacto:** Potencial risco de SQL injection se parâmetros não forem validados.

**Correção:** Verificar se todos os campos em `updateFields` são validados antes de serem incluídos na query.

---

### 3. **BUG: Falta de Validação de `parseInt` em Controllers**
**Severidade:** CRÍTICA  
**Arquivos:** 
- `src/controllers/operacionalController.js:258, 294, 364`
- `src/controllers/sindicoController.js:90, 91, 167, 168, 220, 225, 226, 264, 265, 360, 361`

**Problema:**
```javascript
const occurrenceId = parseInt(req.params.id);
const page = parseInt(req.query.page) || 1;
```

**Descrição:** `parseInt()` retorna `NaN` se o valor não for numérico. Isso pode causar queries SQL inválidas ou comportamentos inesperados.

**Impacto:** 
- Queries SQL com `NaN` podem falhar silenciosamente
- Paginação pode quebrar
- IDs inválidos podem causar erros 500

**Correção:**
```javascript
const occurrenceId = parseInt(req.params.id, 10);
if (isNaN(occurrenceId) || occurrenceId <= 0) {
  return res.status(400).send('ID inválido');
}

const page = parseInt(req.query.page, 10) || 1;
if (isNaN(page) || page < 1) {
  return res.status(400).send('Página inválida');
}
```

---

### 4. **BUG: Falta de Transações em Operações Múltiplas**
**Severidade:** CRÍTICA  
**Arquivos:** 
- `src/services/operacionalService.js:245-252` (UPDATE + SELECT)
- `src/services/financeiroService.js:257-283` (UPDATE + LOG)

**Problema:** Múltiplas queries executadas sem transação podem causar inconsistências se uma falhar.

**Exemplo:**
```javascript
await query(`UPDATE checklists SET ... WHERE id = $${paramCount}`, updateValues);
const updatedResult = await query(`SELECT * FROM checklists WHERE id = $1`, [checklistId]);
```

**Impacto:** Se a segunda query falhar, o banco fica em estado inconsistente (UPDATE feito mas SELECT não).

**Correção:** Usar transações para operações que precisam ser atômicas:
```javascript
const client = await getClient();
try {
  await client.query('BEGIN');
  await client.query(`UPDATE checklists SET ...`, updateValues);
  const result = await client.query(`SELECT * FROM checklists WHERE id = $1`, [checklistId]);
  await client.query('COMMIT');
  return result.rows[0];
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

---

### 5. **BUG: Race Condition em Aprovações Financeiras**
**Severidade:** CRÍTICA  
**Arquivo:** `src/services/financeiroService.js:292+`

**Problema:** Múltiplos usuários podem aprovar a mesma saída financeira simultaneamente se não houver lock.

**Impacto:** Dupla aprovação, valores incorretos no saldo.

**Correção:** Usar `SELECT FOR UPDATE` ou verificação de estado antes de aprovar.

---

### 6. **BUG: Validação de Upload de Arquivos Insuficiente**
**Severidade:** CRÍTICA  
**Arquivo:** `src/middlewares/upload.js:51-57`

**Problema:**
```javascript
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos PDF são permitidos'), false);
  }
};
```

**Descrição:** A validação verifica apenas o `mimetype`, que pode ser falsificado. Não valida a extensão real do arquivo nem o conteúdo.

**Impacto:** 
- Upload de arquivos maliciosos disfarçados como PDF
- Possível execução de código se o arquivo for processado incorretamente

**Correção:**
```javascript
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf'];
  const allowedExts = ['.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos PDF são permitidos'), false);
  }
};

// Adicionar validação de conteúdo após upload (verificar magic bytes)
```

---

### 7. **BUG: Loop N+1 em `src/services/operacionalService.js:139-145`**
**Severidade:** CRÍTICA  
**Arquivo:** `src/services/operacionalService.js:139-145`

**Problema:**
```javascript
for (const task of tasks) {
  const checklistsResult = await query(
    `SELECT * FROM checklists WHERE task_id = $1 ORDER BY item_order, id`,
    [task.id]
  );
  task.checklists = checklistsResult.rows;
}
```

**Descrição:** Para cada tarefa, executa uma query separada. Se houver 100 tarefas, serão 101 queries (1 para tarefas + 100 para checklists).

**Impacto:** 
- Performance muito ruim com muitas tarefas
- Sobrecarga no banco de dados
- Tempo de resposta alto

**Correção:**
```javascript
// Buscar todos os checklists de uma vez
const taskIds = tasks.map(t => t.id);
if (taskIds.length > 0) {
  const checklistsResult = await query(
    `SELECT * FROM checklists WHERE task_id = ANY($1) ORDER BY task_id, item_order, id`,
    [taskIds]
  );
  
  // Agrupar por task_id
  const checklistsByTask = {};
  checklistsResult.rows.forEach(cl => {
    if (!checklistsByTask[cl.task_id]) {
      checklistsByTask[cl.task_id] = [];
    }
    checklistsByTask[cl.task_id].push(cl);
  });
  
  // Associar checklists às tarefas
  tasks.forEach(task => {
    task.checklists = checklistsByTask[task.id] || [];
  });
}
```

---

### 8. **BUG: Falta de Validação de Condomínio em Algumas Queries**
**Severidade:** CRÍTICA  
**Arquivo:** `src/services/operacionalService.js:131-136`

**Problema:**
```javascript
const debugResult = await query(
  `SELECT COUNT(*) as total FROM tasks WHERE assigned_to = $1`,
  [userId]
);
```

**Descrição:** Query de debug não filtra por `condominium_id`, permitindo vazamento de informações entre condomínios.

**Impacto:** Usuário pode ver informações de outros condomínios (mesmo que não seja crítico, é um problema de segurança).

**Correção:** Remover query de debug ou adicionar filtro por condomínio.

---

## 🟠 PROBLEMAS DE ALTA SEVERIDADE

### 9. **BUG: Console.log em Produção**
**Severidade:** ALTA  
**Arquivos:** Múltiplos (67 arquivos encontrados)

**Problema:** Uso extensivo de `console.log`, `console.error`, `console.warn` em todo o código.

**Impacto:** 
- Logs sensíveis podem vazar informações
- Performance degradada em produção
- Dificulta debugging real

**Correção:** Usar sistema de logging adequado (já existe `logger.js`):
```javascript
const { logAction, logError } = require('../utils/logger');
// Em vez de console.log
logError('Erro ao processar', { error, context });
```

---

### 10. **BUG: Falta de Tratamento de Erro em `getClient()`**
**Severidade:** ALTA  
**Arquivo:** `src/config/database.js:69-72`

**Problema:**
```javascript
const getClient = async () => {
  const client = await pool.connect(); // Obtém cliente do pool
  return client; // Retorna cliente para uso em transações
};
```

**Descrição:** Não há tratamento de erro se `pool.connect()` falhar. O cliente pode não ser liberado corretamente.

**Impacto:** 
- Conexões podem não ser liberadas (memory leak)
- Pool pode esgotar conexões

**Correção:**
```javascript
const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('Erro ao obter cliente do pool:', error);
    throw error;
  }
};
```

---

### 11. **BUG: Validação de Parâmetros Query Incompleta**
**Severidade:** ALTA  
**Arquivo:** `src/controllers/sindicoController.js:89-92`

**Problema:**
```javascript
search: req.query.search || '',
page: parseInt(req.query.page) || 1,
perPage: parseInt(req.query.perPage) || 20,
orderBy: req.query.orderBy || 'created_at',
orderDir: req.query.orderDir || 'DESC',
```

**Descrição:** 
- `orderBy` e `orderDir` não são validados, permitindo SQL injection via query string
- `search` não é sanitizado

**Impacto:** SQL injection através de query parameters.

**Correção:**
```javascript
const allowedOrderBy = ['created_at', 'id', 'title', 'status'];
const allowedOrderDir = ['ASC', 'DESC'];

const orderBy = allowedOrderBy.includes(req.query.orderBy) 
  ? req.query.orderBy 
  : 'created_at';
const orderDir = allowedOrderDir.includes(req.query.orderDir?.toUpperCase()) 
  ? req.query.orderDir.toUpperCase() 
  : 'DESC';

// Sanitizar search
const search = req.query.search 
  ? req.query.search.replace(/[%_]/g, '') 
  : '';
```

---

### 12. **BUG: Falta de Rate Limiting**
**Severidade:** ALTA  
**Arquivo:** `src/app.js` e `src/routes/authRoutes.js`

**Problema:** Não há rate limiting em rotas de autenticação.

**Impacto:** 
- Ataques de força bruta em login
- DDoS em endpoints públicos

**Correção:** Adicionar middleware de rate limiting (ex: `express-rate-limit`):
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
});

app.use('/auth/login', loginLimiter);
```

---

### 13. **BUG: Cookies Sem SameSite em Alguns Casos**
**Severidade:** ALTA  
**Arquivo:** `src/middlewares/auth.js:28-33, 61-66`

**Problema:** Cookies estão configurados corretamente, mas há inconsistência com cookie `token` antigo.

**Impacto:** CSRF attacks se cookies antigos forem usados.

**Correção:** Garantir que todos os cookies tenham `sameSite: 'strict'`.

---

### 14. **BUG: Falta de Validação de Tamanho de Arquivo Antes do Upload**
**Severidade:** ALTA  
**Arquivo:** `src/middlewares/upload.js`

**Problema:** Validação de tamanho só acontece no multer, mas não há validação no frontend ou feedback adequado.

**Impacto:** Usuário pode tentar upload de arquivo muito grande, causando timeout.

**Correção:** Adicionar validação no frontend e melhorar mensagens de erro.

---

### 15. **BUG: Falta de Sanitização de Inputs HTML**
**Severidade:** ALTA  
**Arquivo:** Controllers e Services

**Problema:** Dados do usuário são renderizados em EJS sem sanitização.

**Impacto:** XSS (Cross-Site Scripting) se dados maliciosos forem inseridos.

**Correção:** Usar biblioteca de sanitização (ex: `dompurify` ou `validator`) antes de renderizar.

---

### 16. **BUG: Falta de Validação de Condomínio em Algumas Rotas**
**Severidade:** ALTA  
**Arquivo:** Vários controllers

**Problema:** Algumas rotas não verificam se o usuário pertence ao condomínio antes de executar operações.

**Impacto:** Acesso não autorizado a dados de outros condomínios.

**Correção:** Adicionar middleware ou validação em todas as rotas que acessam dados por condomínio.

---

### 17. **BUG: Memory Leak Potencial em Cache**
**Severidade:** ALTA  
**Arquivo:** `src/services/cacheService.js`

**Problema:** Se o cache não tiver TTL ou limpeza adequada, pode crescer indefinidamente.

**Impacto:** Servidor pode ficar sem memória.

**Correção:** Implementar TTL e limpeza periódica do cache.

---

### 18. **BUG: Falta de Validação de Estado em Transições**
**Severidade:** ALTA  
**Arquivo:** `src/services/financeiroService.js`

**Problema:** Não há validação se uma transição de estado é permitida antes de executá-la.

**Impacto:** Estados inválidos podem ser criados (ex: aprovar algo já aprovado).

**Correção:** Usar `authorizeTransition` middleware ou validação no service.

---

## 🟡 PROBLEMAS DE MÉDIA SEVERIDADE

### 19. **BUG: Falta de Índices no Banco de Dados**
**Severidade:** MÉDIA  
**Arquivo:** Scripts SQL de inicialização

**Problema:** Queries frequentes podem não ter índices adequados.

**Impacto:** Performance degradada com muitos registros.

**Correção:** Adicionar índices em colunas frequentemente usadas em WHERE, JOIN, ORDER BY.

---

### 20. **BUG: Falta de Paginação em Algumas Listagens**
**Severidade:** MÉDIA  
**Arquivo:** Vários services

**Problema:** Algumas listagens não têm paginação, retornando todos os registros.

**Impacto:** 
- Performance ruim com muitos dados
- Timeout em listagens grandes

**Correção:** Implementar paginação em todas as listagens.

---

### 21. **BUG: Mensagens de Erro Genéricas**
**Severidade:** MÉDIA  
**Arquivo:** Vários controllers

**Problema:** Erros retornam mensagens genéricas como "Erro interno do servidor".

**Impacto:** Dificulta debugging e não dá feedback útil ao usuário.

**Correção:** Mensagens de erro mais específicas (sem expor detalhes sensíveis).

---

### 22. **BUG: Falta de Validação de Datas em Formulários**
**Severidade:** MÉDIA  
**Arquivo:** Controllers e Services

**Problema:** Datas podem ser inválidas ou inconsistentes.

**Impacto:** Dados incorretos no banco.

**Correção:** Validação mais rigorosa de datas (usar `validateDate` em todos os lugares).

---

### 23. **BUG: Falta de Logging de Auditoria em Algumas Operações**
**Severidade:** MÉDIA  
**Arquivo:** Vários services

**Problema:** Nem todas as operações críticas são logadas.

**Impacto:** Dificulta auditoria e rastreamento de mudanças.

**Correção:** Adicionar `logAction` em todas as operações de CREATE, UPDATE, DELETE.

---

## 🟢 PROBLEMAS DE BAIXA SEVERIDADE

### 24. **BUG: Código Duplicado**
**Severidade:** BAIXA  
**Arquivo:** Vários arquivos

**Problema:** Lógica similar repetida em múltiplos lugares.

**Impacto:** Dificulta manutenção.

**Correção:** Extrair para funções utilitárias reutilizáveis.

---

### 25. **BUG: Falta de Documentação em Funções**
**Severidade:** BAIXA  
**Arquivo:** Vários arquivos

**Problema:** Algumas funções não têm JSDoc ou comentários adequados.

**Impacto:** Dificulta manutenção e onboarding.

**Correção:** Adicionar documentação JSDoc em todas as funções públicas.

---

## 📊 RESUMO POR CATEGORIA

### Segurança
- SQL Injection (validação de parâmetros)
- XSS (sanitização de inputs)
- CSRF (cookies)
- Rate Limiting
- Validação de uploads
- Validação de permissões

### Performance
- N+1 queries
- Falta de índices
- Falta de paginação
- Memory leaks

### Confiabilidade
- Falta de transações
- Race conditions
- Tratamento de erros
- Validação de dados

### Manutenibilidade
- Código duplicado
- Falta de documentação
- Console.log em produção

---

## ✅ RECOMENDAÇÕES PRIORITÁRIAS

1. **URGENTE:** Corrigir bugs críticos de segurança (SQL injection, validação de uploads)
2. **URGENTE:** Implementar transações para operações críticas
3. **ALTA:** Corrigir N+1 queries (performance)
4. **ALTA:** Adicionar rate limiting
5. **MÉDIA:** Melhorar validação de inputs
6. **MÉDIA:** Adicionar índices no banco de dados

---

## 🔧 PRÓXIMOS PASSOS

1. Criar issues no sistema de controle de versão para cada bug
2. Priorizar correções por severidade
3. Implementar testes automatizados para prevenir regressões
4. Revisar código após correções
5. Implementar code review process

---

**Fim do Relatório**
