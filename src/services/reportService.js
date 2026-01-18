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
          
          return {
            name: file,
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            type: file.endsWith('.pdf') ? 'PDF' : 'Excel',
            url: `/uploads/reports/${file}`
          };
        })
        .sort((a, b) => b.modifiedAt - a.modifiedAt); // Mais recentes primeiro
      
      return reportFiles;
    } catch (error) {
      console.error('Erro ao listar relatórios gerados:', error);
      throw error;
    }
  },

  // Gerar relatório financeiro mensal
  generateMonthlyFinancialReport: async (condominiumId, month, year, userId, ipAddress, userAgent) => {
    try {
      const { query } = require('../config/database');
      const { logAction } = require('../utils/logger');
      
      // Buscar nome do condomínio
      const condominiumResult = await query(
        `SELECT name FROM condominiums WHERE id = $1`,
        [condominiumId]
      );
      const condominiumName = condominiumResult.rows.length > 0 ? condominiumResult.rows[0].name : 'Condomínio';
      
      // Buscar entradas do mês
      const entriesResult = await query(
        `SELECT * FROM financial_entries 
         WHERE condominium_id = $1 
         AND EXTRACT(MONTH FROM entry_date) = $2 
         AND EXTRACT(YEAR FROM entry_date) = $3
         ORDER BY entry_date ASC`,
        [condominiumId, month, year]
      );
      const entries = entriesResult.rows;
      
      // Buscar saídas do mês
      const exitsResult = await query(
        `SELECT * FROM financial_exits 
         WHERE condominium_id = $1 
         AND EXTRACT(MONTH FROM exit_date) = $2 
         AND EXTRACT(YEAR FROM exit_date) = $3
         ORDER BY exit_date ASC`,
        [condominiumId, month, year]
      );
      const exits = exitsResult.rows;
      
      // Calcular totais
      const totalEntries = entries.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const totalEntriesReceived = entries
        .filter(e => e.received)
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const totalExits = exits.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const totalExitsPaid = exits
        .filter(e => e.payment_status === 'PAID')
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      
      // Gerar PDF
      return new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({ margin: 50, size: 'A4' });
          const fileName = `relatorio_mensal_${year}_${month}_${Date.now()}.pdf`;
          const reportsDir = path.join(__dirname, '../../uploads/reports');
          
          // Criar diretório se não existir
          if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
          }
          
          const filePath = path.join(reportsDir, fileName);
          const stream = fs.createWriteStream(filePath);
          doc.pipe(stream);
          
          // Cabeçalho
          doc.fontSize(20).font('Helvetica-Bold').text('Relatório Financeiro Mensal', { align: 'center' });
          doc.fontSize(12).font('Helvetica').text(condominiumName, { align: 'center' });
          doc.fontSize(10).text(`${month}/${year}`, { align: 'center' });
          doc.moveDown();
          
          // Data de geração
          doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'right' });
          doc.moveDown(2);
          
          // Resumo
          doc.fontSize(14).font('Helvetica-Bold').text('Resumo Financeiro', { underline: true });
          doc.moveDown();
          
          doc.fontSize(12).font('Helvetica');
          doc.text(`Total de Entradas: R$ ${totalEntries.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
          doc.text(`Entradas Recebidas: R$ ${totalEntriesReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
          doc.moveDown();
          doc.text(`Total de Saídas: R$ ${totalExits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
          doc.text(`Saídas Pagas: R$ ${totalExitsPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
          doc.moveDown();
          doc.font('Helvetica-Bold').fontSize(12);
          const balance = totalEntriesReceived - totalExitsPaid;
          doc.text(`Saldo do Mês: R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, {
            color: balance >= 0 ? '#008000' : '#FF0000'
          });
          doc.moveDown(2);
          
          // Entradas
          doc.fontSize(14).font('Helvetica-Bold').text('Entradas do Mês', { underline: true });
          doc.moveDown();
          
          if (entries.length === 0) {
            doc.fontSize(10).font('Helvetica').text('Nenhuma entrada registrada neste mês.');
          } else {
            entries.forEach((entry, index) => {
              if (doc.y > 700) {
                doc.addPage();
              }
              
              doc.fontSize(10).font('Helvetica-Bold');
              doc.text(`${index + 1}. ${entry.description || 'Sem descrição'}`);
              doc.font('Helvetica');
              doc.text(`   Data: ${new Date(entry.entry_date).toLocaleDateString('pt-BR')}`);
              doc.text(`   Valor: R$ ${parseFloat(entry.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
              doc.text(`   Status: ${entry.received ? 'Recebido' : 'Pendente'}`);
              doc.moveDown(0.5);
            });
          }
          
          doc.addPage();
          
          // Saídas
          doc.fontSize(14).font('Helvetica-Bold').text('Saídas do Mês', { underline: true });
          doc.moveDown();
          
          if (exits.length === 0) {
            doc.fontSize(10).font('Helvetica').text('Nenhuma saída registrada neste mês.');
          } else {
            exits.forEach((exit, index) => {
              if (doc.y > 700) {
                doc.addPage();
              }
              
              doc.fontSize(10).font('Helvetica-Bold');
              doc.text(`${index + 1}. ${exit.description || 'Sem descrição'}`);
              doc.font('Helvetica');
              doc.text(`   Data: ${new Date(exit.exit_date).toLocaleDateString('pt-BR')}`);
              doc.text(`   Valor: R$ ${parseFloat(exit.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
              doc.text(`   Status: ${exit.payment_status || 'Pendente'}`);
              doc.moveDown(0.5);
            });
          }
          
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
          
          stream.on('finish', async () => {
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
                afterData: { month, year, filePath, fileName },
                ipAddress: ipAddress,
                userAgent: userAgent,
              });
            } catch (logError) {
              console.error('Erro ao registrar log:', logError);
            }
            
            resolve({ filePath, fileName, url: `/uploads/reports/${fileName}` });
          });
          
          stream.on('error', (error) => {
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
