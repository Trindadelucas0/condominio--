# 📋 FLUXO DO SISTEMA DE GESTÃO CONDOMINIAL
## Guia Explicativo para o Cliente

---

## 🎯 VISÃO GERAL

Este sistema gerencia todas as atividades de um condomínio de forma organizada e controlada. Cada pessoa tem um papel específico e só pode fazer o que é permitido para seu perfil.

**Princípio fundamental:** 
- Quem executa tarefas não toma decisões
- Quem toma decisões não executa tarefas
- Quem administra o sistema não administra o condomínio

---

## 👥 PERFIS DO SISTEMA

### 1. **SUPER MASTER** (Administrador do Sistema)
- Cria e gerencia condomínios
- Cria e gerencia usuários
- Define quem tem qual perfil
- **NÃO** gerencia o dia a dia do condomínio

### 2. **SÍNDICO / SUBSÍNDICO** (Tomador de Decisões)
- Vê o panorama geral do condomínio
- **Aprova ou rejeita** despesas acima de um valor
- Visualiza alertas e problemas
- **NÃO** cria tarefas ou executa trabalhos
- **NÃO** cria usuários

### 3. **ADMINISTRATIVO** (Organizador)
- Cria tarefas para o operacional
- Define prazos e responsáveis
- Cadastra documentos
- Registra despesas e receitas
- Gerencia patrimônio
- **NÃO** executa tarefas
- **NÃO** aprova despesas altas (isso é do síndico)

### 4. **OPERACIONAL** (Executor)
- Faz o checklist diário
- Marca tarefas como feitas ou não feitas
- **Conclui tarefas com formulário estruturado** (sucesso, contratempos, tempo, qualidade)
- Cria ocorrências (problemas encontrados)
- **Resolve ocorrências com formulário estruturado** (método, custo, complicações, medidas preventivas)
- Vê apenas suas tarefas
- **NÃO** vê informações financeiras
- **NÃO** aprova nada
- **NÃO** cria tarefas

### 5. **CONSELHO** (Fiscalizador)
- Apenas visualiza informações
- Não pode criar, editar ou aprovar nada
- Serve para acompanhar o que está acontecendo

---

## 🏠 PAINEL DO SÍNDICO - O QUE APARECE E DE ONDE VEM

Quando o síndico entra no sistema, ele vê um painel com várias informações. Vamos explicar cada uma:

---

### 📊 **APROVAÇÕES PENDENTES**

**O que é:** Despesas que precisam da aprovação do síndico antes de serem pagas.

**Quem gera:** 
- O **ADMINISTRATIVO** cria uma despesa (saída financeira)
- Se o valor for acima de um limite configurado, o sistema **automaticamente** cria uma aprovação pendente

**Fluxo:**
1. Administrativo registra uma despesa de R$ 5.000,00 (exemplo: reforma do elevador)
2. Sistema verifica: "Esse valor precisa de aprovação?"
3. Se sim, cria uma aprovação pendente
4. Aprovação aparece no painel do síndico
5. Síndico pode:
   - **Aprovar** → Despesa fica liberada para pagamento
   - **Rejeitar** → Despesa não pode ser paga (com motivo obrigatório)

**Onde ver:** Menu "Aprovações" no painel do síndico

---

### 🚨 **ALERTAS CRÍTICOS E AVISOS**

**O que é:** Avisos automáticos sobre problemas que precisam de atenção.

**Quem gera:** O **SISTEMA AUTOMATICAMENTE** cria alertas quando:
- Uma tarefa está atrasada há mais de 48 horas → Alerta CRÍTICO
- Uma tarefa está atrasada há menos de 48 horas → Alerta AVISO
- Uma ocorrência está atrasada no atendimento
- Um documento está próximo do vencimento
- Uma tarefa/ocorrência foi escalada (muito atrasada)

**Fluxo:**
1. Sistema verifica periodicamente:
   - Tarefas com prazo vencido
   - Ocorrências com SLA vencido
   - Documentos próximos de vencer
2. Se encontrar problemas, cria alertas automaticamente
3. Alertas aparecem no painel do síndico
4. Síndico pode resolver ou justificar o alerta

**Onde ver:** Menu "Alertas" no painel do síndico

---

### 💰 **DESPESAS PENDENTES**

**O que é:** Despesas que foram registradas mas ainda não foram pagas.

**Quem gera:** 
- O **ADMINISTRATIVO** registra despesas (contas de água, luz, manutenções, etc.)

**Fluxo:**
1. Administrativo cadastra uma despesa
2. Se valor for alto, precisa de aprovação do síndico primeiro
3. Após aprovação (ou se não precisar), despesa fica pendente
4. Administrativo marca como "paga" quando efetivamente pagar
5. Contador mostra quantas despesas ainda estão pendentes

