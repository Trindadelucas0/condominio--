// Service do módulo RELATÓRIOS
// Contém lógica de negócio para geração de relatórios em PDF
// Acesso: FINANCEIRO, SINDICO

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');
const { logAction } = require('../utils/logger');

// Função para gerar relatório mensal financeiro
const generateMonthlyFinancialReport = async (condominiumId, month, year, userId, ipAddress, userAgent) => {
  try {
    // Busca dados do condomínio
    const condominiumResult = await query(
      `SELECT * FROM condominiums WHERE id = $1`,
      [condominiumId]
    );

    if (condominiumResult.rows.length === 0) {
      throw new Error('Condomínio não encontrado');
    }

    const condominium = condominiumResult.rows[0];

    // Busca entradas do mês
    const entriesResult = await query(
      `SELECT fe.*, cc.name as cost_center_name
       FROM financial_entries fe
       LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
       WHERE fe.condominium_id = $1 
       AND EXTRACT(MONTH FROM fe.entry_date) = $2 
       AND EXTRACT(YEAR FROM fe.entry_date) = $3
       AND fe.deleted_at IS NULL
       ORDER BY fe.entry_date DESC`,
      [condominiumId, month, year]
    );

    // Busca saídas do mês
    const exitsResult = await query(
      `SELECT fe.*, cc.name as cost_center_name
       FROM financial_exits fe
       LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
       WHERE fe.condominium_id = $1 
       AND EXTRACT(MONTH FROM fe.exit_date) = $2 
       AND EXTRACT(YEAR FROM fe.exit_date) = $3
       ORDER BY fe.exit_date DESC`,
      [condominiumId, month, year]
    );

    // Calcula totais
    const totalEntries = entriesResult.rows
      .filter(e => e.received && e.review_status !== 'REJECTED')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const totalExitsPaid = exitsResult.rows
      .filter(e => e.payment_status === 'PAID')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const totalExitsApproved = exitsResult.rows
      .filter(e => e.payment_status === 'APPROVED')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const balance = totalEntries - totalExitsPaid - totalExitsApproved;

    // Cria diretório de relatórios se não existir
    const reportsDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Nome do arquivo
    const fileName = `relatorio_mensal_${month}_${year}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    // Cria PDF
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Cabeçalho
    doc.fontSize(20).text('Relatório Financeiro Mensal', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(condominium.name, { align: 'center' });
    doc.fontSize(12).text(
      `${new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      { align: 'center' }
    );
    doc.moveDown(2);

    // Resumo Executivo
    doc.fontSize(16).text('Resumo Executivo', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total de Entradas: R$ ${totalEntries.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    doc.text(`Total de Saídas Pagas: R$ ${totalExitsPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    doc.text(`Total de Saídas Aprovadas: R$ ${totalExitsApproved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    doc.text(`Saldo do Mês: R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, {
      color: balance >= 0 ? 'green' : 'red'
    });
    doc.moveDown(2);

    // Detalhamento de Entradas
    if (entriesResult.rows.length > 0) {
      doc.fontSize(16).text('Entradas Financeiras', { underline: true });
      doc.moveDown();
      doc.fontSize(10);

      entriesResult.rows.forEach((entry, index) => {
        if (index > 0 && index % 25 === 0) {
          doc.addPage();
        }

        const status = entry.received ? 'Recebida' : 'Pendente';
        doc.text(
          `${new Date(entry.entry_date).toLocaleDateString('pt-BR')} - ${entry.description} - R$ ${parseFloat(entry.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${status}`
        );
      });

      doc.moveDown(2);
    }

    // Detalhamento de Saídas
    if (exitsResult.rows.length > 0) {
      doc.fontSize(16).text('Saídas Financeiras', { underline: true });
      doc.moveDown();
      doc.fontSize(10);

      exitsResult.rows.forEach((exit, index) => {
        if (index > 0 && index % 25 === 0) {
          doc.addPage();
        }

        const status = exit.payment_status === 'PAID' ? 'Paga' : 
                      exit.payment_status === 'APPROVED' ? 'Aprovada' : 'Pendente';
        doc.text(
          `${new Date(exit.exit_date).toLocaleDateString('pt-BR')} - ${exit.description} - R$ ${parseFloat(exit.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${status}`
        );
      });

      doc.moveDown(2);
    }

    // Rodapé
    doc.fontSize(10).text(
      `Relatório gerado em ${new Date().toLocaleString('pt-BR')}`,
      { align: 'center' }
    );

    // Finaliza PDF
    doc.end();

    // Aguarda finalização do stream
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Salva registro do relatório
    const relativePath = path.relative(path.join(__dirname, '../../'), filePath).replace(/\\/g, '/');
    
    const reportResult = await query(
      `INSERT INTO generated_reports (
        condominium_id, report_type, month, year, file_path, file_name, generated_by
      )
      VALUES ($1, 'MONTHLY_FINANCIAL', $2, $3, $4, $5, $6)
      RETURNING *`,
      [condominiumId, month, year, relativePath, fileName, userId]
    );

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'REPORTS',
      entityType: 'generated_reports',
      entityId: reportResult.rows[0].id,
      afterData: reportResult.rows[0],
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      id: reportResult.rows[0].id,
      filePath: relativePath,
      fileName: fileName
    };
  } catch (error) {
    console.error('Erro ao gerar relatório mensal:', error);
    throw error;
  }
};

// Função para listar relatórios gerados
const listGeneratedReports = async (condominiumId, filters = {}) => {
  try {
    let queryText = `
      SELECT gr.*, u.full_name as generated_by_name
      FROM generated_reports gr
      LEFT JOIN users u ON gr.generated_by = u.id
      WHERE gr.condominium_id = $1
    `;
    const params = [condominiumId];

    if (filters.reportType) {
      queryText += ` AND gr.report_type = $${params.length + 1}`;
      params.push(filters.reportType);
    }

    queryText += ` ORDER BY gr.generated_at DESC LIMIT $${params.length + 1}`;
    params.push(filters.limit || 50);

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar relatórios:', error);
    throw error;
  }
};

module.exports = {
  generateMonthlyFinancialReport,
  listGeneratedReports
};
