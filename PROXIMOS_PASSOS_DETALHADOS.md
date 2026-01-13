# 📋 PRÓXIMOS PASSOS DETALHADOS

Este documento detalha os próximos passos recomendados para completar as melhorias do sistema.

---

## ✅ PASSO 1: Formulário de Saída Financeira - Campo AssetId

### Objetivo
Adicionar campo opcional `assetId` no formulário de criação/edição de saída financeira para vincular custos a ativos.

### Arquivos a Modificar
- `views/administrativo/financeiro/saidas/form.ejs`
- `src/controllers/financeiroController.js` (se necessário)
- `src/services/financeiroService.js` (se necessário)

### Implementação

1. **No formulário (`form.ejs`):**
   - Adicionar campo select para selecionar ativo
   - Campo deve ser opcional
   - Listar apenas ativos ativos do condomínio
   - Exibir nome do ativo + tipo (ex: "Elevador A - ELEVADOR")

2. **Query para buscar ativos:**
   ```javascript
   // Em financeiroController ou financeiroService
   const assets = await patrimonioService.listAssets(condominiumId, { status: 'ACTIVE' });
   ```

3. **Salvar no banco:**
   - Campo `asset_id` já existe na tabela `financial_exits` (criado em `fixAssetIdFinancialExits.sql`)
   - Basta incluir `assetId` no objeto `data` ao criar/atualizar saída

### Exemplo de Código

**Formulário:**
```ejs
<div class="mb-4">
  <label for="assetId" class="block text-sm font-medium text-gray-700 mb-1">
    Ativo Relacionado (Opcional)
  </label>
  <select id="assetId" name="assetId" class="w-full px-3 py-2 border border-gray-300 rounded-md">
    <option value="">Nenhum</option>
    <% if (typeof assets !== 'undefined') { %>
      <% assets.forEach(asset => { %>
        <option value="<%= asset.id %>" <%= (entry && entry.asset_id === asset.id) ? 'selected' : '' %>>
          <%= asset.name %> - <%= asset.asset_type %>
        </option>
      <% }); %>
    <% } %>
  </select>
  <p class="mt-1 text-sm text-gray-500">Vincule esta saída a um ativo para rastrear custos</p>
</div>
```

**Controller/Service:**
```javascript
// Ao criar/atualizar saída
const exitData = {
  // ... outros campos
  assetId: req.body.assetId || null, // Opcional
};
```

---

## ✅ PASSO 2: Detalhes do Ativo - Histórico Financeiro

### Objetivo
Exibir histórico financeiro vinculado a um ativo na tela de detalhes do ativo.

### Arquivos a Modificar
- `src/services/patrimonioService.js` (adicionar função para buscar custos)
- `views/administrativo/patrimonio/asset-detail.ejs` (adicionar seção de histórico financeiro)
- `src/controllers/patrimonioController.js` (passar dados financeiros para view)

### Implementação

1. **Adicionar função em `patrimonioService.js`:**
   ```javascript
   // Função para buscar histórico financeiro de um ativo
   const getAssetFinancialHistory = async (assetId, condominiumId) => {
     try {
       const result = await query(
         `SELECT fe.*, cc.name as cost_center_name, u.full_name as created_by_name
          FROM financial_exits fe
          LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
          LEFT JOIN users u ON fe.created_by = u.id
          WHERE fe.asset_id = $1 AND fe.condominium_id = $2
          ORDER BY fe.exit_date DESC, fe.created_at DESC`,
         [assetId, condominiumId]
       );
       return result.rows;
     } catch (error) {
       console.error('Erro ao buscar histórico financeiro do ativo:', error);
       throw error;
     }
   };
   ```

2. **Calcular total de custos:**
   ```javascript
   const totalCostsResult = await query(
     `SELECT COALESCE(SUM(amount), 0) as total
      FROM financial_exits
      WHERE asset_id = $1 AND condominium_id = $2`,
     [assetId, condominiumId]
   );
   const totalCosts = parseFloat(totalCostsResult.rows[0].total);
   ```

3. **Na view, adicionar seção:**
   ```ejs
   <!-- Histórico Financeiro -->
   <div class="bg-white rounded-lg shadow p-6 mb-6">
     <h2 class="text-xl font-bold text-gray-800 mb-4">Histórico Financeiro</h2>
     <div class="mb-4">
       <p class="text-sm text-gray-600">
         <strong>Total de Custos:</strong> 
         <span class="text-red-600 font-bold">
           R$ <%= totalCosts.toLocaleString('pt-BR', {minimumFractionDigits: 2}) %>
         </span>
       </p>
     </div>
     <!-- Tabela de saídas financeiras vinculadas -->
     <!-- ... -->
   </div>
   ```