**Onde ver:** Dashboard do síndico mostra o total de despesas pendentes

---

### ⏰ **TAREFAS ATRASADAS**

**O que é:** Tarefas que passaram do prazo e ainda não foram concluídas.

**Quem gera:**
- O **ADMINISTRATIVO** cria tarefas e define prazos
- O **OPERACIONAL** recebe e executa as tarefas
- O **SISTEMA** verifica automaticamente quais estão atrasadas

**Fluxo:**
1. Administrativo cria uma tarefa:
   - Exemplo: "Limpar área comum do 5º andar"
   - Define prazo: "Hoje às 18h"
   - Define responsável: "João (operacional)"
2. Tarefa aparece para o operacional
3. Operacional executa e marca itens do checklist
4. **Ao concluir, operacional preenche formulário estruturado:**
   - Foi bem sucedida? (obrigatório)
   - Observações finais
   - Teve contratempos?
   - Tempo gasto
   - Qualidade da execução
5. Se o prazo passar e a tarefa não for concluída:
   - Sistema cria alerta automaticamente
   - Contador de "tarefas atrasadas" aumenta
6. Síndico vê quantas tarefas estão atrasadas no painel
7. **Síndico e Administrativo podem ver todas as informações de conclusão** para análise

**Onde ver:** Dashboard do síndico mostra total de tarefas atrasadas

---

### 📝 **OCORRÊNCIAS ABERTAS**

**O que é:** Problemas ou situações reportadas que ainda não foram resolvidas.

**Quem gera:**
- O **OPERACIONAL** cria ocorrências quando encontra problemas
- Exemplos: "Vazamento no corredor", "Lâmpada queimada", "Porta quebrada"

**Fluxo:**
1. Operacional encontra um problema
2. Cria uma ocorrência no sistema:
   - Título: "Vazamento no 3º andar"
   - Descrição: "Água vazando do teto"
   - Prioridade: Alta/Média/Baixa
3. Ocorrência fica com status "ABERTA" ou "EM ATENDIMENTO"
4. Sistema verifica se está atrasada (baseado em SLA)
5. **Operacional resolve a ocorrência preenchendo formulário estruturado:**
   - Foi resolvida com sucesso? (obrigatório)
   - Notas de resolução (obrigatório)
   - Método utilizado (Interna/Terceiro/Manutenção/Outra)
   - Custo (se houver)
   - Teve complicações?
   - Tempo gasto
   - Medidas preventivas tomadas
6. Ocorrência é marcada como "RESOLVIDA" com todos os dados estruturados
7. Contador mostra quantas ocorrências ainda estão abertas
8. **Síndico pode ver todas as informações de resolução** para análise completa

**Onde ver:** Dashboard do síndico mostra total de ocorrências abertas

---

## 🔄 FLUXO COMPLETO DO SISTEMA

### **CENÁRIO 1: DESPESA QUE PRECISA DE APROVAÇÃO**

```
1. ADMINISTRATIVO registra despesa de R$ 8.000,00
   ↓
2. Sistema verifica: "Valor acima do limite? SIM"
   ↓
3. Sistema cria APROVAÇÃO PENDENTE automaticamente
   ↓
4. APROVAÇÃO aparece no painel do SÍNDICO
   ↓
5. SÍNDICO decide:
   - APROVAR → Despesa liberada para pagamento
   - REJEITAR → Despesa bloqueada (com motivo)
   ↓
6. Se aprovada, ADMINISTRATIVO pode marcar como "paga"
   ↓
7. Sistema registra tudo nos logs de auditoria
```

---

### **CENÁRIO 2: TAREFA CRIADA E CONCLUÍDA COM DADOS ESTRUTURADOS**

```
1. ADMINISTRATIVO cria tarefa:
   - "Limpar elevador social"
   - Prazo: Hoje 16h
   - Responsável: Maria (operacional)
   ↓
2. Tarefa aparece para MARIA (operacional)
   ↓
3. Maria executa a tarefa e marca itens do checklist
   ↓
4. Maria clica em "Concluir Tarefa" e preenche formulário estruturado:
   * Foi concluída com sucesso? (Sim/Não) - OBRIGATÓRIO
   * Observações finais
   * Teve contratempos? (Sim/Não)
   * Descrição dos contratempos (se houver)
   * Tempo gasto (em minutos)
   * Qualidade da execução (Excelente/Bom/Regular/Ruim)
   ↓
5. Sistema salva todos os dados estruturados na tarefa
   ↓
6. Tarefa fica com status "COMPLETED"
   ↓
7. Sistema registra tudo nos logs de auditoria
   ↓
8. ADMINISTRATIVO e SÍNDICO podem ver todas as informações de conclusão:
   - Se foi bem sucedida
   - Observações
   - Contratempos (se houver)
   - Tempo gasto
   - Qualidade da execução
   ↓
9. Se Maria não concluir até 16h:
   - Sistema verifica automaticamente (a cada X minutos)
   - Cria ALERTA automaticamente
   - Sistema cria NOTIFICAÇÃO para responsável e criador
   - Se muito atrasada (> 48h), ESCALONA para SÍNDICO
   - Contador de "tarefas atrasadas" aumenta no painel do síndico
```

