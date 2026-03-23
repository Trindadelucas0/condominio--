// Rotas do módulo FINANCEIRO
// Gerencia requisições do painel financeiro

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const financeiroController = require('../controllers/financeiroController');
const { ALL_CATEGORY_LABELS, DESPESA_CATEGORIES, DEFAULT_DESPESA_CATEGORY, normalizeDespesaCategoryForForm } = require('../constants/financialCategories');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadPayment, uploadReceipt, uploadBillReceipt, uploadExitPaymentAttachments } = require('../middlewares/upload');
const { validateNumericIdParam } = require('../middlewares/validateParams');
const { requireCondominium } = require('../middlewares/requireCondominium');

// Todas as rotas exigem autenticação
router.use(authenticate);

// Todas as rotas exigem perfil FINANCEIRO, SINDICO ou SUBSINDICO
// SINDICO tem acesso total ao condomínio, incluindo financeiro
router.use(authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'));

// Todas as rotas exigem condomínio (middleware único; evita repetir if condominiumId em cada handler)
router.use(requireCondominium);

// Valida req.params.id como inteiro positivo quando presente (evita NaN em rotas com :id)
router.use(validateNumericIdParam('id'));

// Dashboard
router.get('/dashboard', financeiroController.showDashboard);

// Como funciona o sistema (fluxo e conceitos do Financeiro)
router.get('/como-funciona', (req, res) => {
  res.render('financeiro/como-funciona', { title: 'Como funciona o sistema', user: req.user });
});

// Entradas
router.get('/entradas/nova', financeiroController.showCreateEntry);
// Comprovante: ver PDF ou resposta controlada quando não há comprovante
router.get('/entradas/:id/comprovante', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const entry = await financeiroService.getEntryById(req.params.id, req.user.condominiumId).catch(() => null);
    if (!entry) {
      return res.status(404).send('Entrada não encontrada');
    }
    const pathValue = entry.receipt_pdf_path && entry.receipt_pdf_path.trim();
    const isPlaceholder = !pathValue || pathValue === 'taxa_paga_sem_comprovante.pdf';
    if (isPlaceholder) {
      return res.status(200).json({ hasReceipt: false, entryId: entry.id });
    }
    const baseDir = path.join(__dirname, '../../');
    const absolutePath = path.resolve(baseDir, pathValue.replace(/^\//, ''));
    if (!fs.existsSync(absolutePath)) {
      return res.status(200).json({ hasReceipt: false, entryId: entry.id });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(absolutePath, (err) => {
      if (err && !res.headersSent) {
        console.error('Erro ao enviar comprovante:', err);
        res.status(500).json({ hasReceipt: false, entryId: entry.id });
      }
    });
  } catch (error) {
    console.error('Erro ao obter comprovante:', error);
    res.status(500).json({ hasReceipt: false });
  }
});
// Adicionar comprovante (entrada já recebida)
router.get('/entradas/:id/comprovante/adicionar', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const entry = await financeiroService.getEntryById(req.params.id, req.user.condominiumId).catch(() => null);
    if (!entry) {
      return res.status(404).send('Entrada não encontrada');
    }
    if (!entry.received) {
      return res.redirect('/financeiro/entradas?error=entry_not_received');
    }
    res.render('administrativo/financeiro/entradas/comprovante-adicionar', {
      title: 'Adicionar Comprovante',
      user: req.user,
      entry: entry,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de adicionar comprovante:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
});
router.post('/entradas/:id/comprovante/adicionar', (req, res, next) => {
  uploadReceipt(req, res, async (err) => {
    try {
      if (err) {
        const financeiroService = require('../services/financeiroService');
        const entry = await financeiroService.getEntryById(req.params.id, req.user.condominiumId).catch(() => null);
        return res.render('administrativo/financeiro/entradas/comprovante-adicionar', {
          title: 'Adicionar Comprovante',
          user: req.user,
          entry: entry || {},
          req: req,
          error: err.message || 'Erro ao fazer upload do arquivo',
          formData: req.body,
        });
      }
      const financeiroService = require('../services/financeiroService');
      if (!req.file) {
        const entryNoFile = await financeiroService.getEntryById(req.params.id, req.user.condominiumId);
        return res.render('administrativo/financeiro/entradas/comprovante-adicionar', {
          title: 'Adicionar Comprovante',
          user: req.user,
          entry: entryNoFile,
          req: req,
          error: 'Comprovante em PDF é obrigatório',
          formData: req.body,
        });
      }
      const receiptPdfPath = path.relative(path.join(__dirname, '../../'), req.file.path).replace(/\\/g, '/');
      await financeiroService.addReceiptToEntry(
        req.params.id,
        req.user.condominiumId,
        req.user.id,
        {
          receiptPdfPath,
          receiptDetails: req.body.receiptDetails,
          receiptNotes: req.body.receiptNotes,
          receiptMethod: req.body.receiptMethod,
        },
        req.ip || req.connection?.remoteAddress,
        req.get('user-agent')
      );
      res.redirect('/financeiro/entradas?success=comprovante_adicionado');
    } catch (error) {
      console.error('Erro ao adicionar comprovante:', error);
      const financeiroService = require('../services/financeiroService');
      const entry = await financeiroService.getEntryById(req.params.id, req.user.condominiumId).catch(() => null);
      res.render('administrativo/financeiro/entradas/comprovante-adicionar', {
        title: 'Adicionar Comprovante',
        user: req.user,
        entry: entry || {},
        req: req,
        error: error.message,
        formData: req.body,
      });
    }
  });
});
router.get('/entradas/:id/editar', financeiroController.showEditEntry);
// Rota de recebimento deve vir ANTES da rota genérica /:id para evitar conflito
router.get('/entradas/:id/receber', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const entry = await financeiroService.getEntryById(req.params.id, req.user.condominiumId);
    if (!entry) {
      return res.status(404).send('Entrada não encontrada');
    }
    if (entry.received) {
      return res.redirect('/financeiro/entradas?error=already_received');
    }
    res.render('administrativo/financeiro/entradas/receber', {
      title: 'Marcar Entrada como Recebida',
      user: req.user,
      entry: entry,
      categoryLabels: ALL_CATEGORY_LABELS,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de recebimento:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
});
router.post('/entradas/:id/receber', async (req, res) => {
  const { uploadReceipt } = require('../middlewares/upload');
  
  // Aplica middleware de upload
  uploadReceipt(req, res, async (err) => {
    try {
      if (err) {
        console.error('Erro no upload:', err);
        const financeiroService = require('../services/financeiroService');
        const entry = await financeiroService.getEntryById(req.params.id, req.user.condominiumId).catch(() => null);
        return res.render('administrativo/financeiro/entradas/receber', {
          title: 'Marcar Entrada como Recebida',
          user: req.user,
          entry: entry,
          categoryLabels: ALL_CATEGORY_LABELS,
          req: req,
          error: err.message || 'Erro ao fazer upload do arquivo',
          formData: req.body,
        });
      }

      const financeiroService = require('../services/financeiroService');
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      // Comprovante é opcional; pode ser adicionado depois em "Ver Comprovante" → Adicionar
      const receiptPdfPath = req.file
        ? path.relative(path.join(__dirname, '../../'), req.file.path).replace(/\\/g, '/')
        : null;

      await financeiroService.markEntryAsReceived(
        req.params.id,
        req.user.condominiumId,
        req.user.id,
        {
          receiptMethod: req.body.receiptMethod,
          receiptPdfPath: receiptPdfPath,
          receiptDetails: req.body.receiptDetails,
          receiptNotes: req.body.receiptNotes,
        },
        ipAddress,
        userAgent
      );

      res.redirect('/financeiro/entradas?success=received');
    } catch (error) {
      console.error('Erro ao marcar entrada como recebida:', error);
      const financeiroService = require('../services/financeiroService');
      const entry = await financeiroService.getEntryById(req.params.id, req.user.condominiumId).catch(() => null);
      res.render('administrativo/financeiro/entradas/receber', {
        title: 'Marcar Entrada como Recebida',
        user: req.user,
        entry: entry,
        categoryLabels: ALL_CATEGORY_LABELS,
        req: req,
        error: error.message,
        formData: req.body,
      });
    }
  });
});
// Rota de exclusão deve vir ANTES da rota genérica /:id para evitar conflito
router.post('/entradas/:id/excluir', financeiroController.deleteEntry);
router.post('/entradas/:id/restaurar', financeiroController.restoreEntry);
router.get('/entradas/:id/desfazer-recebimento', financeiroController.showUnmarkEntryReceived);
router.post('/entradas/:id/desfazer-recebimento', financeiroController.unmarkEntryReceived);
// Rota de atualização
router.post('/entradas/:id', financeiroController.updateEntry);
router.post('/entradas', financeiroController.createEntry);
router.get('/entradas-excluidas', financeiroController.listDeletedEntries);
router.get('/entradas', financeiroController.listEntries);

// Saídas
router.get('/saidas/nova', financeiroController.showCreateExit);
router.post('/saidas', (req, res, next) => {
  uploadExitPaymentAttachments(req, res, async (err) => {
    try {
      if (err) {
        const financeiroService = require('../services/financeiroService');
        const costCenters = await financeiroService.listCostCenters(req.user.condominiumId).catch(() => []);
        const bills = await financeiroService.listAccounts(req.user.condominiumId, { active: true }).catch(() => []);
        let errorMsg = err.message || 'Erro ao fazer upload do arquivo';
        if (err.code === 'LIMIT_FILE_SIZE') {
          errorMsg = 'O arquivo é muito grande. O limite permitido é 50MB por PDF.';
        }
        return res.render('administrativo/financeiro/saidas/form', {
          title: 'Nova Saída Financeira',
          user: req.user,
          saida: req.body,
          costCenters,
          bills: bills || [],
          despesaCategories: DESPESA_CATEGORIES,
          error: errorMsg,
        });
      }
      return financeiroController.createExit(req, res, next);
    } catch (error) {
      console.error('Erro no upload de anexos na criação da saída:', error);
      return res.redirect('/financeiro/saidas?error=' + encodeURIComponent(error.message));
    }
  });
});
// Rota de pagamento deve vir ANTES da rota genérica /:id para evitar conflito
router.get('/saidas/:id/pagar', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const exits = await financeiroService.listExits(req.user.condominiumId, { limit: 1000 });
    const exit = exits.find(e => e.id === parseInt(req.params.id));
    if (!exit) {
      return res.status(404).send('Saída não encontrada');
    }
    if (exit.payment_status !== 'APPROVED') {
      return res.redirect('/financeiro/saidas?error=not_approved');
    }
    if (exit.payment_status === 'PAID') {
      return res.redirect('/financeiro/saidas?error=already_paid');
    }
    res.render('administrativo/financeiro/saidas/pagar', {
      title: 'Marcar Saída como Paga',
      user: req.user,
      exit: exit,
      categoryLabels: ALL_CATEGORY_LABELS,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de pagamento:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
});
router.post('/saidas/:id/pagar', async (req, res) => {
  const extractExitAttachmentPaths = () => {
    const files = req.files || {};
    const comprovanteFile = (files.comprovantePagamento && files.comprovantePagamento[0])
      || (files.paymentReceiptPdf && files.paymentReceiptPdf[0])
      || null;
    const notaFiscalFile = (files.notaFiscal && files.notaFiscal[0]) || null;
    const basePath = path.join(__dirname, '../../');
    return {
      comprovantePath: comprovanteFile ? path.relative(basePath, comprovanteFile.path).replace(/\\/g, '/') : null,
      notaFiscalPath: notaFiscalFile ? path.relative(basePath, notaFiscalFile.path).replace(/\\/g, '/') : null,
      notaFiscalFileName: notaFiscalFile ? notaFiscalFile.originalname : null,
    };
  };
  
  // Aplica middleware de upload
  uploadExitPaymentAttachments(req, res, async (err) => {
    try {
      if (err) {
        console.error('Erro no upload:', err);
        const financeiroService = require('../services/financeiroService');
        const exits = await financeiroService.listExits(req.user.condominiumId, { limit: 1000 });
        const exit = exits.find(e => e.id === parseInt(req.params.id));
        let errorMsg = err.message || 'Erro ao fazer upload do arquivo';
        if (err.code === 'LIMIT_FILE_SIZE') {
          errorMsg = 'O arquivo é muito grande. O limite permitido é 50MB por PDF.';
        }
        return res.render('administrativo/financeiro/saidas/pagar', {
          title: 'Marcar Saída como Paga',
          user: req.user,
          exit: exit || null,
          categoryLabels: ALL_CATEGORY_LABELS,
          req: req,
          error: errorMsg,
          formData: req.body,
        });
      }

      const financeiroService = require('../services/financeiroService');
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');
      const attachments = extractExitAttachmentPaths();
      const exits = await financeiroService.listExits(req.user.condominiumId, { limit: 1000 });
      const exit = exits.find(e => e.id === parseInt(req.params.id));
      if (!exit) {
        return res.status(404).send('Saída não encontrada');
      }

      const removeCurrentComprovante = req.body.removeCurrentComprovante === 'true';
      const removeCurrentNotaFiscal = req.body.removeCurrentNotaFiscal === 'true';

      const currentComprovantePath = (exit.payment_receipt_pdf_path && String(exit.payment_receipt_pdf_path).trim()) || null;
      const currentNotaFiscalPath = (exit.invoice_path && String(exit.invoice_path).trim()) || null;
      const currentNotaFiscalFileName = (exit.invoice_file_name && String(exit.invoice_file_name).trim()) || null;

      const finalComprovantePath = attachments.comprovantePath || (removeCurrentComprovante ? null : currentComprovantePath);
      const finalNotaFiscalPath = attachments.notaFiscalPath || (removeCurrentNotaFiscal ? null : currentNotaFiscalPath);
      const finalNotaFiscalFileName = attachments.notaFiscalPath
        ? attachments.notaFiscalFileName
        : (removeCurrentNotaFiscal ? null : currentNotaFiscalFileName);

      if (!finalComprovantePath) {
        return res.render('administrativo/financeiro/saidas/pagar', {
          title: 'Marcar Saída como Paga',
          user: req.user,
          exit: exit,
          categoryLabels: ALL_CATEGORY_LABELS,
          req: req,
          error: 'Comprovante em PDF é obrigatório para concluir o pagamento.',
          formData: req.body,
        });
      }

      await financeiroService.markExitAsPaid(
        req.params.id,
        req.user.condominiumId,
        req.user.id,
        {
          paymentReceiptPdfPath: finalComprovantePath,
          invoicePath: finalNotaFiscalPath,
          invoiceFileName: finalNotaFiscalFileName,
          paymentDetails: req.body.paymentDetails,
          paymentMethod: req.body.paymentMethod,
          paymentNotes: req.body.paymentNotes,
        },
        ipAddress,
        userAgent
      );

      res.redirect('/financeiro/saidas?success=paid');
    } catch (error) {
      console.error('Erro ao marcar saída como paga:', error);
      const financeiroService = require('../services/financeiroService');
      const exits = await financeiroService.listExits(req.user.condominiumId, { limit: 1000 });
      const exit = exits.find(e => e.id === parseInt(req.params.id));
      res.render('administrativo/financeiro/saidas/pagar', {
        title: 'Marcar Saída como Paga',
        user: req.user,
        exit: exit || null,
        categoryLabels: ALL_CATEGORY_LABELS,
        req: req,
        error: error.message,
        formData: req.body,
      });
    }
  });
});
router.get('/saidas/:id/comprovante', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const exit = await financeiroService.getExitById(req.params.id, req.user.condominiumId).catch(() => null);
    if (!exit) return res.status(404).send('Saída não encontrada');
    const pathValue = exit.payment_receipt_pdf_path && exit.payment_receipt_pdf_path.trim();
    if (!pathValue) return res.status(404).send('Comprovante não cadastrado');
    const baseDir = path.join(__dirname, '../../');
    const absolutePath = path.resolve(baseDir, pathValue.replace(/^\//, ''));
    if (!absolutePath.startsWith(path.resolve(baseDir, 'uploads', 'payments'))) {
      return res.status(400).send('Caminho de arquivo inválido');
    }
    if (!fs.existsSync(absolutePath)) return res.status(404).send('Arquivo não encontrado');
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(absolutePath, (err) => {
      if (err && !res.headersSent) res.status(500).send('Erro ao enviar arquivo');
    });
  } catch (error) {
    console.error('Erro ao obter comprovante da saída:', error);
    res.status(500).send('Erro ao obter comprovante');
  }
});
router.get('/saidas/:id/nota-fiscal', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const exit = await financeiroService.getExitById(req.params.id, req.user.condominiumId).catch(() => null);
    if (!exit) return res.status(404).send('Saída não encontrada');
    const pathValue = exit.invoice_path && exit.invoice_path.trim();
    if (!pathValue) return res.status(404).send('Nota fiscal não cadastrada');
    const baseDir = path.join(__dirname, '../../');
    const absolutePath = path.resolve(baseDir, pathValue.replace(/^\//, ''));
    if (!absolutePath.startsWith(path.resolve(baseDir, 'uploads', 'payments'))) {
      return res.status(400).send('Caminho de arquivo inválido');
    }
    if (!fs.existsSync(absolutePath)) return res.status(404).send('Arquivo não encontrado');
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(absolutePath, (err) => {
      if (err && !res.headersSent) res.status(500).send('Erro ao enviar arquivo');
    });
  } catch (error) {
    console.error('Erro ao obter nota fiscal da saída:', error);
    res.status(500).send('Erro ao obter nota fiscal');
  }
});
router.get('/saidas/:id/editar', financeiroController.showEditExit);
router.post('/saidas/:id', (req, res, next) => {
  uploadExitPaymentAttachments(req, res, async (err) => {
    try {
      if (err) {
        const financeiroService = require('../services/financeiroService');
        const exit = await financeiroService.getExitById(req.params.id, req.user.condominiumId).catch(() => null);
        const costCenters = await financeiroService.listCostCenters(req.user.condominiumId).catch(() => []);
        const bills = await financeiroService.listAccounts(req.user.condominiumId, { active: true }).catch(() => []);
        let errorMsg = err.message || 'Erro ao fazer upload do arquivo';
        if (err.code === 'LIMIT_FILE_SIZE') {
          errorMsg = 'O arquivo é muito grande. O limite permitido é 50MB por PDF.';
        }
        return res.render('administrativo/financeiro/saidas/form', {
          title: 'Editar Saída Financeira',
          user: req.user,
          saida: {
            ...(exit || {}),
            id: parseInt(req.params.id, 10),
            description: req.body.description,
            amount: req.body.amount,
            exitDate: req.body.exitDate,
            costCenterId: req.body.costCenterId || null,
            category: req.body.category || DEFAULT_DESPESA_CATEGORY,
            categoryForSelect: normalizeDespesaCategoryForForm(req.body.category || DEFAULT_DESPESA_CATEGORY),
            billId: req.body.billId || null,
            approvalLimit: req.body.approvalLimit || null,
            paymentReceiptPdfPath: exit ? exit.payment_receipt_pdf_path : null,
            invoicePath: exit ? exit.invoice_path : null,
            invoiceFileName: exit ? exit.invoice_file_name : null,
          },
          costCenters,
          bills: bills || [],
          despesaCategories: DESPESA_CATEGORIES,
          error: errorMsg,
        });
      }
      return financeiroController.updateExitController(req, res, next);
    } catch (error) {
      console.error('Erro no upload de anexos da saída:', error);
      return res.redirect('/financeiro/saidas?error=' + encodeURIComponent(error.message));
    }
  });
});
router.post('/saidas/:id/anexos/remover', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const attachmentType = req.body.attachmentType;
    await financeiroService.removeExitAttachment(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      attachmentType,
      req.ip || req.connection?.remoteAddress,
      req.get('user-agent')
    );
    res.redirect('/financeiro/saidas/' + req.params.id + '/editar?success=attachment_removed&type=' + encodeURIComponent(attachmentType));
  } catch (error) {
    console.error('Erro ao remover anexo da saída:', error);
    res.redirect('/financeiro/saidas/' + req.params.id + '/editar?error=' + encodeURIComponent(error.message));
  }
});
router.get('/saidas/:id/desfazer-pagamento', financeiroController.showUnpayExit);
router.post('/saidas/:id/desfazer-pagamento', financeiroController.unpayExit);
router.post('/saidas/:id/excluir', financeiroController.deleteExit);
router.get('/saidas', financeiroController.listExits);

// Contas
router.get('/contas/nova', financeiroController.showCreateAccount);
router.post('/contas', financeiroController.createAccount);
router.get('/contas/:id/comprovante', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const account = await financeiroService.getAccountById(req.params.id, req.user.condominiumId).catch(() => null);
    if (!account) return res.status(404).send('Conta não encontrada');
    const pathValue = account.receipt_pdf_path && account.receipt_pdf_path.trim();
    if (!pathValue) return res.status(404).send('Comprovante não cadastrado');
    const baseDir = path.join(__dirname, '../../');
    const absolutePath = path.resolve(baseDir, pathValue.replace(/^\//, ''));
    if (!fs.existsSync(absolutePath)) return res.status(404).send('Arquivo não encontrado');
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(absolutePath, (err) => {
      if (err && !res.headersSent) res.status(500).send('Erro ao enviar arquivo');
    });
  } catch (e) {
    console.error('Erro comprovante conta:', e);
    res.status(500).send('Erro ao obter comprovante');
  }
});
router.get('/contas/:id/novo-boleto', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const account = await financeiroService.getAccountById(req.params.id, req.user.condominiumId);
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);
    res.render('administrativo/financeiro/contas/novo-boleto', {
      title: 'Adicionar novo boleto',
      user: req.user,
      account,
      costCenters: costCenters || [],
      item: null,
      req: req,
    });
  } catch (e) {
    console.error('Erro ao exibir novo boleto:', e);
    res.status(404).send('Conta não encontrada');
  }
});
router.post('/contas/:id/novo-boleto', (req, res, next) => {
  const { uploadBoleto } = require('../middlewares/upload');
  uploadBoleto(req, res, async (err) => {
    try {
      const financeiroService = require('../services/financeiroService');
      const payableService = require('../services/payableService');
      const account = await financeiroService.getAccountById(req.params.id, req.user.condominiumId).catch(() => null);
      if (!account) return res.status(404).send('Conta não encontrada');
      if (err) {
        const costCenters = await financeiroService.listCostCenters(req.user.condominiumId).catch(() => []);
        return res.render('administrativo/financeiro/contas/novo-boleto', {
          title: 'Adicionar novo boleto',
          user: req.user,
          account,
          costCenters: costCenters || [],
          item: req.body,
          error: err.message || 'Erro no upload',
          req: req,
        });
      }
      let boletoPdfPath = null;
      if (req.file && req.file.path) {
        boletoPdfPath = path.relative(path.join(__dirname, '../../'), req.file.path).replace(/\\/g, '/');
      }
      await payableService.createPayableItem(
        req.user.condominiumId,
        req.user.id,
        {
          billId: req.params.id,
          dueDate: req.body.dueDate,
          amount: req.body.amount,
          description: req.body.description || null,
          costCenterId: req.body.costCenterId || account.cost_center_id || null,
          boletoPdfPath,
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
      res.redirect('/financeiro/contas/' + req.params.id + '?success=boleto_added');
    } catch (e) {
      console.error('Erro ao criar boleto:', e);
      const costCenters = await financeiroService.listCostCenters(req.user.condominiumId).catch(() => []);
      res.render('administrativo/financeiro/contas/novo-boleto', {
        title: 'Adicionar novo boleto',
        user: req.user,
        account: { id: req.params.id },
        costCenters: costCenters || [],
        item: req.body,
        error: e.message,
        req: req,
      });
    }
  });
});
router.get('/contas/:id/editar', financeiroController.showEditAccount);
router.post('/contas/:id', financeiroController.updateAccount);
router.get('/contas/:id', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const payableService = require('../services/payableService');
    const account = await financeiroService.getAccountById(req.params.id, req.user.condominiumId);
    const items = await payableService.listPayableItems(req.user.condominiumId, { billId: parseInt(req.params.id, 10), limit: 100 });
    res.render('administrativo/financeiro/contas/detail', {
      title: account.name + ' - Vencimentos',
      user: req.user,
      account,
      items: items || [],
      query: req.query,
      req: req,
    });
  } catch (e) {
    console.error('Erro ao carregar conta:', e);
    res.status(404).send('Conta não encontrada');
  }
});
router.get('/contas', financeiroController.listAccounts);

