// Controller do módulo ASSEMBLEIAS
// Gerencia requisições de gestão de assembleias

const assemblyService = require('../services/assemblyService');
const { renderError } = require('../utils/errorHandler');

// Listar assembleias
const listAssemblies = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const assemblies = await assemblyService.listAssemblies(req.user.condominiumId, {
      status: req.query.status,
      type: req.query.type,
      limit: 100
    });

    res.render('administrativo/assembleias/list', {
      title: 'Assembleias',
      user: req.user,
      assemblies: assemblies,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar assembleias:', error);
    renderError(res, 500, 'Erro ao carregar assembleias', error);
  }
};

// Criar assembleia
const createAssembly = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await assemblyService.createAssembly(
      req.user.condominiumId,
      req.user.id,
      req.body,
      ipAddress,
      userAgent
    );

    res.redirect('/assembleias?success=created');
  } catch (error) {
    console.error('Erro ao criar assembleia:', error);
    res.redirect('/assembleias/novo?error=' + encodeURIComponent(error.message));
  }
};

// Ver detalhes da assembleia
const showAssembly = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const assembly = await assemblyService.getAssemblyById(
      parseInt(req.params.id),
      req.user.condominiumId
    );

    if (!assembly) {
      return renderError(res, 404, 'Assembleia não encontrada');
    }

    const inadimplenciaService = require('../services/inadimplenciaService');
    const apartments = await inadimplenciaService.listApartments(req.user.condominiumId);

    res.render('administrativo/assembleias/detail', {
      title: 'Detalhes da Assembleia',
      user: req.user,
      assembly: assembly,
      apartments: apartments,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao carregar assembleia:', error);
    renderError(res, 500, 'Erro ao carregar assembleia', error);
  }
};

// Adicionar participante
const addParticipant = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await assemblyService.addParticipant(
      parseInt(req.params.id),
      req.user.condominiumId,
      req.user.id,
      req.body,
      ipAddress,
      userAgent
    );

    res.redirect(`/assembleias/${req.params.id}?success=participant_added`);
  } catch (error) {
    console.error('Erro ao adicionar participante:', error);
    res.redirect(`/assembleias/${req.params.id}?error=` + encodeURIComponent(error.message));
  }
};

// Adicionar decisão
const addDecision = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await assemblyService.addDecision(
      parseInt(req.params.id),
      req.user.condominiumId,
      req.user.id,
      req.body,
      ipAddress,
      userAgent
    );

    res.redirect(`/assembleias/${req.params.id}?success=decision_added`);
  } catch (error) {
    console.error('Erro ao adicionar decisão:', error);
    res.redirect(`/assembleias/${req.params.id}?error=` + encodeURIComponent(error.message));
  }
};

// Anexar documento (ata)
const attachDocument = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const { uploadSingleContract } = require('../middlewares/upload');
    
    uploadSingleContract(req, res, async (err) => {
      try {
        if (err) {
          return res.redirect(`/assembleias/${req.params.id}?error=` + encodeURIComponent(err.message));
        }

        if (!req.file) {
          return res.redirect(`/assembleias/${req.params.id}?error=` + encodeURIComponent('Arquivo é obrigatório'));
        }

        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');
        const path = require('path');

        const filePath = path.relative(path.join(__dirname, '../../'), req.file.path).replace(/\\/g, '/');

        await assemblyService.attachDocument(
          parseInt(req.params.id),
          req.user.condominiumId,
          req.user.id,
          {
            documentType: req.body.documentType || 'ATA',
            filePath: filePath,
            fileName: req.file.originalname,
            signed: req.body.signed === 'true'
          },
          ipAddress,
          userAgent
        );

        res.redirect(`/assembleias/${req.params.id}?success=document_attached`);
      } catch (error) {
        console.error('Erro ao anexar documento:', error);
        res.redirect(`/assembleias/${req.params.id}?error=` + encodeURIComponent(error.message));
      }
    });
  } catch (error) {
    console.error('Erro ao processar upload:', error);
    res.redirect(`/assembleias/${req.params.id}?error=` + encodeURIComponent(error.message));
  }
};

// Finalizar assembleia
const completeAssembly = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await assemblyService.completeAssembly(
      parseInt(req.params.id),
      req.user.condominiumId,
      req.user.id,
      ipAddress,
      userAgent
    );

    res.redirect(`/assembleias/${req.params.id}?success=completed`);
  } catch (error) {
    console.error('Erro ao finalizar assembleia:', error);
    res.redirect(`/assembleias/${req.params.id}?error=` + encodeURIComponent(error.message));
  }
};

module.exports = {
  listAssemblies,
  createAssembly,
  showAssembly,
  addParticipant,
  addDecision,
  attachDocument,
  completeAssembly
};
