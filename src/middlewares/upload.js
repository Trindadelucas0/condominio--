// Middleware para upload de arquivos (PDFs de comprovantes)
// Usa multer para processar uploads de arquivos

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cria diretórios de uploads se não existirem
const receiptsDir = path.join(__dirname, '../../uploads/receipts');
const paymentsDir = path.join(__dirname, '../../uploads/payments');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}
if (!fs.existsSync(paymentsDir)) {
  fs.mkdirSync(paymentsDir, { recursive: true });
}

// Configuração do multer para armazenar PDFs de recebimento (entradas)
const receiptsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, receiptsDir);
  },
  filename: function (req, file, cb) {
    // Nome do arquivo: receipt_{entryId}_{timestamp}.pdf
    const entryId = req.params.id || 'unknown';
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = path.extname(originalName) || '.pdf';
    const filename = `receipt_${entryId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// Configuração do multer para armazenar PDFs de pagamento (saídas)
const paymentsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, paymentsDir);
  },
  filename: function (req, file, cb) {
    // Nome do arquivo: payment_{exitId}_{timestamp}.pdf
    const exitId = req.params.id || 'unknown';
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = path.extname(originalName) || '.pdf';
    const filename = `payment_${exitId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// Filtro para aceitar apenas PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos PDF são permitidos'), false);
  }
};

// Configuração do multer para recebimentos
const uploadReceipts = multer({
  storage: receiptsStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de 10MB
  }
});

// Configuração do multer para pagamentos
const uploadPayments = multer({
  storage: paymentsStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de 10MB
  }
});

// Middleware para upload de um único arquivo PDF de recebimento
const uploadReceipt = uploadReceipts.single('receiptPdf');

// Middleware para upload de um único arquivo PDF de pagamento
const uploadPayment = uploadPayments.single('paymentReceiptPdf');

// Configuração para upload de contratos/documentos (limite maior: 50MB)
const contractsDir = path.join(__dirname, '../../uploads/contracts');
if (!fs.existsSync(contractsDir)) {
  fs.mkdirSync(contractsDir, { recursive: true });
}

const contractsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, contractsDir);
  },
  filename: function (req, file, cb) {
    // Nome do arquivo: contract_{userId}_{timestamp}.pdf
    const userId = req.user ? req.user.id : 'unknown';
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = path.extname(originalName) || '.pdf';
    const filename = `contract_${userId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

const uploadContracts = multer({
  storage: contractsStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB para contratos grandes
  }
});

// Middleware para upload de múltiplos arquivos PDF de contratos
const uploadContract = uploadContracts.array('contractFiles', 10); // Máximo 10 arquivos por vez

module.exports = {
  uploadReceipt,
  uploadPayment,
  uploadContract,
  uploadsDir: receiptsDir
};
