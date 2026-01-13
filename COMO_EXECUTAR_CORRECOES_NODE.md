# 🚀 COMO EXECUTAR CORREÇÕES VIA NODE.JS

Agora você pode aplicar as correções do banco de dados diretamente via Node.js, sem precisar de `psql` ou pgAdmin!

---

## ✅ EXECUTAR MANUALMENTE (RECOMENDADO)

### Opção 1: Via npm script

```bash
npm run apply-corrections
```

### Opção 2: Direto com node

```bash
node src/database/applyCorrections.js
```

**O que acontece:**
- ✅ Verifica se as correções já foram aplicadas
- ✅ Se não foram aplicadas, aplica automaticamente
- ✅ Se já foram aplicadas, apenas informa que está tudo OK
- ✅ Funciona **idempotente** (pode executar várias vezes sem problema)

---

## 🔄 EXECUÇÃO AUTOMÁTICA NO STARTUP

As correções são aplicadas **automaticamente** quando o servidor inicia!

**Como funciona:**
1. Quando você inicia o servidor (`npm start` ou `npm run dev`)
2. O script verifica se as correções foram aplicadas
3. Se não foram, aplica automaticamente
4. Depois inicia o servidor normalmente

**Vantagens:**
- ✅ Não precisa executar manualmente
- ✅ Sempre garante que as correções estão aplicadas
- ✅ Funciona em qualquer ambiente (desenvolvimento, produção)
- ✅ Idempotente (não causa problema se executar várias vezes)

---

## 📋 O QUE O SCRIPT FAZ

O script `applyCorrections.js` aplica as seguintes correções:

1. **Estados de financial_entries**
   - Atualiza a state machine para usar `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `RECEIVED`

2. **Soft Delete em financial_entries**
   - Adiciona colunas `deleted_at`, `deleted_by`, `delete_reason`
   - Cria índices para performance

3. **Asset_id em financial_exits**
   - Adiciona coluna `asset_id` para auditoria patrimônio×financeiro
   - Cria índices para performance

---

## ✅ VERIFICAR SE FUNCIONOU

### Via terminal

Após executar, você verá mensagens como:

```
🔍 Verificando se as correções já foram aplicadas...
⚠️  Correções pendentes encontradas. Aplicando...
🔧 Aplicando correções no banco de dados...
  → Atualizando estados de financial_entries...
  → Adicionando soft delete em financial_entries...
  → Adicionando asset_id em financial_exits...
✅ Todas as correções foram aplicadas com sucesso!
  → Estados de financial_entries atualizados
  → Soft delete implementado em financial_entries
  → Asset_id adicionado em financial_exits
```

**OU** se já foram aplicadas:

```
🔍 Verificando se as correções já foram aplicadas...
✅ Todas as correções já foram aplicadas anteriormente.
```

### Via servidor

Quando você iniciar o servidor (`npm start`), você verá as mensagens antes do servidor iniciar:

```
🔍 Verificando se as correções já foram aplicadas...
✅ Todas as correções já foram aplicadas anteriormente.
🚀 Servidor rodando em http://localhost:3000
```

---

## ⚠️ PROBLEMAS COMUNS

### Erro: "connection refused" ou "cannot connect"

**Problema:** O banco de dados não está rodando ou as credenciais estão incorretas.

**Solução:**
1. Verifique se o PostgreSQL está rodando
2. Verifique as credenciais no arquivo `.env`
3. Tente conectar manualmente via pgAdmin para testar

### Erro: "permission denied"

**Problema:** O usuário do banco não tem permissão para ALTER TABLE.

**Solução:**
- Use um usuário com permissões de superusuário (ex: `postgres`)
- Ou dê permissões ALTER TABLE ao usuário atual

### Erro: "relation does not exist"

**Problema:** As tabelas não existem ainda (banco não foi inicializado).

**Solução:**
- Execute primeiro o script de inicialização do banco (se existir)
- Ou crie as tabelas manualmente

---

## 🎯 PRÓXIMOS PASSOS

Após executar as correções:

1. ✅ Reinicie o servidor (se já estava rodando)
2. ✅ Acesse o dashboard do SINDICO
3. ✅ O erro sobre `deleted_at` não deve mais aparecer
4. ✅ Teste criar/excluir entrada financeira (soft delete)

---

## 📝 NOTAS TÉCNICAS

- O script é **idempotente**: pode executar várias vezes sem problema
- O script usa **transações**: se algo der errado, reverte tudo
- O script verifica antes de aplicar: não duplica colunas ou estados
- O script funciona em **desenvolvimento** e **produção**

---

**Última atualização:** Janeiro 2025
