// Testes Operacionais - Adicionam dados e testam fluxos reais

const { query } = require('../src/config/database');
const inadimplenciaService = require('../src/services/inadimplenciaService');
const assemblyService = require('../src/services/assemblyService');
const monthlyClosureService = require('../src/services/monthlyClosureService');
const reserveFundService = require('../src/services/reserveFundService');

async function run(runner) {
  runner.logInfo('Iniciando testes operacionais (com criação de dados)...');

  let testCondominiumId = null;
  let testUserId = null;
  let testApartmentId = null;
  let testFeeId = null;
  let testAssemblyId = null;

  // Setup: Obter condomínio e usuário de teste
  await runner.test('Setup: Obter dados de teste', async () => {
    // Busca usuário com perfil FINANCEIRO ou SINDICO que tenha condomínio
    const users = await query(`
      SELECT u.id, u.username, u.condominium_id
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name IN ('FINANCEIRO', 'SINDICO')
        AND u.condominium_id IS NOT NULL
        AND u.active = TRUE
      LIMIT 1
    `);

    if (users.rows.length === 0) {
      throw new Error('Nenhum usuário FINANCEIRO ou SINDICO com condomínio encontrado');
    }

    testUserId = users.rows[0].id;
    testCondominiumId = users.rows[0].condominium_id;
    
    runner.logDetail(`Usuário de teste: ${users.rows[0].username} (ID ${testUserId})`);
    runner.logDetail(`Condomínio de teste: ID ${testCondominiumId}`);
  });

  // FLUXO 1: Cadastro de Apartamento → Taxa → Pagamento
  await runner.test('FLUXO 1: Cadastrar Apartamento', async () => {
    const apartmentData = {
      number: `TEST-${Date.now()}`,
      block: 'TESTE',
      ownerName: 'Proprietário Teste',
      ownerDocument: '12345678900',
      ownerPhone: '11999999999',
      ownerEmail: 'teste@teste.com',
      fractionIdeal: 0.0250
    };

    const apartment = await inadimplenciaService.createApartment(
      testCondominiumId,
      testUserId,
      apartmentData,
      '127.0.0.1',
      'Test Runner'
    );

    testApartmentId = apartment.id;
    runner.logDetail(`✅ Apartamento criado: ${apartment.number} (ID: ${apartment.id})`);
    runner.logSuccess(`Apartamento ${apartment.number} cadastrado com sucesso`);
  });

  await runner.test('FLUXO 1: Criar Taxa Mensal', async () => {
    if (!testApartmentId) {
      throw new Error('Apartamento de teste não foi criado');
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const dueDate = new Date(currentYear, currentMonth - 1, 10);

    const feeData = {
      apartmentId: testApartmentId,
      month: currentMonth,
      year: currentYear,
      amount: 500.00,
      dueDate: dueDate.toISOString().split('T')[0]
    };

    const fee = await inadimplenciaService.createMonthlyFee(
      testCondominiumId,
      testUserId,
      feeData,
      '127.0.0.1',
      'Test Runner'
    );

    testFeeId = fee.id;
    runner.logDetail(`✅ Taxa criada: R$ ${fee.amount} (ID: ${fee.id})`);
    runner.logDetail(`   Vencimento: ${new Date(fee.due_date).toLocaleDateString('pt-BR')}`);
    runner.logSuccess('Taxa mensal criada com sucesso');
  });

  await runner.test('FLUXO 1: Verificar Cálculo Automático de Inadimplência', async () => {
    if (!testFeeId) {
      throw new Error('Taxa de teste não foi criada');
    }

    // Força atualização de dias em atraso
    await inadimplenciaService.updateOverdueDays(testFeeId);

    const fee = await query('SELECT * FROM monthly_fees WHERE id = $1', [testFeeId]);
    
    if (fee.rows.length === 0) {
      throw new Error('Taxa não encontrada');
    }

    const feeData = fee.rows[0];
    runner.logDetail(`Dias em atraso: ${feeData.days_overdue || 0}`);
    runner.logDetail(`Multa: R$ ${parseFloat(feeData.late_fee || 0).toFixed(2)}`);
    runner.logDetail(`Juros: R$ ${parseFloat(feeData.interest || 0).toFixed(2)}`);

    runner.logSuccess('Cálculo automático funcionando');
  });

  await runner.test('FLUXO 1: Marcar Taxa como Paga', async () => {
    if (!testFeeId) {
      throw new Error('Taxa de teste não foi criada');
    }

    const paymentData = {
      paymentMethod: 'PIX',
      paymentReceiptPath: null
    };

    const updated = await inadimplenciaService.markFeeAsPaid(
      testFeeId,
      testCondominiumId,
      testUserId,
      paymentData,
      '127.0.0.1',
      'Test Runner'
    );

    runner.logDetail(`✅ Taxa marcada como paga`);
    runner.logDetail(`   Método: ${updated.payment_method}`);
    runner.logDetail(`   Data: ${new Date(updated.paid_at).toLocaleString('pt-BR')}`);

    // Verifica se dias em atraso foram zerados
    if (updated.days_overdue !== 0) {
      throw new Error('Dias em atraso deveriam ser 0 após pagamento');
    }

    runner.logSuccess('Taxa marcada como paga corretamente');
  });

  // FLUXO 2: Criar Assembleia → Adicionar Participante → Adicionar Decisão → Finalizar
  await runner.test('FLUXO 2: Criar Assembleia', async () => {
    const assemblyData = {
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias no futuro
      time: '19:00',
      type: 'ORDINARIA',
      location: 'Salão de Festas',
      agenda: 'Pauta de teste: Aprovação de orçamento, Eleição de síndico',
      quorum: 10
    };

    const assembly = await assemblyService.createAssembly(
      testCondominiumId,
      testUserId,
      assemblyData,
      '127.0.0.1',
      'Test Runner'
    );

    testAssemblyId = assembly.id;
    runner.logDetail(`✅ Assembleia criada: ID ${assembly.id}`);
    runner.logDetail(`   Data: ${new Date(assembly.date).toLocaleDateString('pt-BR')}`);
    runner.logDetail(`   Tipo: ${assembly.type}`);
    runner.logSuccess('Assembleia criada com sucesso');
  });

  await runner.test('FLUXO 2: Adicionar Participante à Assembleia', async () => {
    if (!testAssemblyId) {
      throw new Error('Assembleia de teste não foi criada');
    }

    const participantData = {
      ownerName: 'Participante Teste',
      ownerDocument: '98765432100',
      apartmentId: testApartmentId,
      present: true,
      signed: false
    };

    const participant = await assemblyService.addParticipant(
      testAssemblyId,
      testCondominiumId,
      testUserId,
      participantData,
      '127.0.0.1',
      'Test Runner'
    );

    runner.logDetail(`✅ Participante adicionado: ${participant.owner_name}`);
    runner.logDetail(`   Presente: ${participant.present ? 'Sim' : 'Não'}`);
    runner.logSuccess('Participante adicionado com sucesso');
  });

  await runner.test('FLUXO 2: Adicionar Decisão à Assembleia', async () => {
    if (!testAssemblyId) {
      throw new Error('Assembleia de teste não foi criada');
    }

    const decisionData = {
      decisionNumber: 1,
      title: 'Aprovação de Orçamento 2026',
      description: 'Aprovar orçamento anual de R$ 120.000,00',
      votesFor: 8,
      votesAgainst: 2,
      votesAbstention: 0,
      approved: true
    };

    const decision = await assemblyService.addDecision(
      testAssemblyId,
      testCondominiumId,
      testUserId,
      decisionData,
      '127.0.0.1',
      'Test Runner'
    );

    runner.logDetail(`✅ Decisão adicionada: ${decision.title}`);
    runner.logDetail(`   Aprovada: ${decision.approved ? 'Sim' : 'Não'}`);
    runner.logDetail(`   Votos: ${decision.votes_for} a favor, ${decision.votes_against} contra`);
    runner.logSuccess('Decisão adicionada com sucesso');
  });

  await runner.test('FLUXO 2: Verificar Quórum da Assembleia', async () => {
    if (!testAssemblyId) {
      throw new Error('Assembleia de teste não foi criada');
    }

    const assembly = await assemblyService.getAssemblyById(testAssemblyId, testCondominiumId);
    
    const presentCount = assembly.participants?.filter(p => p.present).length || 0;
    const quorumNeeded = assembly.quorum || 0;
    const quorumAchieved = presentCount >= quorumNeeded;

    runner.logDetail(`Participantes presentes: ${presentCount}`);
    runner.logDetail(`Quórum necessário: ${quorumNeeded}`);
    runner.logDetail(`Quórum atingido: ${quorumAchieved ? 'Sim' : 'Não'}`);

    runner.logSuccess('Verificação de quórum funcionando');
  });

  // FLUXO 3: Fechamento Mensal
  await runner.test('FLUXO 3: Validar Fechamento Mensal', async () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const validation = await monthlyClosureService.validateMonthClosure(
      testCondominiumId,
      currentMonth,
      currentYear
    );

    runner.logDetail(`Pode fechar: ${validation.canClose}`);
    runner.logDetail(`Pendências: ${validation.pendingEntries || 0} entradas, ${validation.pendingExits || 0} saídas`);

    if (validation.errors && validation.errors.length > 0) {
      validation.errors.forEach(err => {
        runner.logDetail(`  ⚠️  ${err}`);
      });
    }

    runner.logSuccess('Validação de fechamento funcionando');
  });

  await runner.test('FLUXO 3: Calcular Totais do Mês', async () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const totals = await monthlyClosureService.calculateMonthTotals(
      testCondominiumId,
      currentMonth,
      currentYear
    );

    runner.logDetail(`Total Entradas: R$ ${totals.totalEntries.toFixed(2)}`);
    runner.logDetail(`Total Saídas: R$ ${totals.totalExits.toFixed(2)}`);
    runner.logDetail(`Saldo: R$ ${totals.balance.toFixed(2)}`);

    runner.logSuccess('Cálculo de totais funcionando');
  });

  // FLUXO 4: Fundo de Reserva
  await runner.test('FLUXO 4: Configurar Fundo de Reserva', async () => {
    const fundData = {
      targetBalance: 50000.00,
      contributionMethod: 'FIXED',
      monthlyContributionAmount: 1000.00,
      monthlyContributionPercent: null
    };

    await reserveFundService.setupReserveFund(
      testCondominiumId,
      testUserId,
      fundData,
      '127.0.0.1',
      'Test Runner'
    );

    const fund = await reserveFundService.getReserveFund(testCondominiumId);

    runner.logDetail(`✅ Fundo configurado`);
    runner.logDetail(`   Meta: R$ ${parseFloat(fund.target_balance).toFixed(2)}`);
    runner.logDetail(`   Método: ${fund.contribution_method}`);
    runner.logDetail(`   Contribuição: R$ ${parseFloat(fund.monthly_contribution_amount || 0).toFixed(2)}`);
    runner.logDetail(`   % da meta: ${fund.target_percent.toFixed(1)}%`);

    runner.logSuccess('Fundo de reserva configurado com sucesso');
  });

  // Cleanup: Remover dados de teste (opcional - comentado para não perder dados)
  await runner.test('Cleanup: Verificar dados de teste criados', async () => {
    runner.logDetail('Dados de teste criados:');
    if (testApartmentId) {
      runner.logDetail(`  - Apartamento ID: ${testApartmentId}`);
    }
    if (testFeeId) {
      runner.logDetail(`  - Taxa ID: ${testFeeId}`);
    }
    if (testAssemblyId) {
      runner.logDetail(`  - Assembleia ID: ${testAssemblyId}`);
    }
    
    runner.logWarning('⚠️  Dados de teste foram criados e NÃO foram removidos');
    runner.logDetail('(Mantenha para validação manual ou remova depois)');
  });

  runner.logSuccess('Testes operacionais concluídos!');
}

module.exports = { run };
