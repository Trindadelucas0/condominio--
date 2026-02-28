// Service do módulo INADIMPLÊNCIA
// Contém lógica de negócio para controle de inadimplência
// Acesso: FINANCEIRO, SINDICO

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');
const { validateUserBelongsToCondominium } = require('../utils/queryHelper');
const { DEFAULT_RECEITA_CATEGORY } = require('../constants/financialCategories');

// Função para criar apartamento
const createApartment = async (condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const { number, block, ownerName, ownerDocument, ownerPhone, ownerEmail, fractionIdeal } = data;

    if (!number || !number.trim()) {
      throw new Error('Número do apartamento é obrigatório');
    }

    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    // Verifica se já existe
    const existingResult = await query(
      `SELECT * FROM apartments 
       WHERE condominium_id = $1 AND number = $2 AND (block = $3 OR (block IS NULL AND $3 IS NULL))`,
      [condominiumId, number.trim(), block || null]
    );

    if (existingResult.rows.length > 0) {
      throw new Error('Apartamento já cadastrado');
    }

    const result = await query(
      `INSERT INTO apartments (
        condominium_id, number, block, owner_name, owner_document, 
        owner_phone, owner_email, fraction_ideal
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        condominiumId,
        number.trim(),
        block || null,
        ownerName || null,
        ownerDocument || null,
        ownerPhone || null,
        ownerEmail || null,
        fractionIdeal ? parseFloat(fractionIdeal) : null
      ]
    );

    const apartment = result.rows[0];

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'FINANCIAL',
      entityType: 'apartments',
      entityId: apartment.id,
      afterData: apartment,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return apartment;
  } catch (error) {
    console.error('Erro ao criar apartamento:', error);
    throw error;
  }
};

// Função para listar apartamentos
const listApartments = async (condominiumId, filters = {}) => {
  try {
    let queryText = `SELECT * FROM apartments WHERE condominium_id = $1`;
    const params = [condominiumId];

    if (filters.search) {
      queryText += ` AND (number ILIKE $${params.length + 1} OR owner_name ILIKE $${params.length + 1})`;
      params.push(`%${filters.search}%`);
    }

    queryText += ` ORDER BY number LIMIT $${params.length + 1}`;
    params.push(filters.limit || 1000);

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar apartamentos:', error);
    throw error;
  }
};

// Função para criar ou atualizar taxa mensal
const createMonthlyFee = async (condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const { apartmentId, month, year, amount, dueDate, manualLateFee, manualInterest } = data;

    if (!apartmentId || !month || !year || !amount || !dueDate) {
      throw new Error('Todos os campos são obrigatórios');
    }

    // Verifica se já existe - se existir, atualiza ao invés de criar nova
    const existingResult = await query(
      `SELECT * FROM monthly_fees 
       WHERE apartment_id = $1 AND month = $2 AND year = $3`,
      [apartmentId, month, year]
    );

    const existingFee = existingResult.rows.length > 0 ? existingResult.rows[0] : null;
    
    // Se já existe e está paga: reabre a taxa (paid = false) e a entrada vinculada (received = false)
    // Assim o usuário pode "recriar" ou corrigir sem precisar de outro mês/ano
    if (existingFee && existingFee.paid) {
      await query(
        `UPDATE monthly_fees SET paid = FALSE, paid_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [existingFee.id]
      );
      if (existingFee.financial_entry_id) {
        await query(
          `UPDATE financial_entries SET received = FALSE, received_at = NULL WHERE id = $1 AND condominium_id = $2`,
          [existingFee.financial_entry_id, condominiumId]
        );
      }
      existingFee.paid = false;
      existingFee.paid_at = null;
    }

    // Busca dados do apartamento para descrição da entrada
    const apartmentResult = await query(
      `SELECT number, block, owner_name FROM apartments WHERE id = $1 AND condominium_id = $2`,
      [apartmentId, condominiumId]
    );

    if (apartmentResult.rows.length === 0) {
      throw new Error('Apartamento não encontrado');
    }

    const apartment = apartmentResult.rows[0];
    const apartmentLabel = apartment.block 
      ? `Apt ${apartment.number} - Bloco ${apartment.block}` 
      : `Apt ${apartment.number}`;

    // Valor base da nova taxa
    const baseAmount = parseFloat(amount);
    
    // Multa e juros: se informados manualmente, usa eles; senão, calcula automaticamente
    // IMPORTANTE: Multa e juros são calculados apenas para a NOVA taxa, não somados das taxas anteriores
    let totalLateFee = 0;
    let totalInterest = 0;

    // Se multa foi fornecida manualmente, usa ela
    if (manualLateFee !== undefined && manualLateFee !== null && manualLateFee !== '') {
      totalLateFee = parseFloat(manualLateFee) || 0;
    }
    // Se não foi informada manualmente, não calcula automaticamente
    // (multa só é aplicada quando a taxa está em atraso, não na criação)

    // Se juros foram fornecidos manualmente, usa eles
    if (manualInterest !== undefined && manualInterest !== null && manualInterest !== '') {
      totalInterest = parseFloat(manualInterest) || 0;
    }
    // Se não foram informados manualmente, não calcula automaticamente
    // (juros só são aplicados quando a taxa está em atraso, não na criação)
    
    // Valor total da nova taxa = valor base + multa + juros
    // Cálculo simples: taxa + multa + juros
    const totalAmount = baseAmount + totalLateFee + totalInterest;

    // Se já existe, atualiza; senão, cria nova
    let fee;
    if (existingFee) {
      // Atualiza taxa existente
      const updateResult = await query(
        `UPDATE monthly_fees 
         SET amount = $1, due_date = $2, late_fee = $3, interest = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [
          totalAmount,
          dueDate,
          totalLateFee,
          totalInterest,
          existingFee.id
        ]
      );
      fee = updateResult.rows[0];
      
      // Se tinha entrada financeira vinculada, atualiza ela também
      if (existingFee.financial_entry_id) {
        const financeiroService = require('./financeiroService');
        try {
          await query(
            `UPDATE financial_entries 
             SET amount = $1, description = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND condominium_id = $4`,
            [
              totalAmount,
              `Taxa de Condomínio - ${apartmentLabel} - ${String(month).padStart(2, '0')}/${year}${totalLateFee > 0 || totalInterest > 0 ? ` (Inclui multa: R$ ${totalLateFee.toFixed(2)} e juros: R$ ${totalInterest.toFixed(2)})` : ''}`,
              existingFee.financial_entry_id,
              condominiumId
            ]
          );
        } catch (entryError) {
          console.warn('Erro ao atualizar entrada financeira:', entryError.message);
        }
      }
    } else {
      // Cria nova taxa (paid = FALSE: taxa recém-criada nunca vem como paga)
      // O campo 'amount' recebe o valor total (base + multas + juros)
      // Os campos 'late_fee' e 'interest' registram as multas e juros (manuais ou calculados)
      const result = await query(
        `INSERT INTO monthly_fees (
          apartment_id, condominium_id, month, year, amount, due_date,
          late_fee, interest, paid
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
        RETURNING *`,
        [
          apartmentId, 
          condominiumId, 
          month, 
          year, 
          totalAmount, // Valor total incluindo multas e juros
          dueDate,
          totalLateFee, // Multa (manual ou calculada)
          totalInterest // Juros (manual ou calculado)
        ]
      );
      fee = result.rows[0];
    }

    // Cria entrada financeira automaticamente apenas se for nova taxa
    // Se for atualização, a entrada já existe e foi atualizada acima
    if (!existingFee) {
      const financeiroService = require('./financeiroService');
      
      // Descrição da entrada inclui informação sobre multas se houver
      let entryDescription = `Taxa de Condomínio - ${apartmentLabel} - ${String(month).padStart(2, '0')}/${year}`;
      if (totalLateFee > 0 || totalInterest > 0) {
        entryDescription += ` (Multa: R$ ${totalLateFee.toFixed(2)} + Juros: R$ ${totalInterest.toFixed(2)})`;
      }
      
      const financialEntry = await financeiroService.createEntry(
        condominiumId,
        userId,
        {
          description: entryDescription,
          amount: totalAmount, // Valor total incluindo multas e juros
          entryDate: dueDate, // Usa a data de vencimento como data da entrada
          category: DEFAULT_RECEITA_CATEGORY,
          received: false, // Não recebida ainda, será marcada quando a taxa for paga
          linkedToId: fee.id,
          linkedToType: 'MONTHLY_FEE'
        },
        ipAddress,
        userAgent
      );

      // Atualiza a taxa com o ID da entrada financeira
      await query(
        `UPDATE monthly_fees SET financial_entry_id = $1 WHERE id = $2`,
        [financialEntry.id, fee.id]
      );
    }

    // Atualiza dias em atraso
    // A função updateOverdueDays agora preserva automaticamente multa e juros se existirem
    await updateOverdueDays(fee.id);

    // Busca a taxa atualizada
    const updatedFeeResult = await query(
      `SELECT * FROM monthly_fees WHERE id = $1`,
      [fee.id]
    );
    const updatedFee = updatedFeeResult.rows[0];

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: existingFee ? 'UPDATE' : 'CREATE',
      module: 'FINANCIAL',
      entityType: 'monthly_fees',
      entityId: updatedFee.id,
      beforeData: existingFee || null,
      afterData: updatedFee,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updatedFee;
  } catch (error) {
    console.error('Erro ao criar taxa mensal:', error);
    throw error;
  }
};

// Função para atualizar dias em atraso
// REGRA: Se a taxa tem multa ou juros > 0, eles são FIXOS e NUNCA são recalculados
// Apenas atualiza os dias em atraso, preservando multa e juros existentes
const updateOverdueDays = async (feeId) => {
  try {
    const feeResult = await query(
      `SELECT * FROM monthly_fees WHERE id = $1`,
      [feeId]
    );

    if (feeResult.rows.length === 0) return;

    const fee = feeResult.rows[0];

    if (fee.paid) {
      await query(
        `UPDATE monthly_fees SET days_overdue = 0 WHERE id = $1`,
        [feeId]
      );
      return;
    }

    const daysOverdue = Math.max(0, Math.floor((new Date() - new Date(fee.due_date)) / (1000 * 60 * 60 * 24)));

    // REGRA IMPORTANTE: Se multa ou juros já existem (> 0), são FIXOS e NUNCA são recalculados
    // Apenas atualiza os dias em atraso, preservando os valores de multa e juros
    if (parseFloat(fee.late_fee || 0) > 0 || parseFloat(fee.interest || 0) > 0) {
      // Valores são fixos - apenas atualiza dias em atraso
      await query(
        `UPDATE monthly_fees SET days_overdue = $1 WHERE id = $2`,
        [daysOverdue, feeId]
      );
      return;
    }

    // Se não tem multa nem juros, pode calcular automaticamente (apenas para taxas sem valores manuais)
    // Mas isso só acontece se a taxa foi criada sem multa/juros
    const lateFee = daysOverdue > 0 ? fee.amount * 0.02 : 0;
    const monthsOverdue = Math.floor(daysOverdue / 30);
    const interest = monthsOverdue > 0 ? fee.amount * 0.01 * monthsOverdue : 0;

    await query(
      `UPDATE monthly_fees 
       SET days_overdue = $1, late_fee = $2, interest = $3 
       WHERE id = $4`,
      [daysOverdue, lateFee, interest, feeId]
    );
  } catch (error) {
    console.error('Erro ao atualizar dias em atraso:', error);
  }
};

// Função para marcar taxa como paga
const markFeeAsPaid = async (feeId, condominiumId, userId, paymentData, ipAddress, userAgent) => {
  try {
    const { paymentMethod, paymentReceiptPath } = paymentData;

    if (!paymentMethod) {
      throw new Error('Método de pagamento é obrigatório');
    }

    const feeResult = await query(
      `SELECT * FROM monthly_fees 
       WHERE id = $1 AND condominium_id = $2`,
      [feeId, condominiumId]
    );

    if (feeResult.rows.length === 0) {
      throw new Error('Taxa não encontrada');
    }

    const fee = feeResult.rows[0];

    if (fee.paid) {
      throw new Error('Taxa já foi paga');
    }

    // O campo 'amount' já inclui multas e juros (foi calculado assim na criação)
    // Portanto, não precisa somar novamente
    const totalAmount = parseFloat(fee.amount);

    const updateResult = await query(
      `UPDATE monthly_fees 
       SET paid = TRUE, 
           paid_at = CURRENT_TIMESTAMP,
           payment_method = $1,
           payment_receipt_path = $2,
           days_overdue = 0
       WHERE id = $3
       RETURNING *`,
      [paymentMethod, paymentReceiptPath || null, feeId]
    );

    const updated = updateResult.rows[0];

    const financeiroService = require('./financeiroService');
    const cacheService = require('./cacheService');

    // Fluxo: taxa paga → entrada financeira deve ficar recebida e aprovada → saldo atualizado
    // 1) Se já tem entrada vinculada: aprovar (se pendente) e marcar como recebida
    // 2) Se não tem entrada vinculada: criar entrada já recebida e vincular à taxa
    const receiptPdfPath = paymentReceiptPath || 'taxa_paga_sem_comprovante.pdf';
    const receiptDetails = `Pagamento da taxa de condomínio - ${paymentMethod}`;
    const receiptNotes = `Taxa marcada como paga${fee.late_fee > 0 || fee.interest > 0 ? '. Valor inclui multas e juros.' : ''}`;

    if (fee.financial_entry_id) {
      const entryResult = await query(
        `SELECT * FROM financial_entries WHERE id = $1 AND condominium_id = $2`,
        [fee.financial_entry_id, condominiumId]
      );

      if (entryResult.rows.length > 0) {
        const entry = entryResult.rows[0];

        if (entry.review_status === 'PENDING_REVIEW') {
          try {
            await financeiroService.approveEntry(
              entry.id,
              userId,
              condominiumId,
              'Aprovado automaticamente ao marcar taxa como paga',
              ipAddress,
              userAgent
            );
          } catch (approveError) {
            console.warn('Aprovar entrada:', approveError.message);
          }
        }

        if (!entry.received) {
          try {
            await financeiroService.markEntryAsReceived(
              entry.id,
              condominiumId,
              userId,
              {
                receiptMethod: paymentMethod,
                receiptPdfPath: receiptPdfPath,
                receiptDetails: receiptDetails,
                receiptNotes: receiptNotes,
              },
              ipAddress,
              userAgent
            );
          } catch (receiveError) {
            console.warn('markEntryAsReceived falhou, atualizando direto:', receiveError.message);
            await query(
              `UPDATE financial_entries 
               SET received = TRUE, received_at = CURRENT_TIMESTAMP,
                   receipt_method = $1, receipt_details = $2, receipt_pdf_path = $3, receipt_notes = $4,
                   review_status = 'APPROVED', reviewed_by = $5, reviewed_at = CURRENT_TIMESTAMP,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $6 AND condominium_id = $7 AND received = FALSE`,
              [
                paymentMethod,
                receiptDetails,
                receiptPdfPath,
                receiptNotes,
                userId,
                entry.id,
                condominiumId,
              ]
            );
            await logAction({
              userId,
              condominiumId,
              action: 'MARK_RECEIVED',
              module: 'FINANCIAL',
              entityType: 'financial_entries',
              entityId: entry.id,
              beforeData: entry,
              afterData: { ...entry, received: true },
              ipAddress,
              userAgent,
            });
          }
        }
      }
    } else {
      // Taxa sem entrada vinculada (ex.: criada antes do vínculo): cria entrada já recebida para atualizar saldo
      const aptResult = await query(
        `SELECT a.number, a.block FROM apartments a WHERE a.id = $1 AND a.condominium_id = $2`,
        [fee.apartment_id, condominiumId]
      );
      const apt = aptResult.rows[0];
      const aptLabel = apt ? (apt.block ? `Apt ${apt.number} - Bloco ${apt.block}` : `Apt ${apt.number}`) : `Taxa #${fee.id}`;
      const entryDescription = `Taxa de Condomínio - ${aptLabel} - ${String(fee.month).padStart(2, '0')}/${fee.year} (paga)`;

      const entryDate = fee.due_date ? (typeof fee.due_date === 'string' ? fee.due_date.slice(0, 10) : new Date(fee.due_date).toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10);
      const newEntry = await financeiroService.createEntry(
        condominiumId,
        userId,
        {
          description: entryDescription,
          amount: totalAmount,
          entryDate: entryDate,
          category: DEFAULT_RECEITA_CATEGORY,
          received: true,
          linkedToId: fee.id,
          linkedToType: 'MONTHLY_FEE',
        },
        ipAddress,
        userAgent
      );

      await query(
        `UPDATE financial_entries SET review_status = 'APPROVED', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP,
         received = TRUE, received_at = CURRENT_TIMESTAMP,
         receipt_method = $2, receipt_details = $3, receipt_pdf_path = $4, receipt_notes = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 AND condominium_id = $7`,
        [userId, paymentMethod, receiptDetails, receiptPdfPath, receiptNotes, newEntry.id, condominiumId]
      );
      await query(
        `UPDATE monthly_fees SET financial_entry_id = $1 WHERE id = $2`,
        [newEntry.id, feeId]
      );
    }

    cacheService.deletePattern(`dashboard:stats:${condominiumId}`);
    cacheService.deletePattern(`dashboard:analytics:${condominiumId}`);

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'FINANCIAL',
      entityType: 'monthly_fees',
      entityId: feeId,
      beforeData: fee,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao marcar taxa como paga:', error);
    throw error;
  }
};

