# Sistema de Gestão Condominial

Sistema interno de gestão condominial para administração completa de condomínios, com módulos para gestão financeira, operacional, administrativa e patrimonial. Desenvolvido em Node.js com arquitetura MVC e interface web responsiva.

---

## Visão Geral

O sistema permite gerenciar múltiplos condomínios de forma centralizada, com perfis de acesso distintos para cada tipo de usuário. Cada condomínio possui seu próprio fluxo de trabalho, com aprovações hierárquicas, controle de inadimplência, checklists operacionais e gestão financeira integrada.

---

## Módulos e Funcionalidades

### Módulo Master (Super Administrador)

- **Dashboard** com visão geral do sistema
- **Gestão de Condomínios** — criação, edição e listagem de condomínios
- **Gestão de Usuários** — criação e edição de usuários vinculados aos condomínios
- Acesso exclusivo ao nível do sistema, sem vínculo a condomínio específico

### Módulo Síndico / Subsíndico

- **Dashboard** personalizável com widgets configuráveis e KPIs
- **Aprovações** — entradas financeiras, saídas, orçamentos e ocorrências
- **Tarefas** — acompanhamento, observações e relatórios (PDF/Excel)
- **Ocorrências** — visualização e aprovação de ocorrências pendentes
- **Modelos de Checklist** — criação e edição de modelos para Zeladoria e Limpeza
- **Acompanhamento de Checklists** — questionamento de itens não concluídos
- **Manutenções** — visualização e gestão de manutenções
- **Orçamentos Pendentes** — aprovação ou rejeição de cotações
- **Alertas** — resolução de alertas do sistema
- **Logs** — auditoria de ações realizadas

### Módulo Financeiro

- **Dashboard** financeiro com indicadores e gráficos
- **Entradas** — lançamento, recebimento, comprovantes e aprovação
- **Saídas** — lançamento, pagamento e verificação com multi-aprovação
- **Contas a Pagar** — controle de vencimentos e pagamentos
- **Contas Bancárias** — gestão de contas e boletos
- **Consumo** — registro de consumo por apartamento
- **Centros de Custo** — categorização de despesas e receitas
- **Fechamento Mensal** — processo de fechamento e conciliação
- **Fundo de Reserva** — controle e movimentação
- **Inadimplência** — gestão de taxas e cobranças em atraso
- **Orçamentos** — fluxo de aprovação de cotações

### Módulo Administrativo

- **Dashboard** com tarefas, ocorrências e alertas
- **Tarefas** — criação, atribuição e acompanhamento
- **Documentos** — gestão de contratos e documentos por categorias
- **Ocorrências** — triagem e direcionamento (Zeladoria/Limpeza)
- **Orçamentos** — solicitação, envio para aprovação e acompanhamento
- **Comunicados Operacionais** — criação e desativação
- **Aprovações Financeiras** — aprovação de saídas até limite definido
- **Alertas SLA** — acompanhamento de prazos e escalonamentos
- **Reabertura de Tarefas** — reabertura com justificativa
- **Assembleias** — criação, participantes, decisões e documentação

### Módulo Operacional (Zeladoria)

- **Dashboard** operacional
- **Checklists Diários** — execução com evidências e questionamentos
- **Tarefas** — conclusão com evidências fotográficas
- **Ocorrências** — criação, acompanhamento e resolução
- **Manutenções** — início e conclusão de manutenções
- **Orçamentos** — visualização de orçamentos liberados para execução

### Módulo Limpeza

- **Dashboard** de limpeza
- **Checklists Diários** — execução de checklists de limpeza
- **Ocorrências** — registro de ocorrências de limpeza (sem criação de ocorrências de zeladoria)

### Módulo Patrimônio

- **Dashboard** patrimonial
- **Ativos** — cadastro, edição e histórico
- **Manutenções** — registro de manutenções por ativo
- **Depreciação** — cálculo e acompanhamento de depreciação

### Módulo Estoque