---

### **CENÁRIO 3: OCORRÊNCIA CRIADA E RESOLVIDA PELO OPERACIONAL**

```
1. OPERACIONAL encontra problema:
   - "Lâmpada queimada no corredor do 2º andar"
   ↓
2. OPERACIONAL cria ocorrência:
   - Título: "Lâmpada queimada"
   - Descrição: "Corredor 2º andar, precisa trocar"
   - Prioridade: Média
   ↓
3. Ocorrência fica com status "ABERTA"
   ↓
4. Sistema verifica SLA (prazo de atendimento):
   - Se passar do prazo, cria alerta
   ↓
5. OPERACIONAL resolve a ocorrência (ou ADMINISTRATIVO cria tarefa):
   - Preenche formulário estruturado de resolução:
     * Foi resolvida com sucesso? (Sim/Não)
     * Notas de resolução (obrigatório)
     * Método utilizado (Interna/Terceiro/Manutenção/Outra)
     * Custo (se houver)
     * Teve complicações? (Sim/Não)
     * Descrição das complicações (se houver)
     * Tempo gasto
     * Medidas preventivas tomadas
   ↓
6. Ocorrência é marcada como "RESOLVIDA" com todos os dados estruturados
   ↓
7. Sistema registra tudo nos logs de auditoria
   ↓
8. Contador de "ocorrências abertas" diminui
   ↓
9. SÍNDICO pode ver todas as informações de resolução no dashboard
```

---

## 📱 MÓDULOS DO SISTEMA

### **1. PAINEL DO SÍNDICO**

**O que faz:**
- Mostra visão geral do condomínio
- Aprova ou rejeita despesas
- Visualiza alertas e resolve
- Vê logs de auditoria (histórico de tudo)

**O que NÃO faz:**
- Não cria tarefas
- Não executa trabalhos
- Não cria usuários

---

### **2. PAINEL ADMINISTRATIVO**

**O que faz:**
- Cria tarefas e define prazos
- Cadastra documentos
- Registra receitas e despesas
- Gerencia patrimônio (ativos)
- Cria manutenções

**O que NÃO faz:**
- Não executa tarefas (isso é do operacional)
- Não aprova despesas altas (isso é do síndico)

---

### **3. PAINEL OPERACIONAL**

**O que faz:**
- Faz checklist diário
- Marca tarefas como feitas/não feitas
- Cria ocorrências (problemas encontrados)
- Vê apenas suas tarefas

**O que NÃO faz:**
- Não vê informações financeiras
- Não cria tarefas
- Não aprova nada

---

### **4. PAINEL FINANCEIRO**

**O que faz:**
- Registra entradas (receitas, taxas)
- Registra saídas (despesas)
- Gerencia centros de custo
- Cadastra contas recorrentes (água, luz, gás)
- Mostra fluxo de caixa

**Regras:**
- Despesas acima do limite precisam de aprovação do síndico
- Despesas pagas não podem ser editadas
- Despesas aprovadas podem ser marcadas como pagas

---

### **5. PAINEL PATRIMÔNIO**

**O que faz:**
- Cadastra ativos (elevadores, bombas, equipamentos)
- Registra manutenções
- Calcula depreciação automaticamente
- Mostra histórico de cada ativo

**Regras:**
- Histórico não pode ser editado (imutável)
- Depreciação é calculada automaticamente

---

## 🤖 AUTOMAÇÕES DO SISTEMA

O sistema funciona automaticamente em segundo plano:

### **1. Verificação de SLA**
- Verifica tarefas e ocorrências atrasadas
- Cria alertas automaticamente
- Envia notificações para responsáveis

### **2. Escalonamento**
- Se tarefa/ocorrência muito atrasada (> 48h)
- Sistema notifica o síndico automaticamente
- Cria alerta crítico

### **3. Alertas de Documentos**
- Verifica documentos próximos do vencimento
- Cria alertas para o administrativo

### **4. Notificações**
- Cria notificações quando há algo importante
- Usuários veem notificações não lidas
- Notificações não podem ser apagadas (apenas resolvidas ou justificadas)

---

## 📊 DASHBOARDS - O QUE CADA UM VÊ

### **SÍNDICO vê:**
- Aprovações pendentes (com valores)
- Alertas críticos e avisos
- Saldo financeiro (entradas - saídas pagas)
- Despesas pendentes
- Tarefas atrasadas
- Ocorrências abertas
- Resumo financeiro

