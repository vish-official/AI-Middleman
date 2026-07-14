import { create } from 'zustand';
import { User, ApiKey, Chat } from './types';

interface AppState {
  user: User | null;
  token: string | null;
  apiKeys: ApiKey[];
  chats: Chat[];
  theme: 'light' | 'dark';
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setApiKeys: (keys: ApiKey[]) => void;
  setChats: (chats: Chat[]) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  apiKeys: [],
  chats: [],
  theme: (localStorage.getItem('theme') as any) || 'dark',
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    set({ token });
  },
  setApiKeys: (apiKeys) => set({ apiKeys }),
  setChats: (chats) => set({ chats }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    set({ theme });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, apiKeys: [], chats: [] });
  }
}));
