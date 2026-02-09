/**
 * Tour ÊXITO Condomínios: tutorial por página + fluxo (quem aprova, para onde vai) + por departamento.
 */
(function () {
  'use strict';

  function getCurrentPath() {
    return (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
  }

  function getDriverFn() {
    if (typeof window === 'undefined') return null;
    try {
      if (window.ExitoTourDriver && typeof window.ExitoTourDriver === 'function') return window.ExitoTourDriver;
      if (window.driver && window.driver.js && typeof window.driver.js.driver === 'function') return window.driver.js.driver;
      if (window.driver && typeof window.driver.js === 'function') return window.driver.js;
    } catch (e) { /* ignore */ }
    return null;
  }

  function getUserRoles() {
    try {
      var r = window.__userRoles;
      return Array.isArray(r) ? r : [];
    } catch (e) { return []; }
  }

  function hasRole(role) {
    return getUserRoles().indexOf(role) !== -1;
  }

  function bindTabsInPopover(container) {
    if (!container || !container.querySelector) return;
    var tabs = container.querySelectorAll('.exito-tour-tab');
    var panels = container.querySelectorAll('.exito-tour-panel');
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        panels.forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        if (panels[i]) panels[i].classList.add('active');
      });
    });
  }

  /** Tutoriais específicos por página (path prefix -> passos). A chave mais longa que bater no path ganha. */
  var PAGE_TOURS = {
    '/financeiro/dashboard': [
      { element: document.body, popover: { title: 'Dashboard Financeiro', description: 'Nesta tela você vê o <strong>resumo</strong>: totais de entradas e saídas, alertas de contas vencidas ou a vencer hoje, e atalhos para Entradas, Saídas, Contas a Pagar e relatórios.', side: 'bottom', align: 'center' } },
      { element: document.body, popover: { title: 'Alertas', description: 'Os cards de alerta mostram <strong>contas vencidas</strong> e <strong>a vencer hoje</strong>. Clique para ir direto à listagem de Contas a Pagar.', side: 'bottom', align: 'center' } }
    ],
    '/financeiro/entradas/nova': [
      { element: document.body, popover: { title: 'Nova entrada', description: 'Preencha os dados da <strong>receita</strong> (descrição, valor, vencimento, apartamento se for taxa). Após salvar, a entrada fica na listagem; use <strong>Receber</strong> para marcar como paga e anexar comprovante.', side: 'bottom', align: 'center' } }
    ],
    '/financeiro/entradas': [
      { element: document.body, popover: { title: 'Listagem de Entradas', description: 'Aqui aparecem todas as <strong>receitas</strong> (taxas, multas etc.). Use o botão <strong>Nova entrada</strong> para lançar. Em cada linha você pode receber (marcar como paga e anexar comprovante), editar ou excluir.', side: 'bottom', align: 'center' } },
      { element: document.body, popover: { title: 'Receber entrada', description: 'Ao clicar em <strong>Receber</strong>, informe a data do recebimento e anexe o comprovante PDF. Entradas rejeitadas pelo síndico aparecem na lista e podem ser corrigidas.', side: 'bottom', align: 'center' } }
    ],
    '/financeiro/saidas': [
      { element: document.body, popover: { title: 'Listagem de Saídas', description: 'Aqui ficam as <strong>despesas</strong>. Saídas passam por aprovação conforme o valor (Financeiro ou Síndico). Depois de aprovadas, use <strong>Pagar</strong> para informar a data e anexar o comprovante.', side: 'bottom', align: 'center' } },
      { element: document.body, popover: { title: 'Fluxo', description: 'Criar saída → conforme valor, aprovação automática ou por Financeiro/Síndico → após aprovar, marcar como paga com comprovante. Pendências aparecem no Dashboard.', side: 'bottom', align: 'center' } }
    ],
    '/financeiro/contas': [
      { element: document.body, popover: { title: 'Contas (fornecedores fixos)', description: 'Cadastro de fornecedores recorrentes: <strong>água, luz, gás</strong> etc. Clique em uma conta para ver detalhes e <strong>Adicionar novo boleto</strong> (data de vencimento, valor, anexo do boleto).', side: 'bottom', align: 'center' } },
      { element: document.body, popover: { title: 'Novo boleto', description: 'Cada boleto cadastrado vai para <strong>Contas a Pagar</strong>. Lá você paga (data + comprovante) e o sistema gera a Saída automaticamente.', side: 'bottom', align: 'center' } }
    ],
    '/financeiro/contas-a-pagar/novo': [
      { element: document.body, popover: { title: 'Nova conta a pagar', description: 'Lançamento avulso de boleto/compromisso (fornecedor, valor, vencimento). Opcional anexar o boleto. O item aparece na listagem de Contas a Pagar para você pagar depois.', side: 'bottom', align: 'center' } }
    ],
    '/financeiro/contas-a-pagar': [
      { element: document.body, popover: { title: 'Contas a Pagar', description: 'Lista de <strong>boletos e compromissos</strong> a vencer (vindos de Contas ou lançamentos avulsos). Use <strong>Pagar</strong> para informar a data do pagamento e anexar o comprovante; o sistema registra a Saída.', side: 'bottom', align: 'center' } },
      { element: document.body, popover: { title: 'Alertas', description: 'O Dashboard mostra quantos estão vencidos e a vencer hoje. Aqui você resolve cada item e mantém o fluxo de caixa em dia.', side: 'bottom', align: 'center' } }
    ],
    '/financeiro/taxas': [
      { element: document.body, popover: { title: 'Taxas', description: 'Configuração e cobrança de <strong>taxas</strong> do condomínio. Liste, crie e acompanhe o pagamento por apartamento.', side: 'bottom', align: 'center' } }
    ],
    '/financeiro/centros-custo': [
      { element: document.body, popover: { title: 'Centros de Custo', description: 'Organize as despesas por <strong>centro de custo</strong>. Ao criar uma saída, você vincula a um centro; relatórios e fechamento usam essa classificação.', side: 'bottom', align: 'center' } }
    ],
    '/financeiro/orcamentos-pendentes': [
      { element: document.body, popover: { title: 'Orçamentos pendentes', description: 'Orçamentos enviados pelo Administrativo para <strong>análise financeira</strong>. Você revisa, atribui centro de custo e libera (vai ao Síndico aprovar) ou devolve para correção.', side: 'bottom', align: 'center' } }
    ],
    '/financeiro/saidas-verificacao': [
      { element: document.body, popover: { title: 'Verificação de saídas', description: 'Saídas geradas a partir de <strong>orçamentos aprovados</strong> pelo Síndico. Aqui o Financeiro confere valores e dados e marca como verificada para seguir para pagamento.', side: 'bottom', align: 'center' } }
    ],
    '/sindico/dashboard': [
      { element: document.body, popover: { title: 'Dashboard Síndico', description: 'Visão geral do condomínio: indicadores financeiros, tarefas, ocorrências e <strong>pendências de aprovação</strong> (saídas, orçamentos, ocorrências).', side: 'bottom', align: 'center' } },
      { element: document.body, popover: { title: 'Aprovações', description: 'Acesse <strong>Aprovações</strong> no menu para aprovar ou rejeitar saídas (acima de R$ 5.000), orçamentos e ocorrências. Valores altos podem exigir 2 ou 3 aprovações.', side: 'bottom', align: 'center' } }
    ],
    '/sindico/aprovacoes': [
      { element: document.body, popover: { title: 'Aprovações', description: 'Lista do que está <strong>pendente de sua aprovação</strong>: saídas financeiras, orçamentos e ocorrências. Aprove quando estiver correto; rejeite para o responsável corrigir.', side: 'bottom', align: 'center' } }
    ],
    '/sindico/tarefas': [
      { element: document.body, popover: { title: 'Tarefas', description: 'Todas as tarefas do condomínio. Você pode acompanhar, adicionar observações e gerar relatórios. O Administrativo cria; o Operacional executa.', side: 'bottom', align: 'center' } }
    ],
    '/sindico/ocorrencias': [
      { element: document.body, popover: { title: 'Ocorrências', description: 'Ocorrências registradas pela equipe. Você pode visualizar, adicionar observações e <strong>aprovar ou rejeitar</strong> quando for o caso.', side: 'bottom', align: 'center' } }
    ],
    '/sindico/checklist-modelos': [
      { element: document.body, popover: { title: 'Modelos de checklist', description: 'Crie e edite os <strong>modelos</strong> de checklist. O sistema gera o checklist do dia a partir do modelo; o Operacional/Limpeza executa e você acompanha.', side: 'bottom', align: 'center' } }
    ],
    '/sindico/checklists-acompanhamento': [
      { element: document.body, popover: { title: 'Acompanhar checklists', description: 'Veja os checklists do dia já executados. Você pode <strong>questionar</strong> itens não feitos; o operacional responde aqui.', side: 'bottom', align: 'center' } }
    ],
    '/administrativo/dashboard': [
      { element: document.body, popover: { title: 'Dashboard Administrativo', description: 'Resumo de tarefas, ocorrências pendentes de triagem, orçamentos e alertas de SLA. Atalhos para as principais ações do dia a dia.', side: 'bottom', align: 'center' } }
    ],
    '/administrativo/tarefas': [
      { element: document.body, popover: { title: 'Tarefas', description: 'Crie tarefas para a equipe operacional e acompanhe o status. O operacional conclui com fotos/observações. Você pode reabrir tarefas se precisar.', side: 'bottom', align: 'center' } }
    ],
    '/administrativo/ocorrencias': [
      { element: document.body, popover: { title: 'Ocorrências', description: 'Ocorrências criadas pelo Operacional/Limpeza. Aqui você <strong>tria</strong>: classifica e pode <strong>converter em tarefa</strong> para alguém executar.', side: 'bottom', align: 'center' } }
    ],
    '/administrativo/orcamentos': [
      { element: document.body, popover: { title: 'Orçamentos', description: 'Crie a solicitação de orçamento e adicione <strong>cotações</strong>. O Financeiro revisa; o Síndico aprova. Aprovado vira saída automaticamente.', side: 'bottom', align: 'center' } }
    ],
    '/administrativo/documentos': [
      { element: document.body, popover: { title: 'Documentos', description: 'Cadastre documentos e categorias, faça upload de contratos (PDF) e mantenha o acervo organizado.', side: 'bottom', align: 'center' } }
    ],
    '/operacional/dashboard': [
      { element: document.body, popover: { title: 'Dashboard Operacional', description: 'Checklists do dia, tarefas atribuídas a você e atalhos. Inicie os checklists e conclua as tarefas com fotos quando fizer o serviço.', side: 'bottom', align: 'center' } }
    ],
    '/operacional/checklists-diarios': [
      { element: document.body, popover: { title: 'Checklists do dia', description: 'Checklists gerados a partir do modelo. <strong>Inicie</strong>, marque itens como feitos e anexe fotos. O síndico pode questionar itens; você responde na tela de acompanhamento.', side: 'bottom', align: 'center' } }
    ],
    '/operacional/ocorrencias': [
      { element: document.body, popover: { title: 'Ocorrências', description: 'Registre <strong>ocorrências</strong> (com foto se quiser). O Administrativo tria e pode converter em tarefa para você executar.', side: 'bottom', align: 'center' } }
    ],
    '/limpeza/dashboard': [
      { element: document.body, popover: { title: 'Dashboard Limpeza', description: 'Checklists do dia e ocorrências de limpeza. Mesmo fluxo do Operacional, com foco em rotinas de limpeza.', side: 'bottom', align: 'center' } }
    ],
    '/patrimonio/dashboard': [
      { element: document.body, popover: { title: 'Dashboard Patrimônio', description: 'Resumo de ativos e manutenções. Acesse a lista de ativos e manutenções para cadastrar e acompanhar.', side: 'bottom', align: 'center' } }
    ],
    '/patrimonio/ativos': [
      { element: document.body, popover: { title: 'Ativos', description: 'Cadastre e liste <strong>bens</strong> do condomínio (equipamentos, móveis). Detalhes e localização. Manutenções podem ser vinculadas aos ativos.', side: 'bottom', align: 'center' } }
    ],
    '/conselho/dashboard': [
      { element: document.body, popover: { title: 'Dashboard Conselho', description: 'Acesso <strong>somente leitura</strong>. Acompanhe indicadores e relatórios permitidos ao Conselho.', side: 'bottom', align: 'center' } }
    ],
    '/master/dashboard': [
      { element: document.body, popover: { title: 'Dashboard Master', description: 'Administração do sistema: condomínios e usuários. Acesso global.', side: 'bottom', align: 'center' } }
    ],
    '/master/condominios': [
      { element: document.body, popover: { title: 'Condomínios', description: 'Lista de condomínios. Crie e edite para gerenciar as unidades do sistema.', side: 'bottom', align: 'center' } }
    ],
    '/master/usuarios': [
      { element: document.body, popover: { title: 'Usuários', description: 'Cadastro de usuários e atribuição de perfis (roles) e condomínio.', side: 'bottom', align: 'center' } }
    ]
  };

  /** Path prefix -> roles que podem ver o tutorial desta página. Síndico só vê tutorial de páginas /sindico; Financeiro só /financeiro; etc. */
  var PATH_ALLOWED_ROLES = {
    '/financeiro': ['FINANCEIRO'],
    '/sindico': ['SINDICO', 'SUBSINDICO'],
    '/administrativo': ['ADMINISTRATIVO'],
    '/operacional': ['OPERACIONAL'],
    '/limpeza': ['LIMPEZA'],
    '/patrimonio': ['PATRIMONIO'],
    '/conselho': ['CONSELHO'],
    '/master': ['SUPER_MASTER']
  };

  function pathAllowedForUser(path) {
    for (var prefix in PATH_ALLOWED_ROLES) {
      if (path.indexOf(prefix) === 0) {
        var allowed = PATH_ALLOWED_ROLES[prefix];
        for (var i = 0; i < allowed.length; i++) {
          if (hasRole(allowed[i])) return true;
        }
        return false;
      }
    }
    return false;
  }

  function getPageTourSteps() {
    var path = getCurrentPath();
    if (!path || !pathAllowedForUser(path)) return [];
    var keys = Object.keys(PAGE_TOURS).filter(function (k) { return path.indexOf(k) === 0; });
    if (keys.length === 0) return [];
    keys.sort(function (a, b) { return b.length - a.length; });
    return PAGE_TOURS[keys[0]] || [];
  }

  /** Conceitos: o que é cada coisa no sistema, explicado só do ponto de vista do perfil. Para a pessoa aprender item por item. */
  function getConceitosStepsForUser() {
    var steps = [];
    if (hasRole('SINDICO') || hasRole('SUBSINDICO')) {
      steps.push({
        element: document.body,
        popover: {
          title: 'O que é cada coisa no sistema (Síndico)',
          description: '<div class="exito-tour-tabs">' +
            '<button type="button" class="exito-tour-tab active">Entrada</button>' +
            '<button type="button" class="exito-tour-tab">Saída</button>' +
            '<button type="button" class="exito-tour-tab">Orçamento</button>' +
            '<button type="button" class="exito-tour-tab">Ocorrência</button>' +
            '<button type="button" class="exito-tour-tab">Checklist</button>' +
            '<button type="button" class="exito-tour-tab">Aprovação</button>' +
            '</div><div class="exito-tour-panels">' +
            '<div class="exito-tour-panel active"><strong>Entrada</strong> = receita do condomínio (taxa paga, multa etc.). O Financeiro lança e depois marca como recebida. Quando uma entrada precisa de sua aprovação, ela aparece em <strong>Entradas pendentes</strong> no seu menu; você aprova ou rejeita.</div>' +
            '<div class="exito-tour-panel"><strong>Saída</strong> = despesa (conta de luz, serviço pago etc.). O Financeiro cria. Acima de R$ 5.000 ela vai para você em <strong>Aprovações</strong>. Você aprova ou rejeita; aprovada, o Financeiro paga e anexa o comprovante.</div>' +
            '<div class="exito-tour-panel"><strong>Orçamento</strong> = pedido de compra/serviço. O Administrativo cria e cola cotações; o Financeiro libera; você escolhe qual cotação <strong>aprovar</strong>. Aprovado vira saída (o Financeiro paga depois).</div>' +
            '<div class="exito-tour-panel"><strong>Ocorrência</strong> = registro que a equipe (zeladoria/limpeza) fez (ex.: vazamento, sujeira). Você pode ver todas e <strong>aprovar ou rejeitar</strong> quando for o caso.</div>' +
            '<div class="exito-tour-panel"><strong>Checklist</strong> = lista de tarefas do dia (ex.: limpar área, verificar portaria). Você cria o <strong>modelo</strong> (itens fixos). O sistema gera o checklist do dia. A equipe executa e marca itens; você <strong>acompanha</strong> e pode questionar itens não feitos.</div>' +
            '<div class="exito-tour-panel"><strong>Aprovação</strong> = você dá o ok (ou rejeita) em entradas, saídas, orçamentos e ocorrências. Valores altos em saídas podem exigir 2 ou 3 aprovações de síndicos.</div>' +
            '</div>',
          side: 'bottom',
          align: 'center'
        }
      });
    }
    if (hasRole('FINANCEIRO')) {
      steps.push({
        element: document.body,
        popover: {
          title: 'O que é cada coisa no sistema (Financeiro)',
          description: '<div class="exito-tour-tabs">' +
            '<button type="button" class="exito-tour-tab active">Entrada</button>' +
            '<button type="button" class="exito-tour-tab">Saída</button>' +
            '<button type="button" class="exito-tour-tab">Conta</button>' +
            '<button type="button" class="exito-tour-tab">Contas a Pagar</button>' +
            '<button type="button" class="exito-tour-tab">Centro de custo</button>' +
            '<button type="button" class="exito-tour-tab">Comprovante</button>' +
            '</div><div class="exito-tour-panels">' +
            '<div class="exito-tour-panel active"><strong>Entrada</strong> = receita (taxa, multa, outro). Você <strong>cria</strong> a entrada na tela Entradas; depois você <strong>recebe</strong> (informa a data e anexa o comprovante). Algumas entradas podem precisar de aprovação do Síndico antes.</div>' +
            '<div class="exito-tour-panel"><strong>Saída</strong> = despesa (pagamento). Você <strong>cria</strong> a saída. Conforme o valor: aprovação automática, sua ou do Síndico. Depois de aprovada, você <strong>marca como paga</strong> e anexa o comprovante. Sem comprovante não fecha o fluxo.</div>' +
            '<div class="exito-tour-panel"><strong>Conta</strong> = fornecedor fixo (água, luz, gás). Você cadastra em <strong>Contas</strong>. Em cada conta você adiciona <strong>novo boleto</strong> (data de vencimento, valor, PDF do boleto). Cada boleto vira um item em Contas a Pagar.</div>' +
            '<div class="exito-tour-panel"><strong>Contas a Pagar</strong> = lista de boletos/compromissos a vencer (vindos das Contas ou de lançamento avulso). Em cada item você clica em <strong>Pagar</strong>: informa a data do pagamento e anexa o comprovante. O sistema gera a Saída sozinho.</div>' +
            '<div class="exito-tour-panel"><strong>Centro de custo</strong> = classificação da despesa (ex.: Água, Limpeza). Ao criar uma saída você vincula a um centro; relatórios e fechamento usam isso.</div>' +
            '<div class="exito-tour-panel"><strong>Comprovante</strong> = PDF do recibo/pagamento. Entrada recebida e saída paga exigem comprovante anexado. É a prova do que entrou ou saiu no caixa.</div>' +
            '</div>',
          side: 'bottom',
          align: 'center'
        }
      });
    }
    if (hasRole('ADMINISTRATIVO')) {
      steps.push({
        element: document.body,
        popover: {
          title: 'O que é cada coisa no sistema (Administrativo)',
          description: '<div class="exito-tour-tabs">' +
            '<button type="button" class="exito-tour-tab active">Tarefa</button>' +
            '<button type="button" class="exito-tour-tab">Ocorrência</button>' +
            '<button type="button" class="exito-tour-tab">Triagem</button>' +
            '<button type="button" class="exito-tour-tab">Orçamento</button>' +
            '<button type="button" class="exito-tour-tab">Documento</button>' +
            '</div><div class="exito-tour-panels">' +
            '<div class="exito-tour-panel active"><strong>Tarefa</strong> = serviço que você pede para a equipe fazer. Você <strong>cria</strong> a tarefa e atribui; o operacional/limpeza recebe, executa e <strong>conclui</strong> com fotos. Você acompanha e pode reabrir.</div>' +
            '<div class="exito-tour-panel"><strong>Ocorrência</strong> = registro que a equipe fez (ex.: problema encontrado). Ela aparece para você em <strong>Ocorrências</strong>. Você <strong>tria</strong>: classifica e pode <strong>converter em tarefa</strong> para alguém resolver.</div>' +
            '<div class="exito-tour-panel"><strong>Triagem</strong> = quando você analisa a ocorrência, classifica e decide: só documentar ou <strong>converter em tarefa</strong>. Convertendo, a tarefa é criada e o operacional recebe para executar.</div>' +
            '<div class="exito-tour-panel"><strong>Orçamento</strong> = pedido de compra/serviço. Você <strong>cria</strong> a solicitação e adiciona as <strong>cotações</strong> (propostas). O Financeiro revisa e libera; o Síndico aprova uma cotação. Aprovado vira saída (Financeiro paga).</div>' +
            '<div class="exito-tour-panel"><strong>Documento</strong> = arquivo (contrato, PDF). Você cadastra em Documentos, organiza por categorias e mantém o acervo do condomínio.</div>' +
            '</div>',
          side: 'bottom',
          align: 'center'
        }
      });
    }
    if (hasRole('OPERACIONAL') || hasRole('LIMPEZA')) {
      steps.push({
        element: document.body,
        popover: {
          title: 'O que é cada coisa no sistema (Operacional / Limpeza)',
          description: '<div class="exito-tour-tabs">' +
            '<button type="button" class="exito-tour-tab active">Checklist do dia</button>' +
            '<button type="button" class="exito-tour-tab">Tarefa</button>' +
            '<button type="button" class="exito-tour-tab">Ocorrência</button>' +
            '<button type="button" class="exito-tour-tab">Questionamento</button>' +
            '</div><div class="exito-tour-panels">' +
            '<div class="exito-tour-panel active"><strong>Checklist do dia</strong> = lista de itens que você deve fazer no dia (ex.: limpar hall, verificar bombas). O Síndico cria o <strong>modelo</strong>; o sistema gera a lista do dia. Você <strong>inicia</strong>, marca cada item como feito e pode anexar fotos. O síndico pode <strong>questionar</strong> itens não feitos; você responde.</div>' +
            '<div class="exito-tour-panel"><strong>Tarefa</strong> = serviço que o Administrativo pediu para você fazer. Aparece na sua tela de Tarefas. Você executa e <strong>conclui</strong> com fotos e observações. Assim o administrativo acompanha o que foi feito.</div>' +
            '<div class="exito-tour-panel"><strong>Ocorrência</strong> = registro de algo que você viu ou fez (ex.: vazamento, sujeira). Você <strong>cria</strong> a ocorrência (pode anexar foto). O Administrativo tria e pode virar uma <strong>tarefa</strong> para você ou outro.</div>' +
            '<div class="exito-tour-panel"><strong>Questionamento</strong> = quando o Síndico pergunta sobre um item do checklist que não foi feito ou não ficou claro. Você responde na tela de acompanhamento do checklist para explicar.</div>' +
            '</div>',
          side: 'bottom',
          align: 'center'
        }
      });
    }
    if (hasRole('PATRIMONIO')) {
      steps.push({
        element: document.body,
        popover: {
          title: 'O que é cada coisa (Patrimônio)',
          description: '<strong>Ativo</strong> = bem do condomínio (equipamento, móvel). Você cadastra e lista em Ativos, com detalhes e local. <strong>Manutenção</strong> = serviço preventivo ou corretivo em um ativo; você cria e acompanha; a equipe operacional pode ser quem executa.',
          side: 'bottom',
          align: 'center'
        }
      });
    }
    if (hasRole('CONSELHO')) {
      steps.push({
        element: document.body,
        popover: {
          title: 'Seu perfil: Conselho',
          description: 'Você tem acesso <strong>somente leitura</strong>: pode ver indicadores e relatórios no Dashboard do Conselho. Não cria nem edita nada no sistema; só acompanha.',
          side: 'bottom',
          align: 'center'
        }
      });
    }
    if (hasRole('SUPER_MASTER')) {
      steps.push({
        element: document.body,
        popover: {
          title: 'Seu perfil: Master',
          description: 'Você gerencia o <strong>sistema</strong>: <strong>Condomínios</strong> (unidades) e <strong>Usuários</strong> (perfis e acessos). Acesso global; não participa de aprovações financeiras dos condomínios.',
          side: 'bottom',
          align: 'center'
        }
      });
    }
    return steps;
  }

  /** Retorna os passos de FLUXO apenas do(s) perfil(is) do usuário. Síndico só vê fluxo do Síndico; Financeiro só do Financeiro; etc. */
  function getFlowStepsForUser() {
    var steps = [];
    if (hasRole('SINDICO') || hasRole('SUBSINDICO')) {
      steps.push({
        element: document.body,
        popover: {
          title: 'Fluxo do Síndico: o que você faz',
          description: '<div class="exito-tour-tabs">' +
            '<button type="button" class="exito-tour-tab active">Aprovações de saída</button>' +
            '<button type="button" class="exito-tour-tab">Aprovações de orçamento</button>' +
            '<button type="button" class="exito-tour-tab">Ocorrências</button>' +
            '<button type="button" class="exito-tour-tab">Checklists</button>' +
            '</div><div class="exito-tour-panels">' +
            '<div class="exito-tour-panel active"><strong>Ordem:</strong> (1) O Financeiro cria a saída. (2) Se for acima de R$ 5.000, aparece para você em Menu Aprovações. (3) Você abre o item, confere e clica em Aprovar ou Rejeitar. Rejeitado volta ao Financeiro. R$ 5k–10k: 1 aprovação; ≥ R$ 10k: 2; ≥ R$ 50k: 3.</div>' +
            '<div class="exito-tour-panel"><strong>Ordem:</strong> (1) Administrativo cria o orçamento e cola cotações. (2) Financeiro revisa e libera. (3) Em Aprovações você vê as cotações e escolhe qual aprovar. (4) Aprovado vira saída; o Financeiro verifica e paga.</div>' +
            '<div class="exito-tour-panel"><strong>Ordem:</strong> (1) A equipe (zeladoria/limpeza) registra a ocorrência. (2) Em Menu Ocorrências (ou Aprovações) você vê a lista. (3) Abra o item → Aprovar ou Rejeitar e, se quiser, adicione observações.</div>' +
            '<div class="exito-tour-panel"><strong>Ordem:</strong> (1) Você cria o modelo de checklist (itens fixos do dia). (2) O sistema gera o checklist do dia. (3) Operacional/Limpeza executa e marca itens. (4) Em Acompanhar checklists você vê os feitos; pode Questionar itens não feitos — eles respondem na mesma tela.</div>' +
            '</div>',
          side: 'bottom',
          align: 'center'
        }
      });
    }
    if (hasRole('FINANCEIRO')) {
      steps.push({
        element: document.body,
        popover: {
          title: 'Fluxo do Financeiro: o que você faz',
          description: '<div class="exito-tour-tabs">' +
            '<button type="button" class="exito-tour-tab active">Entradas</button>' +
            '<button type="button" class="exito-tour-tab">Saídas</button>' +
            '<button type="button" class="exito-tour-tab">Contas e Contas a Pagar</button>' +
            '<button type="button" class="exito-tour-tab">Quem aprova (valores)</button>' +
            '</div><div class="exito-tour-panels">' +
            '<div class="exito-tour-panel active"><strong>Ordem:</strong> (1) Você cria a entrada (Entradas → Nova entrada). (2) Quando o dinheiro entrar, clique em Receber → informe a data e anexe o comprovante. (3) Se precisar de aprovação do Síndico, ele aprova ou rejeita; rejeitada volta para você corrigir aqui.</div>' +
            '<div class="exito-tour-panel"><strong>Ordem:</strong> (1) Você cria a saída (Saídas → Nova saída). (2) Conforme o valor: aprovação automática, sua ou do Síndico — aprove em Aprovações se for seu limite. (3) Depois de aprovada: na lista, Pagar → data + comprovante. Sem comprovante o fluxo não fecha.</div>' +
            '<div class="exito-tour-panel"><strong>Ordem:</strong> (1) Em Contas você cadastra o fornecedor e adiciona cada boleto (vencimento, valor, PDF). (2) O boleto aparece em Contas a Pagar. (3) Você clica em Pagar → data + comprovante → o sistema gera a Saída sozinho.</div>' +
            '<div class="exito-tour-panel"><strong>Quem aprova por valor:</strong> &lt; R$ 1.000: automático. R$ 1k–5k: <strong>você</strong>. R$ 5k–10k: <strong>Síndico</strong> (1 aprovação). ≥ R$ 10k: 2 aprovações (Síndico). ≥ R$ 50k: 3 aprovações.</div>' +
            '</div>',
          side: 'bottom',
          align: 'center'
        }
      });
    }
    if (hasRole('ADMINISTRATIVO')) {
      steps.push({
        element: document.body,
        popover: {
          title: 'Fluxo do Administrativo: o que você faz',
          description: '<div class="exito-tour-tabs">' +
            '<button type="button" class="exito-tour-tab active">Tarefas</button>' +
            '<button type="button" class="exito-tour-tab">Triagem de ocorrências</button>' +
            '<button type="button" class="exito-tour-tab">Orçamentos</button>' +
            '</div><div class="exito-tour-panels">' +
            '<div class="exito-tour-panel active">Você <strong>cria tarefas</strong> e atribui à equipe operacional. Eles recebem, executam e concluem com fotos. Você acompanha e pode reabrir.</div>' +
            '<div class="exito-tour-panel">O Operacional/Limpeza <strong>cria</strong> a ocorrência. Você <strong>tria</strong>: classifica e pode <strong>converter em tarefa</strong>. A tarefa é criada e o operacional executa.</div>' +
            '<div class="exito-tour-panel">Você <strong>cria</strong> a solicitação de orçamento e adiciona cotações. O Financeiro revisa e libera; o Síndico aprova. Aprovado vira saída automaticamente.</div>' +
            '</div>',
          side: 'bottom',
          align: 'center'
        }
      });
    }
    if (hasRole('OPERACIONAL') || hasRole('LIMPEZA')) {
      steps.push({
        element: document.body,
        popover: {
          title: 'Fluxo Operacional / Limpeza: o que você faz',
          description: '<div class="exito-tour-tabs">' +
            '<button type="button" class="exito-tour-tab active">Checklists do dia</button>' +
            '<button type="button" class="exito-tour-tab">Tarefas</button>' +
            '<button type="button" class="exito-tour-tab">Ocorrências</button>' +
            '</div><div class="exito-tour-panels">' +
            '<div class="exito-tour-panel active">O sistema gera o checklist a partir do modelo (criado pelo Síndico). Você <strong>inicia</strong>, marca itens feitos e anexa fotos. O síndico pode questionar; você responde.</div>' +
            '<div class="exito-tour-panel">Tarefas criadas pelo Administrativo aparecem para você. <strong>Conclua</strong> com fotos e observações quando fizer o serviço.</div>' +
            '<div class="exito-tour-panel">Você <strong>registra ocorrências</strong> (com foto se quiser). O Administrativo tria e pode converter em tarefa para você executar.</div>' +
            '</div>',
          side: 'bottom',
          align: 'center'
        }
      });
    }
    if (hasRole('PATRIMONIO')) {
      steps.push({
        element: document.body,
        popover: {
          title: 'Fluxo do Patrimônio',
          description: 'Você controla <strong>ativos</strong> (cadastro e lista) e <strong>manutenções</strong> (criar e acompanhar). A equipe operacional pode executar manutenções atribuídas.',
          side: 'bottom',
          align: 'center'
        }
      });
    }
    if (hasRole('CONSELHO')) {
      steps.push({
        element: document.body,
        popover: {
          title: 'Fluxo do Conselho',
          description: 'Seu perfil tem acesso <strong>somente leitura</strong>. Você acompanha indicadores e relatórios no Dashboard. Não cria nem edita registros.',
          side: 'bottom',
          align: 'center'
        }
      });
    }
    if (hasRole('SUPER_MASTER')) {
      steps.push({
        element: document.body,
        popover: {
          title: 'Fluxo Master',
          description: 'Você gerencia <strong>condomínios</strong> e <strong>usuários</strong> do sistema. Acesso global. Sem aprovações financeiras das unidades.',
          side: 'bottom',
          align: 'center'
        }
      });
    }
    return steps;
  }

  function buildSteps() {
    var roles = getUserRoles();
    var steps = [];
    var path = getCurrentPath();

    steps.push({
      element: document.body,
      popover: {
        title: 'Tutorial: como mexer no sistema',
        description: 'Este tutorial mostra <strong>onde clicar</strong> e <strong>como navegar</strong>: menu, dashboard e esta tela. Avance para ver cada parte. Para entender <strong>como o sistema funciona</strong> e o <strong>fluxo</strong> do seu setor (quem faz o quê, em que ordem), acesse no menu: <strong>Como funciona o sistema</strong>.',
        side: 'bottom',
        align: 'center'
      }
    });

    var pageSteps = getPageTourSteps();
    if (pageSteps.length > 0) {
      steps.push({
        element: document.body,
        popover: {
          title: 'Tutorial desta página',
          description: 'Os passos a seguir explicam <strong>esta tela</strong>. Avance para ver cada parte.',
          side: 'bottom',
          align: 'center'
        }
      });
      pageSteps.forEach(function (s) { steps.push(s); });
    }

    steps.push({
      element: '#tour-navbar',
      popover: {
        title: 'Menu',
        description: 'Passe o mouse no nome do módulo (Síndico, Financeiro, Administrativo etc.) para abrir o submenu. Clique em <strong>Dashboard</strong>, listas ou formulários para acessar cada tela. Use <strong>Como funciona o sistema</strong> para ver o fluxo do seu setor.',
        side: 'bottom',
        align: 'center'
      }
    });

    steps.push({
      element: document.body,
      popover: {
        title: 'Dashboard',
        description: 'O <strong>Dashboard</strong> é a primeira opção do menu: resumo, alertas e atalhos. Use para ter visão rápida do que precisa fazer.',
        side: 'bottom',
        align: 'center'
      }
    });

    steps.push({
      element: '#tour-notificacoes',
      popover: {
        title: 'Notificações',
        description: 'Aqui aparecem avisos e alertas (aprovações pendentes, tarefas, prazos). O número indica quantas não lidas.',
        side: 'left',
        align: 'center'
      }
    });

    steps.push({
      element: '#tour-trigger',
      popover: {
        title: 'Em dúvida? Veja o tutorial de novo',
        description: 'Em qualquer tela, clique no botão <strong>Em dúvida? Tutorial</strong> para assistir a este tutorial novamente. Bom uso do sistema!',
        side: 'bottom',
        align: 'center'
      }
    });

    steps.push({
      element: '#tour-footer',
      popover: {
        title: 'Fim do tour',
        description: 'Este tutorial está disponível em todas as páginas. Use o botão "Em dúvida? Tutorial" quando precisar. Obrigado!',
        side: 'top',
        align: 'center'
      }
    });

    return steps;
  }

  function getStepsFiltered(steps) {
    return steps.filter(function (step) {
      if (!step.element || step.element === document.body) return true;
      if (typeof step.element === 'string') return document.querySelector(step.element);
      return step.element && document.contains(step.element);
    });
  }

  function startTour() {
    var driverFn = getDriverFn();
    if (!driverFn) {
      window.alert('Tutorial temporariamente indisponível. Recarregue a página ou tente mais tarde.');
      return;
    }
    var steps = buildSteps();
    var stepsFiltered = getStepsFiltered(steps);
    if (!stepsFiltered.length) return;
    var driverObj = driverFn({
      showProgress: true,
      progressText: '{{current}} de {{total}}',
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      doneBtnText: 'Concluir',
      steps: stepsFiltered,
      allowClose: true,
      overlayOpacity: 0.6,
      smoothScroll: true,
      onPopoverRender: function (popover) {
        var el = popover.description || (popover.wrapper && popover.wrapper.querySelector && popover.wrapper.querySelector('.driver-popover-description'));
        if (el && el.querySelector && el.querySelector('.exito-tour-tabs')) bindTabsInPopover(el);
      },
      onDestroyed: function () {
        document.body.classList.remove('driver-active');
      }
    });
    document.body.classList.add('driver-active');
    driverObj.drive();
  }

  function onTourClick(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    startTour();
  }

  function init() {
    var trigger = document.getElementById('tour-trigger');
    var triggerMobile = document.getElementById('tour-trigger-mobile');
    if (trigger) trigger.addEventListener('click', onTourClick);
    if (triggerMobile) triggerMobile.addEventListener('click', onTourClick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
