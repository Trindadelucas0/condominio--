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

    // Log de debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production' && roles.length === 0) {
      console.warn(`[AUTH] ⚠️  Usuário ${userResult.rows[0].username} (ID: ${decoded.userId}) não tem nenhum perfil atribuído!`);
    }

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

    // Log de debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTHORIZE] Usuário: ${req.user.username} (ID: ${req.user.id})`);
      console.log(`[AUTHORIZE] Roles do usuário:`, req.user.roles);
      console.log(`[AUTHORIZE] Roles permitidos:`, allowedRoles);
    }

    // Verifica se o usuário tem algum dos perfis permitidos
    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));

    // Se não tem permissão, retorna erro 403 (Forbidden) com informações de debug
    if (!hasRole) {
      const errorMessage = `Acesso negado. Permissão insuficiente.
      
Usuário: ${req.user.username} (ID: ${req.user.id})
Perfis do usuário: ${req.user.roles.join(', ') || 'Nenhum'}
Perfis necessários: ${allowedRoles.join(', ')}

Se você acabou de atribuir um perfil a este usuário, peça para ele fazer logout e login novamente.`;
      
      console.error(`[AUTHORIZE] Acesso negado para ${req.user.username}:`, {
        userRoles: req.user.roles,
        requiredRoles: allowedRoles,
        hasRole: hasRole
      });
      
      return res.status(403).send(errorMessage);
    }

    // Log de sucesso (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTHORIZE] ✅ Acesso permitido para ${req.user.username}`);
    }

    next(); // Passa para o próximo middleware/controller
  };
};

// Middleware para verificar permissão específica (AÇÃO x ENTIDADE)
// Verifica se o usuário tem permissão para uma ação específica em uma entidade
// Recebe: entityType, action
// Exemplo: authorizeAction('financial_exits', 'approve')
const authorizeAction = (entityType, action) => {
  const permissionService = require('../services/permissionService');
  
  return async (req, res, next) => {
    // Verifica se usuário está autenticado
    if (!req.user) {
      return res.status(401).redirect('/auth/login?error=not_authenticated');
    }

    // Verifica permissão usando o serviço formal
    const hasPerm = await permissionService.hasPermission(
      req.user.id,
      entityType,
      action
    );

    if (!hasPerm) {
      const errorMessage = `Acesso negado. Permissão insuficiente.
      
Usuário: ${req.user.username} (ID: ${req.user.id})
Ação necessária: ${action} em ${entityType}
Perfis do usuário: ${req.user.roles.join(', ') || 'Nenhum'}

Esta ação requer permissão específica que não está atribuída aos seus perfis.`;
      
      console.error(`[AUTHORIZE_ACTION] Acesso negado para ${req.user.username}:`, {
        entityType,
        action,
        userRoles: req.user.roles,
      });
      
      return res.status(403).send(errorMessage);
    }

    // Log de sucesso (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTHORIZE_ACTION] ✅ Permissão ${entityType}:${action} concedida para ${req.user.username}`);
    }

    next();
  };
};

// Middleware para verificar transição de estado
// Verifica se o usuário pode fazer uma transição de estado específica
// Recebe: entityType, fromState, toState
// Exemplo: authorizeTransition('financial_exits', 'PENDING', 'APPROVED')
const authorizeTransition = (entityType, fromState, toState) => {
  const permissionService = require('../services/permissionService');
  
  return async (req, res, next) => {
    // Verifica se usuário está autenticado
    if (!req.user) {
      return res.status(401).redirect('/auth/login?error=not_authenticated');
    }

    // Verifica se a transição é permitida
    const canTrans = await permissionService.canTransition(
      req.user.id,
      entityType,
      fromState,
      toState
    );

    if (!canTrans) {
      const errorMessage = `Transição de estado não permitida.
      
Usuário: ${req.user.username} (ID: ${req.user.id})
Entidade: ${entityType}
Transição: ${fromState} → ${toState}
Perfis do usuário: ${req.user.roles.join(', ') || 'Nenhum'}

Esta transição de estado não é permitida ou você não tem permissão para realizá-la.`;
      
      console.error(`[AUTHORIZE_TRANSITION] Transição negada para ${req.user.username}:`, {
        entityType,
        fromState,
        toState,
        userRoles: req.user.roles,
      });
      
      return res.status(403).send(errorMessage);
    }

    // Log de sucesso (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTHORIZE_TRANSITION] ✅ Transição ${fromState} → ${toState} permitida para ${req.user.username}`);
    }

    next();
  };
};

// Exporta middlewares para uso nas rotas
module.exports = {
  authenticate, // Verifica autenticação
  authorize, // Verifica autorização por perfil (deve vir após authenticate)
  authorizeAction, // Verifica permissão específica (AÇÃO x ENTIDADE)
  authorizeTransition, // Verifica transição de estado
};
