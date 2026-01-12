// Função helper para renderizar página de erro de forma consistente
// Evita páginas em branco e garante que sempre há uma resposta adequada

const renderError = (res, statusCode, message, error = null) => {
  res.status(statusCode).render('error', {
    message: message || 'Ocorreu um erro ao processar sua solicitação',
    error: process.env.NODE_ENV === 'development' && error ? {
      message: error.message,
      stack: error.stack,
    } : {}
  });
};

module.exports = {
  renderError,
};
