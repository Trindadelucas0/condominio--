# 📖 GUIA DE USO - MELHORIAS DO MÓDULO SÍNDICO

Este guia explica como usar todas as novas funcionalidades implementadas no módulo Síndico.

---

## 🔍 1. BUSCA POR TEXTO

### Onde está disponível:
- ✅ **Tarefas** (`/sindico/tarefas`)
- ✅ **Alertas** (`/sindico/alertas`)
- ✅ **Logs de Auditoria** (`/sindico/logs`)
- ✅ **Ocorrências** (`/sindico/ocorrencias`)
- ✅ **Aprovações** (`/sindico/aprovacoes`)

### Como usar:
1. Localize o campo **"Buscar"** no topo da página, com ícone de lupa 🔍
2. Digite qualquer texto relacionado ao que procura:
   - **Tarefas**: título, descrição, nome do criador
   - **Alertas**: título, mensagem, tipo de alerta
   - **Logs**: módulo, ação, nome do usuário
   - **Ocorrências**: título, descrição, apartamento
   - **Aprovações**: tipo, descrição, valor
3. Pressione **Enter** ou clique no botão **"Buscar"**
4. Os resultados serão filtrados instantaneamente

### Dica:
A busca é **case-insensitive** (não diferencia maiúsculas/minúsculas) e procura em múltiplos campos simultaneamente.

---

## 📄 2. PAGINAÇÃO REAL

### Onde está disponível:
- ✅ Todas as listagens acima mencionadas

### Como usar:
1. Na parte inferior de qualquer lista, você verá:
   - **Contador**: "Mostrando X até Y de Z registros"
   - **Página atual**: "(Página N de M)"
   - **Botões**: "Anterior" ← e "Próxima" →

2. Navegue entre páginas clicando nos botões
3. **Os filtros são preservados** ao mudar de página (busca, status, etc.)

### Configuração:
- **Padrão**: 20 registros por página
- Pode ser ajustado nas configurações (via query string `?perPage=50`)

---

## 📊 3. RELATÓRIOS (PDF E EXCEL)

### Onde está disponível:
- ✅ **Aprovações Pendentes** (`/sindico/aprovacoes`)

### Como usar:
1. Acesse `/sindico/aprovacoes`
2. No topo da página, você verá dois botões:
   - **📊 Exportar Excel** (botão verde)
   - **📄 Exportar PDF** (botão vermelho)
3. Clique no formato desejado
4. O arquivo será gerado e baixado automaticamente

### O que inclui o relatório:
- ✅ Lista completa de aprovações pendentes
- ✅ Tipo de aprovação (Saída, Entrada, Orçamento, etc.)
- ✅ Valores e descrições
- ✅ Datas de criação e vencimento
- ✅ Status atual
- ✅ Ordenação por valor ou data

---

## ✅ 4. VALIDAÇÃO DE SALDO ANTES DE APROVAR

### Onde funciona:
- ✅ **Aprovação de Saídas Financeiras** (`/sindico/saidas-pendentes`)

### Como funciona:
1. Quando você tenta aprovar uma saída financeira
2. O sistema **automaticamente verifica** se há saldo suficiente
3. **Se não houver saldo suficiente**, você verá uma mensagem de erro:
   ```
   ❌ Erro: Saldo insuficiente para aprovar esta saída.
   Valor solicitado: R$ X.XXX,XX
   Saldo disponível: R$ Y.YYY,YY
   ```
4. **Se houver saldo suficiente**, a aprovação será processada normalmente

### Observação:
Esta validação previne que o condomínio tenha saldo negativo após aprovações.

---

## ⚙️ 5. PERSONALIZAÇÃO DO DASHBOARD

### Onde está:
- ✅ **Dashboard Síndico** (`/sindico/dashboard`)

### Como usar:
1. Acesse o Dashboard Síndico
2. No topo direito, clique no botão **"⚙️ Personalizar"**
3. Um modal será aberto com todos os widgets disponíveis

### Funcionalidades:
1. **Mostrar/Ocultar Widgets**:
   - Marque ou desmarque a caixa de seleção ao lado de cada widget
   - Widgets desmarcados não aparecerão no dashboard