// Contas a pagar (itens com vencimento)
const payableService = require('../services/payableService');
router.get('/contas-a-pagar/novo', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const bills = await financeiroService.listAccounts(req.user.condominiumId, { active: true });
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);
    res.render('administrativo/financeiro/contas-a-pagar/form', {
      title: 'Nova Conta a Pagar',
      user: req.user,
      item: null,
      bills: bills || [],
      costCenters: costCenters || [],
      req: req,
    });
  } catch (e) {
    console.error('Erro ao exibir formulário contas a pagar:', e);
    res.status(500).send('Erro ao carregar formulário');
  }
});
router.post('/contas-a-pagar', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const ua = req.get('user-agent');
    const result = await payableService.createPayableItem(
      req.user.condominiumId,
      req.user.id,
      {
        billId: req.body.billId || null,
        dueDate: req.body.dueDate,
        amount: req.body.amount,
        description: req.body.description || null,
        costCenterId: req.body.costCenterId || null,
      },
      ip,
      ua
    );
    if (result.savedAsCopy && result.copyLabel) {
      return res.redirect('/financeiro/contas-a-pagar?success=created_as_copy&copyLabel=' + encodeURIComponent(result.copyLabel));
    }
    res.redirect('/financeiro/contas-a-pagar?success=created');
  } catch (e) {
    console.error('Erro ao criar conta a pagar:', e);
    let errorMsg = e.message;
    if (errorMsg && (errorMsg.includes('idx_payable_items_unique_bill_due') || errorMsg.includes('duplicate key'))) {
      errorMsg = 'Já existe um vencimento para esta conta nesta data. Tente novamente; o sistema pode tê-lo salvo como outro vencimento.';
    }
    const financeiroService = require('../services/financeiroService');
    const bills = await financeiroService.listAccounts(req.user.condominiumId, { active: true }).catch(() => []);
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId).catch(() => []);
    res.render('administrativo/financeiro/contas-a-pagar/form', {
      title: 'Nova Conta a Pagar',
      user: req.user,
      item: req.body,
      bills,
      costCenters,
      error: errorMsg,
      req: req,
    });
  }
});
router.get('/contas-a-pagar/:id/pagar', async (req, res) => {
  try {
    const item = await payableService.getPayableItemById(req.params.id, req.user.condominiumId);
    if (item.status === 'PAID') return res.redirect('/financeiro/contas-a-pagar?error=already_paid');
    res.render('administrativo/financeiro/contas-a-pagar/pagar', {
      title: 'Pagar Conta',
      user: req.user,
      item,
      req: req,
    });
  } catch (e) {
    console.error('Erro ao carregar pagar:', e);
    res.status(404).send('Item não encontrado');
  }
});
router.post('/contas-a-pagar/:id/pagar', (req, res, next) => {
  uploadPayment(req, res, async (err) => {
    try {
      if (err) {
        const item = await payableService.getPayableItemById(req.params.id, req.user.condominiumId).catch(() => null);
        let errorMsg = err.message || 'Erro no upload';
        if (err.code === 'LIMIT_FILE_SIZE') {
          errorMsg = 'O arquivo é muito grande. O limite é 50MB. Tente enviar um PDF menor ou compactado.';
        }
        return res.render('administrativo/financeiro/contas-a-pagar/pagar', {
          title: 'Pagar Conta',
          user: req.user,
          item: item || {},
          error: errorMsg,
          formData: req.body,
          req: req,
        });
      }
      if (!req.file) {
        const item = await payableService.getPayableItemById(req.params.id, req.user.condominiumId);
        return res.render('administrativo/financeiro/contas-a-pagar/pagar', {
          title: 'Pagar Conta',
          user: req.user,
          item,
          error: 'Comprovante em PDF é obrigatório',
          formData: req.body,
          req: req,
        });
      }
      const receiptPath = path.relative(path.join(__dirname, '../../'), req.file.path).replace(/\\/g, '/');
      await payableService.payPayableItem(
        req.params.id,
        req.user.condominiumId,
        req.user.id,
        {
          receiptPdfPath: receiptPath,
          paymentDetails: req.body.paymentDetails,
          paymentMethod: req.body.paymentMethod,
          paymentNotes: req.body.paymentNotes,
        },
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      );
      res.redirect('/financeiro/contas-a-pagar?success=paid');
    } catch (e) {
      console.error('Erro ao pagar item:', e);
      const item = await payableService.getPayableItemById(req.params.id, req.user.condominiumId).catch(() => null);
      res.render('administrativo/financeiro/contas-a-pagar/pagar', {
        title: 'Pagar Conta',
        user: req.user,
        item: item || {},
        error: e.message,
        formData: req.body,
        req: req,
      });
    }
  });
});
router.post('/contas-a-pagar/gerar-vencimentos', async (req, res) => {
  try {
    const result = await payableService.generatePayableItemsForRecurringBills(req.user.condominiumId, { monthsAhead: 3 });
    res.redirect('/financeiro/contas-a-pagar?success=generated&count=' + (result.created || 0));
  } catch (e) {
    console.error('Erro ao gerar vencimentos:', e);
    res.redirect('/financeiro/contas-a-pagar?error=' + encodeURIComponent(e.message));
  }
});
router.get('/contas-a-pagar', async (req, res) => {
  try {
    await payableService.checkAndNotifyOverduePayables(req.user.condominiumId);
    const filters = {
      status: req.query.status || undefined,
      limit: 200,
    };
    const items = await payableService.listPayableItems(req.user.condominiumId, filters);
    res.render('administrativo/financeiro/contas-a-pagar/list', {
      title: 'Contas a Pagar',
      user: req.user,
      items,
      query: req.query,
      req: req,
    });
  } catch (e) {
    console.error('Erro ao listar contas a pagar:', e);
    res.status(500).send('Erro ao carregar contas a pagar');
  }
});

