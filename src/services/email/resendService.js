const { Resend } = require('resend');

let resendClient = null;

const isEmailEnabled = () => process.env.REPORT_EMAIL_ENABLED !== 'false';
const redactEmail = (email) => {
  const value = String(email || '');
  const at = value.indexOf('@');
  if (at <= 1) return '***';
  return `${value.slice(0, 2)}***${value.slice(at)}`;
};

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY não configurada');
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

const getFromAddress = (from = null) => {
  const fromEmail = (from && from.email) || process.env.RESEND_FROM_EMAIL;
  const fromName = (from && from.name) || process.env.RESEND_FROM_NAME || 'Sistema Condominio';
  if (!fromEmail) {
    throw new Error('Remetente não configurado. Defina from_email no condomínio ou RESEND_FROM_EMAIL no .env');
  }
  return `${fromName} <${fromEmail}>`;
};

const normalizeRecipients = (to) => {
  const recipients = Array.isArray(to) ? to : [to];
  return recipients.map((item) => String(item || '').trim()).filter(Boolean);
};

const sendEmail = async ({ to, subject, text, html, attachments = [], from = null }) => {
  if (!isEmailEnabled()) {
    console.log('[RESEND] Envio desabilitado por REPORT_EMAIL_ENABLED=false');
    return { id: null, disabled: true };
  }

  const recipients = normalizeRecipients(to);
  if (recipients.length === 0) {
    throw new Error('Nenhum destinatário informado para envio de email');
  }

  const fromAddress = getFromAddress(from);
  console.log('[RESEND] Iniciando envio', {
    toCount: recipients.length,
    toSample: recipients.slice(0, 3).map(redactEmail),
    from: redactEmail(fromAddress),
    subject,
    attachments: attachments.length,
  });

  const client = getResendClient();
  const { data, error } = await client.emails.send({
    from: fromAddress,
    to: recipients,
    subject,
    text,
    html,
    attachments,
  });

  if (error) {
    console.error('[RESEND] Falha no envio', { message: error.message, subject });
    throw new Error(error.message || 'Erro ao enviar email via Resend');
  }

  console.log('[RESEND] Email enviado com sucesso', { id: data?.id || null, subject });
  return { id: data?.id || null, disabled: false };
};

module.exports = {
  sendEmail,
  isEmailEnabled,
};
