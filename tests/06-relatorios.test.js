// Testes de Relatórios PDF

const { query } = require('../src/config/database');
const reportService = require('../src/services/reportService');
const fs = require('fs');
const path = require('path');

async function run(runner) {
  runner.logInfo('Iniciando testes de relatórios...');

  // Teste 1: Verificar tabela de relatórios gerados
  await runner.test('Verificar tabela de relatórios', async () => {
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'generated_reports'
      )
    `);
    
    if (!result.rows[0].exists) {
      throw new Error('Tabela generated_reports não encontrada');
    }
    
    runner.logDetail('✅ Tabela generated_reports existe');
  });

  // Teste 2: Verificar estrutura da tabela
  await runner.test('Verificar estrutura de relatórios', async () => {
    const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'generated_reports'
      ORDER BY ordinal_position
    `);
    
    runner.logDetail(`Colunas em generated_reports: ${result.rows.length}`);
    
    const requiredColumns = ['id', 'condominium_id', 'report_type', 'month', 'year', 'file_path', 'generated_by', 'generated_at'];
    const foundColumns = result.rows.map(r => r.column_name);
    const missing = requiredColumns.filter(col => !foundColumns.includes(col));
    
    if (missing.length > 0) {
      throw new Error(`Colunas faltando: ${missing.join(', ')}`);
    }
  });

  // Teste 3: Verificar relatórios gerados
  await runner.test('Verificar relatórios gerados', async () => {
    const result = await query(`
      SELECT 
        gr.*,
        u.full_name as generated_by_name,
        c.name as condominium_name
      FROM generated_reports gr
      JOIN condominiums c ON gr.condominium_id = c.id
      LEFT JOIN users u ON gr.generated_by = u.id
      ORDER BY gr.generated_at DESC
      LIMIT 10
    `);
    
    runner.logDetail(`Relatórios encontrados: ${result.rows.length}`);
    
    result.rows.forEach(report => {
      runner.logDetail(`  - ${report.report_type} - ${report.month}/${report.year}`);
      runner.logDetail(`    Gerado por: ${report.generated_by_name || 'N/A'}`);
      runner.logDetail(`    Data: ${new Date(report.generated_at).toLocaleString('pt-BR')}`);
      runner.logDetail(`    Arquivo: ${report.file_path}`);
      
      // Verificar se arquivo existe
      const filePath = path.join(__dirname, '..', report.file_path);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        runner.logDetail(`    ✅ Arquivo existe (${(stats.size / 1024).toFixed(2)} KB)`);
      } else {
        runner.logWarning(`    ⚠️  Arquivo não encontrado: ${filePath}`);
      }
    });
    
    if (result.rows.length === 0) {
      runner.logWarning('Nenhum relatório gerado ainda');
    }
  });

  // Teste 4: Verificar pasta de uploads/reports
  await runner.test('Verificar pasta de relatórios', async () => {
    const reportsDir = path.join(__dirname, '..', 'uploads', 'reports');
    
    if (!fs.existsSync(reportsDir)) {
      runner.logWarning(`Pasta não existe: ${reportsDir}`);
      runner.logDetail('Criando pasta...');
      fs.mkdirSync(reportsDir, { recursive: true });
      runner.logSuccess('Pasta criada');
    } else {
      runner.logDetail(`✅ Pasta existe: ${reportsDir}`);
      
      const files = fs.readdirSync(reportsDir);
      runner.logDetail(`Arquivos na pasta: ${files.length}`);
      
      if (files.length > 0) {
        files.slice(0, 5).forEach(file => {
          const filePath = path.join(reportsDir, file);
          const stats = fs.statSync(filePath);
          runner.logDetail(`  - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
        });
      }
    }
  });

  // Teste 5: Verificar PDFKit instalado
  await runner.test('Verificar biblioteca PDFKit', async () => {
    try {
      const PDFDocument = require('pdfkit');
      runner.logDetail('✅ PDFKit instalado e funcionando');
      
      // Teste básico de criação de PDF
      const doc = new PDFDocument();
      doc.text('Teste');
      doc.end();
      
      runner.logSuccess('PDFKit pode criar documentos');
    } catch (error) {
      throw new Error(`PDFKit não está funcionando: ${error.message}`);
    }
  });

  // Teste 6: Verificar tipos de relatórios
  await runner.test('Verificar tipos de relatórios', async () => {
    const result = await query(`
      SELECT report_type, COUNT(*) as count
      FROM generated_reports
      GROUP BY report_type
      ORDER BY report_type
    `);
    
    runner.logDetail('Tipos de relatórios gerados:');
    result.rows.forEach(row => {
      runner.logDetail(`  - ${row.report_type}: ${row.count}`);
    });
    
    if (result.rows.length === 0) {
      runner.logDetail('  Nenhum relatório gerado ainda');
    }
  });

  runner.logSuccess('Testes de relatórios concluídos!');
}

module.exports = { run };
