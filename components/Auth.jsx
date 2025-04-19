import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Auth() {
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
