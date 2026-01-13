# 📋 ANÁLISE: SISTEMA ATUAL vs SISTEMA BASEADO EM REGRAS

## 🔍 SITUAÇÃO ATUAL (Como está funcionando)

### ✅ O que EXISTE hoje:

```
┌─────────────────────────────────────────────┐
│ ADMINISTRATIVO cria TAREFA manualmente     │
│                                             │
│ • Preenche formulário                      │
│ • Define data específica (due_date)        │
│ • Define responsável                       │
│ • Adiciona itens de checklist              │
│ • Salva                                    │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ Tarefa criada com:                         │
│ • task_id                                   │
│ • assigned_to                               │
│ • due_date (data única)                     │
│ • checklists[] (itens vinculados)          │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ OPERACIONAL executa checklist              │
│                                             │
│ • Marca itens como DONE/NOT_DONE           │
│ • Adiciona comentários                     │
│ • Envia evidências (fotos)                 │
│ • Finaliza tarefa                          │
└─────────────────────────────────────────────┘
```

### ❌ O que NÃO EXISTE:

- ❌ **Não há modelos/templates de checklist**
- ❌ **Não há geração automática de tarefas**
- ❌ **Não há regras de recorrência (ex: "toda segunda-feira")**
- ❌ **Não há separação entre "regra" e "execução"**
- ❌ **Não há job/cron que cria tarefas automaticamente**

### 📊 Estrutura Atual do Banco:

```sql
-- Tarefa (criada manualmente)
tasks (
  id,
  title,
  assigned_to, 
  due_date,        -- Data única e específica
  task_type,       -- CHECKLIST, MANUTENCAO, OUTRA
  checklist_items  -- Itens criados junto com a tarefa
)

-- Itens de checklist (vinculados à tarefa)
checklists (
  id,
  task_id,         -- Vinculado a uma tarefa específica
  item_name,
  status
)
```

---

## 🎯 SISTEMA PROPOSTO (Baseado em Regras)

### ✅ O que DEVE existir:

```
┌─────────────────────────────────────────────┐
│ SÍNDICO cria MODELO/TEMPLATE de checklist  │
│                                             │
│ Nome: "Inspeção Zeladoria - Semanal"       │
│ Departamento: ZELADORIA                     │
│ Dias: Segunda, Quarta                      │
│ Itens:                                      │
│   • Verificar lâmpadas                      │
│   • Verificar bombas                        │
│   • Verificar portões                       │
│ Requer foto: SIM                            │
│ Requer justificativa se não feito: SIM     │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ JOB AUTOMÁTICO (executa todo dia 00:01)    │
│                                             │
│ IF hoje == segunda OU quarta:              │
│   Criar checklist do dia baseado no modelo │
│                                             │
│ Checklist gerado:                           │
│ • checklist_id                              │
│ • model_id (referência ao modelo)          │
│ • scheduled_date (10/03/2025)              │
│ • status: PENDING                           │
│ • assigned_to: ZELADORIA                   │
│ • items[] (copiados do modelo)             │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ OPERACIONAL vê checklist do dia            │
│                                             │
│ • Não vê modelos                            │
│ • Não decide nada                           │
│ • Só executa                                │
│ • Marca itens                               │
│ • Fecha checklist                           │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ Checklist finalizado vira HISTÓRICO        │
│                                             │
│ • Não pode mais editar                      │
│ • Fica salvo para sempre                    │
│ • Comprova que foi feito                    │
└─────────────────────────────────────────────┘
```

---

## 🏗️ NOVA ARQUITETURA NECESSÁRIA

### 1️⃣ NOVA TABELA: `checklist_models` (Modelos/Templates)

