// utils/helpers.js

//
// ─── FORMATTERS ────────────────────────────────────────────────────────────────
//

// Format “YYYY‑MM‑DD” → “DD‑MMM‑YY” (e.g. 17‑Apr‑25)
export function formatDate(dateStr) {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mmm = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
  const yy = String(d.getFullYear()).slice(-2);
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

// Simple Sunday check
export function isSunday(dateStr) {
  return new Date(dateStr).getDay() === 0;
}

// In‑memory list of holiday dates (“YYYY‑MM‑DD”)
let holidayDates = [];

// Overwrite holiday list (e.g. fetched from Supabase)
export function setHolidayDates(dates) {
  holidayDates = dates;
}

// Check if a date is in that list
export function isHoliday(dateStr) {
  return holidayDates.includes(dateStr);
}

//
// ─── BREAK CALCULATION ─────────────────────────────────────────────────────────
//

// Unpaid break policy: >6h → 1h, else 0
export function calculateBreak(hours) {
  if (hours >= 8)  return 1;
  if (hours >= 6)  return 0.5;
  return 0;
}

//
// ─── PAY BREAKDOWN ─────────────────────────────────────────────────────────────
//

/**
 * calculatePayBreakdown()
 * @param {{start:string,end:string,date:string,isHoliday:boolean,isSunday:boolean}}
 * @returns {{
 *   baseHours, baseRate, basePay,
 *   unsocialHours, unsocialRate, unsocialPay,
 *   sundayHours, sundayRate, sundayPay,
 *   holidayHours, holidayRate, holidayPay,
 *   breakHours, total, totalHours
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
    return h + m/60;
  };
  const startH = toDec(start);
  const endH   = toDec(end);
  let rawHrs = endH - startH;
  if (rawHrs <= 0) {
    return { total: 0, totalHours: 0 };
  }

  // 2) Unpaid break: if >6h
  const breakHrs = rawHrs > 6 ? 1 : 0;
  const netHrs   = rawHrs - breakHrs;

  // 3) Unsocial hours windows (00–08 & 20–24)
  const earlyUnsocial = Math.max(0, Math.min(endH, 8) - Math.max(startH, 0));
  const lateUnsocial  = Math.max(0, Math.min(endH,24) - Math.max(startH,20));
  const unsocialHrs   = earlyUnsocial + lateUnsocial;

  // 4) Base hours = remainder
  const baseHrs = netHrs - unsocialHrs;

  // 5) Rate definitions
  const rates = {
    base:     15.10,
    unsocial: 18.88,
    sunday:   22.65,
    holiday:  30.20,
  };

  // 6) Default pays
  let basePay     = baseHrs      * rates.base;
  let unsocialPay = unsocialHrs  * rates.unsocial;
  let sundayPay   = 0;
  let holidayPay  = 0;

  // 7) Override logic
  if (holidayFlag) {
    basePay = 0;
    unsocialPay = 0;
    holidayPay = netHrs * rates.holiday;
  }
  else if (sundayFlag) {
    basePay = 0;
    unsocialPay = 0;
    sundayPay = netHrs * rates.sunday;
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

    breakHours:   breakHrs,
    total,
    totalHours:   netHrs,
  };
}
