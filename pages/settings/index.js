// pages/settings/index.js
import React, { useState } from 'react'
import { useRouter } from 'next/router'
import PublicHolidaysSettings from '../../components/Settings/PublicHolidaysSettings'
import DefaultShiftTimesSettings from '../../components/Settings/DefaultShiftTimesSettings'
import styles from '../../styles/Settings.module.css'

export default function Settings({ session }) {
  const [tab, setTab] = useState('holidays')
  const router = useRouter()

  return (
    <main className={styles.page}>
      <div className={styles.title}>
        <h1>⚙️ Settings</h1>
      </div>

      <nav className={styles.tabs}>
        <button
          className={tab === 'holidays' ? styles.activeTab : styles.tab}
          onClick={() => setTab('holidays')}
        >
          Public Holidays
        </button>
        <button
          className={tab === 'defaults' ? styles.activeTab : styles.tab}
          onClick={() => setTab('defaults')}
        >
          Default Shift Times
        </button>
        <button
          className={styles.homeButton}
          onClick={() => router.push('/')}
        >
          Home
        </button>
      </nav>

      <div className={styles.content}>
        {tab === 'holidays'
          ? <PublicHolidaysSettings session={session} />
          : <DefaultShiftTimesSettings session={session} />
        }
      </div>
    </main>
  )
}
