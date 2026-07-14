import { useState } from 'react';
import { api } from '../services/api';
import { useAppStore } from '../store';
import { Key, CheckCircle2, CircleDashed } from 'lucide-react';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'gemini', name: 'Google Gemini' },
  { id: 'openrouter', name: 'OpenRouter' },
];

export default function ApiKeysPage() {
  const { apiKeys, setApiKeys } = useAppStore();
  const [provider, setProvider] = useState(PROVIDERS[0].id);
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key) return;
    setLoading(true);
    try {
      await api.keys.save(provider, key);
      const updated = await api.keys.list();
      setApiKeys(updated);
      setKey('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (prov: string) => {
    try {
      await api.keys.delete(prov);
      const updated = await api.keys.list();
      setApiKeys(updated);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 overflow-y-auto h-full bg-[#09090b] text-zinc-100">
      <div>
        <h2 className="text-2xl font-semibold">API Keys</h2>
        <p className="text-zinc-400">Manage your AI provider credentials. Keys are stored for your use only.</p>
      </div>

      <div className="p-6 border border-zinc-800 rounded-xl bg-zinc-900/50">
        <h3 className="font-medium mb-4">Add or Update Key</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-48 flex-shrink-0">
              <label className="block text-sm mb-1.5 text-zinc-400">Provider</label>
              <select
                value={provider}
                onChange={e => setProvider(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-700 text-zinc-100"
              >
                {PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1.5 text-zinc-400">API Key</label>
              <input
                type="password"
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-700 text-zinc-100 placeholder-zinc-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !key}
            className="px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/10"
          >
            {loading ? 'Saving...' : 'Save Key'}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">Configured Providers</h3>
        {PROVIDERS.map(p => {
          const isConfigured = apiKeys.some(k => k.provider === p.id);
          return (
            <div key={p.id} className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-zinc-950 flex items-center justify-center">
                  <Key className="w-4 h-4 text-zinc-500" />
                </div>
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="flex items-center gap-1.5 text-sm">
                    {isConfigured ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-zinc-400">Connected</span></>
                    ) : (
                      <><CircleDashed className="w-3.5 h-3.5 text-zinc-500" /><span className="text-zinc-500">Not configured</span></>
                    )}
                  </div>
                </div>
              </div>
              {isConfigured && (
                <button
                  onClick={() => handleDelete(p.id)}
                  className="px-3 py-1.5 text-sm text-rose-400/80 hover:text-rose-400 hover:bg-zinc-800/50 rounded-lg transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