// Função para calcular inadimplência
const calculateDelinquency = async (condominiumId) => {
  try {
    // Atualiza dias em atraso de todas as taxas não pagas
    const unpaidFees = await query(
      `SELECT id FROM monthly_fees 
       WHERE condominium_id = $1 AND paid = FALSE`,
      [condominiumId]
    );

    for (const fee of unpaidFees.rows) {
      await updateOverdueDays(fee.id);
    }

    // Calcula estatísticas
    const overdueResult = await query(
      `SELECT COUNT(*) as total, COALESCE(SUM(amount + late_fee + interest), 0) as total_amount
       FROM monthly_fees 
       WHERE condominium_id = $1 AND paid = FALSE AND due_date < CURRENT_DATE`,
      [condominiumId]
    );

    const totalFeesResult = await query(
      `SELECT COUNT(*) as total FROM monthly_fees 
       WHERE condominium_id = $1 
       AND EXTRACT(YEAR FROM due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM due_date) = EXTRACT(MONTH FROM CURRENT_DATE)`,
      [condominiumId]
    );

    const overdueCount = parseInt(overdueResult.rows[0].total);
    const totalOverdue = parseFloat(overdueResult.rows[0].total_amount);
    const totalFees = parseInt(totalFeesResult.rows[0].total);
    const delinquencyRate = totalFees > 0 ? (overdueCount / totalFees) * 100 : 0;

    return {
      delinquencyRate,
      totalOverdue,
      overdueCount,
      totalFees
    };
  } catch (error) {
    console.error('Erro ao calcular inadimplência:', error);
    throw error;
  }
};

