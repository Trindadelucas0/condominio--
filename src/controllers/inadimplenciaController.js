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

    // Processa filtros
    const filters = {
      limit: 1000
    };
    
    // Filtro por status de pagamento
    if (req.query.paid !== undefined && req.query.paid !== '') {
      filters.paid = req.query.paid === 'true';
    }
    
    // Filtro por inadimplência
    if (req.query.overdue === 'true') {
      filters.overdue = true;
    }
    
    // Filtro por mês
    if (req.query.month && req.query.month !== '') {
      const month = parseInt(req.query.month);
      if (!isNaN(month) && month >= 1 && month <= 12) {
        filters.month = month;
      }
    }
    
    // Filtro por ano
    if (req.query.year && req.query.year !== '') {
      const year = parseInt(req.query.year);
      if (!isNaN(year)) {
        filters.year = year;
      }
    }

    const fees = await inadimplenciaService.listMonthlyFees(req.user.condominiumId, filters);

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
};

module.exports = {
  listApartments,
  createApartment,
  listMonthlyFees,
  createMonthlyFee,
  markFeeAsPaid
};
