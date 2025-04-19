// utils/helpers.js

//
// ─── FORMATTERS ────────────────────────────────────────────────────────────────
//

// Format “YYYY‑MM‑DD” → “DD‑MMM‑YY” (e.g. 17‑Apr‑25)
export function formatDate(dateStr) {
  const d   = new Date(dateStr);
  const dd  = String(d.getDate()).padStart(2, '0');
  const mmm = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
  const yy  = String(d.getFullYear()).slice(-2);
  return `${dd}-${mmm}-${yy}`;
}

// Format “HH:MM[:SS]” → “HH:MM”
export function formatTime(timeStr) {
  const [h, m] = timeStr.split(':');
  return `${h.padStart(2,'0')}:${m.padStart(2,'0')}`;
}

//
// ─── HOLIDAY & SUNDAY CHECKS ───────────────────────────────────────────────────
//

// Is this date a Sunday?
export function isSunday(dateStr) {
  return new Date(dateStr).getDay() === 0;
}

// In‑memory list of holiday dates (“YYYY‑MM‑DD”)
let holidayDates = [];

// Overwrite holiday list (e.g. fetched from Supabase)
export function setHolidayDates(dates) {
  holidayDates = dates;
}

// Check if a date is marked holiday
export function isHoliday(dateStr) {
  return holidayDates.includes(dateStr);
}

//
// ─── BREAK CALCULATION ─────────────────────────────────────────────────────────
//

// Unpaid break policy: >8h→1h, ≥6h→0.5h, <6h→0.25h
export function calculateBreak(hours) {
  if (hours >= 8)  return 1;
  if (hours >= 6)  return 0.5;
  if (hours >  0)  return 0.25;
  return 0;
}

//
// ─── PAY BREAKDOWN ─────────────────────────────────────────────────────────────
//

/**
 * calculatePayBreakdown()
 * 
 * @param {Object} params
 * @param {string} params.start     – “HH:MM”
 * @param {string} params.end       – “HH:MM”
 * @param {string} params.date      – “YYYY‑MM‑DD”
 * @param {boolean} params.isHoliday
 * @param {boolean} params.isSunday
 * 
 * @returns {{
 *   baseHours, baseRate, basePay,
 *   unsocialHours, unsocialRate, unsocialPay,
 *   sundayHours, sundayRate, sundayPay,
 *   holidayHours, holidayRate, holidayPay,
 *   breakHours,
 *   total,
 *   totalHours
 * }}
 */
export function calculatePayBreakdown({
  start,
  end,
  date,
  isHoliday: holidayFlag,
  isSunday: sundayFlag
}) {
  // 1) Convert “HH:MM” → decimal hours
  const toDec = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h + m / 60;
  };
  const startH = toDec(start);
  const endH   = toDec(end);
  let rawHrs   = endH - startH;
  if (rawHrs <= 0) {
    return { total: 0, totalHours: 0 };
  }

  // 2) Unpaid break: if >6h → 1h, else none here (you also have calculateBreak if you want 0.25h etc)
  const breakHrs = rawHrs > 6 ? 1 : 0;
  const netHrs   = rawHrs - breakHrs;

  // 3) UNSOCIAL hours **00:00–07:00** only
  const earlyUnsocial = Math.max(0, Math.min(endH, 7) - Math.max(startH, 0));
  const unsocialHrs   = earlyUnsocial;

  // 4) Base hours = remainder
  const baseHrs = netHrs - unsocialHrs;

  // 5) Rate definitions
  const rates = {
    base:     15.10,
    unsocial: 18.88,
    sunday:   22.65,
    holiday:  30.20,
  };

  // 6) Default pay computation
  let basePay     = baseHrs      * rates.base;
  let unsocialPay = unsocialHrs  * rates.unsocial;
  let sundayPay   = 0;
  let holidayPay  = 0;

  // 7) Override for holiday / Sunday
  if (holidayFlag) {
    basePay     = 0;
    unsocialPay = 0;
    holidayPay  = netHrs * rates.holiday;
  } else if (sundayFlag) {
    basePay     = 0;
    unsocialPay = 0;
    sundayPay   = netHrs * rates.sunday;
  }

  // 8) Totals
  const total = basePay + unsocialPay + sundayPay + holidayPay;

  return {
    baseHours:    baseHrs,
    baseRate:     rates.base,
    basePay,

    unsocialHours: unsocialHrs,
    unsocialRate:  rates.unsocial,
    unsocialPay,

    sundayHours:   sundayFlag && !holidayFlag ? netHrs : 0,
    sundayRate:    rates.sunday,
    sundayPay,

    holidayHours:  holidayFlag ? netHrs : 0,
    holidayRate:   rates.holiday,
    holidayPay,

    breakHours:    breakHrs,
    total,
    totalHours:    netHrs,
  };
}
