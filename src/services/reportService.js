// Service de geração de relatórios (PDF e Excel)
// Gera relatórios gerenciais para o módulo síndico

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const reportService = {
  // Gerar relatório de aprovações em PDF
  generateApprovalsPDF: async (approvals, filters, condominiumName = 'Condomínio') => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const fileName = `aprovacoes_${Date.now()}.pdf`;
        const reportsDir = path.join(__dirname, '../../uploads/reports');
        
        // Criar diretório se não existir
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const filePath = path.join(reportsDir, fileName);
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        
        // Cabeçalho
        doc.fontSize(20).font('Helvetica-Bold').text('Relatório de Aprovações', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text(condominiumName, { align: 'center' });
        doc.moveDown();
        
        // Data de geração
        doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'right' });
        doc.moveDown();
        
        // Filtros aplicados
        if (filters.startDate || filters.endDate) {
          doc.fontSize(12).text(
            `Período: ${filters.startDate || 'Início'} até ${filters.endDate || 'Fim'}`,
            { align: 'left' }
          );
          doc.moveDown();
        }
        
        // Total de registros
        doc.fontSize(10).text(`Total de registros: ${approvals.length}`, { align: 'left' });
        doc.moveDown();
        
        // Tabela de aprovações
        let y = doc.y;
        const startY = y;
        const colWidths = { id: 40, type: 120, status: 80, amount: 100, date: 100 };
        const leftMargin = 50;
        
        doc.fontSize(10).font('Helvetica-Bold');
        
        // Cabeçalho da tabela
        doc.text('ID', leftMargin, y);
        doc.text('Tipo', leftMargin + colWidths.id, y);
        doc.text('Status', leftMargin + colWidths.id + colWidths.type, y);
        doc.text('Valor', leftMargin + colWidths.id + colWidths.type + colWidths.status, y);
        doc.text('Data', leftMargin + colWidths.id + colWidths.type + colWidths.status + colWidths.amount, y);
        
        y += 20;
        doc.moveTo(leftMargin, y).lineTo(leftMargin + 500, y).stroke();
        
        // Dados
        doc.font('Helvetica');
        let rowHeight = 15;
        
        approvals.forEach((approval, index) => {
          if (y + rowHeight > 750) {
            // Nova página se necessário
            doc.addPage();
            y = 50;
          }
          
          y += rowHeight;
          
          doc.text((approval.id || '-').toString(), leftMargin, y);
          doc.text((approval.entity_type || '-').replace('_', ' '), leftMargin + colWidths.id, y);
          doc.text((approval.status || '-'), leftMargin + colWidths.id + colWidths.type, y);
          doc.text(
            approval.amount ? `R$ ${parseFloat(approval.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
            leftMargin + colWidths.id + colWidths.type + colWidths.status, y
          );
          doc.text(
            approval.created_at ? new Date(approval.created_at).toLocaleDateString('pt-BR') : '-',
            leftMargin + colWidths.id + colWidths.type + colWidths.status + colWidths.amount, y
          );
        });
        
        // Rodapé
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).text(
            `Página ${i + 1} de ${pageCount}`,
            50,
            doc.page.height - 30,
            { align: 'center' }
          );
        }
        
        doc.end();
        
        stream.on('finish', () => {
          resolve({ filePath, fileName });
        });
        
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  },
  
  // Gerar relatório de aprovações em Excel
  generateApprovalsExcel: async (approvals, filters, condominiumName = 'Condomínio') => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Aprovações');
      
      // Cabeçalho
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'Relatório de Aprovações';
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      worksheet.mergeCells('A2:F2');
      const nameCell = worksheet.getCell('A2');
      nameCell.value = condominiumName;
      nameCell.font = { size: 12 };
      nameCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Data de geração
      worksheet.mergeCells('A3:F3');
      const dateCell = worksheet.getCell('A3');
      dateCell.value = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
      dateCell.font = { size: 10 };
      dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
      
      // Filtros
      if (filters.startDate || filters.endDate) {
        worksheet.mergeCells('A4:F4');
        const filterCell = worksheet.getCell('A4');
        filterCell.value = `Período: ${filters.startDate || 'Início'} até ${filters.endDate || 'Fim'}`;
        filterCell.font = { size: 10 };
      }
      
      // Total
      worksheet.mergeCells('A5:F5');
      const totalCell = worksheet.getCell('A5');
      totalCell.value = `Total de registros: ${approvals.length}`;
      totalCell.font = { size: 10, bold: true };
      
      // Cabeçalhos da tabela
      const headerRow = worksheet.getRow(7);
      headerRow.values = ['ID', 'Tipo', 'Status', 'Valor', 'Data', 'Observações'];
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Dados
      approvals.forEach((approval, index) => {
        const row = worksheet.getRow(8 + index);
        row.values = [
          approval.id || '-',
          approval.entity_type ? approval.entity_type.replace('_', ' ') : '-',
          approval.status || '-',
          approval.amount ? parseFloat(approval.amount) : 0,
          approval.created_at ? new Date(approval.created_at) : null,
          approval.review_notes || approval.notes || '-'
        ];
        
        // Formatação de moeda
        if (approval.amount) {
          row.getCell(4).numFmt = 'R$ #,##0.00';
        }
        
        // Formatação de data
        if (approval.created_at) {
          row.getCell(5).numFmt = 'dd/mm/yyyy hh:mm';
        }
      });
      
      // Ajustar largura das colunas
      worksheet.columns = [
        { width: 10 }, // ID
        { width: 20 }, // Tipo
        { width: 15 }, // Status
        { width: 15 }, // Valor
        { width: 20 }, // Data
        { width: 40 }  // Observações
      ];
      
      // Salvar arquivo
      const fileName = `aprovacoes_${Date.now()}.xlsx`;
      const reportsDir = path.join(__dirname, '../../uploads/reports');
      
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const filePath = path.join(reportsDir, fileName);
      await workbook.xlsx.writeFile(filePath);
      
      return { filePath, fileName };
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      throw error;
    }
  },
  
  // Gerar relatório de tarefas em Excel
  generateTasksExcel: async (tasks, filters, condominiumName = 'Condomínio') => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tarefas');
      
      // Cabeçalho
      worksheet.mergeCells('A1:G1');
      worksheet.getCell('A1').value = 'Relatório de Tarefas';
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };
      
      worksheet.mergeCells('A2:G2');
      worksheet.getCell('A2').value = condominiumName;
      worksheet.getCell('A2').font = { size: 12 };
      worksheet.getCell('A2').alignment = { horizontal: 'center' };
      
      // Cabeçalhos
      const headerRow = worksheet.getRow(4);
      headerRow.values = ['ID', 'Título', 'Status', 'Criado por', 'Atribuído a', 'Data Limite', 'Progresso'];
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Dados
      tasks.forEach((task, index) => {
        const row = worksheet.getRow(5 + index);
        const progress = task.checklists_count > 0 
          ? `${task.checklists_done}/${task.checklists_count}` 
          : '-';
        
        row.values = [
          task.id,
          task.title || '-',
          task.status || '-',
          task.created_by_name || '-',
          task.assigned_to_name || '-',
          task.due_date ? new Date(task.due_date) : null,
          progress
        ];
        
        if (task.due_date) {
          row.getCell(6).numFmt = 'dd/mm/yyyy';
        }
      });
      
      // Ajustar largura das colunas
      worksheet.columns = [
        { width: 10 }, // ID
        { width: 30 }, // Título
        { width: 15 }, // Status
        { width: 20 }, // Criado por
        { width: 20 }, // Atribuído a
        { width: 15 }, // Data Limite
        { width: 15 }  // Progresso
      ];
      
      // Salvar arquivo
      const fileName = `tarefas_${Date.now()}.xlsx`;
      const reportsDir = path.join(__dirname, '../../uploads/reports');
      
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const filePath = path.join(reportsDir, fileName);
      await workbook.xlsx.writeFile(filePath);
      
      return { filePath, fileName };
    } catch (error) {
      console.error('Erro ao gerar relatório de tarefas:', error);
      throw error;
    }
  },

  // Gerar relatório de tarefas em PDF
  generateTasksPDF: async (tasks, filters, condominiumName = 'Condomínio') => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const fileName = `tarefas_${Date.now()}.pdf`;
        const reportsDir = path.join(__dirname, '../../uploads/reports');
        
        // Criar diretório se não existir
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const filePath = path.join(reportsDir, fileName);
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        
        // Cabeçalho
        doc.fontSize(20).font('Helvetica-Bold').text('Relatório de Tarefas', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text(condominiumName, { align: 'center' });
        doc.moveDown();
        
        // Data de geração
        doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'right' });
        doc.moveDown();
        
        // Total de registros
        doc.fontSize(10).text(`Total de tarefas: ${tasks.length}`, { align: 'left' });
        doc.moveDown();
        
        // Tabela de tarefas
        let y = doc.y;
        const startY = y;
        const rowHeight = 20;
        const colWidths = [50, 200, 80, 100, 100, 80, 60];
        const headers = ['ID', 'Título', 'Status', 'Criado por', 'Atribuído a', 'Data Limite', 'Progresso'];
        
        // Cabeçalho da tabela
        doc.fontSize(9).font('Helvetica-Bold');
        let x = 50;
        headers.forEach((header, i) => {
          doc.text(header, x, y, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });
        y += rowHeight;
        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 5;
        
        // Dados
        doc.fontSize(8).font('Helvetica');
        tasks.forEach((task) => {
          if (y > 750) {
            doc.addPage();
            y = 50;
          }
          
          const progress = task.checklists_count > 0 
            ? `${task.checklists_done || 0}/${task.checklists_count}` 
            : '-';
          
          const dueDate = task.due_date 
            ? new Date(task.due_date).toLocaleDateString('pt-BR')
            : '-';
          
          const row = [
            task.id || '-',
            (task.title || '-').substring(0, 30),
            task.status || '-',
            (task.created_by_name || '-').substring(0, 15),
            (task.assigned_to_name || '-').substring(0, 15),
            dueDate,
            progress
          ];
          
          x = 50;
          row.forEach((cell, i) => {
            doc.text(String(cell), x, y, { width: colWidths[i], align: 'left' });
            x += colWidths[i];
          });
          y += rowHeight;
        });
        
        doc.end();
        
        stream.on('finish', () => {
          resolve({ filePath, fileName });
        });
        
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Listar relatórios gerados (arquivos na pasta uploads/reports)
  listGeneratedReports: async (condominiumId) => {
    try {
      const reportsDir = path.join(__dirname, '../../uploads/reports');
      
      // Se o diretório não existir, retornar array vazio
      if (!fs.existsSync(reportsDir)) {
        return [];
      }
      
      // Ler arquivos do diretório
      const files = fs.readdirSync(reportsDir);
      
      // Filtrar apenas arquivos de relatório (PDF e Excel)
      const reportFiles = files
        .filter(file => file.endsWith('.pdf') || file.endsWith('.xlsx'))
        .map(file => {
          const filePath = path.join(reportsDir, file);
          const stats = fs.statSync(filePath);
          
          // Extrair mês e ano do nome do arquivo se for relatório mensal
          let month = null;
          let year = null;
          const monthlyMatch = file.match(/relatorio_mensal_(\d{4})_(\d{1,2})_/);
          if (monthlyMatch) {
            year = parseInt(monthlyMatch[1]);
            month = parseInt(monthlyMatch[2]);
          }
          
          return {
            name: file,
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            type: file.endsWith('.pdf') ? 'PDF' : 'Excel',
            url: `/uploads/reports/${file}`,
            month: month,
            year: year
          };
        })
        .sort((a, b) => b.modifiedAt - a.modifiedAt); // Mais recentes primeiro
      
      return reportFiles;
    } catch (error) {
      console.error('Erro ao listar relatórios gerados:', error);
      throw error;
    }
  },

  // Excluir relatório
  deleteReport: async (fileName, condominiumId, userId, ipAddress, userAgent) => {
    try {
      const { logAction } = require('../utils/logger');
      const reportsDir = path.join(__dirname, '../../uploads/reports');
      const filePath = path.join(reportsDir, fileName);
      
      // Verificar se o arquivo existe
      if (!fs.existsSync(filePath)) {
        throw new Error('Relatório não encontrado');
      }
      
      // Verificar se é um arquivo PDF ou Excel (segurança)
      if (!fileName.endsWith('.pdf') && !fileName.endsWith('.xlsx')) {
        throw new Error('Tipo de arquivo inválido');
      }
      
      // Verificar se o arquivo está dentro do diretório de relatórios (segurança)
      const resolvedPath = path.resolve(filePath);
      const resolvedDir = path.resolve(reportsDir);
      if (!resolvedPath.startsWith(resolvedDir)) {
        throw new Error('Caminho inválido');
      }
      
      // Obter informações do arquivo antes de excluir (para log)
      const stats = fs.statSync(filePath);
      const fileInfo = {
        name: fileName,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
      
      // Excluir arquivo
      fs.unlinkSync(filePath);
      
      // Registrar log
      try {
        await logAction({
          userId: userId,
          condominiumId: condominiumId,
          action: 'DELETE',
          module: 'FINANCIAL',
          entityType: 'monthly_report',
          entityId: null,
          beforeData: fileInfo,
          afterData: null,
          ipAddress: ipAddress,
          userAgent: userAgent,
        });
      } catch (logError) {
        console.error('Erro ao registrar log de exclusão:', logError);
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir relatório:', error);
      throw error;
    }
  },

  // Gerar relatório financeiro mensal COMPLETO E DETALHADO
  generateMonthlyFinancialReport: async (condominiumId, month, year, userId, ipAddress, userAgent) => {
    try {
      const { query } = require('../config/database');
      const { logAction } = require('../utils/logger');
      const monthlyClosureService = require('./monthlyClosureService');
      
      // Verifica se o mês está fechado - só permite gerar relatório se estiver fechado
      const closure = await monthlyClosureService.getClosureByMonth(condominiumId, month, year);
      if (!closure || closure.status !== 'CLOSED') {
        throw new Error('Relatório só pode ser gerado para meses fechados. Por favor, feche o mês primeiro.');
      }
      
      // Buscar nome do condomínio
      const condominiumResult = await query(
        `SELECT name FROM condominiums WHERE id = $1`,
        [condominiumId]
      );
      const condominiumName = condominiumResult.rows.length > 0 ? condominiumResult.rows[0].name : 'Condomínio';
      
      // Buscar informações do fundo de reserva
      const reserveFundService = require('./reserveFundService');
      const reserveFund = await reserveFundService.getReserveFund(condominiumId);
      
      // Busca o valor do fundo de reserva do fechamento (pode ter múltiplas comandas, soma todas)
      const closureWithReserveResult = await query(
        `SELECT COALESCE(SUM(reserve_fund_amount), 0) as total FROM monthly_closures 
         WHERE condominium_id = $1 AND month = $2 AND year = $3 AND status = 'CLOSED'`,
        [condominiumId, month, year]
      );
      const reserveFundAmountThisMonth = parseFloat(closureWithReserveResult.rows[0].total || 0);
      
      // Buscar entradas do mês com todos os detalhes
      const entriesResult = await query(
        `SELECT 
          fe.*, 
          cc.name as cost_center_name,
          u.full_name as created_by_name,
          u2.full_name as reviewed_by_name
         FROM financial_entries fe
         LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
         LEFT JOIN users u ON fe.created_by = u.id
         LEFT JOIN users u2 ON fe.reviewed_by = u2.id
         WHERE fe.condominium_id = $1 
         AND EXTRACT(MONTH FROM fe.entry_date) = $2 
         AND EXTRACT(YEAR FROM fe.entry_date) = $3
         AND fe.deleted_at IS NULL
         ORDER BY fe.entry_date ASC, fe.id ASC`,
        [condominiumId, month, year]
      );
      const entries = entriesResult.rows;
      
      // Buscar saídas do mês com todos os detalhes
      const exitsResult = await query(
        `SELECT 
          fe.*,
          cc.name as cost_center_name,
          b.name as bill_name,
          b.bill_type,
          u.full_name as created_by_name,
          u2.full_name as approved_by_name
         FROM financial_exits fe
         LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
         LEFT JOIN bills b ON fe.bill_id = b.id
         LEFT JOIN users u ON fe.created_by = u.id
         LEFT JOIN users u2 ON fe.approved_by = u2.id
         WHERE fe.condominium_id = $1 
         AND EXTRACT(MONTH FROM fe.exit_date) = $2 
         AND EXTRACT(YEAR FROM fe.exit_date) = $3
         ORDER BY fe.exit_date ASC, fe.id ASC`,
        [condominiumId, month, year]
      );
      const exits = exitsResult.rows;
      
      // Buscar consumo mensal do mês
      const consumptionResult = await query(
        `SELECT 
          mc.*,
          b.name as bill_name,
          b.bill_type,
          b.provider
         FROM monthly_consumption mc
         INNER JOIN bills b ON mc.bill_id = b.id
         WHERE mc.condominium_id = $1 
         AND mc.month = $2 
         AND mc.year = $3
         ORDER BY b.bill_type, b.name`,
        [condominiumId, month, year]
      );
      const consumption = consumptionResult.rows;
      
      // Calcular totais e estatísticas
      const totalEntries = entries.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const totalEntriesReceived = entries
        .filter(e => e.received)
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const totalEntriesPending = entries
        .filter(e => !e.received && e.review_status === 'APPROVED')
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      
      const totalExits = exits.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const totalExitsPaid = exits
        .filter(e => e.payment_status === 'PAID')
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const totalExitsApproved = exits
        .filter(e => e.payment_status === 'APPROVED')
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const totalExitsPending = exits
        .filter(e => e.payment_status === 'PENDING')
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const totalExitsRejected = exits
        .filter(e => e.payment_status === 'REJECTED')
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      
      // Análise por centro de custo - Entradas
      const entriesByCostCenter = {};
      entries.forEach(entry => {
        const ccName = entry.cost_center_name || 'Sem Centro de Custo';
        if (!entriesByCostCenter[ccName]) {
          entriesByCostCenter[ccName] = { total: 0, received: 0, count: 0 };
        }
        entriesByCostCenter[ccName].total += parseFloat(entry.amount || 0);
        if (entry.received) {
          entriesByCostCenter[ccName].received += parseFloat(entry.amount || 0);
        }
        entriesByCostCenter[ccName].count++;
      });
      
      // Análise por centro de custo - Saídas
      const exitsByCostCenter = {};
      exits.forEach(exit => {
        const ccName = exit.cost_center_name || 'Sem Centro de Custo';
        if (!exitsByCostCenter[ccName]) {
          exitsByCostCenter[ccName] = { total: 0, paid: 0, approved: 0, pending: 0, count: 0 };
        }
        exitsByCostCenter[ccName].total += parseFloat(exit.amount || 0);
        if (exit.payment_status === 'PAID') {
          exitsByCostCenter[ccName].paid += parseFloat(exit.amount || 0);
        } else if (exit.payment_status === 'APPROVED') {
          exitsByCostCenter[ccName].approved += parseFloat(exit.amount || 0);
        } else if (exit.payment_status === 'PENDING') {
          exitsByCostCenter[ccName].pending += parseFloat(exit.amount || 0);
        }
        exitsByCostCenter[ccName].count++;
      });
      
      // Análise por categoria - Entradas
      const entriesByCategory = {};
      entries.forEach(entry => {
        const cat = entry.category || 'OUTRA';
        if (!entriesByCategory[cat]) {
          entriesByCategory[cat] = { total: 0, received: 0, count: 0 };
        }
        entriesByCategory[cat].total += parseFloat(entry.amount || 0);
        if (entry.received) {
          entriesByCategory[cat].received += parseFloat(entry.amount || 0);
        }
        entriesByCategory[cat].count++;
      });
      
      // Análise por categoria - Saídas
      const exitsByCategory = {};
      exits.forEach(exit => {
        const cat = exit.category || 'OUTRA';
        if (!exitsByCategory[cat]) {
          exitsByCategory[cat] = { total: 0, paid: 0, count: 0 };
        }
        exitsByCategory[cat].total += parseFloat(exit.amount || 0);
        if (exit.payment_status === 'PAID') {
          exitsByCategory[cat].paid += parseFloat(exit.amount || 0);
        }
        exitsByCategory[cat].count++;
      });
      
      // Comparação com mês anterior
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      
      const prevEntriesResult = await query(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM financial_entries 
         WHERE condominium_id = $1 
         AND EXTRACT(MONTH FROM entry_date) = $2 
         AND EXTRACT(YEAR FROM entry_date) = $3
         AND received = TRUE AND deleted_at IS NULL`,
        [condominiumId, prevMonth, prevYear]
      );
      const prevEntries = parseFloat(prevEntriesResult.rows[0].total);
      
      const prevExitsResult = await query(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM financial_exits 
         WHERE condominium_id = $1 
         AND EXTRACT(MONTH FROM exit_date) = $2 
         AND EXTRACT(YEAR FROM exit_date) = $3
         AND payment_status = 'PAID'`,
        [condominiumId, prevMonth, prevYear]
      );
      const prevExits = parseFloat(prevExitsResult.rows[0].total);
      
      const entriesVariation = prevEntries > 0 
        ? ((totalEntriesReceived - prevEntries) / prevEntries) * 100 
        : (totalEntriesReceived > 0 ? 100 : 0);
      const exitsVariation = prevExits > 0 
        ? ((totalExitsPaid - prevExits) / prevExits) * 100 
        : (totalExitsPaid > 0 ? 100 : 0);
      
      // Saldo do mês
      const balance = totalEntriesReceived - totalExitsPaid;
      
      // Gerar PDF completo
      return new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({ 
            margin: 50, 
            size: 'A4',
            info: {
              Title: `Relatório Financeiro Mensal - ${month}/${year}`,
              Author: condominiumName,
              Subject: 'Relatório Financeiro',
              Creator: 'Sistema de Gestão Condominial'
            }
          });
          
          // Garantir nome único para não sobrescrever - usando múltiplas camadas de segurança
          const reportsDir = path.join(__dirname, '../../uploads/reports');
          
          // Criar diretório se não existir
          if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
          }
          
          // Função para gerar nome único garantido com múltiplos identificadores
          const generateUniqueFileName = (counter = 0) => {
            // Usar timestamp de alta precisão + ID aleatório + contador de processo + nanosegundos
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 9);
            const processId = process.pid || Math.floor(Math.random() * 10000);
            const hrtime = process.hrtime ? process.hrtime() : [0, 0];
            const nanoseconds = hrtime[1] || Math.floor(Math.random() * 1000000000);
            
            // Formato: relatorio_mensal_YYYY_MM_timestamp_processId_nanoseconds_randomId_counter.pdf
            const baseName = `relatorio_mensal_${year}_${String(month).padStart(2, '0')}_${timestamp}_${processId}_${nanoseconds}_${randomId}`;
            
            if (counter > 0) {
              return `${baseName}_${counter}.pdf`;
            }
            return `${baseName}.pdf`;
          };
          
          // Gerar nome único e verificar
          let finalFileName = generateUniqueFileName();
          let filePath = path.join(reportsDir, finalFileName);
          let counter = 0;
          const maxAttempts = 100;
          
          // Garantir que o arquivo não existe - tentar até encontrar nome único
          while (fs.existsSync(filePath) && counter < maxAttempts) {
            counter++;
            finalFileName = generateUniqueFileName(counter);
            filePath = path.join(reportsDir, finalFileName);
          }
          
          // Se ainda existir após todas as tentativas, usar UUID completo
          if (fs.existsSync(filePath)) {
            // Gerar UUID v4 completo
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              const r = Math.random() * 16 | 0;
              const v = c === 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
            finalFileName = `relatorio_mensal_${year}_${String(month).padStart(2, '0')}_${uuid.replace(/-/g, '')}.pdf`;
            filePath = path.join(reportsDir, finalFileName);
          }
          
          // Verificação final de segurança antes de criar o stream
          if (fs.existsSync(filePath)) {
            // Última tentativa com timestamp único garantido
            const finalTimestamp = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${process.hrtime ? process.hrtime()[1] : Math.random()}`;
            finalFileName = `relatorio_mensal_${year}_${String(month).padStart(2, '0')}_${finalTimestamp}.pdf`;
            filePath = path.join(reportsDir, finalFileName);
            
            // Se ainda existir, lançar erro (caso extremamente raro)
            if (fs.existsSync(filePath)) {
              throw new Error(`Erro crítico: Não foi possível gerar nome de arquivo único após ${maxAttempts + 2} tentativas.`);
            }
          }
          
          console.log(`📄 Gerando relatório com nome único: ${finalFileName} (tentativas: ${counter})`);
          
          // Verificação final antes de criar o stream (proteção contra race condition)
          if (fs.existsSync(filePath)) {
            // Se por algum motivo o arquivo foi criado entre a verificação e agora, gerar novo nome
            const emergencyTimestamp = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            finalFileName = `relatorio_mensal_${year}_${String(month).padStart(2, '0')}_EMERGENCY_${emergencyTimestamp}.pdf`;
            filePath = path.join(reportsDir, finalFileName);
            console.log(`AVISO: Arquivo detectado no ultimo momento, usando nome de emergencia: ${finalFileName}`);
          }
          
          // Criar stream de escrita (modo 'wx' garante que falha se arquivo existir)
          // Mas como já verificamos, vamos usar modo normal
          const stream = fs.createWriteStream(filePath, { flags: 'w' });
          doc.pipe(stream);
          
          // Log adicional para debug
          console.log(`OK: Arquivo sera criado em: ${filePath}`);
          
          // Cores do tema
          const colors = {
            primary: '#1e40af',      // Azul escuro
            secondary: '#3b82f6',    // Azul
            success: '#10b981',      // Verde
            danger: '#ef4444',       // Vermelho
            warning: '#f59e0b',      // Laranja
            dark: '#1f2937',        // Cinza escuro
            light: '#f3f4f6',       // Cinza claro
            border: '#e5e7eb'       // Borda
          };
          
          // Função auxiliar para adicionar nova página se necessário
          const checkPageBreak = (requiredSpace = 80) => {
            if (doc.y + requiredSpace > 720) {
              doc.addPage();
              doc.y = 50;
              return true;
            }
            return false;
          };
          
          // Garantir espaço mínimo após bloco e evitar sobreposição
          const SECTION_GAP = 40;
          const setYAfter = (y) => {
            doc.y = Math.max(doc.y, y) + SECTION_GAP;
          };
          
          // Função auxiliar para formatar moeda
          const formatCurrency = (value) => {
            return `R$ ${parseFloat(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          };
          
          // Função auxiliar para formatar data
          const formatDate = (date) => {
            if (!date) return '-';
            return new Date(date).toLocaleDateString('pt-BR');
          };
          
          // Função para desenhar box/caixa
          const drawBox = (x, y, width, height, fillColor = null, strokeColor = colors.border) => {
            if (fillColor) {
              doc.rect(x, y, width, height).fillColor(fillColor).fill();
            }
            doc.rect(x, y, width, height).strokeColor(strokeColor).lineWidth(0.5).stroke();
          };
          
          // Função para adicionar linha horizontal
          const drawLine = (y, color = colors.border, width = 495) => {
            doc.moveTo(50, y).lineTo(50 + width, y).strokeColor(color).lineWidth(1).stroke();
          };
          
          // Função para desenhar gráfico de rosca (doughnut chart) - versão melhorada e suave
          const drawDoughnutChart = (centerX, centerY, outerRadius, innerRadius, progressPercent, chartColors) => {
            try {
              // Desenha o fundo completo (cinza claro)
              doc.circle(centerX, centerY, outerRadius)
                .fillColor('#f3f4f6')
                .fill();
              
              // Desenha o furo interno (branco)
              doc.circle(centerX, centerY, innerRadius)
                .fillColor('#ffffff')
                .fill();
              
              // Desenha o arco de progresso com mais segmentos para suavidade
              if (progressPercent > 0 && progressPercent <= 100) {
                const startAngle = -Math.PI / 2; // Começa no topo
                const progressAngle = (progressPercent / 100) * 2 * Math.PI;
                const steps = 120; // Mais segmentos = mais suave
                
                // Desenha segmentos do arco de progresso
                for (let i = 0; i < steps; i++) {
                  const angle1 = startAngle + (i / steps) * progressAngle;
                  const angle2 = startAngle + ((i + 1) / steps) * progressAngle;
                  
                  // Calcula pontos do segmento
                  const x1_outer = centerX + outerRadius * Math.cos(angle1);
                  const y1_outer = centerY + outerRadius * Math.sin(angle1);
                  const x2_outer = centerX + outerRadius * Math.cos(angle2);
                  const y2_outer = centerY + outerRadius * Math.sin(angle2);
                  const x1_inner = centerX + innerRadius * Math.cos(angle1);
                  const y1_inner = centerY + innerRadius * Math.sin(angle1);
                  const x2_inner = centerX + innerRadius * Math.cos(angle2);
                  const y2_inner = centerY + innerRadius * Math.sin(angle2);
                  
                  // Desenha o segmento
                  doc.save();
                  doc.moveTo(x1_outer, y1_outer);
                  doc.lineTo(x2_outer, y2_outer);
                  doc.lineTo(x2_inner, y2_inner);
                  doc.lineTo(x1_inner, y1_inner);
                  doc.closePath();
                  doc.fillColor(chartColors.success).fill();
                  doc.restore();
                }
              }
              
              // Bordas suaves e elegantes
              doc.circle(centerX, centerY, outerRadius)
                .strokeColor('#e5e7eb')
                .lineWidth(2)
                .stroke();
              
              doc.circle(centerX, centerY, innerRadius)
                .strokeColor('#ffffff')
                .lineWidth(2)
                .stroke();
              
              // Sombra sutil no círculo externo
              doc.circle(centerX + 1, centerY + 1, outerRadius)
                .strokeColor('#d1d5db')
                .lineWidth(0.5)
                .opacity(0.3)
                .stroke();
            } catch (error) {
              console.error('Erro ao desenhar gráfico de rosca:', error);
              // Em caso de erro, apenas desenha círculos simples
              doc.circle(centerX, centerY, outerRadius)
                .strokeColor('#d1d5db')
                .lineWidth(1.5)
                .stroke();
            }
          };
          
          // ========== CABEÇALHO BONITO ==========
          const headerY = 50;
          
          // Box do cabeçalho
          drawBox(50, headerY, 495, 80, colors.primary);
          
          // Título principal
          doc.fontSize(24).font('Helvetica-Bold').fillColor('#ffffff')
            .text('RELATÓRIO FINANCEIRO MENSAL', 50, headerY + 15, { 
              align: 'center', 
              width: 495 
            });
          
          // Nome do condomínio
          doc.fontSize(16).font('Helvetica-Bold').fillColor('#ffffff')
            .text(condominiumName, 50, headerY + 45, { 
              align: 'center', 
              width: 495 
            });
          
          // Período
          doc.fontSize(12).font('Helvetica').fillColor('#e0e7ff')
            .text(`Período: ${String(month).padStart(2, '0')}/${year}`, 50, headerY + 65, { 
              align: 'center', 
              width: 495 
            });
          
          // Resetar cor
          doc.fillColor('#000000');
          
          // Data de geração (fora do box)
          doc.fontSize(9).font('Helvetica').fillColor(colors.dark)
            .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 50, headerY + 95, { 
              align: 'right', 
              width: 495 
            });
          
          doc.moveDown(2);
          
          // ========== RESUMO EXECUTIVO ==========
          const sectionY = doc.y;
          
          // Título da seção com fundo
          doc.fontSize(18).font('Helvetica-Bold').fillColor(colors.primary)
            .text('1. RESUMO EXECUTIVO', 50, sectionY);
          drawLine(sectionY + 25, colors.primary, 200);
          doc.moveDown(1.5);
          
          // Box de resumo financeiro
          const boxY = doc.y;
          const boxHeight = 180;
          drawBox(50, boxY, 495, boxHeight, colors.light);
          
          doc.fontSize(13).font('Helvetica-Bold').fillColor(colors.dark)
            .text('1.1. Resumo Financeiro Geral', 60, boxY + 10);
          
          const lineHeight = 12;
          let currentY = boxY + 30;
          
          doc.fontSize(10).font('Helvetica').fillColor(colors.dark);
          
          // Entradas
          doc.font('Helvetica-Bold').text('ENTRADAS:', 60, currentY);
          currentY += lineHeight;
          doc.font('Helvetica').text(`  Total Registradas: ${formatCurrency(totalEntries)}`, 60, currentY);
          currentY += lineHeight;
          doc.font('Helvetica').fillColor(colors.success)
            .text(`  Total Recebidas: ${formatCurrency(totalEntriesReceived)}`, 60, currentY);
          currentY += lineHeight;
          if (totalEntriesPending > 0) {
            doc.font('Helvetica').fillColor(colors.warning)
              .text(`  Pendentes: ${formatCurrency(totalEntriesPending)}`, 60, currentY);
            currentY += lineHeight;
          }
          currentY += 5;
          
          // Saídas
          doc.font('Helvetica-Bold').fillColor(colors.dark).text('SAÍDAS:', 60, currentY);
          currentY += lineHeight;
          doc.font('Helvetica').text(`  Total Registradas: ${formatCurrency(totalExits)}`, 60, currentY);
          currentY += lineHeight;
          doc.font('Helvetica').fillColor(colors.danger)
            .text(`  Total Pagas: ${formatCurrency(totalExitsPaid)}`, 60, currentY);
          currentY += lineHeight;
          if (totalExitsApproved > 0) {
            doc.font('Helvetica').fillColor(colors.warning)
              .text(`  Aprovadas (não pagas): ${formatCurrency(totalExitsApproved)}`, 60, currentY);
            currentY += lineHeight;
          }
          if (totalExitsPending > 0) {
            doc.font('Helvetica').fillColor(colors.warning)
              .text(`  Pendentes: ${formatCurrency(totalExitsPending)}`, 60, currentY);
            currentY += lineHeight;
          }
          if (totalExitsRejected > 0) {
            doc.font('Helvetica').fillColor(colors.danger)
              .text(`  Rejeitadas: ${formatCurrency(totalExitsRejected)}`, 60, currentY);
            currentY += lineHeight;
          }
          
          // Saldo destacado
          currentY += 10;
          drawBox(60, currentY, 475, 30, balance >= 0 ? '#d1fae5' : '#fee2e2');
          doc.font('Helvetica-Bold').fontSize(14)
            .fillColor(balance >= 0 ? colors.success : colors.danger)
            .text(`SALDO DO MÊS: ${formatCurrency(balance)}`, 70, currentY + 8, {
              width: 465,
              align: 'center'
            });
          
          doc.y = boxY + boxHeight + 15;
          doc.fillColor('#000000');
          
          // Comparação com mês anterior
          checkPageBreak(80);
          const comparisonY = doc.y;
          const comparisonHeight = 70;
          drawBox(50, comparisonY, 495, comparisonHeight, '#fef3c7');
          
          doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.dark)
            .text('1.2. Comparação com Mês Anterior', 60, comparisonY + 10);
          
          doc.fontSize(10).font('Helvetica').fillColor(colors.dark);
          let compY = comparisonY + 30;
          doc.text(`Mês Anterior (${String(prevMonth).padStart(2, '0')}/${prevYear}):`, 60, compY);
          compY += 12;
          doc.text(`  Entradas: ${formatCurrency(prevEntries)}`, 60, compY);
          compY += 12;
          doc.text(`  Saídas: ${formatCurrency(prevExits)}`, 60, compY);
          compY += 12;
          
          const varColor = entriesVariation >= 0 ? colors.success : colors.danger;
          doc.fillColor(varColor)
            .text(`Variação Entradas: ${entriesVariation >= 0 ? '+' : ''}${entriesVariation.toFixed(2)}%`, 300, comparisonY + 30);
          const varColor2 = exitsVariation >= 0 ? colors.danger : colors.success;
          doc.fillColor(varColor2)
            .text(`Variação Saídas: ${exitsVariation >= 0 ? '+' : ''}${exitsVariation.toFixed(2)}%`, 300, comparisonY + 42);
          
          doc.y = comparisonY + comparisonHeight + SECTION_GAP;
          doc.fillColor('#000000');
          
          // Estatísticas gerais
          checkPageBreak(70);
          const statsY = doc.y;
          const statsHeight = 50;
          drawBox(50, statsY, 495, statsHeight);
          
          doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.dark)
            .text('1.3. Estatísticas Gerais', 60, statsY + 10);
          
          doc.fontSize(10).font('Helvetica').fillColor(colors.dark);
          doc.text(`Quantidade de Entradas: ${entries.length}`, 60, statsY + 30);
          doc.text(`Quantidade de Saídas: ${exits.length}`, 200, statsY + 30);
          doc.text(`Contas de Consumo: ${consumption.length}`, 340, statsY + 30);
          
          doc.y = statsY + statsHeight + SECTION_GAP;
          
          // ========== PÁGINA DEDICADA AOS GRÁFICOS ==========
          doc.addPage();
          doc.y = 50;
          
          const chartsSectionY = doc.y;
          doc.fontSize(18).font('Helvetica-Bold').fillColor(colors.primary)
            .text('1.4. ANÁLISE VISUAL – GRÁFICOS', 50, chartsSectionY);
          drawLine(chartsSectionY + 25, colors.primary, 320);
          doc.y = chartsSectionY + 38;
          
          doc.fontSize(10).font('Helvetica').fillColor(colors.dark);
          doc.text(
            'Esta seção apresenta os gráficos do período. Cada gráfico mostra um aspecto do financeiro: comparação entre entradas e saídas, distribuição das saídas por categoria e, quando há dados, a evolução em relação ao mês anterior.',
            50, doc.y, { width: 495, align: 'left' }
          );
          doc.y += 32;
          
          // ----- Gráfico 1: Entradas vs Saídas (uma única área, sem sobreposição) -----
          checkPageBreak(220);
          const g1StartY = doc.y;
          const g1BoxH = 200;
          const g1Pad = 16;
          
          drawBox(50, g1StartY, 495, g1BoxH, '#fafafa');
          doc.rect(52, g1StartY + 2, 491, g1BoxH - 4).strokeColor(colors.border).lineWidth(0.5).stroke();
          
          doc.fontSize(13).font('Helvetica-Bold').fillColor(colors.dark)
            .text('Gráfico 1 – Comparação Entradas vs Saídas', 50 + g1Pad, g1StartY + g1Pad);
          doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
            .text('Valores recebidos (entradas) e valores pagos (saídas) no mês. O saldo é a diferença entre eles.', 50 + g1Pad, g1StartY + g1Pad + 16, { width: 463 });
          
          const g1ChartTop = g1StartY + 55;
          const g1ChartH = 110;
          const g1AxisX = 90;
          const g1AxisY = g1ChartTop + g1ChartH - 15;
          const g1ChartW = 435;
          const g1MaxVal = Math.max(totalEntriesReceived, totalExitsPaid, balance > 0 ? balance : 0, 1000);
          const g1BarH = (v) => Math.max((v / g1MaxVal) * (g1ChartH - 25), 8);
          const g1BarW = 70;
          const g1Gap = 28;
          
          doc.moveTo(g1AxisX, g1ChartTop).lineTo(g1AxisX, g1AxisY).strokeColor('#d1d5db').lineWidth(1).stroke();
          doc.moveTo(g1AxisX, g1AxisY).lineTo(g1AxisX + g1ChartW, g1AxisY).strokeColor('#d1d5db').lineWidth(1).stroke();
          
          let g1X = g1AxisX + 25;
          
          const drawBar = (x, height, color, label, value) => {
            const by = g1AxisY - height;
            doc.rect(x, by, g1BarW, height).fillColor(color).fill();
            doc.rect(x, by, g1BarW, height).strokeColor(color).lineWidth(1).stroke();
            doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.dark)
              .text(label, x, by - 14, { width: g1BarW, align: 'center' });
            doc.fontSize(8).font('Helvetica').fillColor(colors.dark)
              .text(value, x, g1AxisY + 4, { width: g1BarW, align: 'center' });
          };
          
          drawBar(g1X, g1BarH(totalEntriesReceived), colors.success, 'ENTRADAS', formatCurrency(totalEntriesReceived));
          g1X += g1BarW + g1Gap;
          drawBar(g1X, g1BarH(totalExitsPaid), colors.danger, 'SAÍDAS', formatCurrency(totalExitsPaid));
          g1X += g1BarW + g1Gap;
          if (balance > 0) {
            drawBar(g1X, g1BarH(balance), '#059669', 'SALDO', formatCurrency(balance));
          }
          
          doc.y = g1StartY + g1BoxH + SECTION_GAP;
          
          // ----- Gráfico 2: Distribuição por Categoria (em nova página se não couber) -----
          if (Object.keys(exitsByCategory).length > 0) {
            checkPageBreak(220);
            const g2StartY = doc.y;
            const g2BoxH = 180;
            const g2Pad = 14;
            
            drawBox(50, g2StartY, 495, g2BoxH, '#fafafa');
            doc.rect(52, g2StartY + 2, 491, g2BoxH - 4).strokeColor(colors.border).lineWidth(0.5).stroke();
            
            doc.fontSize(13).font('Helvetica-Bold').fillColor(colors.dark)
              .text('Gráfico 2 – Distribuição das Saídas por Categoria', 50 + g2Pad, g2StartY + g2Pad);
            doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
              .text('Quanto foi gasto em cada categoria (ex.: manutenção, contas). Valores e percentuais sobre o total de saídas.', 50 + g2Pad, g2StartY + g2Pad + 14, { width: 467 });
            
            const catColors = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6'];
            const catLabelW = 110;
            const catBarMaxW = 260;
            const catBarH = 14;
            const catSpacing = 22;
            let catY = g2StartY + 52;
            
            Object.entries(exitsByCategory)
              .sort((a, b) => b[1].total - a[1].total)
              .slice(0, 5)
              .forEach(([cat, data], idx) => {
                const pct = totalExits > 0 ? (data.total / totalExits) * 100 : 0;
                const barW = totalExits > 0 ? (data.total / totalExits) * catBarMaxW : 0;
                const c = catColors[idx % catColors.length];
                doc.rect(50 + g2Pad + catLabelW, catY, catBarMaxW, catBarH).fillColor('#f3f4f6').fill();
                doc.rect(50 + g2Pad + catLabelW, catY, barW, catBarH).fillColor(c).fill();
                doc.rect(50 + g2Pad + catLabelW, catY, barW, catBarH).strokeColor(c).lineWidth(0.5).stroke();
                doc.fontSize(9).font('Helvetica').fillColor(colors.dark).text(cat, 50 + g2Pad, catY + 2, { width: catLabelW - 4 });
                doc.fontSize(8).font('Helvetica').fillColor(colors.dark)
                  .text(`${formatCurrency(data.total)} (${pct.toFixed(1)}%)`, 50 + g2Pad + catLabelW + catBarMaxW + 8, catY + 3);
                catY += catSpacing;
              });
            
            doc.y = g2StartY + g2BoxH + SECTION_GAP;
          }
          
          // ----- Gráfico 3: Evolução Mensal (barras lado a lado, sem sobreposição) -----
          if (prevEntries > 0 || prevExits > 0) {
            checkPageBreak(200);
            const g3StartY = doc.y;
            const g3BoxH = 170;
            const g3Pad = 14;
            
            drawBox(50, g3StartY, 495, g3BoxH, '#fafafa');
            doc.rect(52, g3StartY + 2, 491, g3BoxH - 4).strokeColor(colors.border).lineWidth(0.5).stroke();
            
            doc.fontSize(13).font('Helvetica-Bold').fillColor(colors.dark)
              .text('Gráfico 3 – Evolução Mensal (Entradas e Saídas)', 50 + g3Pad, g3StartY + g3Pad);
            doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
              .text('Comparação entre o mês anterior e o mês atual. Cada par de barras: entradas (verde) e saídas (vermelho).', 50 + g3Pad, g3StartY + g3Pad + 14, { width: 467 });
            
            const g3ChartY = g3StartY + 52;
            const g3BarH = 75;
            const g3Max = Math.max(prevEntries, prevExits, totalEntriesReceived, totalExitsPaid, 1000);
            const g3Bar = (v) => Math.max((v / g3Max) * g3BarH, 6);
            const g3BarW = 45;
            const g3Gap = 12;
            const g3GroupGap = 55;
            
            let g3X = 80;
            const g3BaseY = g3ChartY + g3BarH + 5;
            
            const drawGroup = (ent, sai, label) => {
              const he = g3Bar(ent);
              const hs = g3Bar(sai);
              doc.rect(g3X, g3BaseY - he, g3BarW, he).fillColor(colors.success).fill();
              doc.rect(g3X, g3BaseY - he, g3BarW, he).strokeColor(colors.success).lineWidth(1).stroke();
              doc.rect(g3X + g3BarW + g3Gap, g3BaseY - hs, g3BarW, hs).fillColor(colors.danger).fill();
              doc.rect(g3X + g3BarW + g3Gap, g3BaseY - hs, g3BarW, hs).strokeColor(colors.danger).lineWidth(1).stroke();
              doc.fontSize(8).font('Helvetica').fillColor(colors.dark)
                .text(label, g3X, g3BaseY + 8, { width: g3BarW * 2 + g3Gap, align: 'center' });
            };
            
            drawGroup(prevEntries, prevExits, `${String(prevMonth).padStart(2, '0')}/${prevYear}`);
            g3X += g3BarW * 2 + g3Gap + g3GroupGap;
            drawGroup(totalEntriesReceived, totalExitsPaid, `${String(month).padStart(2, '0')}/${year}`);
            
            doc.fontSize(8).font('Helvetica').fillColor(colors.success).text('Entradas', g3X + 60, g3ChartY - 8);
            doc.fontSize(8).font('Helvetica').fillColor(colors.danger).text('Saídas', g3X + 120, g3ChartY - 8);
            
            doc.y = g3StartY + g3BoxH + SECTION_GAP;
          }
          
          // ========== EXPLICAÇÃO DO CÁLCULO DO SALDO ==========
          checkPageBreak(140);
          const calculationY = doc.y;
          const calculationHeight = 115;
          drawBox(50, calculationY, 495, calculationHeight, '#e0f2fe');
          
          doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.primary)
            .text('1.5. CÁLCULO DETALHADO DO SALDO FINAL', 60, calculationY + 10);
          doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
            .text('Como o saldo do mês é obtido: somam-se apenas as entradas já recebidas e subtraem-se apenas as saídas já pagas.', 60, calculationY + 28, { width: 475 });
          
          doc.fontSize(10).font('Helvetica').fillColor(colors.dark);
          let calcY = calculationY + 48;
          
          doc.font('Helvetica-Bold').text('1. Total de Entradas Recebidas:', 70, calcY);
          doc.font('Helvetica').text(`   ${formatCurrency(totalEntriesReceived)}`, 90, calcY + 12);
          calcY += 25;
          
          doc.font('Helvetica-Bold').text('2. Total de Saídas Pagas:', 70, calcY);
          doc.font('Helvetica').text(`   ${formatCurrency(totalExitsPaid)}`, 90, calcY + 12);
          calcY += 25;
          
          doc.font('Helvetica-Bold').fontSize(11).fillColor(balance >= 0 ? colors.success : colors.danger)
            .text(`SALDO FINAL = Entradas - Saídas = ${formatCurrency(balance)}`, 70, calcY);
          
          if (totalExitsApproved > 0) {
            calcY += 15;
            doc.font('Helvetica').fontSize(9).fillColor(colors.warning)
              .text(`ATENCAO: Existem ${formatCurrency(totalExitsApproved)} em saidas aprovadas que ainda nao foram pagas.`, 70, calcY);
          }
          
          doc.y = calculationY + calculationHeight + SECTION_GAP;
          
          // ========== ANÁLISE POR CENTRO DE CUSTO ==========
          checkPageBreak(120);
          const costCenterY = doc.y;
          doc.fontSize(18).font('Helvetica-Bold').fillColor(colors.primary)
            .text('2. ANÁLISE POR CENTRO DE CUSTO', 50, costCenterY);
          drawLine(costCenterY + 25, colors.primary, 250);
          doc.y = costCenterY + 35;
          doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
            .text('Valores agrupados por centro de custo (ex.: áreas comuns, administrativo). Entradas: o que entrou; Saídas: o que saiu por centro.', 50, doc.y, { width: 495 });
          doc.y += 22;
          
          // Entradas por centro de custo
          doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.dark)
            .text('2.1. Entradas por Centro de Custo', 60, doc.y);
          doc.y += 18;
          
          if (Object.keys(entriesByCostCenter).length === 0) {
            doc.fontSize(10).font('Helvetica').fillColor(colors.dark)
              .text('Nenhuma entrada registrada com centro de custo.', 60, doc.y);
            doc.y += 20;
          } else {
            Object.entries(entriesByCostCenter)
              .sort((a, b) => b[1].total - a[1].total)
              .forEach(([ccName, data]) => {
                checkPageBreak(40);
                const ccY = doc.y;
                drawBox(60, ccY, 475, 28, '#f0f9ff');
                
                doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.primary)
                  .text(ccName, 70, ccY + 8);
                doc.font('Helvetica').fontSize(9).fillColor(colors.dark)
                  .text(`Total: ${formatCurrency(data.total)} | Recebido: ${formatCurrency(data.received)} | Qtd: ${data.count}`, 70, ccY + 20);
                
                doc.y = ccY + 32;
              });
          }
          doc.y += 18;
          
          // Saídas por centro de custo
          doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.dark)
            .text('2.2. Saídas por Centro de Custo', 60, doc.y);
          doc.y += 18;
          
          if (Object.keys(exitsByCostCenter).length === 0) {
            doc.fontSize(10).font('Helvetica').fillColor(colors.dark)
              .text('Nenhuma saída registrada com centro de custo.', 60, doc.y);
            doc.y += 20;
          } else {
            Object.entries(exitsByCostCenter)
              .sort((a, b) => b[1].total - a[1].total)
              .forEach(([ccName, data]) => {
                checkPageBreak(45);
                const ccY = doc.y;
                drawBox(60, ccY, 475, 34, '#fef2f2');
                
                doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.danger)
                  .text(ccName, 70, ccY + 8);
                doc.font('Helvetica').fontSize(8).fillColor(colors.dark)
                  .text(`Total: ${formatCurrency(data.total)} | Pago: ${formatCurrency(data.paid)} | Aprovado: ${formatCurrency(data.approved)}`, 70, ccY + 20);
                doc.text(`Pendente: ${formatCurrency(data.pending)} | Qtd: ${data.count}`, 70, ccY + 30);
                
                doc.y = ccY + 38;
              });
          }
          doc.y += SECTION_GAP;
          
          // ========== ANÁLISE POR CATEGORIA ==========
          checkPageBreak(120);
          const categoryY = doc.y;
          doc.fontSize(18).font('Helvetica-Bold').fillColor(colors.primary)
            .text('3. ANÁLISE POR CATEGORIA', 50, categoryY);
          drawLine(categoryY + 25, colors.primary, 220);
          doc.y = categoryY + 35;
          doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
            .text('Valores agrupados por tipo (ex.: taxa, receita, manutenção, conta). Facilita ver onde entram e onde saem os recursos.', 50, doc.y, { width: 495 });
          doc.y += 22;
          
          // Entradas por categoria
          doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.dark)
            .text('3.1. Entradas por Categoria', 60, doc.y);
          doc.y += 18;
          
          if (Object.keys(entriesByCategory).length === 0) {
            doc.fontSize(10).font('Helvetica').fillColor(colors.dark)
              .text('Nenhuma entrada registrada.', 60, doc.y);
            doc.y += 20;
          } else {
            Object.entries(entriesByCategory)
              .sort((a, b) => b[1].total - a[1].total)
              .forEach(([cat, data]) => {
                checkPageBreak(35);
                const catY = doc.y;
                drawBox(60, catY, 475, 28, '#ecfdf5');
                
                doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.success)
                  .text(cat, 70, catY + 8);
                doc.font('Helvetica').fontSize(9).fillColor(colors.dark)
                  .text(`Total: ${formatCurrency(data.total)} | Recebido: ${formatCurrency(data.received)} | Qtd: ${data.count}`, 70, catY + 20);
                
                doc.y = catY + 32;
              });
          }
          doc.y += 18;
          
          // Saídas por categoria
          doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.dark)
            .text('3.2. Saídas por Categoria', 60, doc.y);
          doc.y += 18;
          
          if (Object.keys(exitsByCategory).length === 0) {
            doc.fontSize(10).font('Helvetica').fillColor(colors.dark)
              .text('Nenhuma saída registrada.', 60, doc.y);
            doc.y += 20;
          } else {
            Object.entries(exitsByCategory)
              .sort((a, b) => b[1].total - a[1].total)
              .forEach(([cat, data]) => {
                checkPageBreak(35);
                const catY = doc.y;
                drawBox(60, catY, 475, 28, '#fef2f2');
                
                doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.danger)
                  .text(cat, 70, catY + 8);
                doc.font('Helvetica').fontSize(9).fillColor(colors.dark)
                  .text(`Total: ${formatCurrency(data.total)} | Pago: ${formatCurrency(data.paid)} | Qtd: ${data.count}`, 70, catY + 20);
                
                doc.y = catY + 32;
              });
          }
          doc.y += SECTION_GAP;
          
          // ========== CONSUMO MENSAL ==========
          if (consumption.length > 0) {
            checkPageBreak(100);
            const consumptionY = doc.y;
            doc.fontSize(18).font('Helvetica-Bold').fillColor(colors.primary)
              .text('4. CONSUMO MENSAL DE CONTAS', 50, consumptionY);
            drawLine(consumptionY + 25, colors.primary, 280);
            doc.y = consumptionY + 35;
            doc.fontSize(10).font('Helvetica');
            
            consumption.forEach((cons, index) => {
              checkPageBreak(45);
              const consY = doc.y;
              const consHeight = 40;
              const boxColor = cons.paid ? '#d1fae5' : '#fef3c7';
              drawBox(60, consY, 475, consHeight, boxColor);
              
              doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.dark)
                .text(`${index + 1}. ${cons.bill_name || 'Conta'} (${cons.bill_type || 'N/A'})`, 70, consY + 8);
              
              doc.font('Helvetica').fontSize(8).fillColor(colors.dark);
              let consInfoY = consY + 22;
              
              // Coluna esquerda
              if (cons.provider) {
                doc.text(`Fornecedor: ${cons.provider}`, 70, consInfoY);
                consInfoY += 10;
              }
              if (cons.consumption_value) {
                doc.text(`Consumo: ${parseFloat(cons.consumption_value).toLocaleString('pt-BR')} ${cons.consumption_unit || 'unidade'}`, 70, consInfoY);
              }
              
              // Coluna direita
              consInfoY = consY + 22;
              doc.fillColor(colors.danger)
                .text(`Valor: ${formatCurrency(cons.bill_amount)}`, 300, consInfoY);
              consInfoY += 10;
              const statusColor = cons.paid ? colors.success : colors.warning;
              doc.fillColor(statusColor)
                .text(`Status: ${cons.paid ? 'Pago' : 'Pendente'}`, 300, consInfoY);
              consInfoY += 10;
              if (cons.due_date) {
                doc.fillColor(colors.dark)
                  .text(`Vencimento: ${formatDate(cons.due_date)}`, 300, consInfoY);
              }
              
              doc.y = consY + consHeight + 10;
              doc.fillColor('#000000');
            });
            doc.moveDown(2);
          }
          
          // ========== TABELA DETALHADA DE ENTRADAS ==========
          checkPageBreak(160);
          const entriesTableY = doc.y;
          doc.fontSize(18).font('Helvetica-Bold').fillColor(colors.primary)
            .text('5. TABELA COMPLETA DE ENTRADAS', 50, entriesTableY);
          drawLine(entriesTableY + 25, colors.primary, 300);
          doc.y = entriesTableY + 35;
          doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
            .text('Listagem de todas as entradas do mês (ID, descrição, data, valor, centro de custo, status). Abaixo, o detalhamento de cada entrada.', 50, doc.y, { width: 495 });
          doc.y += 22;
          
          if (entries.length === 0) {
            doc.fontSize(10).font('Helvetica').fillColor(colors.dark)
              .text('Nenhuma entrada registrada neste mês.', 60, doc.y);
            doc.moveDown(2);
          } else {
            // Cabeçalho da tabela
            const tableHeaderY = doc.y;
            const rowHeight = 15;
            const colWidths = [40, 180, 80, 80, 100, 60]; // ID, Descrição, Data, Valor, Centro, Status
            
            drawBox(50, tableHeaderY, 495, rowHeight, colors.primary);
            
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
            doc.text('ID', 55, tableHeaderY + 4);
            doc.text('Descrição', 100, tableHeaderY + 4, { width: 170 });
            doc.text('Data', 275, tableHeaderY + 4);
            doc.text('Valor', 360, tableHeaderY + 4);
            doc.text('Centro Custo', 445, tableHeaderY + 4, { width: 90 });
            
            doc.y = tableHeaderY + rowHeight + 5;
            
            // Linhas da tabela
            entries.forEach((entry, index) => {
              checkPageBreak(rowHeight + 5);
              const rowY = doc.y;
              const rowColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
              
              drawBox(50, rowY, 495, rowHeight, rowColor);
              
              doc.fontSize(8).font('Helvetica').fillColor(colors.dark);
              
              // ID
              doc.text(entry.id.toString(), 55, rowY + 4);
              
              // Descrição (truncada se muito longa)
              const desc = (entry.description || 'Sem descrição').substring(0, 35);
              doc.text(desc, 100, rowY + 4, { width: 170 });
              
              // Data
              doc.text(formatDate(entry.entry_date), 275, rowY + 4);
              
              // Valor
              doc.fillColor(colors.success)
                .text(formatCurrency(entry.amount), 360, rowY + 4);
              
              // Centro de Custo
              doc.fillColor(colors.dark)
                .text((entry.cost_center_name || '-').substring(0, 15), 445, rowY + 4, { width: 90 });
              
              // Status (pequeno badge)
              const statusColor = entry.received ? colors.success : colors.warning;
              doc.fillColor(statusColor)
                .text(entry.received ? 'OK' : 'PEND', 535, rowY + 4);
              
              doc.y = rowY + rowHeight + 2;
              doc.fillColor('#000000');
            });
            
            // Rodapé da tabela
            const tableFooterY = doc.y;
            drawBox(50, tableFooterY, 495, rowHeight, colors.light);
            doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.dark)
              .text(`TOTAL: ${entries.length} entrada(s)`, 55, tableFooterY + 4);
            doc.fillColor(colors.success)
              .text(`Total Recebido: ${formatCurrency(totalEntriesReceived)}`, 360, tableFooterY + 4);
            
            doc.y = tableFooterY + rowHeight + 20;
            
            // Detalhamento completo de cada entrada
            doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.primary)
              .text('5.1. DETALHAMENTO COMPLETO DE CADA ENTRADA', 50, doc.y);
            drawLine(doc.y + 25, colors.primary, 380);
            doc.y += 35;
            
            entries.forEach((entry, index) => {
              checkPageBreak(90);
              const entryY = doc.y;
              const entryHeight = 85;
              
              // Box para cada entrada
              const boxColor = entry.received ? '#d1fae5' : '#fef3c7';
              drawBox(50, entryY, 495, entryHeight, boxColor);
              
              // Título da entrada
              doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.dark)
                .text(`ENTRADA #${entry.id} - ${entry.description || 'Sem descrição'}`, 60, entryY + 8, {
                  width: 475
                });
              
              // Informações detalhadas
              doc.font('Helvetica').fontSize(8).fillColor(colors.dark);
              let infoY = entryY + 25;
              
              // Primeira linha
              doc.text(`Data da Entrada: ${formatDate(entry.entry_date)}`, 60, infoY);
              doc.fillColor(colors.success)
                .text(`Valor: ${formatCurrency(entry.amount)}`, 300, infoY);
              infoY += 12;
              
              // Segunda linha
              doc.fillColor(colors.dark)
                .text(`Categoria: ${entry.category || 'N/A'}`, 60, infoY);
              if (entry.cost_center_name) {
                doc.text(`Centro de Custo: ${entry.cost_center_name}`, 300, infoY);
              }
              infoY += 12;
              
              // Terceira linha - Status
              const statusColor = entry.received ? colors.success : colors.warning;
              const statusText = entry.received 
                ? `RECEBIDO em ${formatDate(entry.received_at)}` 
                : 'PENDENTE DE RECEBIMENTO';
              doc.fillColor(statusColor).font('Helvetica-Bold')
                .text(`Status: ${statusText}`, 60, infoY);
              infoY += 12;
              
              // Quarta linha - Informações adicionais
              if (entry.created_by_name) {
                doc.font('Helvetica').fillColor(colors.dark)
                  .text(`Criado por: ${entry.created_by_name}`, 60, infoY);
              }
              if (entry.reviewed_by_name) {
                doc.text(`Revisado por: ${entry.reviewed_by_name}`, 300, infoY);
              }
              infoY += 12;
              
              // Quinta linha - Observações
              if (entry.review_notes) {
                doc.fontSize(7).fillColor('#6b7280')
                  .text(`Observacoes: ${entry.review_notes}`, 60, infoY, { width: 475 });
              }
              
              doc.y = entryY + entryHeight + 10;
              doc.fillColor('#000000');
            });
          }
          doc.moveDown(2);
          
          // ========== TABELA DETALHADA DE SAÍDAS ==========
          checkPageBreak(150);
          const exitsTableY = doc.y;
          doc.fontSize(18).font('Helvetica-Bold').fillColor(colors.primary)
            .text('6. TABELA COMPLETA DE SAÍDAS', 50, exitsTableY);
          drawLine(exitsTableY + 25, colors.primary, 280);
          doc.y = exitsTableY + 35;
          
          if (exits.length === 0) {
            doc.fontSize(10).font('Helvetica').fillColor(colors.dark)
              .text('Nenhuma saída registrada neste mês.', 60, doc.y);
            doc.moveDown(2);
          } else {
            // Cabeçalho da tabela
            const tableHeaderY = doc.y;
            const rowHeight = 15;
            
            drawBox(50, tableHeaderY, 495, rowHeight, colors.primary);
            
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
            doc.text('ID', 55, tableHeaderY + 4);
            doc.text('Descrição', 100, tableHeaderY + 4, { width: 170 });
            doc.text('Data', 275, tableHeaderY + 4);
            doc.text('Valor', 360, tableHeaderY + 4);
            doc.text('Status', 445, tableHeaderY + 4, { width: 90 });
            
            doc.y = tableHeaderY + rowHeight + 5;
            
            // Linhas da tabela
            exits.forEach((exit, index) => {
              checkPageBreak(rowHeight + 5);
              const rowY = doc.y;
              const rowColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
              
              drawBox(50, rowY, 495, rowHeight, rowColor);
              
              doc.fontSize(8).font('Helvetica').fillColor(colors.dark);
              
              // ID
              doc.text(exit.id.toString(), 55, rowY + 4);
              
              // Descrição (truncada se muito longa)
              const desc = (exit.description || 'Sem descrição').substring(0, 35);
              doc.text(desc, 100, rowY + 4, { width: 170 });
              
              // Data
              doc.text(formatDate(exit.exit_date), 275, rowY + 4);
              
              // Valor
              doc.fillColor(colors.danger)
                .text(formatCurrency(exit.amount), 360, rowY + 4);
              
              // Status
              let statusColor = colors.dark;
              let statusSymbol = 'PEND';
              if (exit.payment_status === 'PAID') {
                statusColor = colors.success;
                statusSymbol = 'PAGO';
              } else if (exit.payment_status === 'APPROVED') {
                statusColor = colors.secondary;
                statusSymbol = 'APROV';
              } else if (exit.payment_status === 'REJECTED') {
                statusColor = colors.danger;
                statusSymbol = 'REJ';
              }
              
              doc.fillColor(statusColor)
                .text(`${statusSymbol}`, 445, rowY + 4, { width: 90 });
              
              doc.y = rowY + rowHeight + 2;
              doc.fillColor('#000000');
            });
            
            // Rodapé da tabela
            const tableFooterY = doc.y;
            drawBox(50, tableFooterY, 495, rowHeight, colors.light);
            doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.dark)
              .text(`TOTAL: ${exits.length} saída(s)`, 55, tableFooterY + 4);
            doc.fillColor(colors.danger)
              .text(`Total Pago: ${formatCurrency(totalExitsPaid)}`, 360, tableFooterY + 4);
            
            doc.y = tableFooterY + rowHeight + 20;
            
            // Detalhamento completo de cada saída
            doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.primary)
              .text('6.1. DETALHAMENTO COMPLETO DE CADA SAÍDA', 50, doc.y);
            drawLine(doc.y + 25, colors.primary, 380);
            doc.y += 35;
            
            exits.forEach((exit, index) => {
              checkPageBreak(100);
              const exitY = doc.y;
              const exitHeight = 95;
              
              // Box para cada saída com cor baseada no status
              let boxColor = '#f3f4f6';
              if (exit.payment_status === 'PAID') boxColor = '#d1fae5';
              else if (exit.payment_status === 'APPROVED') boxColor = '#dbeafe';
              else if (exit.payment_status === 'REJECTED') boxColor = '#fee2e2';
              else boxColor = '#fef3c7';
              
              drawBox(50, exitY, 495, exitHeight, boxColor);
              
              // Título da saída
              doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.dark)
                .text(`SAÍDA #${exit.id} - ${exit.description || 'Sem descrição'}`, 60, exitY + 8, {
                  width: 475
                });
              
              // Informações detalhadas
              doc.font('Helvetica').fontSize(8).fillColor(colors.dark);
              let infoY = exitY + 25;
              
              // Primeira linha
              doc.text(`Data da Saida: ${formatDate(exit.exit_date)}`, 60, infoY);
              doc.fillColor(colors.danger)
                .text(`Valor: ${formatCurrency(exit.amount)}`, 300, infoY);
              infoY += 12;
              
              // Segunda linha
              doc.fillColor(colors.dark)
                .text(`Categoria: ${exit.category || 'N/A'}`, 60, infoY);
              if (exit.cost_center_name) {
                doc.text(`Centro de Custo: ${exit.cost_center_name}`, 300, infoY);
              }
              infoY += 12;
              
              // Terceira linha - Status e Aprovação
              let statusColor = colors.dark;
              let statusText = exit.payment_status || 'Pendente';
              if (exit.payment_status === 'PAID') {
                statusColor = colors.success;
                statusText = `PAGO em ${formatDate(exit.paid_at)}`;
              } else if (exit.payment_status === 'APPROVED') {
                statusColor = colors.secondary;
                statusText = `APROVADO por ${exit.approved_by_name || 'N/A'} em ${formatDate(exit.approved_at)}`;
              } else if (exit.payment_status === 'REJECTED') {
                statusColor = colors.danger;
                statusText = 'REJEITADO';
              } else {
                statusColor = colors.warning;
                statusText = 'AGUARDANDO APROVACAO';
              }
              
              doc.fillColor(statusColor).font('Helvetica-Bold')
                .text(`Status: ${statusText}`, 60, infoY);
              infoY += 12;
              
              // Quarta linha - Informações adicionais
              if (exit.bill_name) {
                doc.font('Helvetica').fillColor(colors.dark)
                  .text(`Conta Relacionada: ${exit.bill_name} (${exit.bill_type || 'N/A'})`, 60, infoY);
                infoY += 12;
              }
              
              if (exit.requires_approval) {
                doc.text(`Requer Aprovacao: Sim (Limite: ${formatCurrency(exit.approval_limit || 0)})`, 60, infoY);
                infoY += 12;
              }
              
              // Quinta linha - Criado por
              if (exit.created_by_name) {
                doc.text(`Criado por: ${exit.created_by_name} em ${formatDate(exit.created_at)}`, 60, infoY);
                infoY += 12;
              }
              
              // Sexta linha - Método de pagamento (se pago)
              if (exit.payment_status === 'PAID' && exit.payment_method) {
                doc.text(`Metodo de Pagamento: ${exit.payment_method}`, 60, infoY);
                if (exit.payment_details) {
                  doc.text(` | Detalhes: ${exit.payment_details}`, 300, infoY);
                }
              }
              
              doc.y = exitY + exitHeight + 10;
              doc.fillColor('#000000');
            });
          }
          doc.moveDown(2);
          
          // ========== RESUMO EXECUTIVO DETALHADO ==========
          checkPageBreak(150);
          const summaryY = doc.y;
          doc.fontSize(18).font('Helvetica-Bold').fillColor(colors.primary)
            .text('7. RESUMO EXECUTIVO DETALHADO', 50, summaryY);
          drawLine(summaryY + 25, colors.primary, 320);
          doc.y = summaryY + 35;
          
          const summaryBoxY = doc.y;
          const summaryBoxHeight = 140;
          drawBox(50, summaryBoxY, 495, summaryBoxHeight, '#f0f9ff');
          
          doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.primary)
            .text('Como cada valor foi calculado:', 60, summaryBoxY + 10);
          
          doc.fontSize(9).font('Helvetica').fillColor(colors.dark);
          let sumY = summaryBoxY + 30;
          
          // Entradas
          doc.font('Helvetica-Bold').text('ENTRADAS:', 70, sumY);
          sumY += 12;
          doc.font('Helvetica').text(`  • Total Registrado: ${entries.length} entrada(s) somando ${formatCurrency(totalEntries)}`, 80, sumY);
          sumY += 10;
          doc.fillColor(colors.success)
            .text(`  • Total Recebido: ${entries.filter(e => e.received).length} entrada(s) recebida(s) = ${formatCurrency(totalEntriesReceived)}`, 80, sumY);
          sumY += 10;
          if (totalEntriesPending > 0) {
            doc.fillColor(colors.warning)
              .text(`  • Pendentes: ${entries.filter(e => !e.received && e.review_status === 'APPROVED').length} entrada(s) = ${formatCurrency(totalEntriesPending)}`, 80, sumY);
            sumY += 10;
          }
          sumY += 5;
          
          // Saídas
          doc.font('Helvetica-Bold').fillColor(colors.dark).text('SAÍDAS:', 70, sumY);
          sumY += 12;
          doc.font('Helvetica').text(`  • Total Registrado: ${exits.length} saída(s) somando ${formatCurrency(totalExits)}`, 80, sumY);
          sumY += 10;
          doc.fillColor(colors.danger)
            .text(`  • Total Pago: ${exits.filter(e => e.payment_status === 'PAID').length} saída(s) paga(s) = ${formatCurrency(totalExitsPaid)}`, 80, sumY);
          sumY += 10;
          if (totalExitsApproved > 0) {
            doc.fillColor(colors.secondary)
              .text(`  • Aprovadas (não pagas): ${exits.filter(e => e.payment_status === 'APPROVED').length} saída(s) = ${formatCurrency(totalExitsApproved)}`, 80, sumY);
            sumY += 10;
          }
          if (totalExitsPending > 0) {
            doc.fillColor(colors.warning)
              .text(`  • Pendentes: ${exits.filter(e => e.payment_status === 'PENDING').length} saída(s) = ${formatCurrency(totalExitsPending)}`, 80, sumY);
          }
          
          doc.y = summaryBoxY + summaryBoxHeight + 20;
          doc.fillColor('#000000');
          
          // ========== ANÁLISE DE TENDÊNCIAS ==========
          checkPageBreak(100);
          const trendsY = doc.y;
          doc.fontSize(18).font('Helvetica-Bold').fillColor(colors.primary)
            .text('8. ANÁLISE DE TENDÊNCIAS', 50, trendsY);
          drawLine(trendsY + 25, colors.primary, 250);
          doc.y = trendsY + 35;
          
          const trendsBoxY = doc.y;
          const trendsBoxHeight = 80;
          drawBox(50, trendsBoxY, 495, trendsBoxHeight, '#fef3c7');
          
          doc.fontSize(10).font('Helvetica').fillColor(colors.dark);
          let trendY = trendsBoxY + 15;
          
          // Comparação com mês anterior
          doc.font('Helvetica-Bold').text('Comparação com Mês Anterior:', 60, trendY);
          trendY += 12;
          
          const entriesTrend = entriesVariation >= 0 ? 'AUMENTO' : 'REDUCAO';
          const entriesTrendColor = entriesVariation >= 0 ? colors.success : colors.danger;
          doc.fillColor(entriesTrendColor)
            .text(`  Entradas: ${entriesTrend} de ${Math.abs(entriesVariation).toFixed(2)}% (${formatCurrency(prevEntries)} -> ${formatCurrency(totalEntriesReceived)})`, 70, trendY);
          trendY += 12;
          
          const exitsTrend = exitsVariation >= 0 ? 'AUMENTO' : 'REDUCAO';
          const exitsTrendColor = exitsVariation >= 0 ? colors.danger : colors.success;
          doc.fillColor(exitsTrendColor)
            .text(`  Saidas: ${exitsTrend} de ${Math.abs(exitsVariation).toFixed(2)}% (${formatCurrency(prevExits)} -> ${formatCurrency(totalExitsPaid)})`, 70, trendY);
          trendY += 12;
          
          // Análise do saldo
          const balanceChange = balance - (prevEntries - prevExits);
          if (balanceChange !== 0) {
            const balanceTrend = balanceChange >= 0 ? 'MELHOROU' : 'PIOROU';
            const balanceTrendColor = balanceChange >= 0 ? colors.success : colors.danger;
            doc.fillColor(balanceTrendColor)
              .text(`  Saldo: ${balanceTrend} em ${formatCurrency(Math.abs(balanceChange))}`, 70, trendY);
          }
          
          doc.y = trendsBoxY + trendsBoxHeight + 20;
          doc.fillColor('#000000');
          
          // ========== FUNDO DE RESERVA ==========
          if (reserveFund || reserveFundAmountThisMonth > 0) {
            checkPageBreak(180);
            const reserveFundY = doc.y;
            let reserveFundHeight = 80; // Altura base
            
            // Ajusta altura baseado no conteúdo
            if (reserveFundAmountThisMonth > 0) reserveFundHeight += 20;
            if (reserveFund) reserveFundHeight += 120; // Aumentado para acomodar gráfico
            
            drawBox(50, reserveFundY, 495, reserveFundHeight, '#e0f2fe');
            
            doc.fontSize(18).font('Helvetica-Bold').fillColor(colors.primary)
              .text('9. FUNDO DE RESERVA', 50, reserveFundY + 10);
            drawLine(reserveFundY + 25, colors.primary, 200);
            doc.y = reserveFundY + 35;
            
            doc.fontSize(10).font('Helvetica').fillColor(colors.dark);
            let reserveY = reserveFundY + 35;
            
            // Valor adicionado no mês
            if (reserveFundAmountThisMonth > 0) {
              doc.font('Helvetica-Bold').text('Valor Adicionado ao Fundo de Reserva neste Mês:', 60, reserveY);
              reserveY += 12;
              doc.font('Helvetica').fillColor(colors.success)
                .text(`  R$ ${formatCurrency(reserveFundAmountThisMonth)}`, 70, reserveY);
              reserveY += 20;
            }
            
            // Informações do fundo de reserva
            if (reserveFund) {
              const progressPercent = reserveFund.target_balance > 0 
                ? Math.min(((reserveFund.current_balance || 0) / reserveFund.target_balance) * 100, 100)
                : 0;
              const progressColor = progressPercent >= 100 ? colors.success : progressPercent >= 50 ? colors.warning : colors.danger;
              
              // Layout em duas colunas lado a lado (melhor uso do espaço)
              const leftColumnX = 60;
              const rightColumnX = 320;
              const chartOuterRadius = 55;
              const chartInnerRadius = 35;
              
              // Salva posição inicial
              const infoStartY = reserveY;
              
              // Coluna esquerda: informações
              doc.font('Helvetica-Bold').fillColor(colors.dark).text('Situação Atual do Fundo de Reserva:', leftColumnX, reserveY);
              reserveY += 15;
              
              // Box para informações
              const infoBoxHeight = 80;
              drawBox(leftColumnX, reserveY, 240, infoBoxHeight, '#ffffff');
              
              doc.font('Helvetica').fillColor(colors.dark)
                .text(`Saldo Atual:`, leftColumnX + 10, reserveY + 10);
              doc.font('Helvetica-Bold').fillColor(colors.primary)
                .text(formatCurrency(reserveFund.current_balance || 0), leftColumnX + 10, reserveY + 25);
              
              doc.font('Helvetica').fillColor(colors.dark)
                .text(`Meta:`, leftColumnX + 10, reserveY + 45);
              doc.font('Helvetica-Bold').fillColor(colors.dark)
                .text(formatCurrency(reserveFund.target_balance || 0), leftColumnX + 10, reserveY + 60);
              
              // Coluna direita: gráfico
              const chartCenterX = rightColumnX + 75;
              const chartCenterY = infoStartY + 70;
              
              // Título do gráfico
              doc.font('Helvetica-Bold').fillColor(colors.dark)
                .text('Progresso em Direção à Meta', rightColumnX, infoStartY, { width: 150, align: 'center' });
              
              // Desenha o gráfico de rosca
              try {
                drawDoughnutChart(chartCenterX, chartCenterY, chartOuterRadius, chartInnerRadius, progressPercent, {
                  success: progressColor
                });
                
                // Texto central no gráfico com fundo branco
                doc.circle(chartCenterX, chartCenterY, 25)
                  .fillColor('#ffffff')
                  .fill();
                
                doc.fontSize(18).font('Helvetica-Bold').fillColor(progressColor)
                  .text(`${progressPercent.toFixed(1)}%`, chartCenterX, chartCenterY - 8, { width: 100, align: 'center' });
                doc.fontSize(9).font('Helvetica').fillColor('#666666')
                  .text('da meta', chartCenterX, chartCenterY + 10, { width: 100, align: 'center' });
              } catch (chartError) {
                console.error('Erro ao desenhar gráfico:', chartError);
              }
              
              // Atualiza reserveY para a maior posição (informações ou gráfico)
              reserveY = Math.max(reserveY + infoBoxHeight, chartCenterY + chartOuterRadius) + 20;
            } else if (reserveFundAmountThisMonth > 0) {
              doc.font('Helvetica').fillColor(colors.warning)
                .text('  Nota: Fundo de reserva ainda não foi configurado. O valor foi registrado no fechamento.', 70, reserveY, { width: 455 });
              reserveY += 30;
            }
            
            // Garante que doc.y está atualizado corretamente
            doc.y = Math.max(reserveY, reserveFundY + reserveFundHeight + 15);
            doc.fillColor('#000000');
          }
          
          // ========== OBSERVAÇÕES FINAIS ==========
          checkPageBreak(180);
          const notesY = doc.y;
          let notesHeight = 160; // Altura dinâmica
          
          // Calcula altura necessária
          let estimatedHeight = 50; // Título e espaçamento
          estimatedHeight += 40; // Informações gerais
          if (totalExitsApproved > 0 || totalEntriesPending > 0 || totalExitsPending > 0) {
            estimatedHeight += 30;
            if (totalExitsApproved > 0) estimatedHeight += 12;
            if (totalEntriesPending > 0) estimatedHeight += 12;
            if (totalExitsPending > 0) estimatedHeight += 12;
          }
          estimatedHeight += 25; // Título recomendações
          if (balance < 0) estimatedHeight += 12;
          if (totalExitsApproved > balance && balance > 0) estimatedHeight += 12;
          if (entriesVariation < -10) estimatedHeight += 12;
          if (exitsVariation > 20) estimatedHeight += 12;
          
          notesHeight = Math.max(notesHeight, estimatedHeight);
          
          // Box com fundo mais claro para melhor contraste
          drawBox(50, notesY, 495, notesHeight, '#fff9e6');
          
          doc.fontSize(18).font('Helvetica-Bold').fillColor('#1f2937')
            .text('10. OBSERVAÇÕES E RECOMENDAÇÕES', 60, notesY + 12);
          drawLine(notesY + 30, colors.primary, 200);
          
          doc.fontSize(11).font('Helvetica').fillColor('#000000'); // Preto puro para máximo contraste
          let noteY = notesY + 40;
          
          // Informações Gerais
          doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000') // Preto puro
            .text('INFORMAÇÕES GERAIS:', 60, noteY);
          noteY += 16;
          doc.fontSize(11).font('Helvetica').fillColor('#000000') // Preto puro
            .text('  • Este relatório foi gerado automaticamente pelo sistema de gestão condominial.', 70, noteY);
          noteY += 13;
          doc.fillColor('#000000').text('  • Todos os valores estão em Reais (R$).', 70, noteY);
          noteY += 13;
          doc.fillColor('#000000').text('  • O saldo do mês considera apenas entradas recebidas e saídas pagas.', 70, noteY);
          noteY += 18;
          
          // Alertas importantes
          if (totalExitsApproved > 0 || totalEntriesPending > 0 || totalExitsPending > 0) {
            doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000') // Preto puro
              .text('ATENÇÕES IMPORTANTES:', 60, noteY);
            noteY += 16;
            
            if (totalExitsApproved > 0) {
              doc.fontSize(11).font('Helvetica').fillColor('#000000') // Preto puro
                .text(`  • Existem ${exits.filter(e => e.payment_status === 'APPROVED').length} saída(s) aprovada(s) no valor de ${formatCurrency(totalExitsApproved)} que ainda não foram pagas.`, 70, noteY, { width: 455 });
              noteY += 13;
            }
            if (totalEntriesPending > 0) {
              doc.fillColor('#000000')
                .text(`  • Existem ${entries.filter(e => !e.received && e.review_status === 'APPROVED').length} entrada(s) pendente(s) no valor de ${formatCurrency(totalEntriesPending)} que ainda não foram recebidas.`, 70, noteY, { width: 455 });
              noteY += 13;
            }
            if (totalExitsPending > 0) {
              doc.fillColor('#000000')
                .text(`  • Existem ${exits.filter(e => e.payment_status === 'PENDING').length} saída(s) pendente(s) no valor de ${formatCurrency(totalExitsPending)} aguardando aprovação.`, 70, noteY, { width: 455 });
              noteY += 13;
            }
            noteY += 8;
          }
          
          // Recomendações
          doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000') // Preto puro
            .text('RECOMENDAÇÕES:', 60, noteY);
          noteY += 16;
          
          if (balance < 0) {
            doc.fontSize(11).font('Helvetica').fillColor('#000000')
              .text('  • O saldo está negativo. Considere revisar as despesas e aumentar as receitas.', 70, noteY, { width: 455 });
            noteY += 13;
          }
          
          if (totalExitsApproved > balance && balance > 0) {
            doc.fillColor('#000000')
              .text('  • As saídas aprovadas superam o saldo atual. Planeje o fluxo de caixa com cuidado.', 70, noteY, { width: 455 });
            noteY += 13;
          }
          
          if (entriesVariation < -10) {
            doc.fillColor('#000000')
              .text('  • As entradas diminuíram significativamente em relação ao mês anterior. Verifique a cobrança de taxas.', 70, noteY, { width: 455 });
            noteY += 13;
          }
          
          if (exitsVariation > 20) {
            doc.fillColor('#000000')
              .text('  • As saídas aumentaram significativamente. Revise os gastos para identificar possíveis otimizações.', 70, noteY, { width: 455 });
            noteY += 13;
          }
          
          doc.y = notesY + notesHeight + 15;
          doc.fillColor('#000000');
          
          // Tratamento de erros do documento
          doc.on('error', (error) => {
            console.error('Erro ao gerar PDF:', error);
            stream.destroy();
            reject(error);
          });
          
          // Contador de páginas
          let pageCounter = 1;
          
          // Função para adicionar rodapé
          const addFooter = (pageNum) => {
            const footerY = doc.page.height - 35;
            
            // Linha do rodapé
            drawLine(footerY, colors.border, 495);
            
            // Texto do rodapé (sem total de páginas por enquanto)
            doc.fontSize(8).font('Helvetica').fillColor(colors.dark);
            doc.text(
              `${condominiumName} | Relatório Financeiro Mensal ${String(month).padStart(2, '0')}/${year}`,
              50,
              footerY + 5,
              { align: 'center', width: 495 }
            );
          };
          
          // Adicionar rodapé na primeira página (será adicionado após logo e assinaturas)
          
          // ========== KPIs E INDICADORES FINANCEIROS ==========
          checkPageBreak(250);
          const kpisY = doc.y;
          const kpisHeight = 240; // Aumentado para mais KPIs
          drawBox(50, kpisY, 495, kpisHeight, '#f8fafc');
          
          doc.fontSize(20).font('Helvetica-Bold').fillColor(colors.primary)
            .text('11. INDICADORES FINANCEIROS (KPIs)', 50, kpisY + 10);
          drawLine(kpisY + 28, colors.primary, 380);
          
          doc.fontSize(10).font('Helvetica').fillColor(colors.dark);
          let kpiY = kpisY + 45;
          
          // Calcula KPIs adicionais
          const totalEntriesCount = entries.length;
          const totalExitsCount = exits.length;
          const avgEntryValue = totalEntriesCount > 0 ? totalEntries / totalEntriesCount : 0;
          const avgExitValue = totalExitsCount > 0 ? totalExits / totalExitsCount : 0;
          const entryExitRatio = totalExits > 0 ? (totalEntries / totalExits) * 100 : 0;
          const reserveFundProgress = reserveFund && reserveFund.target_balance > 0 
            ? ((reserveFund.current_balance || 0) / reserveFund.target_balance) * 100 
            : 0;
          const monthlyBalance = totalEntriesReceived - totalExitsPaid;
          const pendingEntriesValue = totalEntriesPending;
          const pendingExitsValue = totalExitsPending;
          const efficiencyRatio = totalEntries > 0 ? ((totalEntriesReceived / totalEntries) * 100) : 0;
          const paymentEfficiency = totalExits > 0 ? ((totalExitsPaid / totalExits) * 100) : 0;
          
          // Layout em 3x3 grid de KPIs (9 KPIs)
          const kpiBoxWidth = 150;
          const kpiBoxHeight = 55;
          const kpiSpacingX = 15;
          const kpiSpacingY = 12;
          const kpiStartX = 55;
          
          // Linha 1: KPIs principais financeiros
          let kpiX = kpiStartX;
          
          // KPI 1: Saldo do Mês
          drawBox(kpiX, kpiY, kpiBoxWidth, kpiBoxHeight, monthlyBalance >= 0 ? '#d1fae5' : '#fee2e2');
          doc.fontSize(8).font('Helvetica').fillColor('#666666')
            .text('Saldo do Mês', kpiX + 8, kpiY + 5);
          doc.fontSize(15).font('Helvetica-Bold').fillColor(monthlyBalance >= 0 ? colors.success : colors.danger)
            .text(formatCurrency(monthlyBalance), kpiX + 8, kpiY + 22);
          
          kpiX += kpiBoxWidth + kpiSpacingX;
          
          // KPI 2: Taxa de Entrada vs Saída
          const ratioColor = entryExitRatio >= 100 ? colors.success : entryExitRatio >= 80 ? colors.warning : colors.danger;
          drawBox(kpiX, kpiY, kpiBoxWidth, kpiBoxHeight, '#fef3c7');
          doc.fontSize(8).font('Helvetica').fillColor('#666666')
            .text('Taxa Entrada/Saída', kpiX + 8, kpiY + 5);
          doc.fontSize(15).font('Helvetica-Bold').fillColor(ratioColor)
            .text(`${entryExitRatio.toFixed(1)}%`, kpiX + 8, kpiY + 22);
          
          kpiX += kpiBoxWidth + kpiSpacingX;
          
          // KPI 3: Total de Transações
          drawBox(kpiX, kpiY, kpiBoxWidth, kpiBoxHeight, '#e0e7ff');
          doc.fontSize(8).font('Helvetica').fillColor('#666666')
            .text('Total Transações', kpiX + 8, kpiY + 5);
          doc.fontSize(15).font('Helvetica-Bold').fillColor(colors.primary)
            .text(`${totalEntriesCount + totalExitsCount}`, kpiX + 8, kpiY + 22);
          
          kpiY += kpiBoxHeight + kpiSpacingY;
          kpiX = kpiStartX;
          
          // Linha 2: KPIs de valores médios e eficiência
          // KPI 4: Valor Médio de Entradas
          drawBox(kpiX, kpiY, kpiBoxWidth, kpiBoxHeight, '#dbeafe');
          doc.fontSize(8).font('Helvetica').fillColor('#666666')
            .text('Média Entradas', kpiX + 8, kpiY + 5);
          doc.fontSize(15).font('Helvetica-Bold').fillColor(colors.primary)
            .text(formatCurrency(avgEntryValue), kpiX + 8, kpiY + 22);
          
          kpiX += kpiBoxWidth + kpiSpacingX;
          
          // KPI 5: Valor Médio de Saídas
          drawBox(kpiX, kpiY, kpiBoxWidth, kpiBoxHeight, '#fce7f3');
          doc.fontSize(8).font('Helvetica').fillColor('#666666')
            .text('Média Saídas', kpiX + 8, kpiY + 5);
          doc.fontSize(15).font('Helvetica-Bold').fillColor(colors.danger)
            .text(formatCurrency(avgExitValue), kpiX + 8, kpiY + 22);
          
          kpiX += kpiBoxWidth + kpiSpacingX;
          
          // KPI 6: Eficiência de Recebimento
          const efficiencyColor = efficiencyRatio >= 90 ? colors.success : efficiencyRatio >= 70 ? colors.warning : colors.danger;
          drawBox(kpiX, kpiY, kpiBoxWidth, kpiBoxHeight, '#ecfdf5');
          doc.fontSize(8).font('Helvetica').fillColor('#666666')
            .text('Efic. Recebimento', kpiX + 8, kpiY + 5);
          doc.fontSize(15).font('Helvetica-Bold').fillColor(efficiencyColor)
            .text(`${efficiencyRatio.toFixed(1)}%`, kpiX + 8, kpiY + 22);
          
          kpiY += kpiBoxHeight + kpiSpacingY;
          kpiX = kpiStartX;
          
          // Linha 3: KPIs de pendências e fundo de reserva
          // KPI 7: Pendências de Entrada
          const pendingEntriesColor = pendingEntriesValue > 0 ? colors.warning : colors.success;
          drawBox(kpiX, kpiY, kpiBoxWidth, kpiBoxHeight, '#fef3c7');
          doc.fontSize(8).font('Helvetica').fillColor('#666666')
            .text('Entradas Pendentes', kpiX + 8, kpiY + 5);
          doc.fontSize(15).font('Helvetica-Bold').fillColor(pendingEntriesColor)
            .text(formatCurrency(pendingEntriesValue), kpiX + 8, kpiY + 22);
          
          kpiX += kpiBoxWidth + kpiSpacingX;
          
          // KPI 8: Pendências de Saída
          const pendingExitsColor = pendingExitsValue > 0 ? colors.warning : colors.success;
          drawBox(kpiX, kpiY, kpiBoxWidth, kpiBoxHeight, '#fee2e2');
          doc.fontSize(8).font('Helvetica').fillColor('#666666')
            .text('Saídas Pendentes', kpiX + 8, kpiY + 5);
          doc.fontSize(15).font('Helvetica-Bold').fillColor(pendingExitsColor)
            .text(formatCurrency(pendingExitsValue), kpiX + 8, kpiY + 22);
          
          kpiX += kpiBoxWidth + kpiSpacingX;
          
          // KPI 9: Progresso Fundo de Reserva
          if (reserveFund && reserveFund.target_balance > 0) {
            const fundColor = reserveFundProgress >= 100 ? colors.success : reserveFundProgress >= 50 ? colors.warning : colors.danger;
            drawBox(kpiX, kpiY, kpiBoxWidth, kpiBoxHeight, '#e0f2fe');
            doc.fontSize(8).font('Helvetica').fillColor('#666666')
              .text('Fundo Reserva', kpiX + 8, kpiY + 5);
            doc.fontSize(15).font('Helvetica-Bold').fillColor(fundColor)
              .text(`${reserveFundProgress.toFixed(1)}%`, kpiX + 8, kpiY + 22);
          } else {
            drawBox(kpiX, kpiY, kpiBoxWidth, kpiBoxHeight, '#f3f4f6');
            doc.fontSize(8).font('Helvetica').fillColor('#666666')
              .text('Fundo Reserva', kpiX + 8, kpiY + 5);
            doc.fontSize(15).font('Helvetica-Bold').fillColor('#999999')
              .text('N/A', kpiX + 8, kpiY + 22);
          }
          
          doc.y = kpisY + kpisHeight + 15;
          doc.fillColor('#000000');
          
          // ========== ASSINATURAS ==========
          checkPageBreak(100);
          const signatureY = doc.y;
          const signatureHeight = 70;
          
          // Linha separadora
          drawLine(signatureY - 10, colors.border, 495);
          
          // Espaço para assinaturas
          const signatureBoxY = signatureY + 15;
          const signatureBoxWidth = 150;
          const signatureBoxHeight = 50;
          const signatureSpacing = 20;
          
          // Assinatura 1: Síndico
          const sig1X = 60;
          drawBox(sig1X, signatureBoxY, signatureBoxWidth, signatureBoxHeight, '#ffffff');
          doc.fontSize(9).font('Helvetica').fillColor('#000000')
            .text('_________________________________', sig1X + 10, signatureBoxY + 10, { width: signatureBoxWidth - 20, align: 'center' });
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
            .text('SÍNDICO', sig1X + 10, signatureBoxY + 30, { width: signatureBoxWidth - 20, align: 'center' });
          
          // Assinatura 2: Administrador
          const sig2X = 60 + signatureBoxWidth + signatureSpacing;
          drawBox(sig2X, signatureBoxY, signatureBoxWidth, signatureBoxHeight, '#ffffff');
          doc.fontSize(9).font('Helvetica').fillColor('#000000')
            .text('_________________________________', sig2X + 10, signatureBoxY + 10, { width: signatureBoxWidth - 20, align: 'center' });
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
            .text('ADMINISTRADOR', sig2X + 10, signatureBoxY + 30, { width: signatureBoxWidth - 20, align: 'center' });
          
          // Assinatura 3: Financeiro
          const sig3X = 60 + (signatureBoxWidth + signatureSpacing) * 2;
          drawBox(sig3X, signatureBoxY, signatureBoxWidth, signatureBoxHeight, '#ffffff');
          doc.fontSize(9).font('Helvetica').fillColor('#000000')
            .text('_________________________________', sig3X + 10, signatureBoxY + 10, { width: signatureBoxWidth - 20, align: 'center' });
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
            .text('RESPONSÁVEL FINANCEIRO', sig3X + 10, signatureBoxY + 30, { width: signatureBoxWidth - 20, align: 'center' });
          
          doc.y = signatureY + signatureHeight + 15;
          doc.fillColor('#000000');
          
          // Adicionar rodapé na primeira página
          addFooter(1);
          
          // Adicionar rodapé em cada nova página
          doc.on('pageAdded', () => {
            pageCounter++;
            addFooter(pageCounter);
          });
          
          // Finalizar documento
          doc.end();
          
          stream.on('finish', async () => {
            // Verificar se o arquivo foi criado e tem conteúdo
            try {
              const stats = fs.statSync(filePath);
              if (stats.size === 0) {
                console.error('PDF gerado está vazio!');
                reject(new Error('PDF gerado está vazio'));
                return;
              }
              
              console.log(`PDF gerado com sucesso: ${fileName} (${stats.size} bytes)`);
              
              // Registrar log
              try {
                await logAction({
                  userId: userId,
                  condominiumId: condominiumId,
                  action: 'GENERATE_REPORT',
                  module: 'FINANCIAL',
                  entityType: 'monthly_report',
                  entityId: null,
                  beforeData: null,
                  afterData: { month, year, filePath, fileName, size: stats.size },
                  ipAddress: ipAddress,
                  userAgent: userAgent,
                });
              } catch (logError) {
                console.error('Erro ao registrar log:', logError);
              }
              
              resolve({ filePath, fileName: finalFileName, url: `/uploads/reports/${finalFileName}` });
            } catch (fileError) {
              console.error('Erro ao verificar arquivo gerado:', fileError);
              reject(new Error('Erro ao verificar arquivo gerado: ' + fileError.message));
            }
          });
          
          stream.on('error', (error) => {
            console.error('Erro no stream ao gerar PDF:', error);
            reject(error);
          });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error('Erro ao gerar relatório financeiro mensal:', error);
      throw error;
    }
  },
};

module.exports = reportService;
