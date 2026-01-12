// Controller do módulo SUPER_MASTER
// Gerencia requisições relacionadas ao painel administrativo do sistema
// Apenas usuários com perfil SUPER_MASTER podem acessar

const masterService = require('../services/masterService'); // Service do módulo master

// Função para exibir dashboard do SUPER_MASTER
// GET /master/dashboard
const showDashboard = async (req, res) => {
  try {
    // Busca estatísticas do sistema
    const stats = await masterService.getDashboardStats();

    // Renderiza dashboard
    res.render('master/dashboard', {
      title: 'Dashboard Master',
      user: req.user, // Dados do usuário autenticado (vem do middleware)
      stats: stats, // Estatísticas para exibir
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard master:', error);
    res.status(500).send('Erro ao carregar dashboard');
  }
};

// Função para listar condomínios
// GET /master/condominios
const listCondominios = async (req, res) => {
  try {
    const condominios = await masterService.listCondominios();

    res.render('master/condominios/list', {
      title: 'Condomínios',
      user: req.user,
      condominios: condominios,
    });
  } catch (error) {
    console.error('Erro ao listar condomínios:', error);
    res.status(500).send('Erro ao listar condomínios');
  }
};

// Função para exibir formulário de criação de condomínio
// GET /master/condominios/novo
const showCreateCondominio = (req, res) => {
  res.render('master/condominios/form', {
    title: 'Novo Condomínio',
    user: req.user,
    condominio: null, // Null indica criação
  });
};

// Função para processar criação de condomínio
// POST /master/condominios
const createCondominio = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await masterService.createCondominio(req.body, req.user.id, ipAddress, userAgent);

    res.redirect('/master/condominios?success=created');
  } catch (error) {
    res.render('master/condominios/form', {
      title: 'Novo Condomínio',
      user: req.user,
      condominio: req.body, // Retorna dados para corrigir
      error: error.message,
    });
  }
};

// Função para exibir formulário de edição de condomínio
// GET /master/condominios/:id/editar
const showEditCondominio = async (req, res) => {
  try {
    const condominio = await masterService.getCondominioById(req.params.id);

    if (!condominio) {
      return res.status(404).send('Condomínio não encontrado');
    }

    res.render('master/condominios/form', {
      title: 'Editar Condomínio',
      user: req.user,
      condominio: condominio,
    });
  } catch (error) {
    console.error('Erro ao buscar condomínio:', error);
    res.status(500).send('Erro ao carregar condomínio');
  }
};

// Função para processar atualização de condomínio
// POST /master/condominios/:id
const updateCondominio = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await masterService.updateCondominio(req.params.id, req.body, req.user.id, ipAddress, userAgent);

    res.redirect('/master/condominios?success=updated');
  } catch (error) {
    res.render('master/condominios/form', {
      title: 'Editar Condomínio',
      user: req.user,
      condominio: { ...req.body, id: req.params.id },
      error: error.message,
    });
  }
};

