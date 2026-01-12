// Script para gerar chave secreta JWT
// Execute: node src/utils/generateJwtSecret.js
// Copie a chave gerada para o arquivo .env

const crypto = require('crypto'); // Módulo nativo do Node.js para criptografia

// Gera string aleatória segura de 64 bytes (512 bits)
// Usa algoritmo cryptographically secure random
const jwtSecret = crypto.randomBytes(64).toString('hex');

// Exibe a chave gerada
console.log('\n✅ Chave JWT gerada com sucesso!\n');
console.log('Copie a linha abaixo para o seu arquivo .env:\n');
console.log(`JWT_SECRET=${jwtSecret}\n`);
console.log('⚠️  IMPORTANTE: Mantenha esta chave em segredo!\n');
