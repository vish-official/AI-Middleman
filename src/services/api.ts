const getToken = () => localStorage.getItem('token');

export const fetchApi = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as any),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const err = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || err.message || 'Request failed');
  }
  
  return response.json();
};

export const api = {
  auth: {
    me: () => fetchApi('/api/auth/me'),
    login: (data: any) => fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: any) => fetchApi('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    updatePassword: (password: string) => fetchApi('/api/auth/password', { method: 'POST', body: JSON.stringify({ password }) }),
    deleteAccount: () => fetchApi('/api/auth/me', { method: 'DELETE' }),
  },
  keys: {
    list: () => fetchApi('/api/keys'),
    save: (provider: string, key: string) => fetchApi('/api/keys', { method: 'POST', body: JSON.stringify({ provider, key }) }),
    delete: (provider: string) => fetchApi(`/api/keys/${provider}`, { method: 'DELETE' }),
  },
  chats: {
    list: () => fetchApi('/api/chats'),
    create: (title: string, provider: string) => fetchApi('/api/chats', { method: 'POST', body: JSON.stringify({ title, provider }) }),
    get: (id: string) => fetchApi(`/api/chats/${id}`),
    delete: (id: string) => fetchApi(`/api/chats/${id}`, { method: 'DELETE' }),
    uploadFile: (id: string, file: File) => {
      const formData = new FormData();
      formData.append('files', file);
      // Let browser set the Content-Type for multipart/form-data
      const token = getToken();
      return fetch(`/api/chats/${id}/files`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      }).then(res => {
        if(!res.ok) throw new Error('Upload failed');
        return res.json();
      });
    }
  }
};
