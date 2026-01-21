# 🎬 GUIA COMPLETO DE TESTE - DADOS FICTÍCIOS E FLUXOS

**Versão:** 1.0  
**Data:** Janeiro 2026  
**Objetivo:** Guia passo a passo para testar o sistema completo com dados fictícios, incluindo todos os departamentos, fluxos e funcionalidades.

---

## 📋 ÍNDICE

1. [DADOS FICTÍCIOS PARA TESTE](#1-dados-fictícios-para-teste)
2. [FLUXO 1: CONFIGURAÇÃO INICIAL (MASTER)](#2-fluxo-1-configuração-inicial-master)
3. [FLUXO 2: OPERACIONAL - Checklist e Tarefas](#3-fluxo-2-operacional---checklist-e-tarefas)
4. [FLUXO 3: OPERACIONAL - Ocorrências](#4-fluxo-3-operacional---ocorrências)
5. [FLUXO 4: ADMINISTRATIVO - Triagem de Ocorrências](#5-fluxo-4-administrativo---triagem-de-ocorrências)
6. [FLUXO 5: ADMINISTRATIVO - Criação de Tarefas](#6-fluxo-5-administrativo---criação-de-tarefas)
7. [FLUXO 6: FINANCEIRO - Entradas e Saídas](#7-fluxo-6-financeiro---entradas-e-saídas)
8. [FLUXO 7: FINANCEIRO - Orçamentos](#8-fluxo-7-financeiro---orçamentos)
9. [FLUXO 8: SÍNDICO - Aprovações](#9-fluxo-8-síndico---aprovações)
10. [FLUXO 9: SÍNDICO - Observações](#10-fluxo-9-síndico---observações)
11. [FLUXO 10: FLUXO COMPLETO INTEGRADO](#11-fluxo-10-fluxo-completo-integrado)
12. [ONDE APARECEM NOTIFICAÇÕES](#12-onde-aparecem-notificações)

---

## 1. DADOS FICTÍCIOS PARA TESTE

### 🏢 **CONDOMÍNIO**

```
Nome: Residencial Jardim das Flores
CNPJ: 12.345.678/0001-90
Endereço: Rua das Flores, 123 - Bairro Centro
Cidade: São Paulo - SP
CEP: 01234-567
Telefone: (11) 3456-7890
Email: contato@jardimflores.com.br
Limite de Aprovação Financeiro: R$ 1.000,00
```

### 👥 **USUÁRIOS PARA TESTE**

#### **SUPER_MASTER**
```
Nome: Admin Master
Email: master@teste.com
Senha: admin123
Perfil: SUPER_MASTER
```

#### **SÍNDICO**
```
Nome: João Silva
Email: sindico@teste.com
Senha: sindico123
Perfil: SINDICO
Condomínio: Residencial Jardim das Flores
```

#### **FINANCEIRO**
```
Nome: Maria Santos
Email: financeiro@teste.com
Senha: financeiro123
Perfil: FINANCEIRO
Condomínio: Residencial Jardim das Flores
```

#### **ADMINISTRATIVO**
```
Nome: Carlos Oliveira
Email: administrativo@teste.com
Senha: admin123
Perfil: ADMINISTRATIVO
Condomínio: Residencial Jardim das Flores
```

#### **OPERACIONAL**
```
Nome: Pedro Costa
Email: operacional@teste.com
Senha: operacional123
Perfil: OPERACIONAL
Condomínio: Residencial Jardim das Flores
```

#### **LIMPEZA**
```
Nome: Ana Lima
Email: limpeza@teste.com
Senha: limpeza123
Perfil: LIMPEZA
Condomínio: Residencial Jardim das Flores
```

---

## 2. FLUXO 1: CONFIGURAÇÃO INICIAL (MASTER)

### 🎯 **OBJETIVO:** Criar condomínio e usuários para teste

### **PASSO 1: Login como MASTER**

1. **Acesse:** `http://localhost:3000/auth/login`
2. **Preencha:**
   - Email: `master@teste.com`
   - Senha: `admin123`
3. **Clique:** Botão **"Entrar"**
4. **Resultado:** Redirecionado para `/master/dashboard`

### **PASSO 2: Criar Condomínio**

1. **No menu superior:** Clique em **"Condomínios"**
2. **URL:** `/master/condominios`
3. **Clique:** Botão **"Novo Condomínio"** (canto superior direito)
4. **URL:** `/master/condominios/novo`
5. **Preencha o formulário:**
   ```
   Nome: Residencial Jardim das Flores
   CNPJ: 12345678000190
   Endereço: Rua das Flores, 123
   Bairro: Centro
   Cidade: São Paulo
   Estado: SP
   CEP: 01234567
   Telefone: 1134567890
   Email: contato@jardimflores.com.br
   Limite de Aprovação Financeiro: 1000
   Status: ☑ Ativo
   ```
6. **Clique:** Botão **"Salvar"**
7. **Resultado:** 
   - Mensagem: "Condomínio criado com sucesso!"
   - Redirecionado para `/master/condominios`
   - Condomínio aparece na lista

### **PASSO 3: Criar Usuário SÍNDICO**

1. **No menu superior:** Clique em **"Usuários"**
2. **URL:** `/master/usuarios`
3. **Clique:** Botão **"Novo Usuário"**
4. **URL:** `/master/usuarios/novo`
5. **Preencha o formulário:**
   ```
   Nome: João Silva
   Email: sindico@teste.com
   Senha: sindico123
   Confirmar Senha: sindico123
   Perfis: ☑ SINDICO
   Condomínio: [Selecione] Residencial Jardim das Flores
   Status: ☑ Ativo
   ```
6. **Clique:** Botão **"Salvar"**
7. **Resultado:** Usuário criado e aparece na lista

### **PASSO 4: Criar Demais Usuários**

**Repita o PASSO 3 para criar:**

- **FINANCEIRO:** `financeiro@teste.com` / `financeiro123`
- **ADMINISTRATIVO:** `administrativo@teste.com` / `admin123`
- **OPERACIONAL:** `operacional@teste.com` / `operacional123`
- **LIMPEZA:** `limpeza@teste.com` / `limpeza123`

**Importante:** Cada usuário deve ter seu perfil correspondente selecionado e estar associado ao condomínio criado.

### **PASSO 5: Verificar Lista de Condomínios**

1. **Acesse:** `/master/condominios`
2. **O que ver:**
   - Lista com o condomínio criado
   - Colunas: Nome, CNPJ, Cidade, Status
   - Botões: Editar, Ver Detalhes

### **PASSO 6: Editar Condomínio (Opcional)**

1. **Na lista:** Clique em **"Editar"** no condomínio
2. **URL:** `/master/condominios/[ID]/editar`
3. **Altere:** Ex: Telefone para `(11) 3456-7891`
4. **Clique:** **"Salvar"**
5. **Resultado:** Alteração salva e redirecionado para lista

---

## 3. FLUXO 2: OPERACIONAL - Checklist e Tarefas

### 🎯 **OBJETIVO:** Testar execução de checklist diário e conclusão de tarefas

### **PASSO 1: Login como OPERACIONAL**

1. **Faça logout** do MASTER (botão "Sair" no menu)
2. **Acesse:** `/auth/login`
3. **Preencha:**
   - Email: `operacional@teste.com`
   - Senha: `operacional123`
4. **Clique:** **"Entrar"**
5. **Resultado:** Redirecionado para `/operacional/dashboard`

### **PASSO 2: Visualizar Dashboard**

**O que você vê:**
- Widget: **"Minhas Tarefas Pendentes"** (número)
- Widget: **"Tarefas Atrasadas"** (número)
- Widget: **"Checklists do Dia"** (número)
- Widget: **"Ocorrências Abertas"** (número)

### **PASSO 3: Executar Checklist Diário**

1. **No menu:** Clique em **"Checklists Diários"** ou acesse `/operacional/checklists-diarios`
2. **O que ver:**
   - Lista de checklists (se houver)
   - Botão **"Iniciar Checklist"** ou **"Ver Detalhes"**
3. **Se não houver checklist:**
   - **Ação:** Volte para o SÍNDICO criar um modelo primeiro (ver FLUXO 9)
4. **Se houver checklist:**
   - Clique em **"Iniciar Checklist"** ou **"Ver Detalhes"**
   - **URL:** `/operacional/checklists-diarios/[ID]`
5. **Na tela de execução:**
   - Vê lista de itens do checklist
   - Exemplo de itens:
     ```
     ☐ Verificar portões elétricos
     ☐ Verificar iluminação externa
     ☐ Inspecionar elevadores
     ☐ Verificar sistema de água
     ☐ Limpar área comum
     ```
6. **Para cada item:**
   - **Marque o checkbox** quando concluir
   - **Adicione observação** (se necessário): Campo de texto abaixo do item
   - **Adicione foto** (opcional): Botão **"Adicionar Foto"** → Seleciona arquivo → Upload
   - **Clique:** **"Salvar Item"** (salva progresso)
7. **Após concluir todos os itens:**
   - **Clique:** Botão **"Finalizar Checklist"** (canto inferior direito)
   - **Confirmação:** Sistema pergunta "Tem certeza?"
   - **Clique:** **"Sim, Finalizar"**
8. **Resultado:**
   - Mensagem: "Checklist finalizado com sucesso!"
   - Status muda para COMPLETED
   - Redirecionado para lista de checklists

### **PASSO 4: Ver Tarefas Atribuídas**

1. **No dashboard:** Clique no widget **"Minhas Tarefas Pendentes"** OU
2. **No menu:** Clique em **"Tarefas"** OU acesse `/operacional/checklist`
3. **O que ver:**
   - Lista de tarefas atribuídas a você
   - Colunas: Título, Status, Prioridade, Prazo
   - Botões: Ver Detalhes, Concluir
4. **Exemplo de tarefas:**
   ```
   Tarefa 1: "Trocar lâmpada corredor 3º andar" - Status: PENDING
   Tarefa 2: "Verificar vazamento banheiro social" - Status: PENDING
   ```

### **PASSO 5: Concluir Tarefa**

1. **Na lista:** Clique em **"Ver Detalhes"** de uma tarefa
2. **URL:** `/operacional/checklist/[ID]` ou `/operacional/task/[ID]`
3. **O que ver:**
   - Título e descrição da tarefa
   - Status atual
   - Observações (se houver)
   - Checklist de itens (se a tarefa tiver checklist)
4. **Se tarefa tem checklist:**
   - Marque itens conforme executa
   - Adicione fotos como evidência
5. **Para completar tarefa:**
   - **Clique:** Botão **"Concluir Tarefa"** (canto superior direito)
   - **URL:** `/operacional/complete-task/[ID]`
6. **Preencha o formulário:**
   ```
   Conclusão bem sucedida? ☑ Sim
   Observações finais: "Tarefa concluída com sucesso. Lâmpada trocada."
   Tempo gasto (minutos): 30
   Qualidade da execução: [Selecione] Excelente
   Teve problemas? ☐ Não
   ```
7. **Upload de foto:**
   - **Clique:** Botão **"Escolher Arquivo"** em **"Foto do Resultado"**
   - Selecione uma foto (obrigatório)
   - Foto aparece como preview
8. **Clique:** Botão **"Confirmar Conclusão"**
9. **Resultado:**
   - Mensagem: "Tarefa concluída com sucesso!"
   - Status muda para COMPLETED
   - ADMINISTRATIVO e SÍNDICO recebem notificação
   - Redirecionado para lista de tarefas

---

## 4. FLUXO 3: OPERACIONAL - Ocorrências

### 🎯 **OBJETIVO:** Criar e resolver ocorrências

### **PASSO 1: Criar Nova Ocorrência**

1. **No menu:** Clique em **"Ocorrências"** OU acesse `/operacional/ocorrencias`
2. **Clique:** Botão **"Nova Ocorrência"** (canto superior direito)
3. **URL:** `/operacional/ocorrencias/nova`
4. **Preencha o formulário:**
   ```
   Título: Vazamento no 3º Andar
   Descrição: Vazamento no corredor próximo ao apartamento 301. Água escorrendo pela parede.
   Localização: Corredor 3º Andar, Bloco A
   Tipo: [Selecione] Hidráulica
   Prioridade: [Selecione] URGENT
   Observações: Necessário atendimento imediato
   ```
5. **Upload de foto (OBRIGATÓRIO):**
   - **Clique:** Botão **"Escolher Arquivo"** em **"Foto da Ocorrência"**
   - Selecione uma foto
   - Foto aparece como preview
6. **Clique:** Botão **"Salvar"**
7. **Resultado:**
   - Mensagem: "Ocorrência criada com sucesso!"
   - **Se prioridade = URGENT:** Status = PENDING_SINDICO_APPROVAL
   - **Se prioridade ≠ URGENT:** Status = ABERTA (vai direto para ADMINISTRATIVO)
   - SÍNDICO recebe notificação (se URGENT)
   - Redirecionado para lista de ocorrências

### **PASSO 2: Ver Detalhes da Ocorrência**

1. **Na lista:** Clique em **"Ver Detalhes"** da ocorrência criada
2. **URL:** `/operacional/ocorrencias/[ID]`
3. **O que ver:**
   - Título, descrição, localização
   - Foto(s) da ocorrência
   - Status atual
   - Observações do ADMINISTRATIVO/SÍNDICO (se houver)
   - Histórico de atualizações

### **PASSO 3: Resolver Ocorrência**

**IMPORTANTE:** Só é possível resolver ocorrências que foram atribuídas a você pelo ADMINISTRATIVO.

1. **Na lista de ocorrências:** Procure ocorrência com status **"EM_ATENDIMENTO"** ou **"ABERTA"**
2. **Clique:** **"Resolver"** ou **"Ver Detalhes"**
3. **Na tela de detalhes:** Clique em **"Resolver Ocorrência"**
4. **URL:** `/operacional/ocorrencias/[ID]/resolver`
5. **Preencha o formulário:**
   ```
   Descrição da Resolução: Vazamento corrigido. Troquei a válvula danificada e vedei a conexão.
   Custo: 150.00
   Tempo Gasto (minutos): 45
   Observações: Material utilizado: válvula nova e vedação
   ```
6. **Upload de foto (OBRIGATÓRIO):**
   - **Clique:** Botão **"Escolher Arquivo"** em **"Foto(s) da Resolução"**
   - Selecione foto mostrando problema resolvido
   - Foto aparece como preview
7. **Clique:** Botão **"Confirmar Resolução"**
8. **Resultado:**
   - Mensagem: "Ocorrência resolvida com sucesso!"
   - Status muda para RESOLVIDA
   - ADMINISTRATIVO recebe notificação
   - Redirecionado para lista de ocorrências

---

## 5. FLUXO 4: ADMINISTRATIVO - Triagem de Ocorrências

### 🎯 **OBJETIVO:** Triar ocorrências e criar tarefas/orçamentos

### **PASSO 1: Login como ADMINISTRATIVO**

1. **Faça logout** do OPERACIONAL
2. **Acesse:** `/auth/login`
3. **Preencha:**
   - Email: `administrativo@teste.com`
   - Senha: `admin123`
4. **Clique:** **"Entrar"**
5. **Resultado:** Redirecionado para `/administrativo/dashboard`

### **PASSO 2: Visualizar Dashboard**

**O que você vê:**
- Widget: **"Tarefas Pendentes"** (número)
- Widget: **"Ocorrências Abertas"** (número)
- Widget: **"Documentos Vencendo"** (número)
- Widget: **"Orçamentos Pendentes"** (número)

### **PASSO 3: Triar Ocorrência**

1. **No menu:** Clique em **"Ocorrências"** OU acesse `/administrativo/ocorrencias`
2. **Filtre:** Clique em **"Pendentes"** ou **"Aguardando Triagem"**
3. **O que ver:**
   - Lista de ocorrências aguardando triagem
   - Status: ABERTA (aprovada pelo síndico)
4. **Clique:** **"Triar"** na ocorrência OU clique em **"Ver Detalhes"** → Botão **"Triar"**
5. **URL:** `/administrativo/ocorrencias/[ID]/triar`
6. **Preencha o formulário de triagem:**
   ```
   Classificação: [Selecione] Hidráulico
   Prioridade: [Selecione] URGENT
   
   ☑ Criar Tarefa
   Responsável: [Selecione] Pedro Costa (OPERACIONAL)
   Prazo: 2 horas
   Descrição: [Pré-preenchida, pode editar] Corrigir vazamento no 3º andar
   
   ☑ Criar Orçamento
   Valor Estimado: 500.00
   Tipo: [Selecione] Material
   Upload Orçamento PDF: [Escolher arquivo] orcamento_vazamento.pdf
   
   Observações da Triagem: Priorizar devido ao risco de infiltração
   ```
7. **Clique:** Botão **"Confirmar Triagem"**
8. **Resultado:**
   - Mensagem: "Triagem realizada com sucesso!"
   - Status da ocorrência muda para EM_ANALISE
   - Tarefa criada automaticamente → OPERACIONAL recebe notificação
   - Orçamento criado → FINANCEIRO recebe notificação
   - Redirecionado para lista de ocorrências

### **PASSO 4: Verificar Tarefas Criadas**

1. **No menu:** Clique em **"Tarefas"**
2. **URL:** `/administrativo/tarefas`
3. **O que ver:**
   - Tarefa criada na triagem aparece na lista
   - Status: PENDING
   - Responsável: Pedro Costa
4. **Clique:** **"Ver Detalhes"** para ver informações completas

---

## 6. FLUXO 5: ADMINISTRATIVO - Criação de Tarefas

### 🎯 **OBJETIVO:** Criar tarefa manualmente

### **PASSO 1: Criar Nova Tarefa**

1. **No menu:** Clique em **"Tarefas"**
2. **Clique:** Botão **"Nova Tarefa"** (canto superior direito)
3. **URL:** `/administrativo/tarefas/nova`
4. **Preencha o formulário:**
   ```
   Título: Verificar sistema de segurança
   Descrição: Checar câmeras e sensores do sistema de segurança
   Responsável: [Selecione] Pedro Costa (OPERACIONAL)
   Prioridade: [Selecione] HIGH
   Data de Vencimento: [Selecione] 20/01/2026 17:00
   Tipo: [Selecione] Manutenção
   
   Itens de Checklist (opcional):
   Item 1: Verificar câmeras
   Item 2: Testar sensores
   Item 3: Checar gravações
   ```
5. **Clique:** Botão **"Salvar"**
6. **Resultado:**
   - Mensagem: "Tarefa criada com sucesso!"
   - OPERACIONAL recebe notificação
   - Redirecionado para lista de tarefas

### **PASSO 2: Reabrir Tarefa Concluída**

1. **Na lista:** Clique em tarefa com status COMPLETED
2. **Na tela de detalhes:** Clique em **"Reabrir Tarefa"**
3. **Preencha:**
   ```
   Motivo da Reabertura: Precisa correção adicional. Verificar novamente os sensores.
   ```
4. **Clique:** **"Confirmar Reabertura"**
5. **Resultado:**
   - Status muda para PENDING
   - OPERACIONAL recebe notificação
   - Tarefa volta para lista de pendentes

---

## 7. FLUXO 6: FINANCEIRO - Entradas e Saídas

### 🎯 **OBJETIVO:** Criar entradas/saídas, marcar como recebido/pago

### **PASSO 1: Login como FINANCEIRO**

1. **Faça logout** do ADMINISTRATIVO
2. **Acesse:** `/auth/login`
3. **Preencha:**
   - Email: `financeiro@teste.com`
   - Senha: `financeiro123`
4. **Clique:** **"Entrar"**
5. **Resultado:** Redirecionado para `/financeiro/dashboard`

### **PASSO 2: Visualizar Dashboard**

**O que você vê:**
- Widget: **"Saldo Atual"** (ex: R$ 25.000,00)
- Widget: **"Entradas Pendentes"** (número)
- Widget: **"Saídas Pendentes"** (número)
- Widget: **"Gastos do Mês"** (valor)
- Widget: **"Inadimplência"** (valor)

### **PASSO 3: Criar Nova Entrada**

1. **No menu:** Clique em **"Entradas"** OU acesse `/financeiro/entradas`
2. **Clique:** Botão **"Nova Entrada"** (canto superior direito)
3. **URL:** `/financeiro/entradas/nova`
4. **Preencha o formulário:**
   ```
   Descrição: Taxa Condomínio - Apartamento 103
   Valor: 500.00
   Data Esperada: [Selecione] 20/01/2026
   Categoria: [Selecione] Taxa Mensal
   Centro de Custo: [Selecione] Taxas Condominiais
   Observações: Referente a janeiro/2026
   ```
5. **Clique:** Botão **"Salvar"**
6. **Resultado:**
   - **Se valor ≤ R$ 1.000,00:** Aprovação automática (status = APPROVED)
   - **Se valor > R$ 1.000,00:** Status = PENDING_SINDICO (síndico aprova)
   - Mensagem: "Entrada criada com sucesso!"
   - Redirecionado para lista de entradas

### **PASSO 4: Marcar Entrada como Recebida**

1. **Na lista de entradas:** Procure entrada com status **APPROVED**
2. **Clique:** Botão **"Receber"** OU **"Ver Detalhes"** → Botão **"Marcar como Recebida"**
3. **URL:** `/financeiro/entradas/[ID]/receber`
4. **Preencha o formulário:**
   ```
   Método de Recebimento: [Selecione] Transferência
   Data de Recebimento: [Selecione] 15/01/2026
   Comprovante em PDF: [Escolher arquivo] comprovante_recebimento.pdf
   Detalhes: Transferência bancária - Número: 123456789
   Observações: Recebido via PIX
   ```
5. **Clique:** Botão **"Confirmar Recebimento"**
6. **Resultado:**
   - Mensagem: "Recebimento registrado com sucesso!"
   - Status muda para RECEIVED
   - Saldo do condomínio atualizado automaticamente
   - Redirecionado para lista de entradas

### **PASSO 5: Criar Nova Saída**

1. **No menu:** Clique em **"Saídas"** OU acesse `/financeiro/saidas`
2. **Clique:** Botão **"Nova Saída"** (canto superior direito)
3. **URL:** `/financeiro/saidas/nova`
4. **Preencha o formulário:**
   ```
   Descrição: Pagamento Fornecedor Limpeza
   Valor: 800.00
   Data de Vencimento: [Selecione] 20/01/2026
   Fornecedor: Limpeza ABC Ltda
   Categoria: [Selecione] Manutenção
   Centro de Custo: [Selecione] Limpeza
   Observações: Pagamento mensal de janeiro
   ```
5. **Clique:** Botão **"Salvar"**
6. **Resultado:**
   - **Se valor ≤ R$ 1.000,00:** Aprovação automática (status = APPROVED)
   - **Se valor > R$ 1.000,00:** Status = PENDING_SINDICO
   - Mensagem: "Saída criada com sucesso!"
   - Redirecionado para lista de saídas

### **PASSO 6: Marcar Saída como Paga**

1. **Na lista de saídas:** Procure saída com status **APPROVED**
2. **Clique:** Botão **"Pagar"** OU **"Ver Detalhes"** → Botão **"Marcar como Paga"**
3. **URL:** `/financeiro/saidas/[ID]/pagar`
4. **Preencha o formulário:**
   ```
   Comprovante em PDF: [Escolher arquivo] comprovante_pagamento.pdf
   Método de Pagamento: [Selecione] Transferência
   Data de Pagamento: [Selecione] 15/01/2026
   Detalhes: Transferência bancária - Número: 987654321
   Observações: Pagamento realizado conforme combinado
   ```
5. **Clique:** Botão **"Confirmar Pagamento"**
6. **Resultado:**
   - Mensagem: "Pagamento registrado com sucesso!"
   - Status muda para PAID
   - Saldo do condomínio atualizado automaticamente
   - Redirecionado para lista de saídas

---

## 8. FLUXO 7: FINANCEIRO - Orçamentos

### 🎯 **OBJETIVO:** Revisar e liberar orçamentos

### **PASSO 1: Revisar Orçamento Pendente**

1. **No menu:** Clique em **"Orçamentos Pendentes"** OU acesse `/financeiro/orcamentos-pendentes`
2. **O que ver:**
   - Lista de orçamentos aguardando revisão financeira
   - Status: PENDING_FINANCEIRO
   - Criado pelo ADMINISTRATIVO
3. **Clique:** **"Revisar"** no orçamento
4. **URL:** `/financeiro/orcamentos/[ID]/revisar`
5. **Preencha:**
   ```
   Observações do Financeiro: Orçamento dentro do esperado. Valor adequado para o serviço.
   Centro de Custo: [Selecione] Manutenção
   ```
6. **Clique:** Botão **"Enviar para Síndico"**
7. **Resultado:**
   - Mensagem: "Orçamento enviado para aprovação do síndico!"
   - Status muda para PENDING_SINDICO
   - SÍNDICO recebe notificação
   - Redirecionado para lista de orçamentos

### **PASSO 2: Liberar Orçamento Aprovado**

**IMPORTANTE:** Só é possível liberar após o SÍNDICO aprovar.

1. **No menu:** Clique em **"Orçamentos Aprovados"** OU acesse `/financeiro/orcamentos-aprovados`
2. **O que ver:**
   - Lista de orçamentos aprovados pelo síndico
   - Status: APPROVED
3. **Clique:** **"Liberar"** no orçamento
4. **Preencha (opcional):**
   ```
   Observações: Valor liberado para execução
   ```
5. **Clique:** Botão **"Confirmar Liberação"**
6. **Resultado:**
   - Mensagem: "Orçamento liberado com sucesso!"
   - Status muda para LIBERATED
   - OPERACIONAL recebe notificação
   - OPERACIONAL pode executar o serviço

---

## 9. FLUXO 8: SÍNDICO - Aprovações

### 🎯 **OBJETIVO:** Aprovar/rejeitar entradas, saídas, ocorrências e orçamentos

### **PASSO 1: Login como SÍNDICO**

1. **Faça logout** do FINANCEIRO
2. **Acesse:** `/auth/login`
3. **Preencha:**
   - Email: `sindico@teste.com`
   - Senha: `sindico123`
4. **Clique:** **"Entrar"**
5. **Resultado:** Redirecionado para `/sindico/dashboard`

### **PASSO 2: Visualizar Dashboard**

**O que você vê:**
- Widget: **"Inadimplência"** (valor e número de apartamentos)
- Widget: **"Saldo Atual"** (valor)
- Widget: **"Gastos do Mês"** (valor)
- Widget: **"Alertas Críticos"** (número)
- Widget: **"Aprovações Pendentes"** (número) ← **CLIQUE AQUI**

### **PASSO 3: Aprovar Entrada Financeira**

1. **No dashboard:** Clique no widget **"Aprovações Pendentes"** OU
2. **No menu:** Clique em **"Aprovações"** OU acesse `/sindico/aprovacoes`
3. **Vê resumo:**
   - Entradas pendentes: X
   - Saídas pendentes: X
   - Orçamentos pendentes: X
4. **Clique:** **"Ver Entradas Pendentes"** OU acesse `/sindico/entradas-pendentes`
5. **O que ver:**
   - Lista de entradas com valores > R$ 1.000,00
   - Status: PENDING_SINDICO
   - Colunas: Descrição, Valor, Data Esperada, Criado em
6. **Clique:** **"Aprovar"** na entrada OU **"Ver Detalhes"** → Botão **"Aprovar"**
7. **Preencha (opcional):**
   ```
   Observações de Aprovação: Aprovado conforme orçamento
   ```
8. **Clique:** Botão **"Confirmar Aprovação"**
9. **Resultado:**
   - Mensagem: "Entrada aprovada com sucesso!"
   - Status muda para APPROVED
   - FINANCEIRO recebe notificação
   - FINANCEIRO pode marcar como recebida

### **PASSO 4: Rejeitar Entrada Financeira**

1. **Na lista:** Clique em **"Rejeitar"** na entrada
2. **Preencha (OBRIGATÓRIO):**
   ```
   Motivo da Rejeição: Valor inconsistente com o orçamento apresentado
   ```
3. **Clique:** Botão **"Confirmar Rejeição"**
4. **Resultado:**
   - Mensagem: "Entrada rejeitada!"
   - Status muda para REJECTED
   - FINANCEIRO recebe notificação
   - FINANCEIRO pode ver em "Entradas Rejeitadas"

### **PASSO 5: Aprovar Saída Financeira**

1. **Acesse:** `/sindico/saidas-pendentes`
2. **O que ver:**
   - Lista de saídas com valores > R$ 1.000,00
   - Status: PENDING_SINDICO
3. **Clique:** **"Aprovar"** na saída
4. **Preencha (opcional):**
   ```
   Observações: Aprovado conforme contrato
   ```
5. **Clique:** **"Confirmar Aprovação"**
6. **Resultado:**
   - Status muda para APPROVED
   - FINANCEIRO recebe notificação
   - FINANCEIRO pode marcar como paga

### **PASSO 6: Aprovar Ocorrência**

1. **Acesse:** `/sindico/ocorrencias-pendentes-aprovacao`
2. **O que ver:**
   - Lista de ocorrências criadas pelo OPERACIONAL com prioridade URGENT
   - Status: PENDING_SINDICO_APPROVAL
3. **Clique:** **"Ver Detalhes"** na ocorrência
4. **URL:** `/sindico/ocorrencias/[ID]`
5. **O que ver:**
   - Título, descrição, fotos
   - Prioridade, localização
   - Criado por: OPERACIONAL
6. **Clique:** Botão **"Aprovar Ocorrência"** (verde)
7. **Preencha (opcional):**
   ```
   Observações: Aprovado. Priorizar atendimento.
   ```
8. **Clique:** **"Confirmar Aprovação"**
9. **Resultado:**
   - Mensagem: "Ocorrência aprovada com sucesso!"
   - Status muda para ABERTA
   - ADMINISTRATIVO recebe notificação
   - ADMINISTRATIVO pode triar

### **PASSO 7: Rejeitar Ocorrência**

1. **Na tela de detalhes:** Clique em **"Rejeitar"**
2. **Preencha (OBRIGATÓRIO):**
   ```
   Motivo da Rejeição: Ocorrência já foi resolvida anteriormente
   ```
3. **Clique:** **"Confirmar Rejeição"**
4. **Resultado:**
   - Status muda para REJECTED
   - OPERACIONAL recebe notificação

### **PASSO 8: Aprovar Orçamento**

1. **Acesse:** `/sindico/orcamentos-pendentes`
2. **O que ver:**
   - Lista de orçamentos revisados pelo FINANCEIRO
   - Status: PENDING_SINDICO
3. **Clique:** **"Ver Detalhes"** no orçamento
4. **O que ver:**
   - Descrição do serviço
   - Valor solicitado
   - PDF anexado (pode baixar)
   - Observações do FINANCEIRO
   - Centro de custo
5. **Clique:** **"Aprovar"**
6. **Preencha:**
   ```
   Valor Aprovado: 3000.00 (pode ser diferente do solicitado)
   Observações de Aprovação: Aprovar com ajuste de valor conforme negociação
   ```
7. **Clique:** **"Confirmar Aprovação"**
8. **Resultado:**
   - Mensagem: "Orçamento aprovado com sucesso!"
   - Status muda para APPROVED
   - FINANCEIRO recebe notificação
   - FINANCEIRO pode liberar

### **PASSO 9: Rejeitar Orçamento**

1. **Na tela de detalhes:** Clique em **"Rejeitar"**
2. **Preencha (OBRIGATÓRIO):**
   ```
   Motivo da Rejeição: Orçamento acima do esperado. Solicitar novo orçamento.
   ```
3. **Clique:** **"Confirmar Rejeição"**
4. **Resultado:**
   - Status muda para REJECTED
   - ADMINISTRATIVO e FINANCEIRO recebem notificação

---

## 10. FLUXO 9: SÍNDICO - Observações

### 🎯 **OBJETIVO:** Adicionar observações em tarefas e ocorrências

### **PASSO 1: Adicionar Observação em Tarefa**

1. **No menu:** Clique em **"Tarefas"** OU acesse `/sindico/tarefas`
2. **O que ver:**
   - Lista de todas as tarefas do condomínio
   - Status, responsável, prazo
3. **Clique:** **"Ver Detalhes"** em uma tarefa
4. **URL:** `/sindico/tarefas/[ID]`
5. **Na tela de detalhes:**
   - Role até a seção **"Observações do Síndico"**
   - **Se houver observações anteriores:** Vê lista com data e autor
6. **Para adicionar:**
   - Preencha o campo **"Adicionar Observação"**:
     ```
     Favor verificar com atenção os sensores do portão elétrico. 
     Foi reportado problema anterior.
     ```
   - **Clique:** Botão **"Adicionar Observação"**
7. **Resultado:**
   - Mensagem: "Observação adicionada com sucesso!"
   - Observação aparece na lista
   - OPERACIONAL recebe notificação
   - OPERACIONAL vê observação ao acessar a tarefa

### **PASSO 2: Adicionar Observação em Ocorrência**

1. **No menu:** Clique em **"Ocorrências"** OU acesse `/sindico/ocorrencias`
2. **Clique:** **"Ver Detalhes"** em uma ocorrência
3. **URL:** `/sindico/ocorrencias/[ID]`
4. **Na tela de detalhes:**
   - Role até a seção **"Observações do Síndico"**
5. **Para adicionar:**
   - Preencha o campo **"Adicionar Observação"**:
     ```
     Verificar se há risco de infiltração na estrutura. 
     Se necessário, chamar engenheiro para avaliação.
     ```
   - **Clique:** Botão **"Adicionar Observação"**
6. **Resultado:**
   - Observação salva e exibida
   - ADMINISTRATIVO e OPERACIONAL recebem notificação
   - Aparece para ambos ao acessar a ocorrência

### **PASSO 3: Criar Modelo de Checklist**

1. **No menu:** Clique em **"Modelos de Checklist"** OU acesse `/sindico/checklist-modelos`
2. **Clique:** Botão **"Novo Modelo"** (canto superior direito)
3. **URL:** `/sindico/checklist-modelos/novo`
4. **Preencha o formulário:**
   ```
   Nome: Checklist Diário - Manhã
   Descrição: Itens a verificar pela manhã
   Status: ☑ Ativo
   
   Itens do Checklist:
   Item 1: Verificar portões elétricos
   Item 2: Verificar iluminação externa
   Item 3: Inspecionar elevadores
   Item 4: Verificar sistema de água
   Item 5: Limpar área comum
   ```
5. **Clique:** Botão **"Salvar"**
6. **Resultado:**
   - Mensagem: "Modelo criado com sucesso!"
   - Sistema usa modelo para gerar checklists diários automaticamente
   - OPERACIONAL vê checklist no dia seguinte

---

## 11. FLUXO 10: FLUXO COMPLETO INTEGRADO

### 🎯 **OBJETIVO:** Testar fluxo completo de ponta a ponta

### **CENÁRIO:** Vazamento no condomínio que requer orçamento e aprovação

### **PASSO 1: OPERACIONAL cria ocorrência URGENT**

1. **Login:** `operacional@teste.com` / `operacional123`
2. **Acesse:** `/operacional/ocorrencias/nova`
3. **Preencha:**
   ```
   Título: Vazamento crítico no 3º Andar
   Descrição: Vazamento intenso no corredor próximo ao apartamento 301
   Localização: Corredor 3º Andar, Bloco A
   Tipo: Hidráulica
   Prioridade: URGENT
   ```
4. **Upload foto:** Adicione foto do vazamento
5. **Salve:** Status = PENDING_SINDICO_APPROVAL
6. **Resultado:** SÍNDICO recebe notificação

### **PASSO 2: SÍNDICO aprova ocorrência**

1. **Login:** `sindico@teste.com` / `sindico123`
2. **Acesse:** `/sindico/ocorrencias-pendentes-aprovacao`
3. **Clique:** Ver detalhes da ocorrência
4. **Clique:** Aprovar ocorrência
5. **Adicione observação:** "Priorizar atendimento imediato"
6. **Confirme:** Status muda para ABERTA
7. **Resultado:** ADMINISTRATIVO recebe notificação

### **PASSO 3: ADMINISTRATIVO tria ocorrência**

1. **Login:** `administrativo@teste.com` / `admin123`
2. **Acesse:** `/administrativo/ocorrencias`
3. **Clique:** Triar ocorrência
4. **Preencha:**
   ```
   Classificação: Hidráulico
   Prioridade: URGENT
   ☑ Criar Tarefa
   Responsável: Pedro Costa (OPERACIONAL)
   Prazo: 2 horas
   ☑ Criar Orçamento
   Valor Estimado: 500.00
   Tipo: Material
   Upload PDF: orcamento.pdf
   ```
5. **Confirme:** Tarefa e orçamento criados
6. **Resultado:** OPERACIONAL e FINANCEIRO recebem notificações

### **PASSO 4: FINANCEIRO revisa orçamento**

1. **Login:** `financeiro@teste.com` / `financeiro123`
2. **Acesse:** `/financeiro/orcamentos-pendentes`
3. **Clique:** Revisar orçamento
4. **Preencha:**
   ```
   Observações: Orçamento adequado
   Centro de Custo: Manutenção
   ```
5. **Envie para síndico:** Status = PENDING_SINDICO
6. **Resultado:** SÍNDICO recebe notificação

### **PASSO 5: SÍNDICO aprova orçamento**

1. **Login:** `sindico@teste.com` / `sindico123`
2. **Acesse:** `/sindico/orcamentos-pendentes`
3. **Clique:** Ver detalhes do orçamento
4. **Clique:** Aprovar
5. **Valor aprovado:** 500.00
6. **Confirme:** Status = APPROVED
7. **Resultado:** FINANCEIRO recebe notificação

### **PASSO 6: FINANCEIRO libera orçamento**

1. **Login:** `financeiro@teste.com` / `financeiro123`
2. **Acesse:** `/financeiro/orcamentos-aprovados`
3. **Clique:** Liberar orçamento
4. **Confirme:** Status = LIBERATED
5. **Resultado:** OPERACIONAL recebe notificação

### **PASSO 7: OPERACIONAL executa tarefa**

1. **Login:** `operacional@teste.com` / `operacional123`
2. **Acesse:** `/operacional/checklist`
3. **Veja tarefa:** "Corrigir vazamento no 3º andar"
4. **Clique:** Ver detalhes
5. **Veja observação do síndico:** "Priorizar atendimento imediato"
6. **Execute correção**
7. **Clique:** Concluir tarefa
8. **Preencha:**
   ```
   Conclusão bem sucedida: Sim
   Observações: Vazamento corrigido. Válvula trocada.
   Tempo: 45 minutos
   Qualidade: Excelente
   ```
9. **Upload foto:** Foto do resultado
10. **Confirme:** Status = COMPLETED
11. **Resultado:** ADMINISTRATIVO e SÍNDICO recebem notificação

### **PASSO 8: OPERACIONAL resolve ocorrência**

1. **Ainda logado como OPERACIONAL**
2. **Acesse:** `/operacional/ocorrencias`
3. **Clique:** Resolver ocorrência
4. **Preencha:**
   ```
   Descrição da Resolução: Vazamento corrigido. Válvula trocada.
   Custo: 450.00
   Tempo: 45 minutos
   ```
5. **Upload foto:** Foto da resolução
6. **Confirme:** Status = RESOLVIDA
7. **Resultado:** ADMINISTRATIVO recebe notificação

### **PASSO 9: ADMINISTRATIVO verifica resolução**

1. **Login:** `administrativo@teste.com` / `admin123`
2. **Acesse:** `/administrativo/ocorrencias`
3. **Veja ocorrência:** Status = RESOLVIDA
4. **Clique:** Ver detalhes
5. **Verifique:** Fotos, descrição, custo
6. **Pode fechar ocorrência** se estiver OK

---

## 12. ONDE APARECEM NOTIFICAÇÕES

### 📍 **LOCALIZAÇÃO DAS NOTIFICAÇÕES**

#### **1. Ícone de Notificações (Menu Superior)**

- **Onde:** Canto superior direito, ao lado do nome do usuário
- **Ícone:** 🔔 (sino)
- **Badge:** Número vermelho com quantidade de não lidas
- **Como acessar:**
  1. Clique no ícone 🔔
  2. Dropdown abre com lista de notificações
  3. Notificações não lidas aparecem em destaque
  4. Clique em uma notificação para ver detalhes
  5. Botão **"Marcar todas como lidas"** no topo

#### **2. Página de Notificações**

- **URL:** `/notifications`
- **Como acessar:**
  - Menu: **"Notificações"** (se disponível)
  - Ou clique em **"Ver todas"** no dropdown de notificações
- **O que ver:**
  - Lista completa de notificações
  - Filtros: Todas, Não lidas, Lidas
  - Botão para marcar como lida individualmente
  - Botão para marcar todas como lidas

#### **3. Notificações no Dashboard**

- **Alguns dashboards** mostram notificações importantes em widgets
- Exemplo: Widget **"Alertas Críticos"** no dashboard do SÍNDICO

### 🔔 **TIPOS DE NOTIFICAÇÕES**

#### **OPERACIONAL recebe:**
- ✅ Nova tarefa atribuída
- ✅ Checklist diário disponível
- ✅ Ocorrência atribuída para resolver
- ✅ Observação adicionada pelo síndico em tarefa/ocorrência
- ✅ Orçamento liberado para execução

#### **ADMINISTRATIVO recebe:**
- ✅ Nova ocorrência aprovada pelo síndico (aguardando triagem)
- ✅ Tarefa concluída pelo operacional
- ✅ Ocorrência resolvida pelo operacional
- ✅ Observação adicionada pelo síndico

#### **FINANCEIRO recebe:**
- ✅ Nova entrada/saída criada (se valor > limite)
- ✅ Entrada/saída aprovada pelo síndico
- ✅ Entrada/saída rejeitada pelo síndico
- ✅ Novo orçamento para revisar
- ✅ Orçamento aprovado pelo síndico (pode liberar)

#### **SÍNDICO recebe:**
- ✅ Ocorrência URGENT criada pelo operacional
- ✅ Entrada/saída pendente de aprovação (valor > limite)
- ✅ Orçamento pendente de aprovação
- ✅ Tarefa concluída pelo operacional
- ✅ Ocorrência resolvida pelo operacional

### 📱 **COMO TESTAR NOTIFICAÇÕES**

1. **Crie uma ação** que gera notificação (ex: OPERACIONAL cria ocorrência URGENT)
2. **Faça logout** do usuário atual
3. **Login** como usuário que deve receber notificação (ex: SÍNDICO)
4. **Verifique:** Ícone 🔔 deve mostrar badge com número
5. **Clique no ícone:** Notificação aparece na lista
6. **Clique na notificação:** Redireciona para página relacionada
7. **Verifique:** Notificação fica marcada como lida após clicar

---

## 🎯 CHECKLIST DE TESTE COMPLETO

Use este checklist para garantir que testou tudo:

### ✅ **MASTER**
- [ ] Criar condomínio
- [ ] Editar condomínio
- [ ] Criar usuário de cada perfil
- [ ] Editar usuário
- [ ] Listar condomínios
- [ ] Listar usuários

### ✅ **OPERACIONAL**
- [ ] Login e visualizar dashboard
- [ ] Executar checklist diário
- [ ] Adicionar fotos no checklist
- [ ] Ver tarefas atribuídas
- [ ] Concluir tarefa com evidências
- [ ] Criar ocorrência com foto
- [ ] Resolver ocorrência com foto
- [ ] Ver notificações

### ✅ **ADMINISTRATIVO**
- [ ] Login e visualizar dashboard
- [ ] Triar ocorrência
- [ ] Criar tarefa na triagem
- [ ] Criar orçamento na triagem
- [ ] Criar tarefa manualmente
- [ ] Reabrir tarefa concluída
- [ ] Ver notificações

### ✅ **FINANCEIRO**
- [ ] Login e visualizar dashboard
- [ ] Criar entrada (valor ≤ limite)
- [ ] Criar entrada (valor > limite)
- [ ] Marcar entrada como recebida (com PDF)
- [ ] Criar saída (valor ≤ limite)
- [ ] Criar saída (valor > limite)
- [ ] Marcar saída como paga (com PDF)
- [ ] Revisar orçamento
- [ ] Liberar orçamento aprovado
- [ ] Ver notificações

### ✅ **SÍNDICO**
- [ ] Login e visualizar dashboard
- [ ] Aprovar entrada pendente
- [ ] Rejeitar entrada pendente
- [ ] Aprovar saída pendente
- [ ] Aprovar ocorrência URGENT
- [ ] Rejeitar ocorrência
- [ ] Aprovar orçamento
- [ ] Rejeitar orçamento
- [ ] Adicionar observação em tarefa
- [ ] Adicionar observação em ocorrência
- [ ] Criar modelo de checklist
- [ ] Ver notificações

### ✅ **FLUXOS INTEGRADOS**
- [ ] Fluxo completo: Ocorrência → Tarefa → Resolução
- [ ] Fluxo completo: Orçamento → Aprovação → Liberação → Execução
- [ ] Fluxo completo: Entrada → Aprovação → Recebimento
- [ ] Fluxo completo: Saída → Aprovação → Pagamento

---

## 📝 DICAS PARA GRAVAÇÃO DE TELA

### 🎬 **PREPARAÇÃO**

1. **Tenha dados fictícios prontos:**
   - Fotos de teste (ocorrências, resultados)
   - PDFs de teste (comprovantes, orçamentos)
   - Lista de valores e descrições

2. **Prepare navegador:**
   - Use modo anônimo ou limpe cache
   - Ajuste zoom para 100%
   - Feche abas desnecessárias

3. **Configure gravação:**
   - Resolução: 1920x1080 ou superior
   - Áudio: Desligado (ou narração)
   - FPS: 30 ou 60

### 🎥 **DURANTE A GRAVAÇÃO**

1. **Fale claramente:**
   - "Agora vou criar um condomínio..."
   - "Vou clicar no botão 'Novo Condomínio'..."
   - "Preenchendo o formulário..."

2. **Mostre detalhes:**
   - Pause ao preencher formulários
   - Destaque campos obrigatórios
   - Mostre mensagens de sucesso/erro

3. **Demonstre fluxos:**
   - Mostre notificações aparecendo
   - Mostre mudanças de status
   - Mostre onde cada botão leva

4. **Teste erros:**
   - Tente salvar sem preencher campos obrigatórios
   - Mostre mensagens de validação
   - Mostre tratamento de erros

### ✂️ **PÓS-PRODUÇÃO**

1. **Corte pausas longas**
2. **Adicione legendas** explicando ações
3. **Destaque** botões clicados
4. **Adicione música de fundo** (opcional)
5. **Exporte em qualidade HD**

---

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### **Problema:** Não consigo criar checklist diário
**Solução:** SÍNDICO precisa criar modelo de checklist primeiro

### **Problema:** Não aparecem notificações
**Solução:** Verifique se ações foram concluídas corretamente. Notificações aparecem após ações serem salvas.

### **Problema:** Não consigo aprovar entrada/saída
**Solução:** Verifique se valor é maior que limite de aprovação do financeiro (R$ 1.000,00)

### **Problema:** Não consigo resolver ocorrência
**Solução:** Ocorrência precisa estar atribuída a você pelo ADMINISTRATIVO

### **Problema:** Não consigo liberar orçamento
**Solução:** Orçamento precisa estar aprovado pelo SÍNDICO primeiro

---

## 📞 SUPORTE

Se encontrar problemas durante os testes:

1. Verifique logs do servidor
2. Verifique console do navegador (F12)
3. Verifique se banco de dados está conectado
4. Verifique se usuários têm permissões corretas
5. Verifique se condomínio está ativo

---

**Última Atualização:** Janeiro 2026  
**Versão:** 1.0  
**Autor:** Sistema de Gestão Condominial
