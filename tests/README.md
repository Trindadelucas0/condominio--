# 🧪 TESTES DO SISTEMA DE GESTÃO CONDOMINIAL

## 📋 Descrição

Sistema completo de testes para validar todas as funcionalidades e fluxos do sistema de gestão condominial.

## 🚀 Como Executar

### Executar Todos os Testes
```bash
cd tests
node testRunner.js
```

Ou a partir da raiz do projeto:
```bash
node tests/testRunner.js
```

### Executar Testes Específicos

```bash
# Testes de autenticação
npm run test:auth

# Testes financeiros
npm run test:financeiro

# Testes de inadimplência
npm run test:inadimplencia

# Testes de assembleias
npm run test:assembleias

# Testes de fundo de reserva
npm run test:fundo

# Testes de relatórios
npm run test:relatorios

# Testes de dashboards
npm run test:dashboards

# Testes de permissões
npm run test:permissoes

# Testes de fluxos completos
npm run test:fluxos
```

## 📁 Estrutura dos Testes

### 01-auth.test.js
- Estrutura de usuários
- Perfis (roles)
- Permissões
- JWT

### 02-financeiro.test.js
- Tabelas financeiras
- Entradas e saídas
- Fechamento mensal
- Cálculos de totais

### 03-inadimplencia.test.js
- Apartamentos
- Taxas mensais
- Cálculo de inadimplência
- Multas e juros

### 04-assembleias.test.js
- Assembleias
- Participantes
- Decisões
- Documentos

### 05-fundo-reserva.test.js
- Fundo de reserva
- Rateio de despesas
- Cálculo de contribuição

### 06-relatorios.test.js
- Relatórios gerados
- PDFKit
- Estrutura de arquivos

### 07-dashboards.test.js
- Dashboard do síndico
- Cálculos de métricas
- Alertas

### 08-permissoes.test.js
- Estrutura de permissões
- Atribuição de perfis
- Mapeamento de rotas

### 09-fluxos-completos.test.js
- Fluxo financeiro completo
- Fluxo de inadimplência
- Fluxo de assembleia
- Fluxo de ocorrência
- Integridade dos dados

## 📊 Saída dos Testes

Os testes mostram logs detalhados no console com:
- ✅ Testes que passaram
- ❌ Testes que falharam
- ⚠️  Avisos
- 📝 Detalhes de execução
- ℹ️  Informações

## 🔍 O que os Testes Verificam

1. **Estrutura do Banco de Dados**
   - Tabelas existem
   - Colunas corretas
   - Constraints presentes

2. **Dados Existentes**
   - Quantidade de registros
   - Integridade referencial
   - Status dos dados

3. **Funcionalidades**
   - Cálculos funcionando
   - Services respondendo
   - Lógica de negócio correta

4. **Fluxos Completos**
   - Sequência de operações
   - Validações
   - Estados corretos

## ⚙️ Configuração

Os testes usam a mesma configuração do sistema principal:
- `.env` para conexão com banco
- Mesmas credenciais de acesso
- Mesma estrutura de dados

## 📝 Notas

- Os testes são **não-destrutivos** (não alteram dados)
- Podem ser executados em produção (apenas leitura)
- Mostram logs detalhados para debug
- Identificam problemas rapidamente

---

**Execute os testes regularmente para garantir que o sistema está funcionando corretamente!** ✅
