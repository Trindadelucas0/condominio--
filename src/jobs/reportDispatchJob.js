const cron = require('node-cron');
const {
  dispatchCondominiumReport,
  listCondominiumSchedules,
} = require('../services/reports/reportDispatchService');

let started = false;
const recentRuns = new Map();

const parseCron = (expression, fallback = null) => {
  const value = String(expression || '').trim();
  const parts = value.split(/\s+/);
  if (parts.length !== 5) return fallback;

  const minute = parts[0] === '*' ? '*' : parseInt(parts[0], 10);
  const hour = parts[1] === '*' ? '*' : parseInt(parts[1], 10);
  const weekday = parts[4] === '*' ? '*' : parseInt(parts[4], 10);
  if (
    (minute !== '*' && Number.isNaN(minute)) ||
    (hour !== '*' && Number.isNaN(hour)) ||
    (weekday !== '*' && Number.isNaN(weekday))
  ) {
    return fallback;
  }
  return { minute, hour, weekday };
};

const getZonedParts = (date, timezone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    minute: parseInt(map.minute, 10),
    hour: parseInt(map.hour, 10),
    weekday: weekdayMap[map.weekday] ?? 0,
    dateRef: `${map.year}-${map.month}-${map.day}`,
    minuteRef: `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}`,
  };
};

const isWithinCustomRange = (schedule, timezone, now = new Date()) => {
  const start = String(schedule.custom_start_date || '').trim();
  const end = String(schedule.custom_end_date || '').trim();
  if (!start && !end) return true;
  if (!start || !end) return false;
  const zoned = getZonedParts(now, timezone);
  return zoned.dateRef >= start && zoned.dateRef <= end;
};

const isCronMatch = (parsedCron, zoned) => {
  if (!parsedCron) return false;
  if (parsedCron.minute !== '*' && parsedCron.minute !== zoned.minute) return false;
  if (parsedCron.hour !== '*' && parsedCron.hour !== zoned.hour) return false;
  if (parsedCron.weekday !== '*' && parsedCron.weekday !== zoned.weekday) return false;
  return true;
};

const shouldRunNow = ({ condominiumId, reportType, parsedCron, timezone, now = new Date() }) => {
  const zoned = getZonedParts(now, timezone);
  if (!isCronMatch(parsedCron, zoned)) return { run: false };
  const dedupeKey = `${condominiumId}:${reportType}:${timezone}:${zoned.minuteRef}`;
  if (recentRuns.has(dedupeKey)) return { run: false };
  recentRuns.set(dedupeKey, Date.now());
  return { run: true, dedupeKey };
};

const cleanupRecentRuns = () => {
  const ttlMs = 1000 * 60 * 10;
  const now = Date.now();
  for (const [key, value] of recentRuns.entries()) {
    if (now - value > ttlMs) recentRuns.delete(key);
  }
};

const runDaily = async () => {
  console.log('[REPORT_JOB] Executando envio de relatório diário...');
  const schedules = await listCondominiumSchedules();
  let sent = 0;
  for (const schedule of schedules) {
    if (schedule.enabled === false || schedule.daily_enabled === false) continue;
    const timezone = schedule.timezone || process.env.REPORT_DEFAULT_TZ || 'America/Sao_Paulo';
    if (!isWithinCustomRange(schedule, timezone)) continue;
    const parsedCron = parseCron(
      schedule.daily_cron || process.env.REPORT_SCHEDULE_DAILY || '0 7 * * *',
      { minute: 0, hour: 7, weekday: '*' }
    );
    const decision = shouldRunNow({
      condominiumId: schedule.condominium_id,
      reportType: 'DAILY',
      parsedCron,
      timezone,
    });
    if (!decision.run) continue;
    try {
      await dispatchCondominiumReport(schedule.condominium_id, 'DAILY', { source: 'AUTO' });
      sent += 1;
    } catch (error) {
      console.error('[REPORT_JOB] Falha no diário automático', {
        condominiumId: schedule.condominium_id,
        message: error.message,
      });
    }
  }
  cleanupRecentRuns();
  console.log(`[REPORT_JOB] Relatório diário automático concluído para ${sent} condomínio(s).`);
};

const runWeekly = async () => {
  console.log('[REPORT_JOB] Executando envio de relatório semanal...');
  const schedules = await listCondominiumSchedules();
  let sent = 0;
  for (const schedule of schedules) {
    if (schedule.enabled === false || schedule.weekly_enabled === false) continue;
    const timezone = schedule.timezone || process.env.REPORT_DEFAULT_TZ || 'America/Sao_Paulo';
    if (!isWithinCustomRange(schedule, timezone)) continue;
    const parsedCron = parseCron(
      schedule.weekly_cron || process.env.REPORT_SCHEDULE_WEEKLY || '30 7 * * 1',
      { minute: 30, hour: 7, weekday: 1 }
    );
    const decision = shouldRunNow({
      condominiumId: schedule.condominium_id,
      reportType: 'WEEKLY',
      parsedCron,
      timezone,
    });
    if (!decision.run) continue;
    try {
      await dispatchCondominiumReport(schedule.condominium_id, 'WEEKLY', { source: 'AUTO' });
      sent += 1;
    } catch (error) {
      console.error('[REPORT_JOB] Falha no semanal automático', {
        condominiumId: schedule.condominium_id,
        message: error.message,
      });
    }
  }
  cleanupRecentRuns();
  console.log(`[REPORT_JOB] Relatório semanal automático concluído para ${sent} condomínio(s).`);
};

const start = () => {
  if (started) return;
  started = true;

  const tickCron = '* * * * *';
  const timezone = process.env.REPORT_DEFAULT_TZ || 'America/Sao_Paulo';

  cron.schedule(tickCron, runDaily, { timezone });
  cron.schedule(tickCron, runWeekly, { timezone });
  console.log(
    `[REPORT_JOB] Scheduler por condomínio ativo. Tick: "${tickCron}" | TZ base: ${timezone}`
  );
};

module.exports = {
  start,
  runDaily,
  runWeekly,
};
