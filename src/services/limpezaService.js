// Serviço de ocorrências de LIMPEZA
// Gerencia ocorrências específicas da equipe de limpeza
// REGRA: LIMPEZA reporta, ADMINISTRATIVO decide se cria ocorrência de ZELADORIA

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');
const notificationService = require('./notificationService');

// Tipos de ocorrência de LIMPEZA
const LIMPEZA_TYPES = {
  AREA_IMPROPRIA: 'AREA_IMPROPRIA', // Área imprópria para limpeza
  SUJEIRA_EXCESSIVA: 'SUJEIRA_EXCESSIVA', // Sujeira excessiva/fora do padrão
  FALTA_MATERIAL: 'FALTA_MATERIAL', // Falta de material de limpeza
  EQUIPAMENTO_DEFEITO: 'EQUIPAMENTO_DEFEITO', // Equipamento de limpeza com defeito (vira zeladoria)
};

// Função para criar ocorrência de LIMPEZA
// Recebe: data, userId, condominiumId
// Retorna: ocorrência criada (pode criar também ocorrência de zeladoria se necessário)
const createLimpezaOccurrence = async (data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const { title, description, location, limpezaType, photo } = data;

    if (!title || !description || !limpezaType) {
      throw new Error('Título, descrição e tipo são obrigatórios');
    }

    // Valida tipo de ocorrência de limpeza
    if (!Object.values(LIMPEZA_TYPES).includes(limpezaType)) {
      throw new Error('Tipo de ocorrência de limpeza inválido');
    }

    // Determina se precisa de zeladoria
    const needsZeladoria = limpezaType === LIMPEZA_TYPES.EQUIPAMENTO_DEFEITO;

    // Cria ocorrência de LIMPEZA
    const result = await query(
      `INSERT INTO occurrences (
        condominium_id, reported_by, title, description, location,
        occurrence_type, limpeza_type, needs_zeladoria, status, priority
      )
       VALUES ($1, $2, $3, $4, $5, 'LIMPEZA', $6, $7, 'ABERTA', 'NORMAL')
       RETURNING *`,
      [
        condominiumId,
        userId,
        title.trim(),
        description.trim(),
        location || null,
        limpezaType,
        needsZeladoria,
      ]
    );

    const limpezaOccurrence = result.rows[0];

    // Se precisa de zeladoria, notifica ADMINISTRATIVO (não cria automaticamente)
    if (needsZeladoria) {
      // Notifica ADMINISTRATIVO para decidir se cria ocorrência de ZELADORIA
      await notificationService.createNotificationForRole(
        'ADMINISTRATIVO',
        condominiumId,
        'Equipamento de Limpeza com Defeito Reportado',
        `A equipe de limpeza reportou um equipamento com defeito: "${title}". Verifique se é necessário criar uma ocorrência de zeladoria.`,
        'OCCURRENCE_REQUIRES_ATTENTION',
        'occurrences',
        limpezaOccurrence.id
      );
    }

    // Log de auditoria
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'LIMPEZA',
      entityType: 'occurrences',
      entityId: limpezaOccurrence.id,
      beforeData: null,
      afterData: {
        limpeza_occurrence: limpezaOccurrence,
        needs_zeladoria: needsZeladoria,
        notification_sent: needsZeladoria,
      },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      limpezaOccurrence,
      notificationSent: needsZeladoria,
    };
  } catch (error) {
    console.error('Erro ao criar ocorrência de limpeza:', error);
    throw error;
  }
};

// Função para listar ocorrências de LIMPEZA
// Recebe: userId, condominiumId, filtros
// Retorna: lista de ocorrências de limpeza
const listLimpezaOccurrences = async (userId, condominiumId, filters = {}) => {
  try {
    let queryText = `
      SELECT o.*, u.full_name as reported_by_name, u2.full_name as sindico_observation_by_name
      FROM occurrences o
      LEFT JOIN users u ON o.reported_by = u.id
      LEFT JOIN users u2 ON o.sindico_observation_by = u2.id
      WHERE o.condominium_id = $1 AND o.occurrence_type = 'LIMPEZA'
    `;
    const params = [condominiumId];

    // Filtro por status
    if (filters.status) {
      queryText += ` AND o.status = $${params.length + 1}`;
      params.push(filters.status);
    }

    // Filtro por tipo de limpeza
    if (filters.limpezaType) {
      queryText += ` AND o.limpeza_type = $${params.length + 1}`;
      params.push(filters.limpezaType);
    }

    // Filtro por usuário que reportou
    if (filters.reportedBy) {
      queryText += ` AND o.reported_by = $${params.length + 1}`;
      params.push(filters.reportedBy);
    }

    queryText += ` ORDER BY o.created_at DESC`;

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar ocorrências de limpeza:', error);
    throw error;
  }
};

// Função para obter tipos de ocorrência de limpeza
// Retorna: lista de tipos disponíveis
const getLimpezaTypes = () => {
  return [
    {
      value: LIMPEZA_TYPES.AREA_IMPROPRIA,
      label: 'Área Imprópria para Limpeza',
      description: 'Área bloqueada, entulho, objeto impedindo acesso',
      needsZeladoria: false,
    },
    {
      value: LIMPEZA_TYPES.SUJEIRA_EXCESSIVA,
      label: 'Sujeira Excessiva / Fora do Padrão',
      description: 'Festa, vazamento pequeno, uso indevido',
      needsZeladoria: false,
    },
    {
      value: LIMPEZA_TYPES.FALTA_MATERIAL,
      label: 'Falta de Material de Limpeza',
      description: 'Produto acabou, equipamento indisponível',
      needsZeladoria: false,
    },
    {
      value: LIMPEZA_TYPES.EQUIPAMENTO_DEFEITO,
      label: 'Equipamento de Limpeza com Defeito',
      description: 'Enceradeira, carrinho, aspirador com problema',
      needsZeladoria: true, // Vira ocorrência de zeladoria automaticamente
    },
  ];
};

module.exports = {
  createLimpezaOccurrence,
  listLimpezaOccurrences,
  getLimpezaTypes,
  LIMPEZA_TYPES,
};
