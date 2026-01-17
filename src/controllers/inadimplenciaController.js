// Controller do módulo INADIMPLÊNCIA
// Gerencia requisições de controle de inadimplência

const inadimplenciaService = require('../services/inadimplenciaService');
const { renderError } = require('../utils/errorHandler');

// Listar apartamentos
const listApartments = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const apartments = await inadimplenciaService.listApartments(req.user.condominiumId, {
      search: req.query.search,
      limit: 1000
    });

    res.render('administrativo/financeiro/apartamentos/list', {
      title: 'Apartamentos',
      user: req.user,
      apartments: apartments,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar apartamentos:', error);
    renderError(res, 500, 'Erro ao carregar apartamentos', error);
  }
};

// Criar apartamento
const createApartment = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await inadimplenciaService.createApartment(
      req.user.condominiumId,
      req.user.id,
      req.body,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/apartamentos?success=created');
  } catch (error) {
    console.error('Erro ao criar apartamento:', error);
    res.redirect('/financeiro/apartamentos?error=' + encodeURIComponent(error.message));
  }
};

// Listar taxas mensais
const listMonthlyFees = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const fees = await inadimplenciaService.listMonthlyFees(req.user.condominiumId, {
      paid: req.query.paid !== undefined ? req.query.paid === 'true' : undefined,
      overdue: req.query.overdue === 'true',
      month: req.query.month ? parseInt(req.query.month) : undefined,
      year: req.query.year ? parseInt(req.query.year) : undefined,
      limit: 1000
    });

    const delinquency = await inadimplenciaService.calculateDelinquency(req.user.condominiumId);

    res.render('administrativo/financeiro/taxas/list', {
      title: 'Taxas Mensais',
      user: req.user,
      fees: fees,
      delinquency: delinquency,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar taxas:', error);
    renderError(res, 500, 'Erro ao carregar taxas', error);
  }
};

// Criar taxa mensal
const createMonthlyFee = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await inadimplenciaService.createMonthlyFee(
      req.user.condominiumId,
      req.user.id,
      req.body,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/taxas?success=created');
  } catch (error) {
    console.error('Erro ao criar taxa:', error);
    res.redirect('/financeiro/taxas?error=' + encodeURIComponent(error.message));
  }
};

// Marcar taxa como paga
const markFeeAsPaid = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const { uploadPayment } = require('../middlewares/upload');
    
    uploadPayment(req, res, async (err) => {
      try {
        if (err) {
          return res.redirect('/financeiro/taxas?error=' + encodeURIComponent(err.message));
        }

        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');
        const path = require('path');

        const paymentReceiptPath = req.file 
          ? path.relative(path.join(__dirname, '../../'), req.file.path).replace(/\\/g, '/')
          : null;

        await inadimplenciaService.markFeeAsPaid(
          parseInt(req.params.id),
          req.user.condominiumId,
          req.user.id,
          {
            paymentMethod: req.body.paymentMethod,
            paymentReceiptPath: paymentReceiptPath
          },
          ipAddress,
          userAgent
        );

        res.redirect('/financeiro/taxas?success=paid');
      } catch (error) {
        console.error('Erro ao marcar taxa como paga:', error);
        res.redirect('/financeiro/taxas?error=' + encodeURIComponent(error.message));
      }
    });
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    res.redirect('/financeiro/taxas?error=' + encodeURIComponent(error.message));
  }
};

module.exports = {
  listApartments,
  createApartment,
  listMonthlyFees,
  createMonthlyFee,
  markFeeAsPaid
};