### **ADMINISTRATIVO vê:**
- Tarefas criadas e status
- Documentos e vencimentos
- Financeiro (entradas/saídas)
- Patrimônio (ativos)

### **OPERACIONAL vê:**
- Suas tarefas pendentes
- Checklist diário
- Ocorrências que ele criou
- Estatísticas pessoais

---

## 🔍 LOGS DE AUDITORIA

**O que é:** Registro de TODAS as ações no sistema.

**O que registra:**
- Quem fez (usuário)
- O que fez (ação: criar, editar, aprovar, etc.)
- Quando fez (data e hora)
- O que mudou (antes e depois)
- De onde fez (IP e navegador)

**Regras:**
- Logs NÃO podem ser editados ou apagados
- Logs são imutáveis (para segurança e auditoria)
- Síndico pode ver logs do condomínio
- Master pode ver logs de todos os condomínios

**Onde ver:** Menu "Logs" no painel do síndico

---

## ✅ RESUMO - QUEM FAZ O QUÊ

| Ação | Quem Faz | Quem Vê |
|------|----------|---------|
| Criar tarefa | Administrativo | Operacional (atribuído) |
| Executar tarefa | Operacional | Administrativo e Síndico |
| Criar ocorrência | Operacional | Administrativo e Síndico |
| Registrar despesa | Administrativo | Síndico (se precisar aprovar) |
| Aprovar despesa | Síndico | Administrativo |
| Marcar despesa como paga | Administrativo | Síndico |
| Criar alerta | Sistema (automático) | Síndico |
| Criar usuário | Master | Master |
| Ver logs | Síndico/Master | Síndico/Master |

---

## 🎯 PRINCÍPIOS DO SISTEMA

1. **Separação de Responsabilidades**
   - Quem executa não decide
   - Quem decide não executa

2. **Controle e Auditoria**
   - Tudo é registrado
   - Nada pode ser apagado (apenas desativado)
   - Histórico imutável

3. **Automação**
   - Sistema verifica problemas automaticamente
   - Cria alertas e notificações
   - Escalona quando necessário

4. **Segurança**
   - Cada perfil só vê o que precisa
   - Aprovações obrigatórias para valores altos
   - Logs de todas as ações

---

## 📞 COMO USAR

### **Para o SÍNDICO:**
1. Entre no sistema
2. Veja o dashboard com resumo
3. Clique em "Aprovações" para aprovar/rejeitar despesas
4. Clique em "Alertas" para ver e resolver problemas
5. Clique em "Logs" para ver histórico de ações

### **Para o ADMINISTRATIVO:**
1. Crie tarefas e defina prazos
2. Registre receitas e despesas
3. Cadastre documentos
4. Gerencie patrimônio

### **Para o OPERACIONAL:**
1. Veja suas tarefas
2. Faça o checklist diário
3. Marque tarefas como feitas
4. Crie ocorrências quando encontrar problemas

---

## 🔄 FLUXO TÍPICO DE UM DIA

**Manhã:**
- Operacional faz checklist diário
- Marca tarefas como feitas ou não feitas
- Cria ocorrências se encontrar problemas

**Durante o dia:**
- Administrativo cria novas tarefas
- Registra despesas e receitas
- Sistema verifica automaticamente tarefas atrasadas

**Fim do dia:**
- Síndico entra e vê o dashboard
- Revisa aprovações pendentes
- Aprova ou rejeita despesas
- Resolve alertas críticos
- Verifica logs se necessário

---

## ❓ PERGUNTAS FREQUENTES

**P: Por que o síndico não pode criar tarefas?**
R: Porque o síndico toma decisões, não executa. Criar tarefas é função do administrativo.

**P: Por que o operacional não vê informações financeiras?**
R: Porque ele executa tarefas, não precisa ver finanças. Isso é privacidade e segurança.

**P: O que acontece se uma despesa for rejeitada?**
R: Ela não pode ser marcada como paga. O administrativo precisa criar uma nova despesa ou ajustar.

**P: Os alertas somem sozinhos?**
R: Não. Alertas precisam ser resolvidos ou justificados pelo síndico.

**P: Posso apagar um log?**
R: Não. Logs são imutáveis para garantir auditoria e segurança.

**P: Quem pode criar usuários?**
R: Apenas o SUPER MASTER (administrador do sistema).

---

## 📝 CONCLUSÃO

Este sistema foi projetado para:
- ✅ Organizar todas as atividades do condomínio
- ✅ Garantir controle e aprovações necessárias
- ✅ Automatizar verificações e alertas
- ✅ Manter histórico completo de tudo
- ✅ Separar responsabilidades claramente

Cada pessoa tem seu papel e o sistema garante que tudo funcione de forma organizada e controlada.
