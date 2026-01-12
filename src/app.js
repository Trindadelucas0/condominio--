// Arquivo principal da aplicação Express
// Configura middlewares, rotas e views
// Não inicia o servidor (isso é feito no server.js)

const express = require('express'); // Framework Express
const path = require('path'); // Para caminhos de arquivos
const cookieParser = require('cookie-parser'); // Para ler cookies (JWT)

const app = express(); // Cria instância do Express

// Configuração do diretório de views (EJS)
// Todas as views devem estar em views/
app.set('views', path.join(__dirname, '../views')); // Define pasta de views
app.set('view engine', 'ejs'); // Define EJS como engine de templates

// Middleware para servir arquivos estáticos (CSS, JS, imagens)
// Arquivos em public/ ficam acessíveis via URL
app.use(express.static(path.join(__dirname, '../public')));

// Middleware para processar JSON no corpo das requisições
// Permite receber dados JSON em POST/PUT
app.use(express.json());

// Middleware para processar formulários HTML (application/x-www-form-urlencoded)
// Permite receber dados de formulários
app.use(express.urlencoded({ extended: true }));

// Middleware para ler cookies
// Necessário para JWT armazenado em cookie
app.use(cookieParser());

// Importa rotas
const authRoutes = require('./routes/authRoutes'); // Rotas de autenticação
const masterRoutes = require('./routes/masterRoutes'); // Rotas do SUPER_MASTER
const sindicoRoutes = require('./routes/sindicoRoutes'); // Rotas do SINDICO/SUBSINDICO
const administrativoRoutes = require('./routes/administrativoRoutes'); // Rotas do ADMINISTRATIVO
const operacionalRoutes = require('./routes/operacionalRoutes'); // Rotas do OPERACIONAL
const conselhoRoutes = require('./routes/conselhoRoutes'); // Rotas do CONSELHO

// Registra rotas na aplicação
app.use('/auth', authRoutes); // Todas as rotas de /auth/*
app.use('/master', masterRoutes); // Todas as rotas de /master/* (exige SUPER_MASTER)
app.use('/sindico', sindicoRoutes); // Todas as rotas de /sindico/* (exige SINDICO ou SUBSINDICO)
app.use('/administrativo', administrativoRoutes); // Todas as rotas de /administrativo/* (exige ADMINISTRATIVO)
app.use('/operacional', operacionalRoutes); // Todas as rotas de /operacional/* (exige OPERACIONAL)
app.use('/conselho', conselhoRoutes); // Todas as rotas de /conselho/* (exige CONSELHO)

// Rota raiz (/) redireciona para login
app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

// Middleware de tratamento de erros 404 (página não encontrada)
// Deve ficar após todas as rotas
app.use((req, res) => {
  res.status(404).send('Página não encontrada');
});

// Middleware de tratamento de erros genéricos
// Captura erros não tratados e retorna resposta genérica
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).send('Erro interno do servidor');
});

// Exporta app para uso no server.js
module.exports = app;
