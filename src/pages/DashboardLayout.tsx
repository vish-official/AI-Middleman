import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquarePlus, MessageSquare, Key, Settings, LogOut } from 'lucide-react';
import { useAppStore } from '../store';
import { useEffect } from 'react';
import { api } from '../services/api';
import { cn } from '../lib/utils';

export default function DashboardLayout() {
  const { user, logout, chats, setChats, apiKeys, setApiKeys } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.chats.list().then(setChats).catch(console.error);
    api.keys.list().then(setApiKeys).catch(console.error);
  }, [setChats, setApiKeys]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const hasApiKeys = apiKeys.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b] text-zinc-100">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-zinc-800 bg-[#09090b]">
        <div className="p-6 flex items-center gap-3">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">V1</span>
          </div>
          <span className="font-semibold tracking-tight text-lg">AI Workspace</span>
        </div>

        <div className="px-4 mb-4">
          <NavLink 
            to="/chat" 
            end
            className="w-full flex items-center justify-center gap-2 bg-zinc-100 text-zinc-950 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4" />
            New Chat
          </NavLink>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 px-3 mb-2 mt-4">History</div>
          {chats.map(chat => (
            <div key={chat.id} className="group flex items-center justify-between px-3 py-1 rounded-md hover:bg-zinc-800/50 transition-colors">
              <NavLink
                to={`/chat/${chat.id}`}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 flex-1 min-w-0 text-sm py-1 rounded",
                  isActive ? "text-zinc-100 bg-zinc-800/50" : "text-zinc-400"
                )}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{chat.title}</span>
              </NavLink>
              <button 
                onClick={async () => {
                  if (confirm('Delete chat?')) {
                    await api.chats.delete(chat.id);
                    api.chats.list().then(setChats);
                    if (location.pathname === `/chat/${chat.id}`) navigate('/chat');
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 rounded transition-opacity"
              >
                &times;
              </button>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-1">
          <NavLink
            to="/keys"
            className={({ isActive }) => cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              isActive ? "text-zinc-100 bg-zinc-800/50" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
            )}
          >
            <Key className="w-4 h-4" />
            API Keys
            {hasApiKeys && <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>}
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              isActive ? "text-zinc-100 bg-zinc-800/50" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
            )}
          >
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-rose-400/80 hover:text-rose-400 hover:bg-zinc-800/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
        {/* TopNav */}
        <header className="h-16 border-b border-zinc-800 px-6 flex items-center justify-between bg-[#09090b]">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-zinc-100">
              {location.pathname.startsWith('/chat') ? 'Chat' : location.pathname.startsWith('/keys') ? 'API Keys' : 'Settings'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1">
              <span className="text-xs text-zinc-400 mr-2 self-center">Online</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-indigo-500 border-2 border-zinc-900 flex items-center justify-center text-xs font-bold shadow-sm text-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
