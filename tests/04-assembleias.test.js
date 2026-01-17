// Testes do Módulo de Assembleias

const { query } = require('../src/config/database');
const assemblyService = require('../src/services/assemblyService');

async function run(runner) {
  runner.logInfo('Iniciando testes de assembleias...');

  // Teste 1: Verificar estrutura de tabelas
  await runner.test('Verificar tabelas de assembleias', async () => {
    const tables = ['assemblies', 'assembly_participants', 'assembly_decisions', 'assembly_documents'];
    
    for (const table of tables) {
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table]);
      
      if (!result.rows[0].exists) {
        throw new Error(`Tabela ${table} não encontrada`);
      }
      
      runner.logDetail(`✅ Tabela ${table} existe`);
    }
  });

  // Teste 2: Verificar estrutura de assembleias
  await runner.test('Verificar estrutura de assembleias', async () => {
    const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'assemblies'
      ORDER BY ordinal_position
    `);
    
    runner.logDetail(`Colunas em assemblies: ${result.rows.length}`);
    
    const requiredColumns = ['id', 'condominium_id', 'date', 'type', 'agenda', 'status', 'quorum'];
    const foundColumns = result.rows.map(r => r.column_name);
    const missing = requiredColumns.filter(col => !foundColumns.includes(col));
    
    if (missing.length > 0) {
      throw new Error(`Colunas faltando: ${missing.join(', ')}`);
    }
  });

  // Teste 3: Verificar assembleias cadastradas
  await runner.test('Verificar assembleias cadastradas', async () => {
    const result = await query(`
      SELECT 
        a.id,
        a.date,
        a.type,
        a.status,
        a.quorum,
        a.quorum_achieved,
        COUNT(DISTINCT ap.id) as participantes,
        COUNT(DISTINCT ad.id) as decisoes,
        COUNT(DISTINCT adoc.id) as documentos
      FROM assemblies a
      LEFT JOIN assembly_participants ap ON a.id = ap.assembly_id
      LEFT JOIN assembly_decisions ad ON a.id = ad.assembly_id
      LEFT JOIN assembly_documents adoc ON a.id = adoc.assembly_id
      GROUP BY a.id, a.date, a.type, a.status, a.quorum, a.quorum_achieved
      ORDER BY a.date DESC
      LIMIT 10
    `);
    
    runner.logDetail(`Assembleias encontradas: ${result.rows.length}`);
    
    result.rows.forEach(assembly => {
      runner.logDetail(`  - ${new Date(assembly.date).toLocaleDateString('pt-BR')} - ${assembly.type} - ${assembly.status}`);
      runner.logDetail(`    Participantes: ${assembly.participantes}, Decisões: ${assembly.decisoes}, Documentos: ${assembly.documentos}`);
    });
    
    if (result.rows.length === 0) {
      runner.logWarning('Nenhuma assembleia cadastrada');
    }
  });

  // Teste 4: Verificar participantes
  await runner.test('Verificar participantes de assembleias', async () => {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE present = TRUE) as presentes,
        COUNT(*) FILTER (WHERE signed = TRUE) as assinados
      FROM assembly_participants
    `);
    
    const stats = result.rows[0];
    runner.logDetail(`Total de participantes: ${stats.total}`);
    runner.logDetail(`Presentes: ${stats.presentes}`);
    runner.logDetail(`Assinados: ${stats.assinados}`);
  });

  // Teste 5: Verificar decisões
  await runner.test('Verificar decisões registradas', async () => {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE approved = TRUE) as aprovadas,
        COUNT(*) FILTER (WHERE approved = FALSE) as rejeitadas
      FROM assembly_decisions
    `);
    
    const stats = result.rows[0];
    runner.logDetail(`Total de decisões: ${stats.total}`);
    runner.logDetail(`Aprovadas: ${stats.aprovadas}`);
    runner.logDetail(`Rejeitadas: ${stats.rejeitadas}`);
  });

  // Teste 6: Verificar documentos anexados
  await runner.test('Verificar documentos anexados', async () => {
    const result = await query(`
      SELECT 
        document_type,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE signed = TRUE) as assinados
      FROM assembly_documents
      GROUP BY document_type
      ORDER BY document_type
    `);
    
    runner.logDetail('Documentos por tipo:');
    result.rows.forEach(row => {
      runner.logDetail(`  - ${row.document_type}: ${row.count} (${row.assinados} assinados)`);
    });
    
    if (result.rows.length === 0) {
      runner.logWarning('Nenhum documento anexado');
    }
  });

  // Teste 7: Verificar quórum
  await runner.test('Verificar cálculo de quórum', async () => {
    const result = await query(`
      SELECT 
        a.id,
        a.date,
        a.quorum as quorum_necessario,
        COUNT(ap.id) FILTER (WHERE ap.present = TRUE) as presentes,
        a.quorum_achieved
      FROM assemblies a
      LEFT JOIN assembly_participants ap ON a.id = ap.assembly_id
      WHERE a.quorum IS NOT NULL
      GROUP BY a.id, a.date, a.quorum, a.quorum_achieved
      LIMIT 5
    `);
    
    runner.logDetail(`Assembleias com quórum definido: ${result.rows.length}`);
    
    result.rows.forEach(assembly => {
      const atingido = assembly.presentes >= assembly.quorum_necessario;
      runner.logDetail(`  Assembleia ${assembly.id}: ${assembly.presentes}/${assembly.quorum_necessario} presentes - ${atingido ? '✅ Atingido' : '❌ Não atingido'}`);
    });
  });

  // Teste 8: Verificar status de assembleias
  await runner.test('Verificar status de assembleias', async () => {
    const result = await query(`
      SELECT status, COUNT(*) as count
      FROM assemblies
      GROUP BY status
      ORDER BY status
    `);
    
    runner.logDetail('Status de assembleias:');
    result.rows.forEach(row => {
      runner.logDetail(`  - ${row.status}: ${row.count}`);
    });
  });

  runner.logSuccess('Testes de assembleias concluídos!');
}

module.exports = { run };