```sql
CREATE TABLE checklist_models (
  id SERIAL PRIMARY KEY,
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id),
  
  -- Identificação
  name VARCHAR(255) NOT NULL,              -- "Inspeção Zeladoria - Semanal"
  description TEXT,                        -- Descrição do modelo
  
  -- Configuração de execução
  department VARCHAR(50) NOT NULL,         -- ZELADORIA, LIMPEZA
  days_of_week INTEGER[],                  -- [1,3,5] = Seg, Qua, Sex
  is_active BOOLEAN DEFAULT TRUE,          -- Ativo/Inativo
  
  -- Regras de execução
  requires_photo BOOLEAN DEFAULT TRUE,     -- Requer foto?
  requires_justification BOOLEAN DEFAULT TRUE, -- Requer justificativa se não feito?
  default_assigned_role VARCHAR(50),       -- OPERACIONAL, LIMPEZA
  
  -- Metadados
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2️⃣ NOVA TABELA: `checklist_model_items` (Itens do Modelo)

```sql
CREATE TABLE checklist_model_items (
  id SERIAL PRIMARY KEY,
  model_id INTEGER NOT NULL REFERENCES checklist_models(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,         -- "Verificar lâmpadas"
  item_order INTEGER DEFAULT 0,            -- Ordem de exibição
  requires_photo BOOLEAN DEFAULT FALSE,    -- Este item específico requer foto?
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3️⃣ NOVA TABELA: `daily_checklists` (Checklists do Dia - Gerados Automaticamente)

```sql
CREATE TABLE daily_checklists (
  id SERIAL PRIMARY KEY,
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id),
  model_id INTEGER REFERENCES checklist_models(id), -- Referência ao modelo
  
  -- Data e responsável
  scheduled_date DATE NOT NULL,            -- Data do checklist (10/03/2025)
  assigned_to INTEGER REFERENCES users(id), -- Responsável (pode ser NULL se for por departamento)
  assigned_role VARCHAR(50),                -- OPERACIONAL, LIMPEZA
  
  -- Status
  status VARCHAR(20) DEFAULT 'PENDING',    -- PENDING, IN_PROGRESS, COMPLETED, LATE
  started_at TIMESTAMP NULL,               -- Quando começou
  completed_at TIMESTAMP NULL,             -- Quando finalizou
  completed_by INTEGER REFERENCES users(id),
  
  -- Metadados
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by_system BOOLEAN DEFAULT TRUE,  -- TRUE = gerado automaticamente
  
  UNIQUE(condominium_id, model_id, scheduled_date) -- Não pode ter 2 checklists do mesmo modelo no mesmo dia
);
```

### 4️⃣ NOVA TABELA: `daily_checklist_items` (Itens do Checklist do Dia)

```sql
CREATE TABLE daily_checklist_items (
  id SERIAL PRIMARY KEY,
  checklist_id INTEGER NOT NULL REFERENCES daily_checklists(id) ON DELETE CASCADE,
  model_item_id INTEGER REFERENCES checklist_model_items(id), -- Referência ao item do modelo
  
  -- Dados copiados do modelo
  item_name VARCHAR(255) NOT NULL,         -- Copiado do modelo
  item_order INTEGER DEFAULT 0,
  
  -- Execução
  status VARCHAR(20) DEFAULT 'PENDING',    -- PENDING, DONE, NOT_DONE
  comment TEXT,                            -- Comentário (obrigatório se NOT_DONE)
  done_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5️⃣ TABELA: `checklist_evidences` (Fotos/Evidências)

```sql
CREATE TABLE checklist_evidences (
  id SERIAL PRIMARY KEY,
  checklist_id INTEGER REFERENCES daily_checklists(id) ON DELETE CASCADE,
  checklist_item_id INTEGER REFERENCES daily_checklist_items(id) ON DELETE CASCADE,
  
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚙️ FLUXO DE FUNCIONAMENTO

### **PASSO 1: Síndico cria MODELO**

```javascript
// Exemplo de criação de modelo
{
  name: "Inspeção Zeladoria - Semanal",
  department: "ZELADORIA",
  days_of_week: [1, 3, 5],  // Segunda, Quarta, Sexta
  requires_photo: true,
  requires_justification: true,
  items: [
    { name: "Verificar lâmpadas", order: 1, requires_photo: true },
    { name: "Verificar bombas", order: 2, requires_photo: false },
    { name: "Verificar portões", order: 3, requires_photo: true }
  ]
}
```

### **PASSO 2: Job Automático (cron/job diário)**

```javascript
// Executa TODO DIA às 00:01
async function generateDailyChecklists() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Segunda, etc.
  
  // Busca modelos ativos que devem rodar hoje
  const models = await query(`
    SELECT * FROM checklist_models 
    WHERE is_active = TRUE 
    AND $1 = ANY(days_of_week)
  `, [dayOfWeek]);
  
  for (const model of models) {
    // Verifica se já existe checklist para hoje
    const exists = await query(`
      SELECT id FROM daily_checklists 
      WHERE model_id = $1 
      AND scheduled_date = CURRENT_DATE
    `, [model.id]);
    
    if (exists.rows.length === 0) {
      // Cria checklist do dia
      const checklist = await createDailyChecklist(model, today);
      
      // Cria itens baseados no modelo
      await copyModelItemsToChecklist(model.id, checklist.id);
      
      // Atribui ao departamento (pega primeiro operacional disponível)
      await assignChecklistToDepartment(checklist.id, model.department);
    }
  }
}
```

### **PASSO 3: Operacional executa**

```javascript
// Operacional vê apenas checklists do dia dele
GET /operacional/checklists/hoje

// Retorna:
[
  {
    id: 123,
    name: "Inspeção Zeladoria - Semanal",
    scheduled_date: "2025-03-10",
    status: "PENDING",
    items: [
      { id: 1, name: "Verificar lâmpadas", status: "PENDING" },
      { id: 2, name: "Verificar bombas", status: "PENDING" },
      { id: 3, name: "Verificar portões", status: "PENDING" }
    ]
  }
]
```

### **PASSO 4: Checklist finalizado vira histórico**

```javascript
// Quando operacional fecha checklist
POST /operacional/checklists/:id/complete

// Validações:
// - Todos os itens devem estar DONE ou NOT_DONE (com justificativa)
// - Se requires_photo = TRUE, pelo menos uma foto deve existir
// - Não pode mais editar depois de completado
```

---

## 📊 COMPARAÇÃO: Sistema Atual vs Proposto

| Aspecto | Sistema Atual | Sistema Proposto |
|---------|--------------|------------------|
| **Criação** | Manual pelo ADM | Automática pelo sistema |
| **Frequência** | Data específica | Baseada em regras (dias da semana) |
| **Template** | Não existe | Modelos criados pelo Síndico |
| **Repetição** | Cada tarefa é única | Baseado em modelo reutilizável |
| **Histórico** | Tarefa completa | Checklist completo imutável |
| **Responsável** | Definido na criação | Baseado no departamento do modelo |
| **Calendário** | Tarefas misturadas | Checklists automáticos + tarefas manuais |

---

## 🔄 SEPARAÇÃO: Checklist Automático vs Tarefa Manual

### **CHECKLIST AUTOMÁTICO** (Baseado em Regra)

```
✅ Gerado automaticamente
✅ Baseado em modelo
✅ Recorre conforme regra
✅ Não tem data específica (é "todo dia X")
✅ Não pode ser editado depois de fechado
✅ Vira histórico imutável
```

### **TAREFA MANUAL** (Criada pelo ADM)

```
❌ Criada manualmente
❌ Não tem modelo
❌ Não se repete
❌ Tem data específica (due_date)
❌ Pode ser tarefa única
❌ Ainda pode ser editada (se não concluída)
```

**EXEMPLO DE TAREFA MANUAL:**
- "Retirar vaso quebrado do hall"
- "Acompanhar técnico de elevador"
- "Verificar barulho estranho na bomba"

Essas **NÃO** viram modelo. São tarefas pontuais.

---

## 📅 CALENDÁRIO UNIFICADO

O calendário mostra:

```
┌─────────────────────────────────────────────┐
│ Calendário - 10 de Março de 2025          │
├─────────────────────────────────────────────┤
│                                             │
│ 📋 Checklists Automáticos:                 │
│   • Inspeção Zeladoria - Semanal          │
│   • Limpeza Diária - Entrada               │
│                                             │
│ 📝 Tarefas Manuais:                        │
│   • Retirar vaso quebrado                  │
│   • Acompanhar técnico elevador            │
│                                             │
│ ⚠️ Alertas:                                │
│   • Checklist de ontem ainda não feito     │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🚀 IMPLEMENTAÇÃO SUGERIDA (Fases)

### **FASE 1: Estrutura de Banco**
- [ ] Criar tabelas: `checklist_models`, `checklist_model_items`
- [ ] Criar tabelas: `daily_checklists`, `daily_checklist_items`
- [ ] Migrar dados existentes (se necessário)

### **FASE 2: CRUD de Modelos (Síndico)**
- [ ] Tela para criar/editar modelos
- [ ] Gerenciar itens do modelo
- [ ] Configurar dias da semana

### **FASE 3: Job Automático**
- [ ] Criar cron/job que roda todo dia
- [ ] Gerar checklists baseados em modelos
- [ ] Atribuir a departamentos

### **FASE 4: Execução (Operacional)**
- [ ] Tela de checklists do dia
- [ ] Marcar itens como feito/não feito
- [ ] Upload de fotos
- [ ] Finalizar checklist

### **FASE 5: Histórico e Relatórios**
- [ ] Visualizar checklists antigos (somente leitura)
- [ ] Relatórios de compliance
- [ ] Dashboards com estatísticas

---

## 🎯 VANTAGENS DO SISTEMA PROPOSTO

1. **Automação:** Síndico define uma vez, sistema executa sempre
2. **Consistência:** Todos os checklists seguem o mesmo padrão
3. **Rastreabilidade:** Histórico completo e imutável
4. **Eficiência:** Não precisa criar checklist toda vez
5. **Compliance:** Sistema não esquece, não deixa passar
6. **Simplicidade:** Operacional só executa, não decide

---

## ⚠️ PONTOS DE ATENÇÃO

1. **Migração:** Como migrar checklists existentes?
2. **Compatibilidade:** Manter sistema de tarefas manuais funcionando
3. **Permissões:** Apenas SÍNDICO pode criar modelos?
4. **Notificações:** Avisar quando checklist não foi feito?
5. **Escalonamento:** O que acontece se não fizer?

---

## 📝 DECISÕES NECESSÁRIAS

1. ✅ Síndico cria modelos ou ADM também pode?
2. ✅ Job roda em que horário? (sugestão: 00:01)
3. ✅ Checklist pode ser criado manualmente além do automático?
4. ✅ Como tratar feriados/finais de semana?
5. ✅ Modelos podem ser desativados temporariamente?

---

**Última atualização:** Janeiro 2025
**Status:** 📋 Proposta - Aguardando aprovação para implementação
