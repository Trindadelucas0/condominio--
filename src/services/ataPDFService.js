// Service para geração de PDF da Ata de Assembleia
// Gera PDF em formato oficial para registro

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Função para gerar PDF da ata de assembleia
// Recebe: assembly, condominium, quorumData
// Retorna: buffer do PDF
const generateAtaPDF = async (assembly, condominium, quorumData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Cabeçalho
      doc.fontSize(16).font('Helvetica-Bold').text('ATA DE ASSEMBLEIA', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(condominium.name, { align: 'center' });
      doc.moveDown(1);

      // Informações da Assembleia
      doc.fontSize(12).font('Helvetica-Bold').text('DADOS DA ASSEMBLEIA', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');

      const assemblyDate = new Date(assembly.date);
      const dateStr = assemblyDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      doc.text(`Data: ${dateStr}`, { continued: false });
      if (assembly.time) {
        doc.text(`Horário: ${assembly.time}`, { continued: false });
      }
      doc.text(`Tipo: ${assembly.type === 'ORDINARIA' ? 'Ordinária' : assembly.type === 'EXTRAORDINARIA' ? 'Extraordinária' : 'Especial'}`, { continued: false });
      if (assembly.location) {
        doc.text(`Local: ${assembly.location}`, { continued: false });
      }
      doc.moveDown(1);

      // Quórum
      doc.fontSize(12).font('Helvetica-Bold').text('QUÓRUM', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total de apartamentos: ${quorumData.totalApartments}`, { continued: false });
      doc.text(`Presentes: ${quorumData.presentCount}`, { continued: false });
      doc.text(`Quórum necessário: ${quorumData.requiredQuorum}`, { continued: false });
      doc.text(`Quórum atingido: ${quorumData.quorumAchieved ? 'SIM' : 'NÃO'}`, { continued: false });
      doc.text(`Percentual de presença: ${quorumData.quorumPercent}%`, { continued: false });
      doc.moveDown(1);

      // Pauta
      if (assembly.agenda) {
        doc.fontSize(12).font('Helvetica-Bold').text('PAUTA', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(assembly.agenda, { align: 'justify' });
        doc.moveDown(1);
      }

      // Participantes
      if (assembly.participants && assembly.participants.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('PARTICIPANTES', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');

        assembly.participants.forEach((participant, index) => {
          const aptInfo = participant.apartment_number 
            ? `Apto ${participant.apartment_number}${participant.block ? ' - Bloco ' + participant.block : ''}`
            : '';
          const present = participant.present ? '✓ Presente' : 'Ausente';
          doc.text(`${index + 1}. ${participant.owner_name}${aptInfo ? ' - ' + aptInfo : ''} - ${present}`, { continued: false });
        });
        doc.moveDown(1);
      }

      // Decisões
      if (assembly.decisions && assembly.decisions.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('DECISÕES TOMADAS', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');

        assembly.decisions.forEach((decision) => {
          doc.font('Helvetica-Bold').text(`Decisão ${decision.decision_number}: ${decision.title}`, { continued: false });
          doc.font('Helvetica').text(decision.description, { align: 'justify' });
          doc.text(`Votos a favor: ${decision.votes_for} | Contra: ${decision.votes_against} | Abstenções: ${decision.votes_abstention}`, { continued: false });
          doc.text(`Resultado: ${decision.approved ? 'APROVADA' : 'REJEITADA'}`, { continued: false });
          doc.moveDown(0.5);
        });
        doc.moveDown(1);
      }

      // Rodapé
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica').text(
        `Ata gerada em ${new Date().toLocaleString('pt-BR')}`,
        { align: 'center' }
      );
      doc.moveDown(1);
      doc.text(
        'Esta ata foi gerada automaticamente pelo sistema de gestão condominial.',
        { align: 'center', fontSize: 8 }
      );

      // Finaliza PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateAtaPDF
};
