// Testes de Fluxos Completos do Sistema

const { query } = require('../src/config/database');
const monthlyClosureService = require('../src/services/monthlyClosureService');
const inadimplenciaService = require('../src/services/inadimplenciaService');
const assemblyService = require('../src/services/assemblyService');

async function run(runner) {
  runner.logInfo('Iniciando testes de fluxos completos...');

  // Fluxo 1: Fluxo Financeiro Completo
  await runner.test('Fluxo Financeiro Completo', async () => {
    const condominiums = await query('SELECT id, name FROM condominiums LIMIT 1');
    
    if (condominiums.rows.length === 0) {
      runner.logWarning('Nenhum condomínio encontrado');
      return;
    }
    
    const condominiumId = condominiums.rows[0].id;
    runner.logDetail(`Testando fluxo para condomínio ID: ${condominiumId}`);
    
    // 1. Verificar entradas pendentes
    const pendingEntries = await query(`
      SELECT COUNT(*) as count
      FROM financial_entries
      WHERE condominium_id = $1
        AND received = FALSE
    `, [condominiumId]);
    
    runner.logDetail(`1. Entradas pendentes: ${pendingEntries.rows[0].count}`);
    
    // 2. Verificar saídas pendentes
    const pendingExits = await query(`
      SELECT COUNT(*) as count
      FROM financial_exits
      WHERE condominium_id = $1
        AND payment_status != 'PAID'
        AND requires_approval = TRUE
    `, [condominiumId]);
    
    runner.logDetail(`2. Saídas pendentes de aprovação: ${pendingExits.rows[0].count}`);
    
    // 3. Verificar fechamento do mês atual
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const closure = await monthlyClosureService.getClosureByMonth(condominiumId, currentMonth, currentYear);
    
    if (closure) {
      runner.logDetail(`3. Fechamento do mês: ${closure.status}`);
    } else {
      runner.logDetail(`3. Fechamento do mês: Ainda não fechado`);
    }
    
    // 4. Calcular totais
    const totals = await monthlyClosureService.calculateMonthTotals(condominiumId, currentMonth, currentYear);
    runner.logDetail(`4. Totais do mês:`);
    runner.logDetail(`   Entradas: R$ ${totals.totalEntries.toFixed(2)}`);
    runner.logDetail(`   Saídas: R$ ${totals.totalExits.toFixed(2)}`);
    runner.logDetail(`   Saldo: R$ ${totals.balance.toFixed(2)}`);
    
    runner.logSuccess('Fluxo financeiro verificado');
  });

  // Fluxo 2: Fluxo de Inadimplência
  await runner.test('Fluxo de Inadimplência Completo', async () => {
    const condominiums = await query('SELECT id FROM condominiums LIMIT 1');
    
    if (condominiums.rows.length === 0) {
      runner.logWarning('Nenhum condomínio encontrado');
      return;
    }
    
    const condominiumId = condominiums.rows[0].id;
    
    // 1. Verificar apartamentos
    const apartments = await inadimplenciaService.listApartments(condominiumId);
    runner.logDetail(`1. Apartamentos cadastrados: ${apartments.length}`);
    
    // 2. Verificar taxas
    const fees = await inadimplenciaService.listMonthlyFees(condominiumId);
    runner.logDetail(`2. Taxas cadastradas: ${fees.length}`);
    
    // 3. Calcular inadimplência
    const delinquency = await inadimplenciaService.calculateDelinquency(condominiumId);
    runner.logDetail(`3. Inadimplência:`);
    runner.logDetail(`   Taxa: ${delinquency.delinquencyRate.toFixed(2)}%`);
    runner.logDetail(`   Valor: R$ ${delinquency.totalOverdue.toFixed(2)}`);
    runner.logDetail(`   Apartamentos: ${delinquency.overdueCount}`);
    
    // 4. Verificar taxas em atraso
    const overdueFees = fees.filter(f => !f.paid && f.days_overdue > 0);
    runner.logDetail(`4. Taxas em atraso: ${overdueFees.length}`);
    
    if (overdueFees.length > 0) {
      overdueFees.slice(0, 3).forEach(fee => {
        runner.logDetail(`   - Apt ${fee.apartment_number}: ${fee.days_overdue} dias, R$ ${parseFloat(fee.amount).toFixed(2)}`);
      });
    }
    
    runner.logSuccess('Fluxo de inadimplência verificado');
  });

  // Fluxo 3: Fluxo de Assembleia
  await runner.test('Fluxo de Assembleia Completo', async () => {
    const condominiums = await query('SELECT id FROM condominiums LIMIT 1');
    
    if (condominiums.rows.length === 0) {
      runner.logWarning('Nenhum condomínio encontrado');
      return;
    }
    
    const condominiumId = condominiums.rows[0].id;
    
    // 1. Verificar assembleias
    const assemblies = await assemblyService.listAssemblies(condominiumId);
    runner.logDetail(`1. Assembleias cadastradas: ${assemblies.length}`);
    
    if (assemblies.length > 0) {
      const assembly = assemblies[0];
      
      // 2. Verificar participantes
      runner.logDetail(`2. Participantes da assembleia ${assembly.id}: ${assembly.participants?.length || 0}`);
      
      // 3. Verificar decisões
      runner.logDetail(`3. Decisões registradas: ${assembly.decisions?.length || 0}`);
      
      // 4. Verificar documentos
      runner.logDetail(`4. Documentos anexados: ${assembly.documents?.length || 0}`);
      
      // 5. Verificar status
      runner.logDetail(`5. Status: ${assembly.status}`);
      runner.logDetail(`   Quórum: ${assembly.quorum_achieved ? 'Atingido' : 'Não atingido'}`);
    }
    
    runner.logSuccess('Fluxo de assembleia verificado');
  });

  // Fluxo 4: Fluxo de Ocorrência → Tarefa → Orçamento → Pagamento
  await runner.test('Fluxo Ocorrência → Tarefa → Orçamento → Pagamento', async () => {
    // 1. Verificar ocorrências
    const occurrences = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'OPEN') as abertas,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as em_andamento,
        COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolvidas
      FROM occurrences
    `);
    
    const occ = occurrences.rows[0];
    runner.logDetail(`1. Ocorrências:`);
    runner.logDetail(`   Total: ${occ.total}`);
    runner.logDetail(`   Abertas: ${occ.abertas}`);
    runner.logDetail(`   Em andamento: ${occ.em_andamento}`);
    runner.logDetail(`   Resolvidas: ${occ.resolvidas}`);
    
    // 2. Verificar tarefas relacionadas
    const tasks = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pendentes,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as em_andamento,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as concluidas
      FROM tasks
    `);
    
    const tsk = tasks.rows[0];
    runner.logDetail(`2. Tarefas:`);
    runner.logDetail(`   Total: ${tsk.total}`);
    runner.logDetail(`   Pendentes: ${tsk.pendentes}`);
    runner.logDetail(`   Em andamento: ${tsk.em_andamento}`);
    runner.logDetail(`   Concluídas: ${tsk.concluidas}`);
    
    // 3. Verificar orçamentos
    const budgets = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pendentes,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as aprovados,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejeitados
      FROM budget_requests
    `);
    
    const bud = budgets.rows[0];
    runner.logDetail(`3. Orçamentos:`);
    runner.logDetail(`   Total: ${bud.total}`);
    runner.logDetail(`   Pendentes: ${bud.pendentes}`);
    runner.logDetail(`   Aprovados: ${bud.aprovados}`);
    runner.logDetail(`   Rejeitados: ${bud.rejeitados}`);
    
    runner.logSuccess('Fluxo de ocorrência verificado');
  });

  // Fluxo 5: Verificar integridade dos dados
  await runner.test('Verificar Integridade dos Dados', async () => {
    // 1. Verificar foreign keys
    const fkChecks = [
      { table: 'financial_entries', fk: 'condominium_id', ref: 'condominiums' },
      { table: 'financial_exits', fk: 'condominium_id', ref: 'condominiums' },
      { table: 'apartments', fk: 'condominium_id', ref: 'condominiums' },
      { table: 'monthly_fees', fk: 'apartment_id', ref: 'apartments' },
      { table: 'assemblies', fk: 'condominium_id', ref: 'condominiums' }
    ];
    
    runner.logDetail('Verificando integridade referencial:');
    
    for (const check of fkChecks) {
      const result = await query(`
        SELECT COUNT(*) as count
        FROM ${check.table} t
        WHERE t.${check.fk} IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM ${check.ref} r 
            WHERE r.id = t.${check.fk}
          )
      `);
      
      const invalid = parseInt(result.rows[0].count);
      if (invalid > 0) {
        runner.logError(`${check.table}.${check.fk}: ${invalid} registros órfãos`);
      } else {
        runner.logDetail(`  ✅ ${check.table}.${check.fk}: OK`);
      }
    }
    
    runner.logSuccess('Integridade dos dados verificada');
  });

  runner.logSuccess('Testes de fluxos completos concluídos!');
}

module.exports = { run };
