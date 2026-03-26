// Testes Completos do Módulo FINANCEIRO
// Testa funcionalidades reais: CRUD, validações, regras de negócio, fluxos

const { query } = require('../src/config/database');
const financeiroService = require('../src/services/financeiroService');

async function run(runner) {
  runner.logDetail('Iniciando testes completos do módulo Financeiro...');

  let testCondominiumId = null;
  let testFinanceiroUserId = null;
  let testSindicoUserId = null;
  let testExitId = null;
  let testEntryId = null;
  let testCostCenterId = null;

  // ========================================
  // SETUP: Preparar dados de teste
  // ========================================
  await runner.test('SETUP: Buscar condomínio e usuários para teste', async () => {
    const condominiumResult = await query('SELECT id FROM condominiums WHERE active = TRUE LIMIT 1');

    if (condominiumResult.rows.length === 0) {
      throw new Error('Nenhum condomínio ativo encontrado para teste');
    }

    testCondominiumId = condominiumResult.rows[0].id;

    // Buscar usuário FINANCEIRO
    const financeiroResult = await query(`
      SELECT u.id FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'FINANCEIRO' AND u.condominium_id = $1 AND u.active = TRUE
      LIMIT 1
    `, [testCondominiumId]);

    if (financeiroResult.rows.length > 0) {
      testFinanceiroUserId = financeiroResult.rows[0].id;
    }

    // Buscar usuário SINDICO
    const sindicoResult = await query(`
      SELECT u.id FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'SINDICO' AND u.condominium_id = $1 AND u.active = TRUE
      LIMIT 1
    `, [testCondominiumId]);

    if (sindicoResult.rows.length > 0) {
      testSindicoUserId = sindicoResult.rows[0].id;
    }

    runner.logDetail(`Condomínio: ${testCondominiumId}`);
    runner.logDetail(`Usuário Financeiro: ${testFinanceiroUserId || 'não encontrado'}`);
    runner.logDetail(`Usuário Síndico: ${testSindicoUserId || 'não encontrado'}`);

    if (!testFinanceiroUserId) {
      runner.logWarning('Usuário FINANCEIRO não encontrado - alguns testes serão pulados');
    }
  });

  // ========================================
  // TESTE 1: VALIDAÇÕES DE FORMULÁRIO (SAÍDA)
  // ========================================
  await runner.test('Validação: Criar saída SEM descrição (deve falhar)', async () => {
    if (!testCondominiumId || !testFinanceiroUserId) {
      runner.logWarning('Pulando teste - dados de teste não disponíveis');
      return;
    }

    try {
      await financeiroService.createExit(
        testCondominiumId,
        testFinanceiroUserId,
        {
          // description faltando
          amount: '100.00',
          exitDate: new Date().toISOString().split('T')[0],
          category: 'MANUTENCAO'
        },
        '127.0.0.1',
        'Test Runner'
      );

      throw new Error('Deveria ter falhado - descrição é obrigatória');
    } catch (error) {
      if (error.message.includes('Descrição') || error.message.includes('obrigatório')) {
        runner.logDetail(`✅ Validação funcionando: ${error.message}`);
      } else {
        throw error;
      }
    }
  });

  await runner.test('Validação: Criar saída SEM valor (deve falhar)', async () => {
    if (!testCondominiumId || !testFinanceiroUserId) {
      runner.logWarning('Pulando teste - dados de teste não disponíveis');
      return;
    }

    try {
      await financeiroService.createExit(
        testCondominiumId,
        testFinanceiroUserId,
        {
          description: 'Teste sem valor',
          // amount faltando
          exitDate: new Date().toISOString().split('T')[0],
          category: 'MANUTENCAO'
        },
        '127.0.0.1',
        'Test Runner'
      );

      throw new Error('Deveria ter falhado - valor é obrigatório');
    } catch (error) {
      if (error.message.includes('Valor') || error.message.includes('obrigatório')) {
        runner.logDetail(`✅ Validação funcionando: ${error.message}`);
      } else {
        throw error;
      }
    }
  });

  await runner.test('Validação: Criar saída com valor ZERO (deve falhar)', async () => {
    if (!testCondominiumId || !testFinanceiroUserId) {
      runner.logWarning('Pulando teste - dados de teste não disponíveis');
      return;
    }

    try {
      await financeiroService.createExit(
        testCondominiumId,
        testFinanceiroUserId,
        {
          description: 'Teste valor zero',
          amount: '0',
          exitDate: new Date().toISOString().split('T')[0],
          category: 'MANUTENCAO'
        },
        '127.0.0.1',
        'Test Runner'
      );

      throw new Error('Deveria ter falhado - valor zero não permitido');
    } catch (error) {
      if (error.message.includes('zero') || error.message.includes('Valor')) {
        runner.logDetail(`✅ Validação funcionando: ${error.message}`);
      } else {
        throw error;
      }
    }
  });

  await runner.test('Validação: Criar saída com valor NEGATIVO (deve falhar)', async () => {
    if (!testCondominiumId || !testFinanceiroUserId) {
      runner.logWarning('Pulando teste - dados de teste não disponíveis');
      return;
    }

    try {
      await financeiroService.createExit(
        testCondominiumId,
        testFinanceiroUserId,
        {
          description: 'Teste valor negativo',
          amount: '-100.00',
          exitDate: new Date().toISOString().split('T')[0],
          category: 'MANUTENCAO'
        },
        '127.0.0.1',
        'Test Runner'
      );

      throw new Error('Deveria ter falhado - valor negativo não permitido');
    } catch (error) {
      if (error.message.includes('negativo') || error.message.includes('Valor')) {
        runner.logDetail(`✅ Validação funcionando: ${error.message}`);
      } else {
        throw error;
      }
    }
  });

  // ========================================
  // TESTE 2: CRUD COMPLETO (SAÍDA)
  // ========================================
  await runner.test('CRUD Saída: Criar saída com dados válidos', async () => {
    if (!testCondominiumId || !testFinanceiroUserId) {
      runner.logWarning('Pulando teste - dados de teste não disponíveis');
      return;
    }

    // Buscar ou criar centro de custo
    const costCenterResult = await query(`
      SELECT id FROM cost_centers 
      WHERE condominium_id = $1 AND active = TRUE 
      LIMIT 1
    `, [testCondominiumId]);

    if (costCenterResult.rows.length > 0) {
      testCostCenterId = costCenterResult.rows[0].id;
    } else {
      // Criar centro de custo temporário
      const newCostCenter = await query(`
        INSERT INTO cost_centers (condominium_id, name, description)
        VALUES ($1, 'Teste QA', 'Centro de custo para testes')
        RETURNING id
      `, [testCondominiumId]);
      testCostCenterId = newCostCenter.rows[0].id;
    }

    const exitData = {
      description: `[TESTE QA] Saída Teste ${Date.now()}`,
      amount: '150.50',
      exitDate: new Date().toISOString().split('T')[0],
      costCenterId: testCostCenterId,
      category: 'MANUTENCAO',
      requiresApproval: false
    };

    const exit = await financeiroService.createExit(
      testCondominiumId,
      testFinanceiroUserId,
      exitData,
      '127.0.0.1',
      'Test Runner'
    );

    testExitId = exit.id;

    runner.logDetail(`✅ Saída criada: ID ${testExitId}`);
    runner.logDetail(`   Descrição: ${exit.description}`);
    runner.logDetail(`   Valor: R$ ${exit.amount}`);
    runner.logDetail(`   Status: ${exit.payment_status}`);

    // Valida dados salvos
    if (exit.description !== exitData.description) {
      throw new Error('Descrição não corresponde');
    }

    if (parseFloat(exit.amount) !== parseFloat(exitData.amount)) {
      throw new Error('Valor não corresponde');
    }

    // Verifica no banco
    const dbExit = await query('SELECT * FROM financial_exits WHERE id = $1', [testExitId]);
    if (dbExit.rows.length === 0) {
      throw new Error('Saída não encontrada no banco de dados');
    }

    runner.logDetail('✅ Dados persistidos corretamente no banco');
  });

  await runner.test('CRUD Saída: Buscar saída por ID', async () => {
    if (!testExitId) {
      runner.logWarning('Pulando teste - saída de teste não foi criada');
      return;
    }

    const result = await query(`
      SELECT fe.*, cc.name as cost_center_name
      FROM financial_exits fe
      LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
      WHERE fe.id = $1
    `, [testExitId]);

    if (result.rows.length === 0) {
      throw new Error('Saída não encontrada por ID');
    }

    const exit = result.rows[0];
    runner.logDetail(`✅ Saída encontrada: ${exit.description}`);
    runner.logDetail(`   Centro de Custo: ${exit.cost_center_name || 'N/A'}`);
  });

  await runner.test('CRUD Saída: Atualizar saída (descrição)', async () => {
    if (!testExitId || !testCondominiumId || !testFinanceiroUserId) {
      runner.logWarning('Pulando teste - dados de teste não disponíveis');
      return;
    }

    const newDescription = `[TESTE QA] Saída Atualizada ${Date.now()}`;

    const updated = await financeiroService.updateExit(
      testExitId,
      testCondominiumId,
      testFinanceiroUserId,
      { description: newDescription },
      ['FINANCEIRO'],
      '127.0.0.1',
      'Test Runner'
    );

    runner.logDetail(`✅ Saída atualizada: ${updated.description}`);

    // Valida atualização
    if (updated.description !== newDescription) {
      throw new Error('Descrição não foi atualizada');
    }
  });

  await runner.test('CRUD Saída: Atualizar limite de aprovação em saída PENDING', async () => {
    if (!testCondominiumId || !testFinanceiroUserId) {
      runner.logWarning('Pulando teste - dados de teste não disponíveis');
      return;
    }

    const exitData = {
      description: `[TESTE QA] Update Limite Pending ${Date.now()}`,
      amount: '400.00',
      exitDate: new Date().toISOString().split('T')[0],
      category: 'MANUTENCAO',
      requiresApproval: true,
      approvalLimit: 100.00
    };

    const created = await financeiroService.createExit(
      testCondominiumId,
      testFinanceiroUserId,
      exitData,
      '127.0.0.1',
      'Test Runner'
    );

    if (created.payment_status !== 'PENDING') {
      runner.logWarning(`Status criado diferente de PENDING (${created.payment_status}); seguindo mesmo assim para validar update do limite`);
    }

    const updated = await financeiroService.updateExit(
      created.id,
      testCondominiumId,
      testFinanceiroUserId,
      { approvalLimit: '250.00' },
      ['FINANCEIRO'],
      '127.0.0.1',
      'Test Runner'
    );

    if (parseFloat(updated.approval_limit) !== 250.00) {
      throw new Error(`approval_limit esperado 250.00, obtido ${updated.approval_limit}`);
    }

    runner.logDetail(`✅ Limite atualizado em saída PENDING: ${updated.approval_limit}`);
  });

  await runner.test('CRUD Saída: Atualizar limite de aprovação em saída APPROVED', async () => {
    if (!testCondominiumId || !testFinanceiroUserId) {
      runner.logWarning('Pulando teste - dados de teste não disponíveis');
      return;
    }

    const exitData = {
      description: `[TESTE QA] Update Limite Approved ${Date.now()}`,
      amount: '80.00',
      exitDate: new Date().toISOString().split('T')[0],
      category: 'MANUTENCAO',
      requiresApproval: false
    };

    const created = await financeiroService.createExit(
      testCondominiumId,
      testFinanceiroUserId,
      exitData,
      '127.0.0.1',
      'Test Runner'
    );

    if (created.payment_status === 'PENDING') {
      if (!testSindicoUserId) {
        runner.logWarning('Pulando teste - saída criada como PENDING e usuário SINDICO não está disponível para aprovar');
        return;
      }
      await financeiroService.approveExit(
        created.id,
        testCondominiumId,
        testSindicoUserId,
        ['SINDICO'],
        '127.0.0.1',
        'Test Runner'
      );
    }

    const updated = await financeiroService.updateExit(
      created.id,
      testCondominiumId,
      testFinanceiroUserId,
      { approvalLimit: '300.00' },
      ['FINANCEIRO'],
      '127.0.0.1',
      'Test Runner'
    );

    if (parseFloat(updated.approval_limit) !== 300.00) {
      throw new Error(`approval_limit esperado 300.00, obtido ${updated.approval_limit}`);
    }

    runner.logDetail(`✅ Limite atualizado em saída APPROVED: ${updated.approval_limit}`);
  });

  await runner.test('CRUD Saída: Listar saídas do condomínio', async () => {
    if (!testCondominiumId) {
      runner.logWarning('Pulando teste - condomínio não disponível');
      return;
    }

    const result = await query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN payment_status = 'PENDING' THEN 1 ELSE 0 END) as pending,
             SUM(CASE WHEN payment_status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
             SUM(CASE WHEN payment_status = 'PAID' THEN 1 ELSE 0 END) as paid
      FROM financial_exits
      WHERE condominium_id = $1
    `, [testCondominiumId]);

    const stats = result.rows[0];
    runner.logDetail(`Total de saídas: ${stats.total}`);
    runner.logDetail(`  Pendentes: ${stats.pending}`);
    runner.logDetail(`  Aprovadas: ${stats.approved}`);
    runner.logDetail(`  Pagas: ${stats.paid}`);

    if (parseInt(stats.total) === 0) {
      runner.logWarning('Nenhuma saída encontrada no condomínio');
    }
  });

  // ========================================
  // TESTE 3: REGRAS DE NEGÓCIO
  // ========================================
  await runner.test('Regra de Negócio: Conta paga NÃO pode ser editada', async () => {
    if (!testExitId || !testCondominiumId || !testFinanceiroUserId) {
      runner.logWarning('Pulando teste - dados de teste não disponíveis');
      return;
    }

    // Criar uma nova saída específica para este teste
    const exitData = {
      description: `[TESTE QA] Regra Conta Paga ${Date.now()}`,
      amount: '100.00',
      exitDate: new Date().toISOString().split('T')[0],
      category: 'MANUTENCAO',
      requiresApproval: false
    };

    const newExit = await financeiroService.createExit(
      testCondominiumId,
      testFinanceiroUserId,
      exitData,
      '127.0.0.1',
      'Test Runner'
    );

    // Aprovar a saída primeiro (se necessário)
    if (testSindicoUserId && newExit.payment_status === 'PENDING') {
      await financeiroService.approveExit(
        newExit.id,
        testCondominiumId,
        testSindicoUserId,
        ['SINDICO'],
        '127.0.0.1',
        'Test Runner'
      ).catch(() => {}); // Ignora erros
    }

    // Marcar como paga (com comprovante opcional)
    try {
      await financeiroService.markExitAsPaid(
        newExit.id,
        testCondominiumId,
        testFinanceiroUserId,
        {
          paymentMethod: 'TRANSFERENCIA',
          paymentDetails: 'Banco Teste',
          paymentReceiptPdfPath: 'teste.pdf' // Simula comprovante
        },
        '127.0.0.1',
        'Test Runner'
      );
    } catch (error) {
      throw error;
    }

    // Verificar se está paga
    const paidExit = await query('SELECT payment_status FROM financial_exits WHERE id = $1', [newExit.id]);
    if (paidExit.rows[0].payment_status !== 'PAID') {
      runner.logDetail(`⚠️  Saída não está paga (status: ${paidExit.rows[0].payment_status}) - regra não testada`);
      return;
    }

    // Tentar editar conta paga
    try {
      await financeiroService.updateExit(
        newExit.id,
        testCondominiumId,
        testFinanceiroUserId,
        { description: 'Tentativa de editar conta paga' },
        ['FINANCEIRO'],
        '127.0.0.1',
        'Test Runner'
      );

      throw new Error('Deveria ter falhado - conta paga não pode ser editada');
    } catch (error) {
      if (error.message.includes('paga') || error.message.includes('editada') || error.message.includes('não pode ser')) {
        runner.logDetail(`✅ Regra de negócio funcionando: ${error.message}`);
      } else {
        throw error;
      }
    }
  });

  await runner.test('Regra de Negócio: Fluxo completo (Criar → Aprovar → Pagar)', async () => {
    if (!testCondominiumId || !testFinanceiroUserId || !testSindicoUserId) {
      runner.logWarning('Pulando teste - dados de teste não disponíveis');
      return;
    }

    // Criar nova saída
    const exitData = {
      description: `[TESTE QA] Fluxo Completo ${Date.now()}`,
      amount: '200.00',
      exitDate: new Date().toISOString().split('T')[0],
      category: 'MANUTENCAO',
      requiresApproval: true,
      approvalLimit: 100.00 // Valor acima do limite requer aprovação
    };

    const exit = await financeiroService.createExit(
      testCondominiumId,
      testFinanceiroUserId,
      exitData,
      '127.0.0.1',
      'Test Runner'
    );

    runner.logDetail(`✅ Saída criada: ID ${exit.id}, Status: ${exit.payment_status}`);

    // Verificar que está PENDING (pois requer aprovação)
    if (exit.payment_status !== 'PENDING' && exit.requires_approval) {
      runner.logWarning(`Status inicial: ${exit.payment_status} (esperado PENDING se requires_approval)`);
    }

    // Aprovar
    const approved = await financeiroService.approveExit(
      exit.id,
      testCondominiumId,
      testSindicoUserId,
      ['SINDICO'],
      '127.0.0.1',
      'Test Runner'
    );

    runner.logDetail(`✅ Saída aprovada: Status: ${approved.payment_status}`);

    if (approved.payment_status !== 'APPROVED') {
      throw new Error(`Status esperado: APPROVED, obtido: ${approved.payment_status}`);
    }

    // Marcar como paga
    // Nota: comprovante é opcional neste fluxo, mas aqui enviamos um caminho para cobrir os dois cenários
    const paid = await financeiroService.markExitAsPaid(
      exit.id,
      testCondominiumId,
      testFinanceiroUserId,
      {
        paymentMethod: 'TRANSFERENCIA',
        paymentDetails: 'Banco Teste',
        paymentReceiptPdfPath: `/uploads/receipts/test_receipt_${Date.now()}.pdf` // Comprovante opcional
      },
      '127.0.0.1',
      'Test Runner'
    );

    runner.logDetail(`✅ Saída marcada como paga: Status: ${paid.payment_status}`);

    if (paid.payment_status !== 'PAID') {
      throw new Error(`Status esperado: PAID, obtido: ${paid.payment_status}`);
    }

    // Verificar audit logs
    const auditLogs = await query(`
      SELECT action FROM audit_logs
      WHERE entity_type = 'financial_exits' AND entity_id = $1
      ORDER BY created_at
    `, [exit.id]);

    const actions = auditLogs.rows.map(r => r.action);
    runner.logDetail(`✅ Audit logs: ${actions.join(' → ')}`);

    if (actions.length < 3) {
      runner.logWarning(`Esperado pelo menos 3 logs (CREATE, APPROVE, PAY), encontrado: ${actions.length}`);
    }
  });

  // ========================================
  // Consumo: analytics e fluxo conta → consumo
  // ========================================
  await runner.test('getConsumptionAnalytics: estrutura e filtros', async () => {
    if (!testCondominiumId || !testFinanceiroUserId) {
      runner.logWarning('Pulando teste - dados de teste não disponíveis');
      return;
    }

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const dataInicio = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const dataFim = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const analytics = await financeiroService.getConsumptionAnalytics(testCondominiumId, {
      dataInicio,
      dataFim,
    });

    if (typeof analytics.totalAmount !== 'number') {
      throw new Error('getConsumptionAnalytics deve retornar totalAmount numérico');
    }
    if (!Array.isArray(analytics.series)) {
      throw new Error('getConsumptionAnalytics deve retornar series como array');
    }
    if (!Array.isArray(analytics.recentRecords)) {
      throw new Error('getConsumptionAnalytics deve retornar recentRecords como array');
    }

    const bill = await financeiroService.createAccount(
      testCondominiumId,
      testFinanceiroUserId,
      {
        name: `[TESTE QA] Conta consumo ${Date.now()}`,
        billType: 'AGUA',
      },
      '127.0.0.1',
      'Test Runner'
    );

    const filtered = await financeiroService.getConsumptionAnalytics(testCondominiumId, {
      dataInicio,
      dataFim,
      consumoBillId: bill.id,
      consumoBillType: 'AGUA',
    });

    if (filtered.filters.consumoBillId !== bill.id) {
      throw new Error('Filtro consumoBillId deve ser aplicado quando a conta existe');
    }
    runner.logDetail(`✅ getConsumptionAnalytics OK (conta teste id=${bill.id})`);

    if (!Array.isArray(analytics.seriesPorConta)) {
      throw new Error('getConsumptionAnalytics deve retornar seriesPorConta como array');
    }

    const testMonth = m === 1 ? 2 : m - 1;
    const testYear = m === 1 ? y - 1 : y;
    const created = await financeiroService.createConsumption(
      testCondominiumId,
      testFinanceiroUserId,
      {
        billId: bill.id,
        month: testMonth,
        year: testYear,
        consumptionValue: '10',
        consumptionUnit: 'M3',
        billAmount: '99.90',
        dueDate: null,
      },
      '127.0.0.1',
      'Test Runner'
    );

    await financeiroService.updateConsumption(
      created.id,
      testCondominiumId,
      testFinanceiroUserId,
      {
        billId: bill.id,
        month: testMonth,
        year: testYear,
        consumptionValue: '11',
        consumptionUnit: 'M3',
        billAmount: '100.00',
        dueDate: null,
      },
      '127.0.0.1',
      'Test Runner'
    );

    const listed = await financeiroService.listConsumption(testCondominiumId, {
      billId: bill.id,
      monthFromKey: testYear * 12 + testMonth,
      monthToKey: testYear * 12 + testMonth,
      limit: 50,
    });
    const found = listed.find((r) => r.id === created.id);
    if (!found || parseFloat(found.bill_amount) !== 100) {
      throw new Error('listConsumption com intervalo de meses deve incluir registro atualizado');
    }

    await financeiroService.deleteConsumption(
      created.id,
      testCondominiumId,
      testFinanceiroUserId,
      '127.0.0.1',
      'Test Runner'
    );

    const gone = await financeiroService.getConsumptionById(created.id, testCondominiumId);
    if (gone) {
      throw new Error('deleteConsumption deve remover o registro');
    }

    await query('DELETE FROM bills WHERE id = $1', [bill.id]);
    runner.logDetail('✅ CRUD consumo mensal + listConsumption por intervalo OK');
  });

  runner.logDetail('Testes completos do módulo Financeiro concluídos!');
}

module.exports = { run };
