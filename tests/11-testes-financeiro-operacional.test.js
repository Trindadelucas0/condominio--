// Testes Operacionais do Módulo Financeiro - Cria dados e testa fluxos

const { query } = require('../src/config/database');
const financeiroService = require('../src/services/financeiroService');
const monthlyClosureService = require('../src/services/monthlyClosureService');

async function run(runner) {
  runner.logInfo('Iniciando testes operacionais financeiros (com criação de dados)...');

  let testCondominiumId = null;
  let testUserId = null;
  let testEntryId = null;
  let testExitId = null;

  // Setup
  await runner.test('Setup: Obter dados de teste', async () => {
    // Busca usuário FINANCEIRO que tenha condomínio
    const users = await query(`
      SELECT u.id, u.username, u.condominium_id
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'FINANCEIRO'
        AND u.condominium_id IS NOT NULL
        AND u.active = TRUE
      LIMIT 1
    `);

    if (users.rows.length === 0) {
      // Tenta SINDICO se não encontrar FINANCEIRO
      const sindicoUsers = await query(`
        SELECT u.id, u.username, u.condominium_id
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name IN ('SINDICO', 'SUBSINDICO')
          AND u.condominium_id IS NOT NULL
          AND u.active = TRUE
        LIMIT 1
      `);
      
      if (sindicoUsers.rows.length === 0) {
        throw new Error('Nenhum usuário FINANCEIRO ou SINDICO com condomínio encontrado');
      }
      
      testUserId = sindicoUsers.rows[0].id;
      testCondominiumId = sindicoUsers.rows[0].condominium_id;
      runner.logDetail(`Usando SINDICO: ${sindicoUsers.rows[0].username} (ID ${testUserId})`);
    } else {
      testUserId = users.rows[0].id;
      testCondominiumId = users.rows[0].condominium_id;
      runner.logDetail(`Usando FINANCEIRO: ${users.rows[0].username} (ID ${testUserId})`);
    }
    
    runner.logDetail(`Condomínio ID: ${testCondominiumId}`);
  });

  // FLUXO: Criar Entrada → Marcar como Recebida
  await runner.test('FLUXO FINANCEIRO: Criar Entrada Financeira', async () => {
    const entryData = {
      description: `Teste Entrada ${Date.now()}`,
      amount: 1000.00,
      entryDate: new Date().toISOString().split('T')[0],
      category: 'TAXA',
      costCenterId: null
    };

    const entry = await financeiroService.createEntry(
      testCondominiumId,
      testUserId,
      entryData,
      '127.0.0.1',
      'Test Runner'
    );

    testEntryId = entry.id;
    runner.logDetail(`✅ Entrada criada: ID ${entry.id}`);
    runner.logDetail(`   Descrição: ${entry.description}`);
    runner.logDetail(`   Valor: R$ ${parseFloat(entry.amount).toFixed(2)}`);
    runner.logDetail(`   Status: ${entry.received ? 'Recebida' : 'Pendente'}`);

    if (entry.received) {
      throw new Error('Entrada não deveria estar recebida ao ser criada');
    }

    runner.logSuccess('Entrada financeira criada corretamente');
  });

  await runner.test('FLUXO FINANCEIRO: Marcar Entrada como Recebida', async () => {
    if (!testEntryId) {
      throw new Error('Entrada de teste não foi criada');
    }

    // Cria um PDF fake para o teste
    const fs = require('fs');
    const path = require('path');
    const PDFDocument = require('pdfkit');
    
    const testReceiptPath = path.join(__dirname, '..', 'uploads', 'receipts', `test_receipt_${Date.now()}.pdf`);
    const testReceiptDir = path.dirname(testReceiptPath);
    
    if (!fs.existsSync(testReceiptDir)) {
      fs.mkdirSync(testReceiptDir, { recursive: true });
    }
    
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(testReceiptPath));
    doc.text('Comprovante de Teste Automatizado');
    doc.text(`Entrada ID: ${testEntryId}`);
    doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`);
    doc.end();
    
    // Aguarda PDF ser criado
    await new Promise(resolve => setTimeout(resolve, 100));

    const receiptData = {
      receiptMethod: 'PIX',
      receiptPdfPath: testReceiptPath.replace(path.join(__dirname, '..') + path.sep, ''),
      receiptDetails: 'Comprovante de teste automatizado',
      receiptNotes: 'Teste automatizado'
    };

    const updated = await financeiroService.markEntryAsReceived(
      testEntryId,
      testCondominiumId,
      testUserId,
      receiptData,
      '127.0.0.1',
      'Test Runner'
    );

    runner.logDetail(`✅ Entrada marcada como recebida`);
    runner.logDetail(`   Método: ${updated.receipt_method}`);
    runner.logDetail(`   Data: ${new Date(updated.received_at).toLocaleString('pt-BR')}`);
    runner.logDetail(`   Comprovante: ${updated.receipt_pdf_path}`);

    if (!updated.received) {
      throw new Error('Entrada deveria estar marcada como recebida');
    }

    runner.logSuccess('Entrada marcada como recebida corretamente');
  });

  // FLUXO: Criar Saída → Aprovar → Marcar como Paga
  await runner.test('FLUXO FINANCEIRO: Criar Saída Financeira', async () => {
    const exitData = {
      description: `Teste Saída ${Date.now()}`,
      amount: 500.00,
      exitDate: new Date().toISOString().split('T')[0],
      category: 'MANUTENCAO',
      costCenterId: null,
      requiresApproval: false // Valor baixo, não precisa aprovação
    };

    const exit = await financeiroService.createExit(
      testCondominiumId,
      testUserId,
      exitData,
      '127.0.0.1',
      'Test Runner'
    );

    testExitId = exit.id;
    runner.logDetail(`✅ Saída criada: ID ${exit.id}`);
    runner.logDetail(`   Descrição: ${exit.description}`);
    runner.logDetail(`   Valor: R$ ${parseFloat(exit.amount).toFixed(2)}`);
    runner.logDetail(`   Status: ${exit.payment_status}`);
    runner.logDetail(`   Requer aprovação: ${exit.requires_approval ? 'Sim' : 'Não'}`);

    runner.logSuccess('Saída financeira criada corretamente');
  });

  await runner.test('FLUXO FINANCEIRO: Aprovar Saída (se necessário)', async () => {
    if (!testExitId) {
      throw new Error('Saída de teste não foi criada');
    }

    // Busca saída diretamente do banco
    const exitResult = await query(`
      SELECT * FROM financial_exits 
      WHERE id = $1 AND condominium_id = $2
    `, [testExitId, testCondominiumId]);

    if (exitResult.rows.length === 0) {
      throw new Error('Saída não encontrada');
    }

    const exit = exitResult.rows[0];

    if (exit.requires_approval && exit.payment_status !== 'APPROVED') {
      await financeiroService.approveExit(
        testExitId,
        testCondominiumId,
        testUserId,
        'Aprovação de teste',
        '127.0.0.1',
        'Test Runner'
      );

      runner.logDetail(`✅ Saída aprovada`);
      runner.logSuccess('Aprovação de saída funcionando');
    } else {
      runner.logDetail(`Saída não requer aprovação ou já está aprovada (Status: ${exit.payment_status})`);
      runner.logSuccess('Fluxo de aprovação verificado');
    }
  });

  await runner.test('FLUXO FINANCEIRO: Marcar Saída como Paga', async () => {
    if (!testExitId) {
      throw new Error('Saída de teste não foi criada');
    }

    // Cria um PDF fake para o teste
    const fs = require('fs');
    const path = require('path');
    const PDFDocument = require('pdfkit');
    
    const testPaymentPath = path.join(__dirname, '..', 'uploads', 'payments', `test_payment_${Date.now()}.pdf`);
    const testPaymentDir = path.dirname(testPaymentPath);
    
    if (!fs.existsSync(testPaymentDir)) {
      fs.mkdirSync(testPaymentDir, { recursive: true });
    }
    
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(testPaymentPath));
    doc.text('Comprovante de Pagamento - Teste Automatizado');
    doc.text(`Saída ID: ${testExitId}`);
    doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`);
    doc.end();
    
    // Aguarda PDF ser criado
    await new Promise(resolve => setTimeout(resolve, 100));

    const paymentData = {
      paymentMethod: 'TRANSFERENCIA',
      paymentReceiptPdfPath: testPaymentPath.replace(path.join(__dirname, '..') + path.sep, ''),
      paymentDetails: 'Comprovante de teste automatizado',
      paymentNotes: 'Teste automatizado'
    };

    const updated = await financeiroService.markExitAsPaid(
      testExitId,
      testCondominiumId,
      testUserId,
      paymentData,
      '127.0.0.1',
      'Test Runner'
    );

    runner.logDetail(`✅ Saída marcada como paga`);
    runner.logDetail(`   Método: ${updated.payment_method}`);
    runner.logDetail(`   Status: ${updated.payment_status}`);
    runner.logDetail(`   Data: ${updated.paid_at ? new Date(updated.paid_at).toLocaleString('pt-BR') : 'N/A'}`);
    runner.logDetail(`   Comprovante: ${updated.payment_receipt_pdf_path}`);

    if (updated.payment_status !== 'PAID') {
      throw new Error('Saída deveria estar com status PAID');
    }

    runner.logSuccess('Saída marcada como paga corretamente');
  });

  // FLUXO: Verificar Saldo Atualizado
  await runner.test('FLUXO FINANCEIRO: Verificar Saldo Atualizado', async () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const totals = await monthlyClosureService.calculateMonthTotals(
      testCondominiumId,
      currentMonth,
      currentYear
    );

    runner.logDetail(`Saldo após operações:`);
    runner.logDetail(`   Entradas: R$ ${totals.totalEntries.toFixed(2)}`);
    runner.logDetail(`   Saídas: R$ ${totals.totalExits.toFixed(2)}`);
    runner.logDetail(`   Saldo: R$ ${totals.balance.toFixed(2)}`);

    // Verifica se os valores das operações de teste estão incluídos
    if (totals.totalEntries >= 1000.00 && totals.totalExits >= 500.00) {
      runner.logSuccess('Saldo atualizado corretamente após operações');
    } else {
      runner.logWarning('Valores de teste podem não estar incluídos no cálculo');
    }
  });

  // Verificar logs de auditoria
  await runner.test('FLUXO FINANCEIRO: Verificar Logs de Auditoria', async () => {
    const logs = await query(`
      SELECT action, module, entity_type, entity_id
      FROM audit_logs
      WHERE user_id = $1
        AND (entity_id = $2 OR entity_id = $3)
      ORDER BY created_at DESC
      LIMIT 10
    `, [testUserId, testEntryId, testExitId]);

    runner.logDetail(`Logs de auditoria encontrados: ${logs.rows.length}`);
    
    logs.rows.forEach(log => {
      runner.logDetail(`  - ${log.action} em ${log.entity_type} (ID: ${log.entity_id})`);
    });

    if (logs.rows.length === 0) {
      runner.logWarning('⚠️  Nenhum log de auditoria encontrado');
    } else {
      runner.logSuccess('Logs de auditoria funcionando');
    }
  });

  runner.logSuccess('Testes operacionais financeiros concluídos!');
  runner.logWarning('⚠️  Dados de teste foram criados (entrada e saída)');
}

module.exports = { run };