---

## ✅ PASSO 3: Relatório "Quanto esse ativo custou?"

### Objetivo
Criar relatório/query que responde: "quanto esse elevador já custou?" (ou qualquer ativo)

### Arquivos a Criar/Modificar
- `src/services/patrimonioService.js` (adicionar função de relatório)
- `src/controllers/patrimonioController.js` (adicionar rota de relatório)
- `src/routes/patrimonioRoutes.js` (adicionar rota)
- `views/administrativo/patrimonio/asset-report.ejs` (criar view de relatório)

### Implementação

1. **Função de relatório:**
   ```javascript
   // Função para gerar relatório financeiro de um ativo
   const getAssetFinancialReport = async (assetId, condominiumId, filters = {}) => {
     try {
       const { startDate, endDate } = filters;
       
       let sql = `
         SELECT 
           fe.*,
           cc.name as cost_center_name,
           u.full_name as created_by_name,
           CASE 
             WHEN fe.payment_status = 'PAID' THEN fe.amount
             ELSE 0
           END as paid_amount
         FROM financial_exits fe
         LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
         LEFT JOIN users u ON fe.created_by = u.id
         WHERE fe.asset_id = $1 AND fe.condominium_id = $2
       `;
       const params = [assetId, condominiumId];
       let paramCount = 3;
       
       if (startDate) {
         sql += ` AND fe.exit_date >= $${paramCount++}`;
         params.push(startDate);
       }
       
       if (endDate) {
         sql += ` AND fe.exit_date <= $${paramCount++}`;
         params.push(endDate);
       }
       
       sql += ` ORDER BY fe.exit_date DESC`;
       
       const result = await query(sql, params);
       
       // Calcula totais
       const totals = {
         total: result.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0),
         paid: result.rows.reduce((sum, row) => sum + parseFloat(row.paid_amount), 0),
         pending: result.rows.reduce((sum, row) => 
           sum + (row.payment_status !== 'PAID' ? parseFloat(row.amount) : 0), 0
         ),
       };
       
       return {
         entries: result.rows,
         totals,
       };
     } catch (error) {
       console.error('Erro ao gerar relatório financeiro do ativo:', error);
       throw error;
     }
   };
   ```

2. **Rota:**
   ```javascript
   // GET /patrimonio/ativos/:id/relatorio-financeiro
   router.get('/ativos/:id/relatorio-financeiro', 
     authenticate,
     authorize('ADMINISTRATIVO', 'SINDICO'),
     patrimonioController.showFinancialReport
   );
   ```

---

## ✅ PASSO 4: Atualizar Queries de getEntryById (Opcional)

### Decisão
As queries de `getEntryById`, `updateEntry`, `approveEntry`, `rejectEntry` **NÃO precisam** filtrar por `deleted_at IS NULL` porque:
- Podem ser usadas para exibir detalhes de uma entrada rejeitada/deletada
- Podem ser usadas em operações administrativas
- O filtro `deleted_at IS NULL` já está aplicado em `listEntries()` e `listRejectedEntries()`

### Ação
- ✅ Nenhuma ação necessária
- As queries já estão corretas

---

## 📊 RESUMO DE PRIORIDADES

### 🔴 Alta Prioridade
1. ✅ **Queries de Dashboard/Stats** - CONCLUÍDO
   - Todas as queries foram atualizadas para incluir `deleted_at IS NULL`
   
2. ✅ **View occurrence-detail.ejs** - CONCLUÍDO
   - Removida referência a `zeladoriaOccurrence`
   - Adicionada informação sobre necessidade de zeladoria

### 🟠 Média Prioridade
3. **Formulário de Saída - Campo AssetId**
   - Permite vincular custos a ativos
   - Melhora rastreabilidade

4. **Detalhes do Ativo - Histórico Financeiro**
   - Mostra custos relacionados ao ativo
   - Melhora visibilidade

### 🟡 Baixa Prioridade
5. **Relatório Financeiro de Ativo**
   - Função de relatório completo
   - Útil para análises mais detalhadas

---

## 🎯 CHECKLIST DE IMPLEMENTAÇÃO

- [x] Atualizar queries de dashboard/stats com `deleted_at IS NULL`
- [x] Corrigir view `occurrence-detail.ejs` (remover `zeladoriaOccurrence`)
- [ ] Adicionar campo `assetId` no formulário de saída financeira
- [ ] Adicionar histórico financeiro na tela de detalhes do ativo
- [ ] Criar relatório financeiro de ativo
- [ ] Testar funcionalidades implementadas
- [ ] Atualizar documentação funcional com novas funcionalidades

---

**Última atualização:** Janeiro 2025
