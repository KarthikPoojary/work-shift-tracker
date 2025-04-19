import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatTime, formatDate, calculatePayBreakdown, isHoliday, isSunday } from '../utils/helpers';
import Modal from './Modal';

export default function ShiftTable({ session, reloadFlag }) {
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchShifts = async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('shift_date', { ascending: false });
      if (error) console.error(error);
      else setShifts(data);
    };
    fetchShifts();
  }, [session.user.id, reloadFlag]);

  const totalPages = Math.ceil(shifts.length / itemsPerPage);
  const paginatedShifts = shifts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const goToPage = (page) => setCurrentPage(page);

  return (
    <div className="shift-table">
      <h2>Your Shifts</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th>Pay (€)</th>
            <th><span role="img" aria-label="info">ℹ️</span></th>
          </tr>
        </thead>
        <tbody>
          {paginatedShifts.map((s) => {
            const breakdown = calculatePayBreakdown({
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
                <td>€{breakdown.total.toFixed(2)}</td>
                <td>
                  <button onClick={() => setSelectedShift({ ...s, breakdown })}>i</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => goToPage(i + 1)}
            disabled={i + 1 === currentPage}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {selectedShift && (
        <Modal
          title={`${formatDate(selectedShift.shift_date)} Shift Details`}
          onClose={() => setSelectedShift(null)}
        >
          <p><strong>Start:</strong> {formatTime(selectedShift.start_time)}</p>
          <p><strong>End:</strong> {formatTime(selectedShift.end_time)}</p>
          <hr />
          {selectedShift.breakdown.holidayHours > 0 && (
            <p><strong>BANK HOLIDAY:</strong> {selectedShift.breakdown.holidayHours.toFixed(2)}h - {selectedShift.breakdown.breakHours}h (Break) × €{selectedShift.breakdown.holidayRate} = €{selectedShift.breakdown.holidayPay.toFixed(2)}</p>
          )}
          {selectedShift.breakdown.sundayHours > 0 && selectedShift.breakdown.holidayHours === 0 && (
            <p><strong>SUNDAY:</strong> {selectedShift.breakdown.sundayHours.toFixed(2)}h - {selectedShift.breakdown.breakHours}h (Break) × €{selectedShift.breakdown.sundayRate} = €{selectedShift.breakdown.sundayPay.toFixed(2)}</p>
          )}
          {selectedShift.breakdown.unsocialHours > 0 && (
            <p><strong>UNSOCIAL:</strong> {selectedShift.breakdown.unsocialHours.toFixed(2)}h × €{selectedShift.breakdown.unsocialRate} = €{selectedShift.breakdown.unsocialPay.toFixed(2)}</p>
          )}
          {selectedShift.breakdown.baseHours > 0 && selectedShift.breakdown.holidayHours === 0 && selectedShift.breakdown.sundayHours === 0 && (
            <p><strong>BASE:</strong> {selectedShift.breakdown.baseHours.toFixed(2)}h - {selectedShift.breakdown.breakHours}h (Break) × €{selectedShift.breakdown.baseRate} = €{selectedShift.breakdown.basePay.toFixed(2)}</p>
          )}
        </Modal>
      )}
    </div>
  );
}
