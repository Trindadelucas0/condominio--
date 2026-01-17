# 🧪 GUIA COMPLETO DE TESTES
## Sistema de Gestão Condominial

---

## 📋 VISÃO GERAL

Sistema completo de testes automatizados que verifica:
- ✅ Estrutura do banco de dados
- ✅ Funcionalidades implementadas
- ✅ Fluxos operacionais
- ✅ Integridade dos dados
- ✅ Cálculos e lógica de negócio

---

## 🚀 EXECUTAR TESTES

### Opção 1: Todos os Testes
```bash
npm test
```

### Opção 2: Diretamente
```bash
node tests/testRunner.js
```

### Opção 3: Teste Específico
```bash
# Testes de autenticação
node -e "require('./tests/01-auth.test.js').run(new (require('./tests/testRunner.js'))())"

# Testes financeiros
node -e "require('./tests/02-financeiro.test.js').run(new (require('./tests/testRunner.js'))())"
```

---

## 📊 O QUE CADA TESTE VERIFICA

### 01-auth.test.js
**Testa:**
- ✅ Estrutura da tabela `users`
- ✅ Perfis (roles) cadastrados
- ✅ Usuários e seus perfis
- ✅ Sistema de permissões
- ✅ Configuração JWT
- ✅ Estrutura de login

**Situações Criadas:**
- Lista todos os usuários
- Verifica perfis atribuídos
- Valida estrutura de permissões

---

### 02-financeiro.test.js
**Testa:**
- ✅ Tabelas financeiras existem
- ✅ Estrutura de entradas/saídas
- ✅ Campos de anexos (nota fiscal)
- ✅ Dados financeiros existentes
- ✅ Estrutura de fechamento mensal
- ✅ Cálculo de totais
- ✅ Validação de fechamento

**Situações Criadas:**
- Verifica dados do mês atual
- Testa cálculos de totais
- Valida estrutura de fechamento

---

### 03-inadimplencia.test.js
**Testa:**
- ✅ Tabelas de apartamentos e taxas
- ✅ Estrutura de colunas
- ✅ Apartamentos cadastrados
- ✅ Taxas mensais
- ✅ Cálculo de inadimplência
- ✅ Taxas em atraso
- ✅ Atualização automática de dias

**Situações Criadas:**
- Calcula inadimplência atual
- Lista taxas em atraso
- Verifica cálculos automáticos

---

### 04-assembleias.test.js
**Testa:**
- ✅ Tabelas de assembleias
- ✅ Assembleias cadastradas
- ✅ Participantes
- ✅ Decisões registradas
- ✅ Documentos anexados
- ✅ Cálculo de quórum
- ✅ Status das assembleias

**Situações Criadas:**
- Lista assembleias e seus dados
- Verifica quórum
- Conta participantes e decisões

---

### 05-fundo-reserva.test.js
**Testa:**
- ✅ Tabela de fundo de reserva
- ✅ Fundos configurados
- ✅ Cálculo de contribuição
- ✅ Rateio de despesas

**Situações Criadas:**
- Verifica fundos configurados
- Calcula % da meta
- Testa métodos de contribuição

---

### 06-relatorios.test.js
**Testa:**
- ✅ Tabela de relatórios
- ✅ Relatórios gerados
- ✅ Arquivos PDF existem
- ✅ Biblioteca PDFKit
- ✅ Tipos de relatórios

**Situações Criadas:**
- Lista relatórios gerados
- Verifica se arquivos existem
- Testa criação de PDF

---

### 07-dashboards.test.js
**Testa:**
- ✅ Dashboard do síndico
- ✅ Cálculo de inadimplência
- ✅ Gastos do mês
- ✅ Saldo atual
- ✅ Alertas críticos

**Situações Criadas:**
- Carrega estatísticas do dashboard
- Calcula métricas
- Verifica alertas

---

### 08-permissoes.test.js
**Testa:**
- ✅ Estrutura de permissões
- ✅ Permissões por entidade
- ✅ Permissões por perfil
- ✅ Usuários e perfis
- ✅ Acesso SINDICO ao financeiro
- ✅ Mapeamento de rotas

**Situações Criadas:**
- Lista todas as permissões
- Verifica atribuições
- Valida acesso por perfil

---

### 09-fluxos-completos.test.js
**Testa:**
- ✅ Fluxo financeiro completo
- ✅ Fluxo de inadimplência
- ✅ Fluxo de assembleia
- ✅ Fluxo de ocorrência → tarefa → orçamento
- ✅ Integridade dos dados

**Situações Criadas:**
- Simula fluxos completos
- Verifica sequência de operações
- Valida integridade referencial

---

## 📝 INTERPRETANDO OS RESULTADOS

### ✅ Teste PASSOU
- Funcionalidade está funcionando
- Estrutura está correta
- Dados estão consistentes

### ❌ Teste FALHOU
- Há um problema que precisa ser corrigido
- Verifique o erro mostrado
- Corrija o problema indicado

### ⚠️ AVISO
- Situação que precisa atenção
- Pode não ser um erro crítico
- Verifique se é esperado

### 📝 DETALHES
- Informações sobre o que foi verificado
- Quantidades e valores encontrados
- Status dos dados

---

## 🔧 CORRIGINDO PROBLEMAS

### Se um teste falhar:

1. **Leia a mensagem de erro**
   - Mostra exatamente o que está errado

2. **Verifique a estrutura do banco**
   - Tabela existe?
   - Colunas estão corretas?

3. **Verifique os dados**
   - Há dados para testar?
   - Dados estão consistentes?

4. **Verifique a lógica**
   - Service está funcionando?
   - Cálculo está correto?

---

## 📊 EXEMPLO DE SAÍDA

```
╔══════════════════════════════════════════════════════════════╗
║     SISTEMA DE TESTES - GESTÃO CONDOMINIAL                  ║
╚══════════════════════════════════════════════════════════════╝

============================================================
Executando: 01-auth.test.js
============================================================
   ℹ️  Iniciando testes de autenticação...

🧪 Teste: Verificar estrutura de tabela users
   📝 Colunas encontradas: 11
   ✅ PASSOU (104ms)

🧪 Teste: Verificar estrutura de perfis
   📝 Perfis encontrados: 9
   ✅ PASSOU (5ms)

...

============================================================
RESUMO DOS TESTES
============================================================
✅ Testes Passados: 45
❌ Testes Falhados: 3
⏱️  Tempo Total: 2.34s
============================================================
```

---

## 🎯 USO RECOMENDADO

### Antes de Deploy
```bash
npm test
```
Verifica se tudo está funcionando antes de colocar em produção.

### Após Mudanças
```bash
npm test
```
Valida que as mudanças não quebraram nada.

### Diagnóstico de Problemas
```bash
npm test
```
Identifica onde está o problema.

### Validação Periódica
Execute semanalmente para garantir que o sistema está saudável.

---

## ✅ SISTEMA DE TESTES COMPLETO

**Todos os módulos foram cobertos:**
- ✅ Autenticação
- ✅ Financeiro
- ✅ Inadimplência
- ✅ Assembleias
- ✅ Fundo de Reserva
- ✅ Relatórios
- ✅ Dashboards
- ✅ Permissões
- ✅ Fluxos Completos

**Execute regularmente para manter o sistema funcionando perfeitamente!** 🎯
