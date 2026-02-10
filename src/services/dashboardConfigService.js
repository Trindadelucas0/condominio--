// Service de configuração do dashboard personalizável
// Permite que cada usuário customize seu dashboard

const { query } = require('../config/database');

const dashboardConfigService = {
  // Widgets padrão disponíveis
  defaultWidgets: [
    { key: 'pending_approvals', title: 'Aprovações Pendentes', position: 1, visible: true },
    { key: 'critical_alerts', title: 'Alertas Críticos', position: 2, visible: true },
    { key: 'warning_alerts', title: 'Alertas de Aviso', position: 3, visible: true },
    { key: 'balance', title: 'Saldo Financeiro', position: 4, visible: true },
    { key: 'current_month_expenses', title: 'Gastos do Mês', position: 5, visible: true },
    { key: 'delinquency_rate', title: 'Inadimplência', position: 6, visible: true },
    { key: 'pending_expenses', title: 'Despesas Pendentes', position: 7, visible: true },
    { key: 'contas_a_pagar', title: 'Contas a Pagar', position: 8, visible: true },
    { key: 'overdue_tasks', title: 'Tarefas Atrasadas', position: 9, visible: true },
    { key: 'open_occurrences', title: 'Ocorrências Abertas', position: 10, visible: true },
    { key: 'pending_budgets', title: 'Orçamentos Pendentes', position: 11, visible: true },
    { key: 'pending_entries', title: 'Entradas Pendentes', position: 12, visible: true },
    { key: 'completed_maintenances', title: 'Manutenções Concluídas', position: 13, visible: false },
    { key: 'pending_occurrences_approval', title: 'Ocorrências Aguardando Aprovação', position: 14, visible: false },
    { key: 'monthly_comparison', title: 'Comparação Mensal', position: 15, visible: true },
  ],
  
  // Obter configuração do dashboard do usuário
  getUserConfig: async (userId, condominiumId) => {
    try {
      // Verificar se tabela existe
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'dashboard_config'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️ Tabela dashboard_config não existe. Retornando configuração padrão.');
        return dashboardConfigService.defaultWidgets;
      }
      
      const result = await query(
        `SELECT * FROM dashboard_config 
         WHERE user_id = $1 AND condominium_id = $2
         ORDER BY position`,
        [userId, condominiumId]
      );
      
      // Se não tem configuração, retornar widgets padrão com título
      if (result.rows.length === 0) {
        return dashboardConfigService.defaultWidgets.map((w, i) => {
          return {
            key: w.key,
            title: w.title,
            visible: w.visible !== false,
            position: w.position || i + 1,
            id: w.key
          };
        });
      }
      
      // Processar configuração
      return result.rows.map(row => {
        // Buscar título do widget padrão
        const defaultWidget = dashboardConfigService.defaultWidgets.find(w => w.key === row.widget_key);
        return {
          key: row.widget_key,
          title: defaultWidget ? defaultWidget.title : row.widget_key,
          position: row.position,
          visible: row.visible,
          config: row.config || {},
          id: row.id
        };
      });
    } catch (error) {
      console.error('Erro ao buscar configuração do dashboard:', error);
      // Retornar padrão em caso de erro
      return dashboardConfigService.defaultWidgets;
    }
  },
  
  // Salvar configuração do dashboard
  saveUserConfig: async (userId, condominiumId, widgets) => {
    try {
      // Verificar se tabela existe
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'dashboard_config'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️ Tabela dashboard_config não existe. Criando...');
        // Tentar criar tabela
        const fs = require('fs');
        const path = require('path');
        const sql = fs.readFileSync(
          path.join(__dirname, '../database/extendTablesDashboardConfig.sql'),
          'utf8'
        );
        await query(sql);
        console.log('✅ Tabela dashboard_config criada com sucesso');
      }
      
      // Validar widgets
      if (!Array.isArray(widgets)) {
        throw new Error('Widgets deve ser um array');
      }
      
      // Deletar configuração antiga
      await query(
        `DELETE FROM dashboard_config WHERE user_id = $1 AND condominium_id = $2`,
        [userId, condominiumId]
      );
      
      // Inserir nova configuração
      for (let i = 0; i < widgets.length; i++) {
        const widget = widgets[i];
        
        await query(
          `INSERT INTO dashboard_config (user_id, condominium_id, widget_key, position, visible, config)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            condominiumId,
            widget.key,
            i + 1, // Position baseado no índice do array
            widget.visible !== false, // Default true
            JSON.stringify(widget.config || {})
          ]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar configuração do dashboard:', error);
      throw error;
    }
  },
  
  // Resetar configuração para padrão
  resetToDefault: async (userId, condominiumId) => {
    try {
      // Verificar se tabela existe
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'dashboard_config'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        // Se tabela não existe, não precisa resetar
        return true;
      }
      
      await dashboardConfigService.saveUserConfig(
        userId,
        condominiumId,
        dashboardConfigService.defaultWidgets
      );
      
      return true;
    } catch (error) {
      console.error('Erro ao resetar configuração:', error);
      throw error;
    }
  },
  
  // Toggle visibilidade de widget
  toggleWidget: async (userId, condominiumId, widgetKey, visible) => {
    try {
      // Verificar se tabela existe
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'dashboard_config'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️ Tabela dashboard_config não existe. Criando...');
        const fs = require('fs');
        const path = require('path');
        const sql = fs.readFileSync(
          path.join(__dirname, '../database/extendTablesDashboardConfig.sql'),
          'utf8'
        );
        await query(sql);
        console.log('✅ Tabela dashboard_config criada com sucesso');
      }
      
      const result = await query(
        `UPDATE dashboard_config 
         SET visible = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND condominium_id = $3 AND widget_key = $4
         RETURNING *`,
        [visible, userId, condominiumId, widgetKey]
      );
      
      // Se não existe, criar com padrão
      if (result.rows.length === 0) {
        const defaultWidget = dashboardConfigService.defaultWidgets.find(w => w.key === widgetKey);
        if (defaultWidget) {
          await query(
            `INSERT INTO dashboard_config (user_id, condominium_id, widget_key, position, visible, config)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, condominiumId, widgetKey, defaultWidget.position, visible, '{}']
          );
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao toggle widget:', error);
      throw error;
    }
  },
};

module.exports = dashboardConfigService;
