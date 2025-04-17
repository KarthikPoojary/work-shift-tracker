import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ShiftTable({ session }) {
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    const fetchShifts = async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('shift_date', { ascending: false });
      if (!error) setShifts(data);
    };
    fetchShifts();
  }, [session]);

  return (
    <div className="table-box">
      <h2>Your Shifts</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {shifts.map((s) => (
            <tr key={s.id}>
              <td>{s.shift_date}</td>
              <td>{s.start_time}</td>
              <td>{s.end_time}</td>
              <td>{s.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
