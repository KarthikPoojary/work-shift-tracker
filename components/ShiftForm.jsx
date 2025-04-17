import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ShiftForm({ session }) {
  const [shiftDate, setShiftDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!shiftDate || !startTime || !endTime) {
      alert('Please fill all fields.');
      return;
    }
    if (endTime <= startTime) {
      alert('End time must be after start time.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('shifts').insert({
      user_id: session.user.id,
      shift_date: shiftDate,
      start_time: startTime,
      end_time: endTime,
      notes,
    });
    if (error) alert(error.message);
    else {
      setShiftDate('');
      setStartTime('');
      setEndTime('');
      setNotes('');
    }
    setLoading(false);
  };

  return (
    <div className="form-box">
      <h2>Add Shift</h2>
      <input type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} />
      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving…' : 'Submit Shift'}
      </button>
    </div>
  );
}
