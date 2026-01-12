# 📋 FLUXO DE CATEGORIAS E CLASSIFICAÇÕES NO SISTEMA

## 🎯 VISÃO GERAL

O sistema utiliza diferentes tipos de categorias/classificações em vários módulos para organizar e classificar informações. Este documento explica o fluxo completo de cada tipo.

---

## 1️⃣ CATEGORIAS DE OCORRÊNCIAS (CLASSIFICATION)

### **Onde é usado:**
- Campo `classification` na tabela `occurrences`
- Definido durante a **triagem** pelo **Administrativo**

### **Fluxo Completo:**

```
1. OPERACIONAL registra ocorrência
   └─> Ocorrência criada com status "ABERTA"
   └─> classification = NULL (ainda não classificada)

2. ADMINISTRATIVO faz triagem
   └─> Acessa: /administrativo/ocorrencias/pendentes
   └─> Seleciona ocorrência para triar
   └─> Define:
       • Priority (BAIXA, NORMAL, ALTA, URGENTE)
       • Classification (tipo de manutenção/ocorrência)
       • SLA (horas para resolução)
       • AssignTo (responsável)
       • ConvertToTask (se deve virar tarefa)

3. Sistema atualiza ocorrência
   └─> triaged = TRUE
   └─> triaged_by = userId (ADM)
   └─> triaged_at = CURRENT_TIMESTAMP
   └─> classification = valor selecionado
   └─> sla_hours = valor definido
   └─> sla_due_date = calculado automaticamente

4. Se convertToTask = TRUE
   └─> Sistema cria tarefa automaticamente
   └─> related_task_id = ID da tarefa criada
   └─> converted_to_task = TRUE
```

### **Valores Possíveis de Classification:**

| Valor | Descrição | Quando Usar |
|-------|-----------|-------------|
| `PREVENTIVA` | Manutenção preventiva | Manutenções programadas, inspeções |
| `CORRETIVA` | Manutenção corretiva | Reparos, consertos, correções |
| `EMERGENCIA` | Emergência | Situações urgentes que precisam ação imediata |
| `MELHORIA` | Melhoria/Upgrade | Melhorias, upgrades, modernizações |
| `LIMPEZA` | Limpeza | Serviços de limpeza, higienização |
| `JARDINAGEM` | Jardinagem | Poda, plantio, manutenção de áreas verdes |
| `SEGURANCA` | Segurança | Problemas de segurança, portões, câmeras |
| `ELETRICA` | Elétrica | Problemas elétricos, instalações |
| `HIDRAULICA` | Hidráulica | Problemas de água, encanamento |
| `OUTRA` | Outra | Outros tipos não categorizados |

### **Onde Visualizar:**
- **Administrativo:** `/administrativo/ocorrencias` (filtro por classification)
- **Síndico:** Dashboard mostra ocorrências por classificação
- **Relatórios:** Agrupamento por classification para análise

---

## 2️⃣ CATEGORIAS FINANCEIRAS

### **A) Entradas Financeiras (financial_entries.category)**

| Valor | Descrição | Quando Usar |
|-------|-----------|-------------|
| `TAXA` | Taxa de condomínio | Taxas mensais de condomínio |
| `RECEITA` | Receita | Outras receitas (aluguel de salão, etc) |
| `OUTRA` | Outra entrada | Outros tipos de entrada |

### **B) Saídas Financeiras (financial_exits.category)**

| Valor | Descrição | Quando Usar |
|-------|-----------|-------------|
| `MANUTENCAO` | Manutenção | Gastos com manutenção |
| `CONTA` | Conta | Contas (água, luz, gás) |
| `CONTRATO` | Contrato | Pagamentos de contratos |
| `OUTRA` | Outra saída | Outros tipos de saída |

### **Fluxo:**
```
1. FINANCEIRO cria entrada/saída
   └─> Seleciona categoria no formulário
   └─> Sistema salva com category definida

2. Relatórios e Dashboards
   └─> Agrupam por categoria
   └─> KPIs calculados por categoria
```

---

## 3️⃣ CATEGORIAS DE DOCUMENTOS

### **Onde é usado:**
- Tabela `document_categories` (categorias customizáveis)
- Tabela `documents.category_id` (vinculação)

### **Fluxo:**

```
1. ADMINISTRATIVO cria categoria
   └─> Acessa: /administrativo/documentos/categorias
   └─> Cria categoria (ex: "Contratos", "Atas", "Laudos")
   └─> Sistema salva em document_categories

2. ADMINISTRATIVO cria documento
   └─> Seleciona categoria criada
   └─> Sistema vincula documento à categoria

3. Filtros e Organização
   └─> Lista documentos por categoria
   └─> Alertas de vencimento agrupados por categoria
```

