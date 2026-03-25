const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';
const csrfCookieName = 'login_csrf_token';

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
  },
});

const issueLoginCsrf = (req, res, next) => {
  const token = crypto.randomBytes(24).toString('hex');
  res.cookie(csrfCookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 10 * 60 * 1000,
  });
  res.locals.csrfToken = token;
  next();
};

const validateLoginCsrf = (req, res, next) => {
  const sentToken = req.body?._csrf;
  const cookieToken = req.cookies?.[csrfCookieName];

  if (!sentToken || !cookieToken || sentToken !== cookieToken) {
    return res.status(403).render('auth/login', {
      error: 'csrf_invalid',
      errorMessages: {
        csrf_invalid: 'Sessão de segurança inválida. Atualize a página e tente novamente.',
      },
      csrfToken: null,
    });
  }

  return next();
};

module.exports = {
  loginRateLimit,
  issueLoginCsrf,
  validateLoginCsrf,
};
