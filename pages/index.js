
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import ShiftForm from '../components/ShiftForm';
import ShiftTable from '../components/ShiftTable';
import AnalyticsPanel from '../components/AnalyticsPanel';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (type) => {
    setLoading(true);
    const { error } =
      type === 'LOGIN'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="auth-box">
      <h2>Sign In / Register</h2>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className="button-row">
        <button onClick={() => handleLogin('LOGIN')} disabled={loading}>Login</button>
        <button onClick={() => handleLogin('SIGNUP')} disabled={loading}>Sign Up</button>
      </div>
    </div>
  );
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [reloadFlag, setReloadFlag] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const refreshData = () => setReloadFlag(!reloadFlag);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <main style={{ maxWidth: '800px', margin: 'auto', padding: '1rem' }}>
      <h1 style={{ textAlign: 'center', fontSize: '2rem', margin: '1rem 0' }}>📅 Work Shift Tracker</h1>
      {!session ? (
        <Auth />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#ccc', border: 'none', borderRadius: '4px' }}>Logout</button>
          </div>
          <ShiftForm session={session} onShiftSubmit={refreshData} />
          <AnalyticsPanel session={session} reloadFlag={reloadFlag} />
          <ShiftTable session={session} reloadFlag={reloadFlag} />
        </>
      )}
    </main>
  );
}
