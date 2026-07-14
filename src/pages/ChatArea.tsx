import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Paperclip, Loader2, Copy, FileText, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../services/api';
import { useAppStore } from '../store';
import { ChatDetails } from '../types';
import { cn } from '../lib/utils';
import { useChat } from 'ai/react';

export default function ChatArea() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { apiKeys, setChats } = useAppStore();
  const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null);
  const [provider, setProvider] = useState(apiKeys[0]?.provider || 'openai');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, input, setInput, handleInputChange, handleSubmit, append, setMessages, isLoading } = useChat({
    api: '/api/chat',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    body: { chatId: id },
    onFinish: () => {
      loadChat();
      api.chats.list().then(setChats);
    }
  });

  const loadChat = async () => {
    if (!id) {
      console.log('[DEBUG_FRONTEND] loadChat: no id, clearing messages');
      setChatDetails(null);
      setMessages([]);
      return;
    }
    try {
      console.log('[DEBUG_FRONTEND] loadChat: fetching chat data for id:', id);
      const data = await api.chats.get(id);
      console.log('[DEBUG_FRONTEND] loadChat: received chat data:', JSON.stringify(data, null, 2));
      setChatDetails(data);
      const mappedMsgs = data.messages.map((m: any) => ({ id: m.id, role: m.role, content: m.content }));
      console.log('[DEBUG_FRONTEND] loadChat: setting messages to useChat:', JSON.stringify(mappedMsgs, null, 2));
      setMessages(mappedMsgs);
    } catch (e: any) {
      console.error('[DEBUG_FRONTEND] loadChat error:', e.message);
      navigate('/chat');
    }
  };

  useEffect(() => {
    console.log('[DEBUG_FRONTEND] id or chatDetails changed. id:', id, 'chatDetails.id:', chatDetails?.id);
    if (id && chatDetails?.id === id) {
      return;
    }
    loadChat();
  }, [id]);

  useEffect(() => {
    console.log('[DEBUG_FRONTEND] messages state updated. Current messages count:', messages.length, 'messages:', JSON.stringify(messages, null, 2));
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && files.length === 0) return;
    
    let currentChatId = id;
    let isNewChat = false;
    
    if (!currentChatId) {
      // Create new chat
      const title = input.trim().slice(0, 30) || 'New Chat';
      const newChat = await api.chats.create(title, provider);
      currentChatId = newChat.id;
      isNewChat = true;
      setChatDetails({
        ...newChat,
        messages: [],
        files: []
      } as any);
      api.chats.list().then(setChats);
    }

    if (files.length > 0 && currentChatId) {
      for (const file of files) {
        await api.chats.uploadFile(currentChatId, file);
      }
      setFiles([]);
    }

    if (isNewChat) {
      // Append manually with dynamic body to ensure backend gets the right chatId
      const userInput = input;
      setInput(''); // clear immediately for UX
      await append({ role: 'user', content: userInput }, { body: { chatId: currentChatId } });
      navigate(`/chat/${currentChatId}`, { replace: true });
    } else {
      handleSubmit(e, { body: { chatId: currentChatId } });
    }
  };

  const copyToClipboard = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!id && apiKeys.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center bg-[#09090b]">
        <div>
          <h2 className="text-xl font-medium mb-2 text-zinc-100">Welcome to AI Workspace</h2>
          <p className="text-zinc-400 mb-6">Please configure an API provider to start chatting.</p>
          <button onClick={() => navigate('/keys')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
            Configure API Keys
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      {!id && (
        <div className="flex items-center justify-center p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-500">Select Provider:</span>
            <select 
              value={provider} 
              onChange={e => setProvider(e.target.value as any)}
              className="text-sm px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md outline-none focus:ring-1 focus:ring-zinc-700 text-zinc-200"
            >
              {apiKeys.map(k => (
                <option key={k.provider} value={k.provider}>
                  {k.provider.charAt(0).toUpperCase() + k.provider.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-6 w-full">
          {chatDetails?.files && chatDetails.files.length > 0 && (
             <div className="flex flex-wrap gap-2 mb-4">
               {chatDetails.files.map(f => (
                 <div key={f.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 rounded-lg text-sm border border-zinc-800">
                   <FileText className="w-4 h-4 text-zinc-500" />
                   <span className="truncate max-w-[150px] text-zinc-200">{f.filename}</span>
                 </div>
               ))}
             </div>
          )}
          
          {messages.length === 0 && (
            <div className="text-center text-zinc-500 mt-20">
              <p>Start a conversation...</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={m.id || i} className="flex gap-4 group relative">
              <div className={cn(
                "h-8 w-8 rounded shrink-0 flex items-center justify-center text-[10px] font-bold mt-1",
                m.role === 'user' ? "bg-zinc-800 text-zinc-400" : "bg-indigo-600 text-white"
              )}>
                {m.role === 'user' ? 'YOU' : 'AI'}
              </div>
              <div className="space-y-4 flex-1">
                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:m-0 prose-p:text-sm text-sm break-words">
                  {m.role === 'user' ? (
                     <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap m-0 py-1.5">{m.content}</p>
                  ) : (
                     <ReactMarkdown>{m.content}</ReactMarkdown>
                  )}
                </div>
                {m.role === 'assistant' && (
                  <button 
                    onClick={() => copyToClipboard(m.content, m.id)}
                    className="absolute top-2 right-0 p-1.5 text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 rounded-md"
                    title="Copy"
                  >
                    {copiedId === m.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded bg-indigo-600 shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-1">
                AI
              </div>
              <div className="py-2.5 text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-zinc-800 pb-6 px-6">
        <div className="max-w-3xl mx-auto relative">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300">
                  <FileText className="w-3 h-3" />
                  <span className="truncate max-w-[100px]">{f.name}</span>
                  <button onClick={() => setFiles(fs => fs.filter((_, idx) => idx !== i))} className="ml-1 text-zinc-500 hover:text-rose-400">&times;</button>
                </div>
              ))}
            </div>
          )}
          
          <form onSubmit={handleFormSubmit} className="relative">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={e => {
                if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="hidden" 
              multiple 
              accept=".pdf,.txt,.md,.png,.jpg,.jpeg" 
            />
            <div className="absolute left-4 top-4 flex gap-2 z-10">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>
            
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFormSubmit(e as any);
                }
              }}
              placeholder="Ask anything..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-14 pr-16 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 resize-none min-h-[56px] placeholder-zinc-500"
              rows={1}
            />
            <div className="absolute right-4 top-3.5 z-10">
              <button 
                type="submit" 
                disabled={isLoading || (!input.trim() && files.length === 0)}
                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/10 disabled:opacity-50 disabled:shadow-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          <p className="text-[10px] text-center text-zinc-600 mt-3">AI Workspace • Configured for Speed and Privacy</p>
        </div>
      </div>
    </div>
  );
}
