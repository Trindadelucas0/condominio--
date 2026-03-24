// Service para envio de emails
// Gerencia envio de emails do sistema (convocações, notificações, etc)
const { logAction } = require('../utils/logger');
const { sendEmail } = require('./email/resendService');

// Função para enviar convocação de assembleia por email
// Recebe: assembly, condominium, emails (array de objetos com owner_email, owner_name, etc)
// Retorna: número de emails enviados
const sendAssemblyConvocation = async (assembly, condominium, emails) => {
  try {
    // Em produção, aqui seria a integração com serviço de email real
    // Por enquanto, apenas registra no log e simula envio

    const assemblyDate = new Date(assembly.date);
    const dateStr = assemblyDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let sentCount = 0;
    const errors = [];

    for (const emailData of emails) {
      try {
        // Template do email
        const emailSubject = `Convocação de Assembleia - ${condominium.name}`;
        const emailBody = `
Prezado(a) ${emailData.owner_name || 'Condômino'},

Informamos que está convocada a Assembleia ${assembly.type === 'ORDINARIA' ? 'Ordinária' : assembly.type === 'EXTRAORDINARIA' ? 'Extraordinária' : 'Especial'} do condomínio ${condominium.name}.

Data: ${dateStr}
${assembly.time ? `Horário: ${assembly.time}` : ''}
${assembly.location ? `Local: ${assembly.location}` : ''}

Pauta:
${assembly.agenda}

${assembly.quorum ? `Quórum necessário: ${assembly.quorum} apartamentos` : ''}

Sua presença é muito importante!

Atenciosamente,
Administração do Condomínio ${condominium.name}
        `.trim();

        await sendEmail({
          to: emailData.owner_email,
          subject: emailSubject,
          text: emailBody,
          html: emailBody.replace(/\n/g, '<br>'),
        });

        sentCount++;
      } catch (error) {
        console.error(`Erro ao enviar email para ${emailData.owner_email}:`, error);
        errors.push({ email: emailData.owner_email, error: error.message });
      }
    }

    // Registra no log de auditoria
    await logAction({
      userId: null, // Sistema
      condominiumId: condominium.id,
      action: 'SEND_EMAIL',
      module: 'ADMINISTRATIVE',
      entityType: 'assemblies',
      entityId: assembly.id,
      afterData: {
        type: 'ASSEMBLY_CONVOCATION',
        sentCount: sentCount,
        totalRecipients: emails.length,
        errors: errors
      },
      ipAddress: null,
      userAgent: 'SYSTEM',
    });

    if (errors.length > 0) {
      console.warn(`Alguns emails falharam: ${errors.length} de ${emails.length}`);
    }

    return sentCount;
  } catch (error) {
    console.error('Erro ao enviar convocações:', error);
    throw error;
  }
};

// Função para enviar notificação genérica
// Recebe: to (email ou array de emails), subject, body
// Retorna: número de emails enviados
const sendNotification = async (to, subject, body, condominiumId = null) => {
  try {
    const recipients = Array.isArray(to) ? to : [to];
    let sentCount = 0;

    for (const recipient of recipients) {
      try {
        await sendEmail({
          to: recipient,
          subject,
          text: body,
          html: body.replace(/\n/g, '<br>'),
        });
        sentCount++;
      } catch (error) {
        console.error(`Erro ao enviar email para ${recipient}:`, error);
      }
    }

    return sentCount;
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    throw error;
  }
};

module.exports = {
  sendAssemblyConvocation,
  sendNotification
};
