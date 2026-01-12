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
      user_inactive: 'Usuário inativo. Entre em contato com o administrador',
      invalid_credentials: 'Usuário ou senha incorretos',
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

    // Chama service para validar credenciais e gerar token
    const { user, token } = await authService.login(username, password, ipAddress, userAgent);

    // Define cookie HTTP-only com o token (mais seguro que localStorage)
    res.cookie('token', token, {
      httpOnly: true, // Cookie não acessível via JavaScript (proteção XSS)
      secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
      maxAge: 24 * 60 * 60 * 1000, // Expira em 24 horas (mesmo tempo do JWT)
      sameSite: 'strict', // Proteção CSRF
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

// Função para processar logout
// POST /auth/logout
const processLogout = async (req, res) => {
  // Remove cookie de autenticação
  res.clearCookie('token');
  
  // Redireciona para login
  res.redirect('/auth/login');
};

// Exporta funções para uso nas rotas
module.exports = {
  showLogin, // Exibe página de login
  processLogin, // Processa tentativa de login
  processLogout, // Processa logout
};
