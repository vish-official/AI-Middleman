import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAppStore } from '../store';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUser } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.auth.login({ email, password });
      setToken(res.token);
      setUser(res.user);
      navigate('/chat');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#09090b] text-zinc-100">
      <div className="w-full max-w-sm p-8 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl">
        <h2 className="text-2xl font-semibold mb-6 text-center text-zinc-100">Welcome back</h2>
        {error && <div className="mb-4 p-3 text-sm text-red-400 bg-red-950/50 rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-700 text-zinc-100 placeholder-zinc-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-700 text-zinc-100 placeholder-zinc-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/10 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-400">
          Don't have an account? <Link to="/register" className="text-zinc-100 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
