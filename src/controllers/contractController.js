// Controller do módulo CONTRATOS
// Gerencia requisições de gestão de contratos

const contractService = require('../services/contractService');
const { renderError } = require('../utils/errorHandler');

// Listar contratos
const listContracts = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const contracts = await contractService.listContracts(req.user.condominiumId, {
      status: req.query.status,
      contractType: req.query.contractType,
      expiring: req.query.expiring ? parseInt(req.query.expiring) : null,
      limit: 100
    });

    res.render('administrativo/contracts/list', {
      title: 'Contratos',
      user: req.user,
      contracts: contracts,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar contratos:', error);
    renderError(res, 500, 'Erro ao carregar contratos', error);
  }
};

// Mostrar formulário de criação
const showCreateContract = async (req, res) => {
  try {
    res.render('administrativo/contracts/form', {
      title: 'Novo Contrato',
      user: req.user,
      contract: null,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário:', error);
    renderError(res, 500, 'Erro ao carregar formulário', error);
  }
};

// Criar contrato
const createContract = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const { uploadSingleContract } = require('../middlewares/upload');
    
    uploadSingleContract(req, res, async (err) => {
      try {
        if (err) {
          return res.redirect('/administrativo/contracts/novo?error=' + encodeURIComponent(err.message));
        }

        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');
        const path = require('path');

        const filePath = req.file ? path.relative(path.join(__dirname, '../../'), req.file.path).replace(/\\/g, '/') : null;

        await contractService.createContract(
          req.user.condominiumId,
          req.user.id,
          {
            ...req.body,
            filePath: filePath,
            fileName: req.file ? req.file.originalname : null
          },
          ipAddress,
          userAgent
        );

        res.redirect('/administrativo/contracts?success=created');
      } catch (error) {
        console.error('Erro ao criar contrato:', error);
        res.redirect('/administrativo/contracts/novo?error=' + encodeURIComponent(error.message));
      }
    });
  } catch (error) {
    console.error('Erro ao processar criação:', error);
    res.redirect('/administrativo/contracts/novo?error=' + encodeURIComponent(error.message));
  }
};

// Ver detalhes do contrato
const showContract = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const contract = await contractService.getContractById(
      parseInt(req.params.id),
      req.user.condominiumId
    );

    if (!contract) {
      return renderError(res, 404, 'Contrato não encontrado');
    }

    res.render('administrativo/contracts/detail', {
      title: 'Detalhes do Contrato',
      user: req.user,
      contract: contract,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao carregar contrato:', error);
    renderError(res, 500, 'Erro ao carregar contrato', error);
  }
};

// Mostrar formulário de edição
const showEditContract = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const contract = await contractService.getContractById(
      parseInt(req.params.id),
      req.user.condominiumId
    );

    if (!contract) {
      return renderError(res, 404, 'Contrato não encontrado');
    }

    res.render('administrativo/contracts/form', {
      title: 'Editar Contrato',
      user: req.user,
      contract: contract,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao carregar edição:', error);
    renderError(res, 500, 'Erro ao carregar contrato', error);
  }
};

// Atualizar contrato
const updateContract = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const { uploadSingleContract } = require('../middlewares/upload');
    
    uploadSingleContract(req, res, async (err) => {
      try {
        if (err) {
          return res.redirect(`/administrativo/contracts/${req.params.id}/editar?error=` + encodeURIComponent(err.message));
        }

        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');
        const path = require('path');

        const data = { ...req.body };
        if (req.file) {
          data.filePath = path.relative(path.join(__dirname, '../../'), req.file.path).replace(/\\/g, '/');
          data.fileName = req.file.originalname;
        }

        await contractService.updateContract(
          parseInt(req.params.id),
          req.user.condominiumId,
          req.user.id,
          data,
          ipAddress,
          userAgent
        );

        res.redirect(`/administrativo/contracts/${req.params.id}?success=updated`);
      } catch (error) {
        console.error('Erro ao atualizar contrato:', error);
        res.redirect(`/administrativo/contracts/${req.params.id}/editar?error=` + encodeURIComponent(error.message));
      }
    });
  } catch (error) {
    console.error('Erro ao processar atualização:', error);
    res.redirect(`/administrativo/contracts/${req.params.id}/editar?error=` + encodeURIComponent(error.message));
  }
};

// Renovar contrato
const renewContract = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const { newEndDate } = req.body;

    if (!newEndDate) {
      return renderError(res, 400, 'Nova data de término é obrigatória');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await contractService.renewContract(
      parseInt(req.params.id),
      req.user.condominiumId,
      req.user.id,
      newEndDate,
      ipAddress,
      userAgent
    );

    res.redirect(`/administrativo/contracts/${req.params.id}?success=renewed`);
  } catch (error) {
    console.error('Erro ao renovar contrato:', error);
    res.redirect(`/administrativo/contracts/${req.params.id}?error=` + encodeURIComponent(error.message));
  }
};

// Cancelar contrato
const cancelContract = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await contractService.cancelContract(
      parseInt(req.params.id),
      req.user.condominiumId,
      req.user.id,
      req.body.reason || null,
      ipAddress,
      userAgent
    );

    res.redirect(`/administrativo/contracts/${req.params.id}?success=cancelled`);
  } catch (error) {
    console.error('Erro ao cancelar contrato:', error);
    res.redirect(`/administrativo/contracts/${req.params.id}?error=` + encodeURIComponent(error.message));
  }
};

module.exports = {
  listContracts,
  showCreateContract,
  createContract,
  showContract,
  showEditContract,
  updateContract,
  renewContract,
  cancelContract,
};
