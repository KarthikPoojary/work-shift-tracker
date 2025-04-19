// components/Settings/PublicHolidaysSettings.jsx
import React, { useState, useEffect } from 'react'
import { supabase }                     from '../../lib/supabaseClient'
import { formatDate }                   from '../../utils/helpers'

export default function PublicHolidaysSettings() {
  const [holidays, setHolidays] = useState([])
  const [date, setDate]         = useState('')
  const [name, setName]         = useState('')

  // 1) load user’s holidays
  useEffect(() => {
    const load = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('holidays')
        .select('id, date, name')
        .eq('user_id', session.user.id)
        .order('date', { ascending: true })

      if (error) console.error('loadHolidays error', error)
      else      setHolidays(data)
    }
    load()
  }, [])

  // 2) add a new holiday
  const addHoliday = async () => {
    if (!date || !name) return
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase
      .from('holidays')
      .insert([{ user_id: session.user.id, date, name }])

    if (error) console.error('insertHoliday error', error)
    else      setHolidays(h => [data[0], ...h])

    setDate('')
    setName('')
  }

  // 3) delete
  const deleteHoliday = async (id) => {
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', id)

    if (error) console.error('deleteHoliday error', error)
    else       setHolidays(h => h.filter(x => x.id !== id))
  }

  return (
    <div>
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem' }}>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ flex:1 }}
        />
        <input
          type="text"
          placeholder="Holiday name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ flex:2 }}
        />
        <button
          onClick={addHoliday}
          style={{
            flex:1,
            background:'#0055ff',
            color:'#fff',
            border:'none',
            borderRadius:4,
            cursor:'pointer'
          }}
        >
          + Add
        </button>
      </div>

      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'left',padding:8 }}>Date</th>
            <th style={{ textAlign:'left',padding:8 }}>Holiday</th>
            <th/>
          </tr>
        </thead>
        <tbody>
          {holidays.map(h => (
            <tr key={h.id}>
              <td style={{ padding:8 }}>{formatDate(h.date)}</td>
              <td style={{ padding:8 }}>{h.name}</td>
              <td style={{ padding:8,textAlign:'right' }}>
                <button
                  onClick={() => deleteHoliday(h.id)}
                  style={{
                    background:'#f44336',
                    color:'#fff',
                    border:'none',
                    padding:'0.4rem 0.8rem',
                    borderRadius:4,
                    cursor:'pointer'
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
