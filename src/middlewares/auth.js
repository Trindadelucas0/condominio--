// Middleware de autenticação e autorização
// Verifica se o usuário está autenticado (JWT válido)
// Verifica se o usuário tem permissão para acessar a rota (RBAC)

const jwt = require('jsonwebtoken'); // Biblioteca JWT
const { query } = require('../config/database'); // Conexão com banco

// Middleware para verificar autenticação (JWT)
// Extrai token do cookie, valida e anexa dados do usuário à requisição
const authenticate = async (req, res, next) => {
  try {
    // Busca token JWT no cookie (se não encontrar, retorna null)
    const token = req.cookies.token || null;

    // Se não há token, usuário não está autenticado
    if (!token) {
      return res.status(401).redirect('/auth/login?error=not_authenticated');
    }

    // Verifica e decodifica o token usando a chave secreta do .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Busca dados atualizados do usuário no banco (pode ter sido desativado)
    const userResult = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.condominium_id, u.active
       FROM users u
       WHERE u.id = $1 AND u.active = TRUE`,
      [decoded.userId]
    );

    // Se usuário não existe ou está inativo, invalida token
    if (userResult.rows.length === 0) {
      res.clearCookie('token'); // Remove cookie inválido
      return res.status(401).redirect('/auth/login?error=user_inactive');
    }

    // Busca perfis (roles) do usuário
    const rolesResult = await query(
      `SELECT r.name, r.id
       FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [decoded.userId]
    );

    // Extrai nomes dos perfis em array (ex: ['SUPER_MASTER', 'SINDICO'])
    const roles = rolesResult.rows.map((row) => row.name);

    // Anexa dados do usuário à requisição (disponível nos controllers)
    req.user = {
      id: userResult.rows[0].id,
      username: userResult.rows[0].username,
      email: userResult.rows[0].email,
      fullName: userResult.rows[0].full_name,
      condominiumId: userResult.rows[0].condominium_id,
      roles: roles, // Array de perfis
    };

    next(); // Passa para o próximo middleware/controller
  } catch (error) {
    // Se token é inválido/expirado, redireciona para login
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.clearCookie('token');
      return res.status(401).redirect('/auth/login?error=invalid_token');
    }

    // Outros erros são logados e retornam erro 500
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).send('Erro interno de autenticação');
  }
};

// Middleware para verificar autorização (RBAC)
// Verifica se o usuário tem um dos perfis necessários
// Recebe: array de perfis permitidos (ex: ['SUPER_MASTER', 'SINDICO'])
const authorize = (...allowedRoles) => {
  // Retorna função middleware
  return (req, res, next) => {
    // Verifica se usuário está autenticado (req.user vem do middleware authenticate)
    if (!req.user) {
      return res.status(401).redirect('/auth/login?error=not_authenticated');
    }

    // Verifica se o usuário tem algum dos perfis permitidos
    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));

    // Se não tem permissão, retorna erro 403 (Forbidden)
    if (!hasRole) {
      return res.status(403).send('Acesso negado. Permissão insuficiente.');
    }

    next(); // Passa para o próximo middleware/controller
  };
};

// Exporta middlewares para uso nas rotas
module.exports = {
  authenticate, // Verifica autenticação
  authorize, // Verifica autorização (deve vir após authenticate)
};