// Função para listar taxas
const listMonthlyFees = async (condominiumId, filters = {}) => {
  try {
    let queryText = `
      SELECT mf.*, a.number as apartment_number, a.block, a.owner_name
      FROM monthly_fees mf
      JOIN apartments a ON mf.apartment_id = a.id
      WHERE mf.condominium_id = $1
    `;
    const params = [condominiumId];

    if (filters.paid !== undefined) {
      queryText += ` AND mf.paid = $${params.length + 1}`;
      params.push(filters.paid);
    }

    if (filters.overdue) {
      queryText += ` AND mf.paid = FALSE AND mf.due_date < CURRENT_DATE`;
    }

    if (filters.month) {
      queryText += ` AND mf.month = $${params.length + 1}`;
      params.push(filters.month);
    }

    if (filters.year) {
      queryText += ` AND mf.year = $${params.length + 1}`;
      params.push(filters.year);
    }

    queryText += ` ORDER BY mf.due_date DESC, mf.days_overdue DESC LIMIT $${params.length + 1}`;
    params.push(filters.limit || 1000);

    const result = await query(queryText, params);

    // Atualiza dias em atraso
    // A função updateOverdueDays preserva automaticamente multa e juros se existirem
    for (const fee of result.rows) {
      if (!fee.paid) {
        await updateOverdueDays(fee.id);
      }
    }

    return result.rows;
  } catch (error) {
    console.error('Erro ao listar taxas:', error);
    throw error;
  }
};

module.exports = {
  createApartment,
  listApartments,
  createMonthlyFee,
  markFeeAsPaid,
  calculateDelinquency,
  listMonthlyFees,
  updateOverdueDays
};