// Consumo
router.get('/consumo/novo', financeiroController.showCreateConsumption);
router.post('/consumo', financeiroController.createConsumption);
router.get('/consumo', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    
    // Extrai filtros dos query parameters
    const filters = {
      year: req.query.year ? parseInt(req.query.year) : new Date().getFullYear(),
      month: req.query.month ? parseInt(req.query.month) : undefined,
      billId: req.query.billId ? parseInt(req.query.billId) : undefined,
    };
    
    // Busca contas para o filtro
    const bills = await financeiroService.listAccounts(req.user.condominiumId, { active: true }).catch(() => []);
    
    // Busca consumo com filtros
    const consumption = await financeiroService.listConsumption(req.user.condominiumId, filters).catch(() => []);
    
    res.render('administrativo/financeiro/consumo/list', {
      title: 'Consumo Mensal',
      user: req.user,
      consumption: consumption || [],
      bills: bills || [],
      filters: filters,
      query: req.query,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar consumo:', error);
    // Em caso de erro, ainda renderiza a página com valores padrão
    const financeiroService = require('../services/financeiroService');
    const filters = {
      year: req.query.year ? parseInt(req.query.year) : new Date().getFullYear(),
      month: req.query.month ? parseInt(req.query.month) : undefined,
      billId: req.query.billId ? parseInt(req.query.billId) : undefined,
    };
    const bills = await financeiroService.listAccounts(req.user.condominiumId, { active: true }).catch(() => []);
    res.render('administrativo/financeiro/consumo/list', {
      title: 'Consumo Mensal',
      user: req.user,
      consumption: [],
      bills: bills || [],
      filters: filters,
      query: req.query,
      req: req,
      error: 'Erro ao carregar consumo. Tente novamente.',
    });
  }
});

