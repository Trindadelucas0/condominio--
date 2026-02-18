// Controller de autenticação
// Recebe requisições HTTP, chama services e retorna respostas
// Gerencia fluxo de login e logout

const authService = require('../services/authService'); // Service de autenticação

// Função para exibir página de login
// GET /auth/login
const showLogin = (req, res) => {
  // Verifica se há mensagem de erro na query string
  const error = req.query.error || null;
  
  // Renderiza view de login (EJS)
  // Passa mensagem de erro se houver
  res.render('auth/login', {
    error: error,
    // Mapeia códigos de erro para mensagens amigáveis
    errorMessages: {
      not_authenticated: 'Você precisa fazer login para acessar o sistema',
      invalid_token: 'Sua sessão expirou. Faça login novamente',
      token_expired: 'Sua sessão expirou. Faça login novamente',
      user_inactive: 'Usuário inativo. Entre em contato com o administrador',
      condominium_inactive: 'Condomínio inativo. Entre em contato com o administrador do sistema',
      invalid_credentials: 'Usuário ou senha incorretos',
      no_role: 'Seu usuário não possui perfil de acesso. Entre em contato com o administrador.',
    },
  });
};

// Função para processar login
// POST /auth/login
const processLogin = async (req, res) => {
  try {
    // Extrai username e senha do corpo da requisição
    const { username, password } = req.body;

    // Validação básica (campos obrigatórios)
    if (!username || !password) {
      return res.render('auth/login', {
        error: 'invalid_credentials',
        errorMessages: {
          invalid_credentials: 'Preencha usuário e senha',
        },
      });
    }

    // Extrai IP e user agent para log de auditoria
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Chama service para validar credenciais e gerar tokens
    const loginResult = await authService.login(username, password, ipAddress, userAgent);
    const { user, accessToken, refreshToken } = loginResult;

    // Define cookies HTTP-only com os tokens (mais seguro que localStorage)
    // Access token (15 minutos)
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutos
      sameSite: 'strict',
    });

    // Refresh token (7 dias)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      sameSite: 'strict',
    });

    // Mantém compatibilidade com código antigo (token)
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutos
      sameSite: 'strict',
    });

    // Redireciona conforme perfil do usuário
    // Prioridade: SUPER_MASTER > SINDICO/SUBSINDICO > outros
    if (user.roles.includes('SUPER_MASTER')) {
      return res.redirect('/master/dashboard');
    } else if (user.roles.includes('SINDICO') || user.roles.includes('SUBSINDICO')) {
      return res.redirect('/sindico/dashboard');
    } else if (user.roles.includes('FINANCEIRO')) {
      return res.redirect('/financeiro/dashboard');
    } else if (user.roles.includes('PATRIMONIO')) {
      return res.redirect('/patrimonio/dashboard');
    } else if (user.roles.includes('ADMINISTRATIVO')) {
      return res.redirect('/administrativo/dashboard');
    } else if (user.roles.includes('OPERACIONAL')) {
      return res.redirect('/operacional/dashboard');
    } else if (user.roles.includes('LIMPEZA')) {
      return res.redirect('/limpeza/dashboard'); // LIMPEZA tem seu próprio dashboard
    } else if (user.roles.includes('CONSELHO')) {
      return res.redirect('/conselho/dashboard');
    }

    // Se não tem perfil conhecido, redireciona para login com erro
    return res.redirect('/auth/login?error=no_role');
  } catch (error) {
    // Em caso de erro, renderiza login novamente com mensagem de erro
    return res.render('auth/login', {
      error: 'invalid_credentials',
      errorMessages: {
        invalid_credentials: error.message || 'Erro ao fazer login',
      },
    });
  }
};

// Retorna a URL do dashboard conforme os perfis do usuário (mesma prioridade do login)
const getDashboardUrl = (roles = []) => {
  if (roles.includes('SUPER_MASTER')) return '/master/dashboard';
  if (roles.includes('SINDICO') || roles.includes('SUBSINDICO')) return '/sindico/dashboard';
  if (roles.includes('FINANCEIRO')) return '/financeiro/dashboard';
  if (roles.includes('PATRIMONIO')) return '/patrimonio/dashboard';
  if (roles.includes('ADMINISTRATIVO')) return '/administrativo/dashboard';
  if (roles.includes('OPERACIONAL')) return '/operacional/dashboard';
  if (roles.includes('LIMPEZA')) return '/limpeza/dashboard';
  if (roles.includes('CONSELHO')) return '/conselho/dashboard';
  return null;
};

// Página elegante quando o usuário acessa área não vinculada ao seu perfil
// GET /auth/sem-acesso (requer authenticate)
const showSemAcesso = (req, res) => {
  const dashboardUrl = getDashboardUrl(req.user?.roles || []);
  res.render('auth/sem-acesso', {
    user: req.user,
    dashboardUrl,
  });
};

// Função para processar logout
// POST /auth/logout
const processLogout = async (req, res) => {
  // Remove todos os cookies de autenticação
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.clearCookie('token'); // Compatibilidade
  
  // Redireciona para login
  res.redirect('/auth/login');
};

// Exporta funções para uso nas rotas
module.exports = {
  showLogin, // Exibe página de login
  processLogin, // Processa tentativa de login
  processLogout, // Processa logout
  showSemAcesso, // Página de acesso não disponível (perfil não vinculado)
};
