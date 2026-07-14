/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from './store';
import { api } from './services/api';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './pages/DashboardLayout';
import ChatArea from './pages/ChatArea';
import ApiKeysPage from './pages/ApiKeysPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute() {
  const { token, user, setUser, logout } = useAppStore();

  useEffect(() => {
    if (token && !user) {
      api.auth.me().then(setUser).catch(logout);
    }
  }, [token, user]);

  if (!token) return <Navigate to="/login" replace />;
  
  return <Outlet />;
}

export default function App() {
  // Always force dark mode for this theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/chat" element={<ChatArea />} />
              <Route path="/chat/:id" element={<ChatArea />} />
              <Route path="/keys" element={<ApiKeysPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