// Centros de Custo
router.get('/centros-custo', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);
    res.render('administrativo/financeiro/centros-custo/list', {
      title: 'Centros de Custo',
      user: req.user,
      costCenters: costCenters || [],
    });
  } catch (error) {
    console.error('Erro ao listar centros de custo:', error);
    res.status(500).send('Erro ao carregar centros de custo');
  }
});

router.get('/centros-custo/novo', async (req, res) => {
  try {
    res.render('administrativo/financeiro/centros-custo/form', {
      title: 'Novo Centro de Custo',
      user: req.user,
      centroCusto: null, // Adiciona variável para evitar erro na view
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de centro de custo:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
});

router.post('/centros-custo', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      name: req.body.name,
      description: req.body.description || null,
      active: req.body.active !== undefined ? req.body.active : true,
    };

    await financeiroService.createCostCenter(
      req.user.condominiumId,
      req.user.id,
      data,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/centros-custo?success=created');
  } catch (error) {
    console.error('Erro ao criar centro de custo:', error);
    res.render('administrativo/financeiro/centros-custo/form', {
      title: 'Novo Centro de Custo',
      user: req.user,
      centroCusto: req.body,
      error: error.message,
    });
  }
});

// Entradas rejeitadas (para corrigir)
router.get('/entradas-rejeitadas', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const entries = await financeiroService.listRejectedEntries(req.user.condominiumId);
    res.render('financeiro/entradas-rejeitadas', {
      title: 'Entradas Rejeitadas',
      user: req.user,
      entries: entries,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar entradas rejeitadas:', error);
    res.status(500).send('Erro ao carregar entradas');
  }
});

// Orçamentos aguardando análise do financeiro
router.get('/orcamentos-pendentes', async (req, res) => {
  try {
    const orcamentoService = require('../services/orcamentoService');
    const budgets = await orcamentoService.listBudgetRequestsByStatus(req.user.condominiumId, 'PENDING_FINANCEIRO');
    
    // Busca orçamentos (quotes) para cada solicitação
    for (const budget of budgets) {
      budget.quotes = await orcamentoService.getBudgetQuotes(budget.id);
    }
    
    res.render('financeiro/orcamentos-pendentes', {
      title: 'Orçamentos Aguardando Análise',
      user: req.user,
      budgets: budgets,
    });
  } catch (error) {
    console.error('Erro ao listar orçamentos pendentes:', error);
    res.status(500).send('Erro ao carregar orçamentos');
  }
});

// Revisar orçamento (financeiro)
router.post('/orcamentos/:id/revisar', async (req, res) => {
  try {
    const orcamentoService = require('../services/orcamentoService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await orcamentoService.reviewByFinanceiro(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      {
        financeiroNotes: req.body.financeiroNotes,
        costCenterId: req.body.costCenterId,
      },
      ipAddress,
      userAgent
    );
    res.redirect('/financeiro/orcamentos-pendentes?success=reviewed');
  } catch (error) {
    console.error('Erro ao revisar orçamento:', error);
    res.redirect('/financeiro/orcamentos-pendentes?error=' + encodeURIComponent(error.message));
  }
});

