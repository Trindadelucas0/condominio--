# 📝 INSTRUÇÕES PARA INTEGRAR VALIDAÇÕES

## ✅ ARQUIVOS CRIADOS

### 1. `src/database/init.js` - RECRIADO COMPLETO
- Inclui todas as fases (1-21b)
- Executa automaticamente FASE 21 e 21b
- ✅ PRONTO PARA USO

### 2. `src/services/masterServiceEnhanced.js` - NOVO
- Funções `createCondominium` e `createUser` com validações
- Valida CNPJ (formato + dígitos)
- Valida email (rigoroso)
- Verifica duplicatas

### 3. `src/utils/jwtHelper.js` - NOVO
- Sistema de refresh token
- Access token (15 minutos)
- Refresh token (7 dias)

## 🔄 INTEGRAÇÕES NECESSÁRIAS

### 1. Atualizar `src/services/masterService.js`

Se o arquivo estiver vazio, substitua pelo conteúdo de `masterServiceEnhanced.js` ou importe as funções:

```javascript
const { createCondominium, createUser } = require('./masterServiceEnhanced');

// Use as funções validadas
module.exports = {
  // ... outras funções existentes
  createCondominium,
  createUser,
};
```

### 2. Atualizar `src/controllers/masterController.js`

Use as funções validadas do masterService:

```javascript
const masterService = require('../services/masterService');

const createCondominio = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    
    const condominium = await masterService.createCondominium(
      req.body,
      req.user.id,
      ipAddress,
      userAgent
    );
    
    res.redirect('/master/condominios?success=created');
  } catch (error) {
    res.render('master/condominios/form', {
      error: error.message,
      // ... outros dados
    });
  }
};
```

### 3. Atualizar `.env`

Adicione (opcional, usa JWT_SECRET se não definido):
```
JWT_REFRESH_SECRET=seu_refresh_secret_aqui
```

## ✅ VALIDAÇÕES ATIVAS

Após integrar:

- ✅ CNPJ validado em criação de condomínios
- ✅ Email validado em criação de condomínios e usuários
- ✅ Duplicatas verificadas (CNPJ e email)
- ✅ Refresh token implementado
- ✅ Access token renova automaticamente

## 🧪 TESTAR

1. Criar condomínio com CNPJ inválido → deve falhar
2. Criar condomínio com CNPJ duplicado → deve falhar
3. Criar usuário com email inválido → deve falhar
4. Fazer login → deve receber accessToken e refreshToken
5. Aguardar 15 minutos → deve renovar automaticamente
