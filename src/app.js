// Configuração principal da aplicação Express
// Este arquivo configura o servidor, middlewares e rotas

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Cria instância do Express
const app = express();

// Configuração de porta
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(express.json()); // Parse JSON no body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded
app.use(cookieParser()); // Parse cookies

// Configuração de views (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Servir arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, '../public')));

// Servir uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas públicas (autenticação)
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

// Middleware para verificar autenticação em rotas protegidas
const { authenticate } = require('./middlewares/auth');

// Rotas protegidas (requerem autenticação)
const masterRoutes = require('./routes/masterRoutes');
const sindicoRoutes = require('./routes/sindicoRoutes');
const financeiroRoutes = require('./routes/financeiroRoutes');
const administrativoRoutes = require('./routes/administrativoRoutes');
const operacionalRoutes = require('./routes/operacionalRoutes');
const limpezaRoutes = require('./routes/limpezaRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const patrimonioRoutes = require('./routes/patrimonioRoutes');
const conselhoRoutes = require('./routes/conselhoRoutes');
const configRoutes = require('./routes/configRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const automationRoutes = require('./routes/automationRoutes');
const assemblyRoutes = require('./routes/assemblyRoutes');

// Aplicar rotas
app.use('/master', masterRoutes);
app.use('/sindico', sindicoRoutes);
app.use('/financeiro', financeiroRoutes);
app.use('/administrativo', administrativoRoutes);
app.use('/operacional', operacionalRoutes);
app.use('/limpeza', limpezaRoutes);
app.use('/estoque', estoqueRoutes);
app.use('/patrimonio', patrimonioRoutes);
app.use('/conselho', conselhoRoutes);
app.use('/config', configRoutes);
app.use('/notifications', notificationRoutes);
app.use('/automation', automationRoutes);
app.use('/assembleias', assemblyRoutes);

// Rota raiz - sempre redireciona para login
// Após login bem-sucedido, o authController redireciona para o dashboard correto
app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message || 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Middleware para rotas não encontradas (404)
app.use((req, res) => {
  res.status(404).render('error', {
    message: 'Página não encontrada',
    error: {}
  });
});

// Exporta app para uso no server.js
module.exports = app;
