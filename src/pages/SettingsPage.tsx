import { useState } from 'react';
import { useAppStore } from '../store';
import { api } from '../services/api';
import { Moon, Sun, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { theme, setTheme, logout } = useAppStore();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) return;
    setLoading(true);
    setMsg('');
    try {
      await api.auth.updatePassword(password);
      setMsg('Password updated successfully');
      setPassword('');
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    try {
      await api.auth.deleteAccount();
      logout();
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 overflow-y-auto h-full bg-[#09090b] text-zinc-100">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-zinc-400">Manage your workspace preferences.</p>
      </div>

      {/* Theme */}
      <div className="space-y-4 hidden">
        <h3 className="font-medium text-lg border-b border-zinc-800 pb-2">Appearance</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${theme === 'light' ? 'border-zinc-500 ring-1 ring-zinc-500 bg-zinc-900' : 'border-zinc-800 hover:bg-zinc-900/50'} transition-all`}
          >
            <Sun className="w-5 h-5" />
            <span className="font-medium">Light</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${theme === 'dark' ? 'border-zinc-500 ring-1 ring-zinc-500 bg-zinc-900' : 'border-zinc-800 hover:bg-zinc-900/50'} transition-all`}
          >
            <Moon className="w-5 h-5" />
            <span className="font-medium">Dark</span>
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg border-b border-zinc-800 pb-2">Account</h3>
        <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/50">
          <h4 className="font-medium mb-4">Change Password</h4>
          <form onSubmit={handleUpdatePassword} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full max-w-sm px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-700 text-zinc-100 placeholder-zinc-500"
            />
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={loading || password.length < 6}
                className="px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/10"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
              {msg && <span className="text-sm text-zinc-400">{msg}</span>}
            </div>
          </form>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4 pt-8">
        <h3 className="font-medium text-lg text-rose-500 border-b border-rose-900/30 pb-2">Danger Zone</h3>
        <div className="p-4 border border-rose-900/30 rounded-xl bg-rose-950/20">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-rose-400">Delete Account</h4>
              <p className="text-sm text-rose-500/80 mt-1">
                Permanently delete your account, API keys, and chat history. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600/90 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
