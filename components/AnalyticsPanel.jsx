// AnalyticsPanel.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { calculatePayBreakdown, isHoliday, isSunday } from '../utils/helpers';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsPanel({ session, reloadFlag }) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [earnings, setEarnings] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [breakdownData, setBreakdownData] = useState([]);

  useEffect(() => {
    const fetchShifts = async () => {
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 1);

      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('shift_date', startDate.toISOString().split('T')[0])
        .lt('shift_date', endDate.toISOString().split('T')[0]);

      if (error) {
        console.error(error);
        return;
      }

      let total = 0;
      let totalHrs = 0;
      let base = 0, unsocial = 0, sunday = 0, holiday = 0;

      for (const shift of data) {
        const breakdown = calculatePayBreakdown({
          start: shift.start_time,
          end: shift.end_time,
          date: shift.shift_date,
          isHoliday: isHoliday(shift.shift_date),
          isSunday: isSunday(shift.shift_date),
        });

        total += breakdown.total ?? 0;
        totalHrs += Number.isFinite(breakdown.totalHours) ? breakdown.totalHours : 0;

        base += breakdown.basePay ?? 0;
        unsocial += breakdown.unsocialPay ?? 0;
        sunday += breakdown.sundayPay ?? 0;
        holiday += breakdown.holidayPay ?? 0;
      }

      setEarnings(total);
      setTotalHours(totalHrs);
      setBreakdownData([
        { name: 'Base', value: base },
        { name: 'Unsocial', value: unsocial },
        { name: 'Sunday', value: sunday },
        { name: 'Holiday', value: holiday },
      ]);
    };
    fetchShifts();
  }, [session.user.id, selectedMonth, selectedYear, reloadFlag]);

  const yearOptions = [];
  for (let y = today.getFullYear() - 3; y <= today.getFullYear() + 1; y++) {
    yearOptions.push(y);
  }

  return (
    <div className="analytics-panel">
      <h2>Monthly Analytics</h2>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <label htmlFor="month-select"><strong>Month:</strong></label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{ padding: '0.5rem 1rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc' }}
          >
            {months.map((m, idx) => (
              <option key={idx} value={idx}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="year-select"><strong>Year:</strong></label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ padding: '0.5rem 1rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc' }}
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <p><strong>Total Hours (net):</strong> {Number.isFinite(totalHours) ? `${totalHours.toFixed(2)}h` : '0.00h'}</p>
      <p><strong>Total Estimated Earnings:</strong> €{earnings.toFixed(2)}</p>

      <div style={{ height: 500 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              dataKey="value"
              data={breakdownData}
              cx="50%"
              cy="50%"
              outerRadius={160}
              label={({ name, value }) => (value > 0 ? `${Math.round(value)}` : '')}
            >
              {breakdownData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `€${Math.round(value)}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