2. **Reorganizar Ordem**:
   - Clique e **arraste** os widgets para cima ou para baixo
   - A ordem na lista define a ordem de exibição no dashboard

3. **Salvar Configuração**:
   - Após ajustar, clique em **"💾 Salvar Configuração"**
   - A página será recarregada com suas preferências aplicadas

### Widgets Disponíveis:
- Aprovações Pendentes
- Alertas Críticos
- Alertas de Aviso
- Saldo Financeiro
- Gastos do Mês
- Inadimplência
- Despesas Pendentes
- Tarefas Atrasadas
- Ocorrências Abertas
- Gráficos e Estatísticas

### Importante:
- Cada usuário tem sua própria configuração
- A configuração é salva no banco de dados e persistida entre sessões
- Você pode voltar e ajustar a qualquer momento

---

## 🚀 6. MELHORIAS DE PERFORMANCE

### Cache de Estatísticas:
- O dashboard usa **cache** para estatísticas pesadas
- Cache expira em **5 minutos**
- Se você atualizar dados, o cache é invalidado automaticamente

### Queries Otimizadas:
- Queries foram otimizadas para evitar o problema **N+1**
- Uso de **JOINs** em vez de múltiplas consultas
- Resultado: páginas carregam mais rápido

---

## 🛡️ 7. MENSAGENS DE ERRO MELHORADAS

### Antes:
```
Error: Cannot approve exit
```

### Agora:
```
❌ Erro: Saldo insuficiente para aprovar esta saída.
Valor solicitado: R$ 1.500,00
Saldo disponível: R$ 800,50
Por favor, verifique o saldo antes de aprovar.
```

### Onde funciona:
- ✅ Todas as aprovações
- ✅ Operações financeiras
- ✅ Validações de negócio
- ✅ Mensagens de permissão

---

## 📋 8. RESUMO DAS FUNCIONALIDADES

| Funcionalidade | Página | Como Acessar |
|----------------|--------|--------------|
| **Busca por Texto** | Todas as listagens | Campo de busca no topo |
| **Paginação** | Todas as listagens | Botões no rodapé |
| **Exportar Excel** | Aprovações | Botão verde "📊 Exportar Excel" |
| **Exportar PDF** | Aprovações | Botão vermelho "📄 Exportar PDF" |
| **Validação de Saldo** | Saídas Pendentes | Automático ao aprovar |
| **Personalizar Dashboard** | Dashboard | Botão "⚙️ Personalizar" |
| **Mensagens Melhoradas** | Todas | Automático em erros |

---

## 💡 DICAS E TRUQUES

### 1. Combine Busca + Filtros:
- Use busca por texto junto com filtros de status
- Exemplo: Buscar "elevador" + Status "Pendente"

### 2. Use Relatórios para Reuniões:
- Exporte relatórios em PDF para apresentar em reuniões
- Exporte em Excel para análise em planilhas

### 3. Personalize Seu Dashboard:
- Oculte widgets que não usa
- Coloque os mais importantes no topo
- Economize tempo ao abrir o sistema

### 4. Aproveite o Cache:
- Se o dashboard estiver lento, aguarde alguns segundos
- O cache será atualizado automaticamente

---

## ❓ TROUBLESHOOTING

### A busca não está funcionando:
- Verifique se você digitou algo no campo
- Limpe os filtros e tente novamente
- Verifique sua conexão com o servidor

### A paginação não aparece:
- Isso significa que há menos de 20 registros
- Aumente o número de registros por página (se configurado)

### O relatório não baixa:
- Verifique seu bloqueador de pop-ups
- Certifique-se de ter permissão para baixar arquivos
- Tente novamente após alguns segundos

### A personalização não salva:
- Verifique se você clicou em "Salvar Configuração"
- Recarregue a página (F5) e tente novamente
- Verifique seu console do navegador (F12) para erros

---

## 📞 SUPORTE

Se você encontrar problemas ou tiver dúvidas:
1. Verifique este guia novamente
2. Verifique os logs do sistema (`/sindico/logs`)
3. Entre em contato com o administrador do sistema

---

**Última atualização**: Dezembro 2024
**Versão do Sistema**: 2.0 (Com Melhorias)
