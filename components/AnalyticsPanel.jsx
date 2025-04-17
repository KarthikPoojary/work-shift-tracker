import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AnalyticsPanel({ session }) {
  const [summary, setSummary] = useState({ totalHours: 0, totalEarnings: 0, shiftCount: 0 });

  useEffect(() => {
    const fetchShifts = async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', session.user.id);

      if (!error && data.length > 0) {
        let totalHours = 0;
        data.forEach(shift => {
          const start = new Date(`1970-01-01T${shift.start_time}`);
          const end = new Date(`1970-01-01T${shift.end_time}`);
          let diff = (end - start) / (1000 * 60 * 60);

          if (diff >= 8) diff -= 1;
          else if (diff >= 6) diff -= 0.5;
          else if (diff > 0) diff -= 0.25;

          totalHours += Math.max(0, diff);
        });

        const totalEarnings = totalHours * 15.1;
        setSummary({ totalHours, totalEarnings, shiftCount: data.length });
      }
    };
    fetchShifts();
  }, [session]);

  return (
    <div className="analytics-box">
      <h2>Monthly Analytics</h2>
      <p>Total Hours (net): <strong>{summary.totalHours.toFixed(2)}</strong></p>
      <p>Total Earnings (basic rate): <strong>€{summary.totalEarnings.toFixed(2)}</strong></p>
      <p>Shift Count: <strong>{summary.shiftCount}</strong></p>
    </div>
  );
}
