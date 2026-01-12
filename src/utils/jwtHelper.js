// Helper para gerenciar JWT com refresh token
// Implementa sistema de refresh token para melhorar segurança

const jwt = require('jsonwebtoken');

// Gera access token (expira em 15 minutos)
const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Token de acesso expira em 15 minutos
  );
};

// Gera refresh token (expira em 7 dias)
const generateRefreshToken = (payload) => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, // Pode usar secret diferente
    { expiresIn: '7d' } // Refresh token expira em 7 dias
  );
};

// Verifica access token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    }
    throw new Error('Token inválido');
  }
};

// Verifica refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
    
    if (decoded.type !== 'refresh') {
      throw new Error('Token não é um refresh token');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expirado');
    }
    throw new Error('Refresh token inválido');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
