// Validações centralizadas para o sistema

// Valida CNPJ (formato e dígitos verificadores)
const validateCNPJ = (cnpj) => {
  if (!cnpj) return { valid: true, error: null }; // CNPJ é opcional

  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) {
    return { valid: false, error: 'CNPJ deve ter 14 dígitos' };
  }

  // Verifica se todos os dígitos são iguais (CNPJ inválido)
  if (/^(\d)\1+$/.test(cleanCNPJ)) {
    return { valid: false, error: 'CNPJ inválido' };
  }

  // Valida dígitos verificadores
  let length = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, length);
  const digits = cleanCNPJ.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) {
    return { valid: false, error: 'CNPJ inválido (dígito verificador)' };
  }

  length = length + 1;
  numbers = cleanCNPJ.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) {
    return { valid: false, error: 'CNPJ inválido (dígito verificador)' };
  }

  return { valid: true, error: null };
};

// Valida email (formato básico + regex mais rigoroso)
const validateEmail = (email) => {
  if (!email) {
    return { valid: false, error: 'Email é obrigatório' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Email inválido' };
  }

  // Validações adicionais
  if (email.length > 255) {
    return { valid: false, error: 'Email muito longo (máximo 255 caracteres)' };
  }

  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    return { valid: false, error: 'Email inválido' };
  }

  return { valid: true, error: null };
};

// Valida valor financeiro
const validateFinancialAmount = (amount, options = {}) => {
  const {
    allowZero = false,
    allowNegative = false,
    maxValue = 10000000, // R$ 10 milhões padrão
    minValue = 0,
    fieldName = 'Valor'
  } = options;

  if (amount === null || amount === undefined) {
    return { valid: false, error: `${fieldName} é obrigatório` };
  }

  const numAmount = parseFloat(amount);

  if (isNaN(numAmount)) {
    return { valid: false, error: `${fieldName} deve ser um número válido` };
  }

  if (!allowNegative && numAmount < 0) {
    return { valid: false, error: `${fieldName} não pode ser negativo` };
  }

  if (!allowZero && numAmount === 0) {
    return { valid: false, error: `${fieldName} não pode ser zero` };
  }

  if (numAmount < minValue) {
    return { valid: false, error: `${fieldName} deve ser no mínimo ${minValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` };
  }

  if (numAmount > maxValue) {
    return { valid: false, error: `${fieldName} excede o limite máximo de ${maxValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` };
  }

  return { valid: true, error: null, value: numAmount };
};

// Valida data (não pode ser muito futura)
const validateDate = (date, options = {}) => {
  const {
    allowFuture = true,
    maxFutureDays = 365, // 1 ano no futuro
    allowPast = true,
    fieldName = 'Data'
  } = options;

  if (!date) {
    return { valid: false, error: `${fieldName} é obrigatória` };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: `${fieldName} inválida` };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((dateObj - today) / (1000 * 60 * 60 * 24));

  if (!allowPast && diffDays < 0) {
    return { valid: false, error: `${fieldName} não pode ser no passado` };
  }

  if (!allowFuture && diffDays > 0) {
    return { valid: false, error: `${fieldName} não pode ser no futuro` };
  }

  if (allowFuture && diffDays > maxFutureDays) {
    return { valid: false, error: `${fieldName} não pode ser mais de ${maxFutureDays} dias no futuro` };
  }

  return { valid: true, error: null };
};

module.exports = {
  validateCNPJ,
  validateEmail,
  validateFinancialAmount,
  validateDate,
};
