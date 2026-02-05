/**
 * Helper único para servir arquivo de relatório (visualizar ou download).
 * Centraliza: normalização do nome, path traversal, tipo PDF, tamanho e envio.
 * Uso: await serveReportFile(req, res, 'inline') ou serveReportFile(req, res, 'attachment').
 * @param {object} req - req.query.file = nome do arquivo
 * @param {object} res - Express res
 * @param {'inline'|'attachment'} disposition - 'inline' = abrir no navegador, 'attachment' = download
 * @returns {Promise<void>} - resolve após enviar ou após erro (res já usada)
 */
const path = require('path');
const fs = require('fs');

const REPORTS_DIR = path.join(__dirname, '../../uploads/reports');

async function serveReportFile(req, res, disposition = 'inline') {
  const fileName = req.query.file;
  if (!fileName || typeof fileName !== 'string') {
    res.status(400).send('Nome do arquivo não fornecido');
    return;
  }

  const normalizedFileName = path.basename(fileName);
  const filePath = path.join(REPORTS_DIR, normalizedFileName);

  if (!fs.existsSync(filePath)) {
    res.status(404).send('Relatório não encontrado');
    return;
  }

  if (!normalizedFileName.endsWith('.pdf')) {
    res.status(400).send('Apenas arquivos PDF são permitidos');
    return;
  }

  const resolvedPath = path.resolve(filePath);
  const resolvedDir = path.resolve(REPORTS_DIR);
  if (!resolvedPath.startsWith(resolvedDir)) {
    res.status(403).send('Acesso negado');
    return;
  }

  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    res.status(500).send('Arquivo do relatório está vazio ou corrompido');
    return;
  }

  const contentDisposition = disposition === 'attachment'
    ? `attachment; filename="${encodeURIComponent(normalizedFileName)}"`
    : `inline; filename="${encodeURIComponent(normalizedFileName)}"`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', contentDisposition);
  res.setHeader('Content-Length', stats.size);

  res.sendFile(resolvedPath, (err) => {
    if (err && !res.headersSent) {
      console.error('Erro ao enviar relatório:', err);
      res.status(500).send('Erro ao enviar relatório');
    }
  });
}

module.exports = { serveReportFile };