### **Categorias Padrão Sugeridas:**
- Contratos
- Atas de Reunião
- Laudos Técnicos
- Seguros
- Licenças
- Outros

---

## 4️⃣ CATEGORIAS DE INVENTÁRIO

### **Onde é usado:**
- Campo `category` na tabela `inventory_items`

### **Valores Possíveis:**

| Valor | Descrição |
|-------|-----------|
| `LIMPEZA` | Produtos de limpeza |
| `MANUTENCAO` | Materiais de manutenção |
| `JARDINAGEM` | Produtos para jardinagem |
| `OUTROS` | Outros itens |

---

## 5️⃣ TIPOS DE COMUNICAÇÃO OPERACIONAL

### **Onde é usado:**
- Campo `communication_type` na tabela `operational_communications`

### **Valores Possíveis:**

| Valor | Descrição | Quando Usar |
|-------|-----------|-------------|
| `INFO` | Informativo | Avisos gerais, comunicados |
| `WARNING` | Aviso | Avisos importantes |
| `MAINTENANCE` | Manutenção | Avisos sobre manutenções |
| `BLOCKADE` | Bloqueio | Avisos sobre bloqueios, interdições |

---

## 🔄 FLUXO INTEGRADO: DA OCORRÊNCIA À CATEGORIZAÇÃO

### **Exemplo Completo:**

```
1. OPERACIONAL registra ocorrência
   "Bomba d'água com barulho estranho"
   └─> status: ABERTA
   └─> classification: NULL

2. ADMINISTRATIVO faz triagem
   └─> Classification: CORRETIVA
   └─> Priority: ALTA
   └─> SLA: 24 horas
   └─> AssignTo: Operacional X
   └─> ConvertToTask: TRUE
   
3. Sistema cria tarefa automaticamente
   └─> taskType: CORRECTIVE (baseado na classification)
   └─> related_occurrence_id: ID da ocorrência

4. OPERACIONAL executa tarefa
   └─> Marca como concluída
   └─> Ocorrência atualizada para RESOLVIDA

5. FINANCEIRO registra saída (se houver custo)
   └─> category: MANUTENCAO
   └─> Vinculado à ocorrência/tarefa

6. Sistema gera relatórios
   └─> Agrupa por classification
   └─> Mostra custos por categoria
   └─> KPIs por tipo de manutenção
```

---

## 📊 USO DAS CATEGORIAS EM RELATÓRIOS E KPIs

### **Dashboards:**
- **Síndico:** Visualiza ocorrências por classification
- **Administrativo:** Filtra tarefas por tipo
- **Financeiro:** Agrupa gastos por categoria

### **Relatórios:**
- Ocorrências por classification (mensal/anual)
- Custos por categoria financeira
- Tempo médio de resolução por classification
- SLA compliance por tipo

---

## ⚙️ CONFIGURAÇÃO E MANUTENÇÃO

### **Categorias Fixas (Hardcoded):**
- Classification de ocorrências
- Categorias financeiras
- Tipos de comunicação

### **Categorias Customizáveis:**
- Categorias de documentos (CRUD completo)
- Podem ser criadas/editadas pelo Administrativo

---

## 🔍 ONDE ENCONTRAR NO CÓDIGO

### **Services:**
- `src/services/administrativoTriagemService.js` - Triagem e classification
- `src/services/financeiroService.js` - Categorias financeiras
- `src/services/administrativoService.js` - Categorias de documentos

### **Controllers:**
- `src/controllers/administrativoController.js` - Triagem de ocorrências
- `src/controllers/financeiroController.js` - Entradas/saídas

### **Views:**
- `views/administrativo/ocorrencias/triar.ejs` - Formulário de triagem
- `views/administrativo/financeiro/entradas/form.ejs` - Categoria de entrada
- `views/administrativo/financeiro/saidas/form.ejs` - Categoria de saída

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Campo classification na tabela occurrences
- [x] Triagem pelo Administrativo
- [x] Categorias financeiras (entradas e saídas)
- [x] Categorias de documentos (CRUD)
- [x] Filtros por categoria nos relatórios
- [ ] Validação de valores permitidos (enum)
- [ ] Histórico de mudanças de categoria
- [ ] Relatórios específicos por categoria

---

**Última atualização:** Janeiro 2025
