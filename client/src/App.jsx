import { useEffect, useState } from 'react';
import { api, refresh, setAccessToken } from './api';
import Board from './Board';

function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api(`/api/auth/${mode}`, { method: 'POST', body: form });
      setAccessToken(data.accessToken);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className='auth'>
      <h1>✅ TrackFlow</h1>
      <p className='muted'>AI-powered workflow tracking</p>
      <form onSubmit={submit} className='card'>
        {mode === 'register' && <input name='name' placeholder='Name' value={form.name} onChange={update} />}
        <input name='email' type='email' placeholder='Email' value={form.email} onChange={update} />
        <input name='password' type='password' placeholder='Password (8+ characters)' value={form.password} onChange={update} />
        <button>{mode === 'login' ? 'Log in' : 'Create account'}</button>
        {error && <p className='error'>{error}</p>}
        <button type='button' className='link' onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session from the refresh-token cookie on page load.
  useEffect(() => {
    refresh()
      .then((data) => setUser(data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setAccessToken(null);
    setUser(null);
  }

  if (loading) return <p className='muted center'>Loading…</p>;
  return user ? <Board user={user} onLogout={logout} /> : <AuthForm onAuth={setUser} />;
}
