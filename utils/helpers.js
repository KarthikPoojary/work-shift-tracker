export function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  }
  
  export function formatTime(timeStr) {
    const [h, m] = timeStr.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }
  
  export function isSunday(dateStr) {
    return new Date(dateStr).getDay() === 0;
  }
  
  export let holidayDates = [];
  export function setHolidayDates(dates) {
    holidayDates = dates;
  }
  
  export function isHoliday(dateStr) {
    return holidayDates.includes(dateStr);
  }
  
  export function calculateBreak(hours) {
    if (hours >= 8) return 1;
    if (hours >= 6) return 0.5;
    if (hours > 0) return 0.25;
    return 0;
  }
  
  export function calculatePayBreakdown({ start, end, date, isSunday, isHoliday }) {
    const baseRate = 15.10;
    const unsocialRate = 18.88;
    const sundayRate = 22.65;
    const holidayRate = 30.20;
  
    const startHr = parseInt(start.split(':')[0], 10) + parseInt(start.split(':')[1], 10) / 60;
    const endHr = parseInt(end.split(':')[0], 10) + parseInt(end.split(':')[1], 10) / 60;
  
    let totalHours = endHr - startHr;
    const breakHours = calculateBreak(totalHours);
  
    let breakdown = {
      holidayHours: 0,
      holidayRate,
      holidayPay: 0,
      sundayHours: 0,
      sundayRate,
      sundayPay: 0,
      unsocialHours: 0,
      unsocialRate,
      unsocialPay: 0,
      baseHours: 0,
      baseRate,
      basePay: 0,
      total: 0,
      breakHours
    };
  
    if (isHoliday) {
      const payHours = totalHours - breakHours;
      breakdown.holidayHours = totalHours;
      breakdown.holidayPay = payHours * holidayRate;
      breakdown.total = breakdown.holidayPay;
      return breakdown;
    }
  
    if (isSunday) {
      const payHours = totalHours - breakHours;
      breakdown.sundayHours = totalHours;
      breakdown.sundayPay = payHours * sundayRate;
      breakdown.total = breakdown.sundayPay;
      return breakdown;
    }
  
    // Weekday: compute unsocial and base separately
    const unsocialStart = 0;
    const unsocialEnd = 8;
    const unsocialLateStart = 20;
    const unsocialLateEnd = 24;
  
    const unsocialEarly = Math.max(0, Math.min(endHr, unsocialEnd) - Math.max(startHr, unsocialStart));
    const unsocialLate = Math.max(0, Math.min(endHr, unsocialLateEnd) - Math.max(startHr, unsocialLateStart));
    const unsocialHours = unsocialEarly + unsocialLate;
  
    const baseHours = totalHours - unsocialHours;
    const basePayHours = Math.max(0, baseHours - breakHours);
  
    breakdown.unsocialHours = unsocialHours;
    breakdown.unsocialPay = unsocialHours * unsocialRate;
    breakdown.baseHours = baseHours;
    breakdown.basePay = basePayHours * baseRate;
    breakdown.total = breakdown.unsocialPay + breakdown.basePay;
  
    return breakdown;
  }
  