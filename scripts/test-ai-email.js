require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { Resend } = require('resend');

const ensureEnv = (name) => {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Variável obrigatória ausente: ${name}`);
  }
  return String(value).trim();
};

const redactEmail = (email) => {
  const value = String(email || '');
  const at = value.indexOf('@');
  if (at <= 1) return '***';
  return `${value.slice(0, 2)}***${value.slice(at)}`;
};

const extractGeminiText = (response) => {
  const direct = String(response?.text || '').trim();
  if (direct) return direct;
  const parts = response?.candidates?.[0]?.content?.parts || [];
  const joined = parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();
  return joined || '(sem texto retornado)';
};

const testGemini = async () => {
  const apiKey = ensureEnv('GEMINI_API_KEY');
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const client = new GoogleGenAI({ apiKey });
  const startedAt = Date.now();
  const response = await client.models.generateContent({
    model,
    contents: 'Responda somente com: OK_GEMINI',
    config: {
      temperature: 0,
      maxOutputTokens: 24,
    },
  });

  const usage = response.usageMetadata || {};
  const text = extractGeminiText(response);

  console.log('[TEST_GEMINI] sucesso', {
    model,
    elapsedMs: Date.now() - startedAt,
    text,
    requestTokens: usage.promptTokenCount || 0,
    responseTokens: usage.candidatesTokenCount || 0,
  });

  return { text, usage };
};

const testResend = async (geminiResult) => {
  const apiKey = ensureEnv('RESEND_API_KEY');
  const fromEmail = ensureEnv('RESEND_FROM_EMAIL');
  const fromName = (process.env.RESEND_FROM_NAME || 'Sistema Condominio').trim();
  const toEmail = (process.env.TEST_TO_EMAIL || process.env.RESEND_FROM_EMAIL || '').trim();
  if (!toEmail) {
    throw new Error('Defina TEST_TO_EMAIL (ou RESEND_FROM_EMAIL) para envio de teste');
  }

  const resend = new Resend(apiKey);
  const subject = '[TESTE] Gemini + Resend';
  const bodyLines = [
    'Teste automático concluído.',
    '',
    `Gemini: ${geminiResult.text || '(vazio)'}`,
    `Prompt tokens: ${geminiResult.usage?.promptTokenCount || 0}`,
    `Output tokens: ${geminiResult.usage?.candidatesTokenCount || 0}`,
    `Data: ${new Date().toLocaleString('pt-BR')}`,
  ];
  const text = bodyLines.join('\n');

  console.log('[TEST_RESEND] enviando', {
    to: redactEmail(toEmail),
    from: redactEmail(fromEmail),
    subject,
  });

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: [toEmail],
    subject,
    text,
    html: `<pre style="font-family:monospace;white-space:pre-wrap">${text}</pre>`,
  });

  if (error) {
    throw new Error(error.message || 'Falha no envio via Resend');
  }

  console.log('[TEST_RESEND] sucesso', { emailId: data?.id || null });
};

const main = async () => {
  try {
    const geminiResult = await testGemini();
    await testResend(geminiResult);
    console.log('[TESTE_COMPLETO] OK');
  } catch (error) {
    console.error('[TESTE_COMPLETO] ERRO', { message: error.message });
    process.exit(1);
  }
};

main();
