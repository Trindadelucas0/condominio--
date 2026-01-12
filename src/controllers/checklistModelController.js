// Controller para gerenciar modelos de checklist
// Apenas SÍNDICO pode criar/editar modelos (regras de execução)

const checklistModelService = require('../services/checklistModelService');

// Função para listar modelos
// GET /sindico/checklist-modelos
const showModels = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const models = await checklistModelService.listModels(req.user.condominiumId);

    res.render('sindico/checklist-modelos/list', {
      title: 'Modelos de Checklist',
      user: req.user,
      models,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao listar modelos:', error);
    res.status(500).send('Erro ao carregar modelos');
  }
};

// Função para exibir formulário de criação
// GET /sindico/checklist-modelos/novo
const showCreateModel = (req, res) => {
  res.render('sindico/checklist-modelos/form', {
    title: 'Novo Modelo de Checklist',
    user: req.user,
    model: null,
  });
};

// Função para criar modelo
// POST /sindico/checklist-modelos
const createModel = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Processa itens do modelo
    const items = [];
    if (req.body.items && Array.isArray(req.body.items)) {
      req.body.items.forEach((item, index) => {
        if (item.name && item.name.trim() !== '') {
          items.push({
            name: item.name,
            order: parseInt(item.order) || index,
            requiresPhoto: item.requiresPhoto === 'true' || item.requiresPhoto === true
          });
        }
      });
    }

    // Processa dias da semana
    const daysOfWeek = [];
    if (req.body.monday === 'on') daysOfWeek.push(1);
    if (req.body.tuesday === 'on') daysOfWeek.push(2);
    if (req.body.wednesday === 'on') daysOfWeek.push(3);
    if (req.body.thursday === 'on') daysOfWeek.push(4);
    if (req.body.friday === 'on') daysOfWeek.push(5);
    if (req.body.saturday === 'on') daysOfWeek.push(6);
    if (req.body.sunday === 'on') daysOfWeek.push(0);

    const data = {
      name: req.body.name,
      description: req.body.description || null,
      department: req.body.department,
      daysOfWeek,
      isActive: req.body.isActive === 'true' || req.body.isActive === true,
      requiresPhoto: req.body.requiresPhoto === 'true' || req.body.requiresPhoto === true,
      requiresJustification: req.body.requiresJustification === 'true' || req.body.requiresJustification === true,
      defaultAssignedRole: req.body.defaultAssignedRole || null,
      items
    };

    await checklistModelService.createModel(data, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/sindico/checklist-modelos?success=created');
  } catch (error) {
    res.render('sindico/checklist-modelos/form', {
      title: 'Novo Modelo de Checklist',
      user: req.user,
      model: req.body,
      error: error.message,
    });
  }
};

// Função para exibir formulário de edição
// GET /sindico/checklist-modelos/:id/editar
const showEditModel = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const model = await checklistModelService.getModelById(parseInt(req.params.id), req.user.condominiumId);

    if (!model) {
      return res.status(404).send('Modelo não encontrado');
    }

    res.render('sindico/checklist-modelos/form', {
      title: 'Editar Modelo de Checklist',
      user: req.user,
      model,
    });
  } catch (error) {
    console.error('Erro ao carregar modelo:', error);
    res.status(500).send('Erro ao carregar modelo');
  }
};

// Função para atualizar modelo
// POST /sindico/checklist-modelos/:id
const updateModel = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Processa itens
    const items = [];
    if (req.body.items && Array.isArray(req.body.items)) {
      req.body.items.forEach((item, index) => {
        if (item.name && item.name.trim() !== '') {
          items.push({
            name: item.name,
            order: parseInt(item.order) || index,
            requiresPhoto: item.requiresPhoto === 'true' || item.requiresPhoto === true
          });
        }
      });
    }

    // Processa dias da semana
    const daysOfWeek = [];
    if (req.body.monday === 'on') daysOfWeek.push(1);
    if (req.body.tuesday === 'on') daysOfWeek.push(2);
    if (req.body.wednesday === 'on') daysOfWeek.push(3);
    if (req.body.thursday === 'on') daysOfWeek.push(4);
    if (req.body.friday === 'on') daysOfWeek.push(5);
    if (req.body.saturday === 'on') daysOfWeek.push(6);
    if (req.body.sunday === 'on') daysOfWeek.push(0);

    const data = {
      name: req.body.name,
      description: req.body.description || null,
      department: req.body.department,
      daysOfWeek,
      isActive: req.body.isActive === 'true' || req.body.isActive === true,
      requiresPhoto: req.body.requiresPhoto === 'true' || req.body.requiresPhoto === true,
      requiresJustification: req.body.requiresJustification === 'true' || req.body.requiresJustification === true,
      defaultAssignedRole: req.body.defaultAssignedRole || null,
      items
    };

    await checklistModelService.updateModel(
      parseInt(req.params.id),
      data,
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

    res.redirect('/sindico/checklist-modelos?success=updated');
  } catch (error) {
    try {
      const model = await checklistModelService.getModelById(parseInt(req.params.id), req.user.condominiumId);
      res.render('sindico/checklist-modelos/form', {
        title: 'Editar Modelo de Checklist',
        user: req.user,
        model: { ...req.body, items: items || [] },
        error: error.message,
      });
    } catch (renderError) {
      res.status(500).send('Erro ao processar atualização');
    }
  }
};

// Função para ativar/desativar modelo
// POST /sindico/checklist-modelos/:id/toggle
const toggleModel = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const isActive = req.body.isActive === 'true' || req.body.isActive === true;

    await checklistModelService.toggleModelActive(
      parseInt(req.params.id),
      isActive,
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

    res.redirect('/sindico/checklist-modelos?success=toggled');
  } catch (error) {
    console.error('Erro ao alterar status do modelo:', error);
    res.redirect('/sindico/checklist-modelos?error=' + encodeURIComponent(error.message));
  }
};

module.exports = {
  showModels,
  showCreateModel,
  createModel,
  showEditModel,
  updateModel,
  toggleModel
};
