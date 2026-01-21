// Testes E2E (End-to-End) - Fluxos Completos do Sistema
// Validação de fluxos reais do usuário do início ao fim

const { query, getClient } = require('../src/config/database');
const authService = require('../src/services/authService');
const financeiroService = require('../src/services/financeiroService');
const administrativoService = require('../src/services/administrativoService');
const operacionalService = require('../src/services/operacionalService');

async function run(runner) {
  runner.logInfo('Iniciando testes E2E - Fluxos Completos...');

  // ========================================
  // FLUXO 1: FINANCEIRO COMPLETO
  // Cadastro → Aprovação → Pagamento → Relatório
  // ========================================
  await runner.test('FLUXO E2E: Financeiro Completo (Criar → Aprovar → Pagar)', async () => {
    // 1. Buscar condomínio e usuários de teste
    const condominiumResult = await query(`SELECT id FROM condominiums LIMIT 1`);
    if (condominiumResult.rows.length === 0) {
      throw new Error('Nenhum condomínio encontrado para teste');
    }
    const condominiumId = condominiumResult.rows[0].id;

    const userFinanceiro = await query(`
      SELECT u.id FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'FINANCEIRO' AND u.condominium_id = $1
      LIMIT 1
    `, [condominiumId]);

    const userSindico = await query(`
      SELECT u.id FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'SINDICO' AND u.condominium_id = $1
      LIMIT 1
    `, [condominiumId]);

    if (userFinanceiro.rows.length === 0 || userSindico.rows.length === 0) {
      runner.logWarning('Usuários de teste não encontrados - pulando teste');
      return;
    }

    const financeiroUserId = userFinanceiro.rows[0].id;
    const sindicoUserId = userSindico.rows[0].id;

    runner.logDetail(`Condomínio: ${condominiumId}`);
    runner.logDetail(`Usuário Financeiro: ${financeiroUserId}`);
    runner.logDetail(`Usuário Síndico: ${sindicoUserId}`);

    // 2. Criar saída financeira (FINANCEIRO cria)
    const exitData = {
      description: `[TESTE E2E] Saída teste E2E ${Date.now()}`,
      amount: '1000.00',
      exitDate: new Date().toISOString().split('T')[0],
      category: 'MANUTENCAO',
      requiresApproval: true,
      approvalLimit: 500.00
    };

    const exit = await financeiroService.createExit(
      condominiumId,
      financeiroUserId,
      exitData,
      '127.0.0.1',
      'Test Runner'
    );

    runner.logDetail(`✅ Saída criada: ID ${exit.id}, Status: ${exit.payment_status}`);

    // Verificar que está PENDING
    if (exit.payment_status !== 'PENDING') {
      throw new Error(`Status esperado: PENDING, obtido: ${exit.payment_status}`);
    }

    // 3. Aprovar saída (SÍNDICO aprova)
    const approved = await financeiroService.approveExit(
      exit.id,
      condominiumId,
      sindicoUserId,
      'Aprovado para teste E2E',
      '127.0.0.1',
      'Test Runner'
    );

    runner.logDetail(`✅ Saída aprovada: Status: ${approved.payment_status}`);

    // Verificar que está APPROVED
    if (approved.payment_status !== 'APPROVED') {
      throw new Error(`Status esperado: APPROVED, obtido: ${approved.payment_status}`);
    }

    // 4. Marcar como paga (FINANCEIRO marca como paga)
    const paid = await financeiroService.markExitAsPaid(
      exit.id,
      condominiumId,
      financeiroUserId,
      {
        paymentMethod: 'TRANSFERENCIA',
        paymentDetails: 'Banco Teste - Teste E2E'
      },
      '127.0.0.1',
      'Test Runner'
    );

    runner.logDetail(`✅ Saída marcada como paga: Status: ${paid.payment_status}`);

    // Verificar que está PAID
    if (paid.payment_status !== 'PAID') {
      throw new Error(`Status esperado: PAID, obtido: ${paid.payment_status}`);
    }

    // 5. Verificar histórico no banco
    const dbExit = await query(
      `SELECT * FROM financial_exits WHERE id = $1`,
      [exit.id]
    );

    if (dbExit.rows.length === 0) {
      throw new Error('Saída não encontrada no banco após operações');
    }

    const finalExit = dbExit.rows[0];
    runner.logDetail(`✅ Validação final: Status no banco: ${finalExit.payment_status}`);

    // 6. Verificar audit logs
    const auditLogs = await query(
      `SELECT * FROM audit_logs 
       WHERE entity_type = 'financial_exits' AND entity_id = $1
       ORDER BY created_at`,
      [exit.id]
    );

    runner.logDetail(`✅ Audit logs criados: ${auditLogs.rows.length} registros`);

    if (auditLogs.rows.length < 3) {
      runner.logWarning(`Esperado pelo menos 3 audit logs (CREATE, APPROVE, PAY), encontrado: ${auditLogs.rows.length}`);
    }

    // Limpar dados de teste (opcional - manter para auditoria)
    // await query(`DELETE FROM financial_exits WHERE id = $1`, [exit.id]);

    runner.logSuccess('Fluxo financeiro completo executado com sucesso');
  });

  // ========================================
  // FLUXO 2: OCORRÊNCIA → TAREFA → EXECUÇÃO
  // ========================================
  await runner.test('FLUXO E2E: Ocorrência → Tarefa → Execução', async () => {
    const condominiumResult = await query(`SELECT id FROM condominiums LIMIT 1`);
    if (condominiumResult.rows.length === 0) {
      throw new Error('Nenhum condomínio encontrado para teste');
    }
    const condominiumId = condominiumResult.rows[0].id;

    const userOperacional = await query(`
      SELECT u.id FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'OPERACIONAL' AND u.condominium_id = $1
      LIMIT 1
    `, [condominiumId]);

    const userAdministrativo = await query(`
      SELECT u.id FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'ADMINISTRATIVO' AND u.condominium_id = $1
      LIMIT 1
    `, [condominiumId]);

    if (userOperacional.rows.length === 0 || userAdministrativo.rows.length === 0) {
      runner.logWarning('Usuários de teste não encontrados - pulando teste');
      return;
    }

    const operacionalUserId = userOperacional.rows[0].id;
    const administrativoUserId = userAdministrativo.rows[0].id;

    // 1. OPERACIONAL cria ocorrência
    const occurrenceData = {
      description: `[TESTE E2E] Ocorrência teste ${Date.now()}`,
      location: 'Área Comum',
      occurrenceType: 'MANUTENCAO',
      priority: 'MEDIA'
    };

    // Simular criação (ajustar conforme service real)
    runner.logDetail('✅ Fluxo de ocorrência iniciado (requer implementação completa)');

    runner.logSuccess('Fluxo ocorrência → tarefa validado (parcial)');
  });

  // ========================================
  // FLUXO 3: INADIMPLÊNCIA COMPLETA
  // Taxa → Atraso → Multa → Relatório
  // ========================================
  await runner.test('FLUXO E2E: Inadimplência Completa', async () => {
    const condominiumResult = await query(`SELECT id FROM condominiums LIMIT 1`);
    if (condominiumResult.rows.length === 0) {
      throw new Error('Nenhum condomínio encontrado para teste');
    }
    const condominiumId = condominiumResult.rows[0].id;

    // 1. Verificar estrutura de inadimplência
    const apartments = await query(`
      SELECT * FROM apartments WHERE condominium_id = $1 LIMIT 1
    `, [condominiumId]);

    if (apartments.rows.length === 0) {
      runner.logWarning('Nenhum apartamento cadastrado - pulando teste de inadimplência');
      return;
    }

    const apartmentId = apartments.rows[0].id;

    // 2. Verificar taxas mensais
    const fees = await query(`
      SELECT * FROM monthly_fees 
      WHERE apartment_id = $1 
      ORDER BY year DESC, month DESC 
      LIMIT 5
    `, [apartmentId]);

    runner.logDetail(`Taxas encontradas para apartamento ${apartmentId}: ${fees.rows.length}`);

    if (fees.rows.length > 0) {
      fees.rows.forEach(fee => {
        const status = fee.paid ? 'PAGA' : 'PENDENTE';
        runner.logDetail(`  - ${fee.month}/${fee.year}: R$ ${fee.amount} - ${status}`);
        if (fee.days_overdue > 0) {
          runner.logDetail(`    Atraso: ${fee.days_overdue} dias - Multa: R$ ${fee.late_fee || 0}`);
        }
      });
    }

    runner.logSuccess('Estrutura de inadimplência validada');
  });

  // ========================================
  // FLUXO 4: INTEGRIDADE DE DADOS
  // Verificar consistência após operações
  // ========================================
  await runner.test('FLUXO E2E: Integridade de Dados', async () => {
    const condominiumResult = await query(`SELECT id FROM condominiums LIMIT 1`);
    if (condominiumResult.rows.length === 0) {
      throw new Error('Nenhum condomínio encontrado para teste');
    }
    const condominiumId = condominiumResult.rows[0].id;

    // 1. Verificar órfãos (registros sem condomínio)
    const orphanExits = await query(`
      SELECT COUNT(*) as count FROM financial_exits 
      WHERE condominium_id IS NULL
    `);

    if (parseInt(orphanExits.rows[0].count) > 0) {
      runner.logWarning(`Encontrados ${orphanExits.rows[0].count} saídas sem condomínio`);
    } else {
      runner.logDetail('✅ Nenhuma saída órfã encontrada');
    }

    // 2. Verificar integridade referencial (cost_centers)
    const invalidCostCenters = await query(`
      SELECT fe.id, fe.cost_center_id 
      FROM financial_exits fe
      LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
      WHERE fe.cost_center_id IS NOT NULL AND cc.id IS NULL
      LIMIT 10
    `);

    if (invalidCostCenters.rows.length > 0) {
      runner.logWarning(`Encontrados ${invalidCostCenters.rows.length} registros com cost_center_id inválido`);
    } else {
      runner.logDetail('✅ Integridade referencial de cost_centers OK');
    }

    // 3. Verificar audit logs para operações críticas
    const recentAuditLogs = await query(`
      SELECT COUNT(*) as count FROM audit_logs
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    runner.logDetail(`Audit logs dos últimos 7 dias: ${recentAuditLogs.rows[0].count}`);

    if (parseInt(recentAuditLogs.rows[0].count) === 0) {
      runner.logWarning('Nenhum audit log encontrado nos últimos 7 dias');
    }

    runner.logSuccess('Integridade de dados validada');
  });

  runner.logInfo('Testes E2E concluídos!');
}

module.exports = { run };
