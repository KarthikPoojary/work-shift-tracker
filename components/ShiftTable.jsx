import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const payRates = {
  base: 15.1,
  unsocial: 18.88,
  overtime: 22.65,
  holiday: 30.2,
};

function calculateBreakDuration(hours) {
  if (hours >= 8) return 1;
  if (hours >= 6) return 0.5;
  if (hours > 0) return 0.25;
  return 0;
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function segmentPay({ start, end, date, isSunday, isHoliday }) {
  const segs = [
    { label: 'unsocial', from: 0, to: 7, rate: payRates.unsocial },
    { label: 'base', from: 7, to: 24, rate: payRates.base },
  ];

  let total = 0;
  const breakdown = [];
  const startHr = parseInt(start.split(':')[0], 10) + parseInt(start.split(':')[1], 10) / 60;
  const endHr = parseInt(end.split(':')[0], 10) + parseInt(end.split(':')[1], 10) / 60;
  let duration = endHr - startHr;
  let unpaid = calculateBreakDuration(duration);
  duration -= unpaid;

  if (isHoliday) {
    const amt = duration * payRates.holiday;
    total = amt;
    breakdown.push({ type: 'Holiday', hours: duration, rate: payRates.holiday, total: amt });
  } else if (isSunday) {
    const amt = duration * payRates.overtime;
    total = amt;
    breakdown.push({ type: 'Sunday', hours: duration, rate: payRates.overtime, total: amt });
  } else {
    segs.forEach(seg => {
      const from = Math.max(startHr, seg.from);
      const to = Math.min(endHr, seg.to);
      const overlap = Math.max(0, to - from);
      if (overlap > 0) {
        const amt = overlap * seg.rate;
        breakdown.push({ type: seg.label, hours: overlap, rate: seg.rate, total: amt });
        total += amt;
      }
    });
  }

  return { total: total.toFixed(2), unpaid, breakdown };
}

export default function ShiftTable({ session, reloadFlag }) {
  const [shifts, setShifts] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [visibleNote, setVisibleNote] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [shiftRes, holidayRes] = await Promise.all([
        supabase.from('shifts').select('*').eq('user_id', session.user.id).order('shift_date', { ascending: false }),
        supabase.from('holidays').select('*'),
      ]);
      if (!shiftRes.error && !holidayRes.error) {
        setShifts(shiftRes.data);
        setHolidays(holidayRes.data.map(h => h.date));
      }
    };
    fetchData();
  }, [session, reloadFlag]);
  console.log('Loaded shifts:', shifts); // Debugging line
  console.log('Loaded holidays:', holidays); // Debugging line
  const isSunday = (dateStr) => new Date(dateStr).getDay() === 0;
  const isHoliday = (dateStr) => holidays.includes(dateStr);

  return (
    <div className="table-box">
      <h2>Your Shifts</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th>Pay (€)</th>
            <th>🛈</th>
          </tr>
        </thead>
        <tbody>
          {shifts.map((s) => {
            const breakdown = segmentPay({
              start: s.start_time,
              end: s.end_time,
              date: s.shift_date,
              isSunday: isSunday(s.shift_date),
              isHoliday: isHoliday(s.shift_date),
            });
            return (
              <tr key={s.id}>
                <td>{formatDate(s.shift_date)}</td>
                <td>{formatTime(s.start_time)}</td>
                <td>{formatTime(s.end_time)}</td>
                <td title={`Unpaid break: ${breakdown.unpaid}h`}>€{breakdown.total}</td>
                <td>
                  {s.notes && (
                    <span
                      style={{ cursor: 'pointer' }}
                      onClick={() => setVisibleNote(visibleNote === s.id ? null : s.id)}
                      title={s.notes}
                    >
                      ℹ️
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {visibleNote && (
        <div className="note-tooltip">
          <p>{shifts.find(s => s.id === visibleNote)?.notes}</p>
        </div>
      )}
    </div>
  );
}
