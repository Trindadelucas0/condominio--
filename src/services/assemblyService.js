// Service do módulo ASSEMBLEIAS
// Contém lógica de negócio para gestão de assembleias
// Acesso: SINDICO, ADMINISTRATIVO

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');
const { validateUserBelongsToCondominium } = require('../utils/queryHelper');

// Função para criar assembleia
const createAssembly = async (condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const { date, time, type, location, agenda, quorum } = data;

    if (!date || !type || !agenda) {
      throw new Error('Data, tipo e pauta são obrigatórios');
    }

    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    const result = await query(
      `INSERT INTO assemblies (
        condominium_id, date, time, type, location, agenda, quorum, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'SCHEDULED')
      RETURNING *`,
      [condominiumId, date, time || null, type, location || null, agenda, quorum || null]
    );

    const assembly = result.rows[0];

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'ADMINISTRATIVE',
      entityType: 'assemblies',
      entityId: assembly.id,
      afterData: assembly,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return assembly;
  } catch (error) {
    console.error('Erro ao criar assembleia:', error);
    throw error;
  }
};

// Função para adicionar participante
const addParticipant = async (assemblyId, condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const { apartmentId, ownerName, ownerDocument, present } = data;

    if (!ownerName) {
      throw new Error('Nome do participante é obrigatório');
    }

    const result = await query(
      `INSERT INTO assembly_participants (
        assembly_id, apartment_id, owner_name, owner_document, present
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [assemblyId, apartmentId || null, ownerName, ownerDocument || null, present || false]
    );

    const participant = result.rows[0];

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'ADMINISTRATIVE',
      entityType: 'assembly_participants',
      entityId: participant.id,
      afterData: participant,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return participant;
  } catch (error) {
    console.error('Erro ao adicionar participante:', error);
    throw error;
  }
};

// Função para adicionar decisão
const addDecision = async (assemblyId, condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const { decisionNumber, title, description, votesFor, votesAgainst, votesAbstention, approved } = data;

    if (!decisionNumber || !title || !description) {
      throw new Error('Número, título e descrição são obrigatórios');
    }

    const result = await query(
      `INSERT INTO assembly_decisions (
        assembly_id, decision_number, title, description, 
        votes_for, votes_against, votes_abstention, approved
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        assemblyId,
        decisionNumber,
        title,
        description,
        votesFor || 0,
        votesAgainst || 0,
        votesAbstention || 0,
        approved || false
      ]
    );

    const decision = result.rows[0];

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'ADMINISTRATIVE',
      entityType: 'assembly_decisions',
      entityId: decision.id,
      afterData: decision,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return decision;
  } catch (error) {
    console.error('Erro ao adicionar decisão:', error);
    throw error;
  }
};

// Função para anexar documento (ata)
const attachDocument = async (assemblyId, condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const { documentType, filePath, fileName, signed } = data;

    if (!documentType || !filePath || !fileName) {
      throw new Error('Tipo, caminho e nome do arquivo são obrigatórios');
    }

    const result = await query(
      `INSERT INTO assembly_documents (
        assembly_id, document_type, file_path, file_name, signed, signed_by, signed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        assemblyId,
        documentType,
        filePath,
        fileName,
        signed || false,
        signed ? userId : null,
        signed ? new Date() : null
      ]
    );

    const document = result.rows[0];

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'ADMINISTRATIVE',
      entityType: 'assembly_documents',
      entityId: document.id,
      afterData: document,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return document;
  } catch (error) {
    console.error('Erro ao anexar documento:', error);
    throw error;
  }
};

// Função para listar assembleias
const listAssemblies = async (condominiumId, filters = {}) => {
  try {
    let queryText = `
      SELECT a.*, u.full_name as created_by_name
      FROM assemblies a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.condominium_id = $1
    `;
    const params = [condominiumId];

    if (filters.status) {
      queryText += ` AND a.status = $${params.length + 1}`;
      params.push(filters.status);
    }

    if (filters.type) {
      queryText += ` AND a.type = $${params.length + 1}`;
      params.push(filters.type);
    }

    queryText += ` ORDER BY a.date DESC LIMIT $${params.length + 1}`;
    params.push(filters.limit || 100);

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar assembleias:', error);
    throw error;
  }
};

// Função para obter assembleia com detalhes
const getAssemblyById = async (assemblyId, condominiumId) => {
  try {
    const assemblyResult = await query(
      `SELECT a.*, u.full_name as created_by_name
       FROM assemblies a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = $1 AND a.condominium_id = $2`,
      [assemblyId, condominiumId]
    );

    if (assemblyResult.rows.length === 0) {
      return null;
    }

    const assembly = assemblyResult.rows[0];

    // Busca participantes
    const participantsResult = await query(
      `SELECT ap.*, a.number as apartment_number, a.block
       FROM assembly_participants ap
       LEFT JOIN apartments a ON ap.apartment_id = a.id
       WHERE ap.assembly_id = $1
       ORDER BY ap.owner_name`,
      [assemblyId]
    );
    assembly.participants = participantsResult.rows;

    // Busca decisões
    const decisionsResult = await query(
      `SELECT * FROM assembly_decisions
       WHERE assembly_id = $1
       ORDER BY decision_number`,
      [assemblyId]
    );
    assembly.decisions = decisionsResult.rows;

    // Busca documentos
    const documentsResult = await query(
      `SELECT * FROM assembly_documents
       WHERE assembly_id = $1
       ORDER BY created_at DESC`,
      [assemblyId]
    );
    assembly.documents = documentsResult.rows;

    return assembly;
  } catch (error) {
    console.error('Erro ao buscar assembleia:', error);
    throw error;
  }
};

// Função para finalizar assembleia
const completeAssembly = async (assemblyId, condominiumId, userId, ipAddress, userAgent) => {
  try {
    const assemblyResult = await query(
      `SELECT * FROM assemblies 
       WHERE id = $1 AND condominium_id = $2`,
      [assemblyId, condominiumId]
    );

    if (assemblyResult.rows.length === 0) {
      throw new Error('Assembleia não encontrada');
    }

    const assembly = assemblyResult.rows[0];

    // Conta participantes presentes
    const presentCount = await query(
      `SELECT COUNT(*) as total FROM assembly_participants
       WHERE assembly_id = $1 AND present = TRUE`,
      [assemblyId]
    );

    const quorumAchieved = assembly.quorum ? parseInt(presentCount.rows[0].total) >= assembly.quorum : true;

    const updateResult = await query(
      `UPDATE assemblies 
       SET status = 'COMPLETED',
           quorum_achieved = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [quorumAchieved, assemblyId]
    );

    const updated = updateResult.rows[0];

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'ADMINISTRATIVE',
      entityType: 'assemblies',
      entityId: assemblyId,
      beforeData: assembly,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao finalizar assembleia:', error);
    throw error;
  }
};

module.exports = {
  createAssembly,
  addParticipant,
  addDecision,
  attachDocument,
  listAssemblies,
  getAssemblyById,
  completeAssembly
};