// Função para listar usuários
// GET /master/usuarios
const listUsuarios = async (req, res) => {
  try {
    const usuarios = await masterService.listUsuarios();

    res.render('master/usuarios/list', {
      title: 'Usuários',
      user: req.user,
      usuarios: usuarios,
      query: req.query, // Para mensagens de sucesso
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).send('Erro ao listar usuários');
  }
};

// Função para exibir formulário de criação de usuário
// GET /master/usuarios/novo
const showCreateUsuario = async (req, res) => {
  try {
    // Proteção: se por algum motivo vier um ID na URL, redireciona
    if (req.params.id && req.params.id !== 'novo') {
      console.warn(`[CREATE USER] Tentativa de criar com ID na URL: ${req.params.id}. Redirecionando...`);
      return res.redirect('/master/usuarios/novo');
    }

    const roles = await masterService.getAllRoles();
    const condominios = await masterService.listCondominios();

    res.render('master/usuarios/form', {
      title: 'Novo Usuário',
      user: req.user,
      usuario: null,
      roles: roles,
      condominios: condominios,
    });
  } catch (error) {
    console.error('Erro ao carregar formulário de criação:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};

// Função para processar criação de usuário
// POST /master/usuarios
const createUsuario = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Converte roleIds de array (se múltiplos) ou string única
    // Remove valores inválidos (null, undefined, NaN, strings vazias)
    let roleIds = [];
    if (Array.isArray(req.body.roleIds)) {
      roleIds = req.body.roleIds
        .map(id => parseInt(id))
        .filter(id => !isNaN(id) && id > 0);
    } else if (req.body.roleIds) {
      const parsed = parseInt(req.body.roleIds);
      if (!isNaN(parsed) && parsed > 0) {
        roleIds = [parsed];
      }
    }

    // Valida se pelo menos um perfil foi selecionado
    if (roleIds.length === 0) {
      const roles = await masterService.getAllRoles();
      const condominios = await masterService.listCondominios();
      return res.render('master/usuarios/form', {
        title: 'Novo Usuário',
        user: req.user,
        roles: roles,
        condominios: condominios,
        error: 'Selecione pelo menos um perfil para o usuário',
        formData: req.body,
      });
    }

    const data = {
      ...req.body,
      roleIds: roleIds,
      condominiumId: req.body.condominiumId ? parseInt(req.body.condominiumId) : null,
    };

    await masterService.createUsuario(data, req.user.id, ipAddress, userAgent);

    res.redirect('/master/usuarios?success=created');
  } catch (error) {
    try {
      const roles = await masterService.getAllRoles();
      const condominios = await masterService.listCondominios();

      // Remove qualquer ID do req.body para garantir que é criação, não edição
      const formData = { ...req.body };
      delete formData.id;

      res.render('master/usuarios/form', {
        title: 'Novo Usuário',
        user: req.user,
        usuario: null, // Sempre null na criação, mesmo após erro
        roles: roles,
        condominios: condominios,
        error: error.message,
        formData: formData, // Passa dados do formulário separadamente
      });
    } catch (renderError) {
      console.error('Erro ao renderizar formulário após erro:', renderError);
      res.status(500).send('Erro ao processar criação de usuário');
    }
  }
};

// Função para exibir formulário de edição de usuário
// GET /master/usuarios/:id/editar
const showEditUsuario = async (req, res) => {
  try {
    // Verifica se não é a rota de criação (proteção extra)
    if (req.params.id === 'novo' || req.params.id === 'criar') {
      return res.redirect('/master/usuarios/novo');
    }

    // Valida e converte ID do usuário
    const userId = parseInt(req.params.id);
    if (isNaN(userId) || userId <= 0) {
      console.error(`[EDIT USER] ID inválido recebido: ${req.params.id}`);
      return res.status(400).send(`ID do usuário inválido: "${req.params.id}". Se você está tentando criar um novo usuário, acesse <a href="/master/usuarios/novo">/master/usuarios/novo</a>`);
    }

    const usuario = await masterService.getUsuarioById(userId);
    const roles = await masterService.getAllRoles();
    const condominios = await masterService.listCondominios();

    if (!usuario) {
      return res.status(404).send('Usuário não encontrado');
    }

    res.render('master/usuarios/form', {
      title: 'Editar Usuário',
      user: req.user,
      usuario: usuario,
      roles: roles,
      condominios: condominios,
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).send('Erro ao carregar usuário');
  }
};

// Função para processar atualização de usuário
// POST /master/usuarios/:id
const updateUsuario = async (req, res) => {
  try {
    // Valida e converte ID do usuário
    const userId = parseInt(req.params.id);
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).send('ID do usuário inválido');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Converte roleIds - remove valores inválidos
    let roleIds = undefined;
    if (req.body.roleIds) {
      if (Array.isArray(req.body.roleIds)) {
        const parsed = req.body.roleIds
          .map(id => parseInt(id))
          .filter(id => !isNaN(id) && id > 0);
        roleIds = parsed.length > 0 ? parsed : undefined;
      } else {
        const parsed = parseInt(req.body.roleIds);
        if (!isNaN(parsed) && parsed > 0) {
          roleIds = [parsed];
        }
      }
    }

    const data = {
      ...req.body,
      roleIds: roleIds,
      condominiumId: req.body.condominiumId ? parseInt(req.body.condominiumId) : null,
      active: req.body.active === 'true' || req.body.active === true,
    };

    await masterService.updateUsuario(userId, data, req.user.id, ipAddress, userAgent);

    res.redirect('/master/usuarios?success=updated');
  } catch (error) {
    try {
      const roles = await masterService.getAllRoles();
      const condominios = await masterService.listCondominios();

      res.render('master/usuarios/form', {
        title: 'Editar Usuário',
        user: req.user,
        usuario: { ...req.body, id: req.params.id },
        roles: roles,
        condominios: condominios,
        error: error.message,
      });
    } catch (renderError) {
      res.status(500).send('Erro ao processar atualização de usuário');
    }
  }
};

// Exporta funções
module.exports = {
  showDashboard,
  listCondominios,
  showCreateCondominio,
  createCondominio,
  showEditCondominio,
  updateCondominio,
  listUsuarios,
  showCreateUsuario,
  createUsuario,
  showEditUsuario,
  updateUsuario,
};