// Orçamentos aprovados (para liberar)
router.get('/orcamentos-aprovados', async (req, res) => {
  try {
    const orcamentoService = require('../services/orcamentoService');
    const budgets = await orcamentoService.listBudgetRequestsByStatus(req.user.condominiumId, 'APPROVED');
    
    // Busca orçamentos (quotes) para cada solicitação
    for (const budget of budgets) {
      budget.quotes = await orcamentoService.getBudgetQuotes(budget.id);
    }
    
    res.render('financeiro/orcamentos-aprovados', {
      title: 'Orçamentos Aprovados',
      user: req.user,
      budgets: budgets,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar orçamentos aprovados:', error);
    res.status(500).send('Erro ao carregar orçamentos');
  }
});

// Orçamentos rejeitados
router.get('/orcamentos-rejeitados', async (req, res) => {
  try {
    const orcamentoService = require('../services/orcamentoService');
    
    // Permite filtrar por status (mas por padrão mostra apenas REJECTED)
    const filters = {
      status: req.query.status || 'REJECTED',
    };
    
    const budgets = await orcamentoService.listBudgetRequests(req.user.condominiumId, filters);
    
    // Busca orçamentos (quotes) para cada solicitação
    for (const budget of budgets) {
      budget.quotes = await orcamentoService.getBudgetQuotes(budget.id);
    }
    
    res.render('administrativo/orcamentos/list', {
      title: 'Orçamentos Rejeitados',
      user: req.user,
      requests: budgets,
      filters: filters,
      req: req,
      module: 'financeiro', // Indica que é módulo financeiro para gerar links corretos
      allowCreate: false, // Financeiro não pode criar orçamentos
    });
  } catch (error) {
    console.error('Erro ao listar orçamentos rejeitados:', error);
    res.status(500).send('Erro ao carregar orçamentos');
  }
});

// Detalhes de orçamento rejeitado (ou qualquer orçamento para o financeiro)
router.get('/orcamentos-rejeitados/:id', async (req, res) => {
  try {
    const orcamentoService = require('../services/orcamentoService');
    const budgetRequestId = parseInt(req.params.id);
    
    // Busca solicitação completa com orçamentos e anexos
    const request = await orcamentoService.getBudgetRequestById(budgetRequestId, req.user.condominiumId);
    
    if (!request) {
      return res.status(404).send('Solicitação de orçamento não encontrada');
    }
    
    res.render('administrativo/orcamentos/detail', {
      title: `Detalhes: ${request.title}`,
      user: req.user,
      request: request,
      module: 'financeiro', // Indica que é módulo financeiro
      allowCreate: false, // Financeiro não pode criar orçamentos
    });
  } catch (error) {
    console.error('Erro ao carregar detalhes do orçamento:', error);
    res.status(500).send('Erro ao carregar detalhes');
  }
});

// Saídas que precisam verificação (criadas automaticamente de orçamentos)
router.get('/saidas-verificacao', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const { query } = require('../config/database');
    
    // Busca saídas que precisam verificação
    const exitsResult = await query(
      `SELECT fe.*, br.title as budget_title, bq.supplier_name, bq.quote_value
       FROM financial_exits fe
       LEFT JOIN budget_requests br ON fe.related_budget_request_id = br.id
       LEFT JOIN budget_quotes bq ON fe.related_budget_quote_id = bq.id
       WHERE fe.condominium_id = $1 
         AND fe.needs_verification = TRUE
         AND fe.verified = FALSE
       ORDER BY fe.created_at DESC`,
      [req.user.condominiumId]
    );
    
    const exits = exitsResult.rows;
    
    res.render('financeiro/saidas-verificacao', {
      title: 'Saídas para Verificação',
      user: req.user,
      exits: exits,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar saídas para verificação:', error);
    res.status(500).send('Erro ao carregar saídas');
  }
});

// Verificar e completar saída
router.get('/saidas/:id/verificar', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const exits = await financeiroService.listExits(req.user.condominiumId, { limit: 1000 });
    const exit = exits.find(e => e.id === parseInt(req.params.id));
    
    if (!exit) {
      return res.status(404).send('Saída não encontrada');
    }
    
    if (!exit.needs_verification || exit.verified) {
      return res.redirect('/financeiro/saidas-verificacao?error=already_verified');
    }
    
    // Busca informações do orçamento relacionado
    const orcamentoService = require('../services/orcamentoService');
    let budgetRequest = null;
    if (exit.related_budget_request_id) {
      budgetRequest = await orcamentoService.getBudgetRequestById(exit.related_budget_request_id, req.user.condominiumId);
    }
    
    // Busca centros de custo
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);
    const exitView = { ...exit, categoryForSelect: normalizeDespesaCategoryForForm(exit.category) };

    res.render('financeiro/saidas/verificar', {
      title: 'Verificar e Completar Saída',
      user: req.user,
      exit: exitView,
      budgetRequest: budgetRequest,
      costCenters: costCenters,
      despesaCategories: DESPESA_CATEGORIES,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao carregar formulário de verificação:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
});

router.post('/saidas/:id/verificar', async (req, res) => {
  try {
    const financeiroService = require('../services/financeiroService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    
    // Atualiza a saída com os dados verificados
    const updateData = {
      description: req.body.description,
      amount: req.body.amount,
      exitDate: req.body.exitDate,
      costCenterId: req.body.costCenterId || null,
      category: req.body.category || DEFAULT_DESPESA_CATEGORY,
    };
    
    // Obtém roles do usuário (req.user.roles é array definido pelo middleware auth)
    const userRoles = req.user.roles || [];
    
    await financeiroService.updateExit(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      updateData,
      userRoles,
      ipAddress,
      userAgent
    );
    
    // Marca como verificada
    const { query } = require('../config/database');
    await query(
      `UPDATE financial_exits
       SET verified = TRUE, verified_by = $1, verified_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND condominium_id = $3`,
      [req.user.id, req.params.id, req.user.condominiumId]
    );
    
    res.redirect('/financeiro/saidas-verificacao?success=verified');
  } catch (error) {
    console.error('Erro ao verificar saída:', error);
    res.redirect('/financeiro/saidas/' + req.params.id + '/verificar?error=' + encodeURIComponent(error.message));
  }
});

// Liberar ou retornar orçamento (financeiro)
router.post('/orcamentos/:id/:action', async (req, res) => {
  try {
    const { action } = req.params; // 'liberar' ou 'retornar'
    if (action !== 'liberar' && action !== 'retornar') {
      return res.status(400).send('Ação inválida');
    }
    const orcamentoService = require('../services/orcamentoService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await orcamentoService.releaseOrReturnByFinanceiro(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      action === 'liberar' ? 'RELEASE' : 'RETURN',
      req.body.financeiroNotes,
      ipAddress,
      userAgent
    );
    const redirectPath = action === 'liberar' 
      ? '/financeiro/orcamentos-aprovados?success=released'
      : '/financeiro/orcamentos-aprovados?success=returned';
    res.redirect(redirectPath);
  } catch (error) {
    console.error('Erro ao liberar/retornar orçamento:', error);
    res.redirect('/financeiro/orcamentos-aprovados?error=' + encodeURIComponent(error.message));
  }
});

// Fechamento Mensal
router.get('/fechamento-mensal', financeiroController.showFechamentoMensal);
router.post('/fechamento-mensal/fechar', financeiroController.closeFechamentoMensal);
router.post('/fechamento-mensal/:id/reabrir', financeiroController.reopenFechamentoMensal);

// Inadimplência
const inadimplenciaController = require('../controllers/inadimplenciaController');
router.get('/apartamentos/novo', (req, res) => {
  res.render('administrativo/financeiro/apartamentos/form', {
    title: 'Novo Apartamento',
    user: req.user,
    apartment: null,
    req: req,
  });
});
router.get('/apartamentos', inadimplenciaController.listApartments);
router.post('/apartamentos', inadimplenciaController.createApartment);
router.get('/taxas/nova', (req, res) => {
  const inadimplenciaService = require('../services/inadimplenciaService');
  inadimplenciaService.listApartments(req.user.condominiumId).then(apartments => {
    res.render('administrativo/financeiro/taxas/form', {
      title: 'Nova Taxa Mensal',
      user: req.user,
      apartments: apartments,
      req: req,
    });
  }).catch(err => {
    console.error('Erro ao carregar apartamentos:', err);
    res.status(500).send('Erro ao carregar formulário');
  });
});
router.get('/taxas/:id/pagar', async (req, res) => {
  try {
    const inadimplenciaService = require('../services/inadimplenciaService');
    const fees = await inadimplenciaService.listMonthlyFees(req.user.condominiumId, { limit: 1000 });
    const fee = fees.find(f => f.id === parseInt(req.params.id));
    if (!fee) {
      return res.status(404).send('Taxa não encontrada');
    }
    if (fee.paid) {
      return res.redirect('/financeiro/taxas?error=already_paid');
    }
    res.render('administrativo/financeiro/taxas/pagar', {
      title: 'Marcar Taxa como Paga',
      user: req.user,
      fee: fee,
      req: req,
      error: req.query.error || null,
    });
  } catch (error) {
    console.error('Erro ao carregar formulário de pagamento:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
});
router.get('/taxas', inadimplenciaController.listMonthlyFees);
router.post('/taxas', inadimplenciaController.createMonthlyFee);
router.post('/taxas/:id/pagar', uploadPayment, inadimplenciaController.markFeeAsPaid);

// Relatórios
const reportService = require('../services/reportService');
router.get('/relatorios', async (req, res) => {
  try {
    const reports = await reportService.listGeneratedReports(req.user.condominiumId);
    res.render('administrativo/financeiro/relatorios/list', {
      title: 'Relatórios',
      user: req.user,
      reports: reports,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar relatórios:', error);
    res.status(500).send('Erro ao carregar relatórios');
  }
});

router.post('/relatorios/mensal/gerar', async (req, res) => {
  try {
    const { month, year } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    
    const report = await reportService.generateMonthlyFinancialReport(
      req.user.condominiumId,
      parseInt(month),
      parseInt(year),
      req.user.id,
      ipAddress,
      userAgent
    );
    
    const fileParam = report.fileName || (report.filePath ? path.basename(report.filePath) : '');
    res.redirect(`/financeiro/relatorios?success=generated&file=${encodeURIComponent(fileParam)}`);
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.redirect('/financeiro/relatorios?error=' + encodeURIComponent(error.message));
  }
});

// Visualizar relatório PDF no navegador (helper único: serveReportFile)
const { serveReportFile } = require('../utils/serveReportFile');
router.get('/relatorios/visualizar', async (req, res) => {
  try {
    await serveReportFile(req, res, 'inline');
  } catch (error) {
    console.error('Erro ao visualizar relatório:', error);
    if (!res.headersSent) res.status(500).send('Erro ao visualizar relatório');
  }
});

// Baixar relatório (mesmo helper, disposition attachment)
router.get('/relatorios/download', async (req, res) => {
  try {
    await serveReportFile(req, res, 'attachment');
  } catch (error) {
    console.error('Erro ao baixar relatório:', error);
    if (!res.headersSent) res.status(500).send('Erro ao baixar relatório');
  }
});

// Excluir relatório
router.post('/relatorios/excluir', async (req, res) => {
  try {
    const fileName = req.body.fileName || req.query.fileName;
    if (!fileName) {
      return res.status(400).send('Nome do arquivo não fornecido');
    }
    
    const path = require('path');
    // Normalizar o nome do arquivo para evitar problemas com caminhos
    const normalizedFileName = path.basename(fileName);
    
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    
    await reportService.deleteReport(normalizedFileName, req.user.condominiumId, req.user.id, ipAddress, userAgent);
    
    res.redirect('/financeiro/relatorios?success=deleted');
  } catch (error) {
    console.error('Erro ao excluir relatório:', error);
    res.redirect('/financeiro/relatorios?error=' + encodeURIComponent(error.message));
  }
});

// Fundo de Reserva
const reserveFundService = require('../services/reserveFundService');
router.get('/fundo-reserva', async (req, res) => {
  try {
    const fund = await reserveFundService.getReserveFund(req.user.condominiumId);
    res.render('administrativo/financeiro/fundo-reserva', {
      title: 'Fundo de Reserva',
      user: req.user,
      fund: fund,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao carregar fundo de reserva:', error);
    res.status(500).send('Erro ao carregar fundo de reserva');
  }
});

router.post('/fundo-reserva', async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    
    await reserveFundService.setupReserveFund(
      req.user.condominiumId,
      req.user.id,
      req.body,
      ipAddress,
      userAgent
    );
    
    res.redirect('/financeiro/fundo-reserva?success=updated');
  } catch (error) {
    console.error('Erro ao configurar fundo de reserva:', error);
    res.redirect('/financeiro/fundo-reserva?error=' + encodeURIComponent(error.message));
  }
});

module.exports = router;
