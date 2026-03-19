// Service de Notificações Específicas
// Gera avisos automáticos para eventos específicos

const { query } = require('../config/database');

// Função para criar aviso de boleto gerado
const createBilletGeneratedAlert = async (condominiumId, apartmentId, feeId) => {
  try {
    const apartmentResult = await query(
      `SELECT * FROM apartments WHERE id = $1 AND condominium_id = $2`,
      [apartmentId, condominiumId]
    );

    if (apartmentResult.rows.length === 0) return;

    const apartment = apartmentResult.rows[0];

    // Cria alerta para o síndico
    await query(
      `INSERT INTO alerts (
        condominium_id, alert_type, severity, title, message,
        entity_type, entity_id
      )
      VALUES ($1, 'BILLET_GENERATED', 'INFO', $2, $3, 'monthly_fees', $4)`,
      [
        condominiumId,
        `Boleto Gerado - Apartamento ${apartment.number}`,
        `Boleto gerado para o apartamento ${apartment.number}${apartment.block ? ` - Bloco ${apartment.block}` : ''}`,
        feeId
      ]
    );
  } catch (error) {
    console.error('Erro ao criar aviso de boleto gerado:', error);
  }
};

// Função para criar aviso de atraso
const createPaymentOverdueAlert = async (condominiumId, feeId, daysOverdue) => {
  try {
    const feeResult = await query(
      `SELECT mf.*, a.number as apartment_number, a.block
       FROM monthly_fees mf
       JOIN apartments a ON mf.apartment_id = a.id
       WHERE mf.id = $1 AND mf.condominium_id = $2`,
      [feeId, condominiumId]
    );

    if (feeResult.rows.length === 0) return;

    const fee = feeResult.rows[0];

    // Determina severidade baseado em dias de atraso
    let severity = 'WARNING';
    if (daysOverdue >= 30) severity = 'CRITICAL';
    else if (daysOverdue >= 15) severity = 'WARNING';

    await query(
      `INSERT INTO alerts (
        condominium_id, alert_type, severity, title, message,
        entity_type, entity_id
      )
      VALUES ($1, 'PAYMENT_OVERDUE', $2, $3, $4, 'monthly_fees', $5)
      ON CONFLICT DO NOTHING`,
      [
        condominiumId,
        severity,
        `Pagamento em Atraso - Apartamento ${fee.apartment_number}`,
        `Taxa do apartamento ${fee.apartment_number}${fee.block ? ` - Bloco ${fee.block}` : ''} está ${daysOverdue} dia(s) em atraso. Valor: R$ ${parseFloat(fee.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        feeId
      ]
    );
  } catch (error) {
    console.error('Erro ao criar aviso de atraso:', error);
  }
};

// Função para criar aviso de assembleia agendada
const createAssemblyScheduledAlert = async (condominiumId, assemblyId, daysBefore) => {
  try {
    const assemblyResult = await query(
      `SELECT * FROM assemblies WHERE id = $1 AND condominium_id = $2`,
      [assemblyId, condominiumId]
    );

    if (assemblyResult.rows.length === 0) return;

    const assembly = assemblyResult.rows[0];

    await query(
      `INSERT INTO alerts (
        condominium_id, alert_type, severity, title, message,
        entity_type, entity_id
      )
      VALUES ($1, 'ASSEMBLY_SCHEDULED', 'INFO', $2, $3, 'assemblies', $4)`,
      [
        condominiumId,
        `Assembleia Agendada - ${assembly.type}`,
        `Assembleia ${assembly.type.toLowerCase()} agendada para ${new Date(assembly.date).toLocaleDateString('pt-BR')}${assembly.time ? ` às ${assembly.time}` : ''}. ${daysBefore > 0 ? `Faltam ${daysBefore} dia(s).` : ''}`,
        assemblyId
      ]
    );
  } catch (error) {
    console.error('Erro ao criar aviso de assembleia:', error);
  }
};

// Função para criar aviso de manutenção programada
const createMaintenanceDueAlert = async (condominiumId, maintenanceId, daysBefore) => {
  try {
    const maintenanceResult = await query(
      `SELECT * FROM maintenances WHERE id = $1 AND condominium_id = $2`,
      [maintenanceId, condominiumId]
    );

    if (maintenanceResult.rows.length === 0) return;

    const maintenance = maintenanceResult.rows[0];

    let severity = 'INFO';
    if (daysBefore <= 0) severity = 'WARNING';
    if (daysBefore < -7) severity = 'CRITICAL';

    await query(
      `INSERT INTO alerts (
        condominium_id, alert_type, severity, title, message,
        entity_type, entity_id
      )
      VALUES ($1, 'MAINTENANCE_DUE', $2, $3, $4, 'maintenances', $5)`,
      [
        condominiumId,
        `Manutenção Programada - ${maintenance.title}`,
        `Manutenção "${maintenance.title}" ${daysBefore > 0 ? `programada para daqui a ${daysBefore} dia(s)` : daysBefore === 0 ? 'programada para hoje' : `está ${Math.abs(daysBefore)} dia(s) atrasada`}.`,
        maintenanceId
      ]
    );
  } catch (error) {
    console.error('Erro ao criar aviso de manutenção:', error);
  }
};

// Função para verificar e criar avisos automáticos
const checkAndCreateAutomaticAlerts = async (condominiumId) => {
  try {
    // Verifica taxas em atraso
    const overdueFees = await query(
      `SELECT id, days_overdue FROM monthly_fees 
       WHERE condominium_id = $1 AND paid = FALSE AND due_date < CURRENT_DATE`,
      [condominiumId]
    );

    for (const fee of overdueFees.rows) {
      await createPaymentOverdueAlert(condominiumId, fee.id, fee.days_overdue);
    }

    // Verifica assembleias agendadas (7 dias antes)
    const upcomingAssemblies = await query(
      `SELECT id, date FROM assemblies 
       WHERE condominium_id = $1 
       AND status = 'SCHEDULED' 
       AND date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`,
      [condominiumId]
    );

    for (const assembly of upcomingAssemblies.rows) {
      const daysBefore = Math.floor((new Date(assembly.date) - new Date()) / (1000 * 60 * 60 * 24));
      await createAssemblyScheduledAlert(condominiumId, assembly.id, daysBefore);
    }

    // Verifica manutenções programadas (3 dias antes)
    const upcomingMaintenances = await query(
      `SELECT id, scheduled_date, title FROM maintenances 
       WHERE condominium_id = $1 
       AND status = 'pendente' 
       AND scheduled_date BETWEEN CURRENT_DATE - INTERVAL '7 days' AND CURRENT_DATE + INTERVAL '3 days'`,
      [condominiumId]
    );

    for (const maintenance of upcomingMaintenances.rows) {
      const daysBefore = Math.floor((new Date(maintenance.scheduled_date) - new Date()) / (1000 * 60 * 60 * 24));
      await createMaintenanceDueAlert(condominiumId, maintenance.id, daysBefore);
    }
  } catch (error) {
    console.error('Erro ao verificar avisos automáticos:', error);
  }
};

module.exports = {
  createBilletGeneratedAlert,
  createPaymentOverdueAlert,
  createAssemblyScheduledAlert,
  createMaintenanceDueAlert,
  checkAndCreateAutomaticAlerts
};
