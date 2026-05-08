const pool = require('../config/db');

function getMonday(d) {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function ensureWeeks() {
  try {
    const today = new Date();
    
    // Current Week
    const currentMonday = getMonday(today);
    const currentSunday = new Date(currentMonday);
    currentSunday.setDate(currentMonday.getDate() + 6);
    
    // Next Week
    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(currentMonday.getDate() + 7);
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);

    // Deadline for next week (the Sunday of current week)
    const nextDeadline = new Date(currentSunday);
    nextDeadline.setHours(23, 59, 59, 0);

    const weeks = [
      { start: formatDate(currentMonday), end: formatDate(currentSunday), deadline: nextDeadline, status: 'mo' },
      { start: formatDate(nextMonday), end: formatDate(nextSunday), deadline: nextDeadline, status: 'mo' }
    ];

    for (const w of weeks) {
        await pool.query(`
          INSERT INTO TuanLamViec (ngay_bat_dau, ngay_ket_thuc, deadline_dk, trang_thai)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (ngay_bat_dau) DO NOTHING
        `, [w.start, w.end, w.deadline, w.status]);
    }
    console.log(`[AutoWeeks] Checked/Added weeks starting ${weeks[0].start} and ${weeks[1].start}`);
  } catch (err) {
    console.error('[AutoWeeks] Error:', err.message);
  }
}

module.exports = { ensureWeeks };
