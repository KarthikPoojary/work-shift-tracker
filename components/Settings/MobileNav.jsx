import React from 'react';
import { useSwipeable } from 'react-swipeable';
import styles from '../../styles/Settings.module.css';

export default function MobileNav({ tab, setTab }) {
  const handlers = useSwipeable({
    onSwipedLeft:  () => setTab('defaults'),
    onSwipedRight: () => setTab('holidays'),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  return (
    <div {...handlers} className={styles.mobileNav}>
      <button
        className={`${styles.tab} ${tab==='holidays' ? styles.activeTab : ''}`}
        onClick={() => setTab('holidays')}
      >Public Holidays</button>
      <button
        className={`${styles.tab} ${tab==='defaults' ? styles.activeTab : ''}`}
        onClick={() => setTab('defaults')}
      >Default Shift Times</button>
    </div>
  );
}