- **Dashboard** de estoque
- **Itens** — cadastro e gestão de itens
- **Movimentação** — entrada e saída de itens

### Módulo Conselho

- **Dashboard** em modo leitura
- Visualização de informações gerais do condomínio
- Sem permissão para criar, editar ou aprovar

### Outros Recursos

- **Notificações** — sistema de notificações em tempo real
- **Configurações** — parâmetros do condomínio (Síndico/Subsíndico)
- **Automações** — geração automática de checklists diários
- **Itens Críticos** — modal de alertas pós-login (Síndico, Financeiro, Administrativo)
- **Relatórios** — exportação em PDF e Excel
- **Tour do Sistema** — guia interativo para novos usuários

---

## Perfis de Acesso (Roles)

| Perfil | Descrição |
|--------|-----------|
| **SUPER_MASTER** | Administrador do sistema. Cria condomínios e usuários. Não governa condomínios específicos. |
| **SINDICO** | Síndico. Decide e aprova. Não executa tarefas operacionais. |
| **SUBSINDICO** | Subsíndico. Mesmas permissões do síndico. |
| **ADMINISTRATIVO** | Equipe administrativa. Organiza tarefas e documentos. Não executa checklists. |
| **OPERACIONAL** | Zeladoria. Executa checklists e tarefas. Não vê dados financeiros. |
| **FINANCEIRO** | Equipe financeira. Controla entradas e saídas. Valores altos exigem aprovação do Síndico. |
| **PATRIMONIO** | Controle patrimonial. Cadastra ativos e gerencia depreciação. |
| **LIMPEZA** | Equipe de limpeza. Executa checklists de limpeza. Não cria ocorrências. |
| **CONSELHO** | Membro do conselho. Apenas leitura. |

---

## Fluxos Principais

### Fluxo de Orçamentos

1. Administrativo cria solicitação de orçamento e anexa cotações
2. Financeiro analisa e aprova/rejeita
3. Síndico aprova ou rejeita a cotação escolhida
4. Operacional visualiza orçamentos liberados para execução

### Fluxo de Aprovação Financeira

- **Entradas**: Financeiro lança → Síndico aprova/rejeita
- **Saídas**: Financeiro lança → Administrativo aprova até limite → Síndico aprova valores acima do limite (com suporte a multi-aprovação)

### Fluxo de Ocorrências

- **Operacional**: cria ocorrências de zeladoria diretamente
- **Limpeza**: registra ocorrências que podem ser triadas pelo Administrativo como zeladoria
- **Síndico**: aprova ocorrências que exigem aprovação

### Fluxo de Checklists

1. Síndico cria modelos de checklist (Zeladoria ou Limpeza)
2. Automação gera checklists diários com base nos modelos
3. Operacional/Limpeza executa e anexa evidências
4. Síndico acompanha e pode questionar itens não feitos

---

## Stack Técnico

- **Backend**: Node.js, Express
- **Banco de Dados**: PostgreSQL
- **Views**: EJS
- **Autenticação**: JWT, cookies
- **Upload**: Multer
- **Relatórios**: PDFKit, ExcelJS, Puppeteer
- **Cache**: node-cache
- **Gráficos**: Chart.js
- **Tour**: Driver.js

---

## Estrutura do Projeto

```
├── src/
│   ├── config/          # Configurações (banco, etc.)
│   ├── controllers/     # Controladores por módulo
│   ├── database/        # Inicialização e migrations
│   ├── middlewares/     # Autenticação, autorização, upload
│   ├── routes/          # Rotas por módulo
│   ├── services/        # Lógica de negócio
│   ├── utils/           # Utilitários e helpers
│   ├── jobs/            # Jobs automáticos (checklists diários)
│   ├── app.js           # Configuração Express
│   └── server.js        # Inicialização do servidor
├── views/               # Templates EJS
├── public/              # CSS, JS, imagens
└── uploads/             # Arquivos enviados
```

---

*Sistema proprietário. Descrição técnica e funcional para documentação interna.*
