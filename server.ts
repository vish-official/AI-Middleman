import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index';
import { users, apiKeys, chats, messages, files } from './src/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import { streamText, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-mvp';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Setup file uploads
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });
  const upload = multer({ storage });
  
  // Static uploads route
  app.use('/uploads', express.static(uploadDir));

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- API Routes ---
  
  // Auth
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const existing = db.select().from(users).where(eq(users.email, email)).get();
      if (existing) return res.status(400).json({ error: 'Email already exists' });
      
      const passwordHash = await bcrypt.hash(password, 10);
      const id = crypto.randomUUID();
      
      db.insert(users).values({
        id,
        name,
        email,
        passwordHash,
        createdAt: Date.now()
      }).run();
      
      const token = jwt.sign({ id, email, name }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id, name, email } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = db.select().from(users).where(eq(users.email, email)).get();
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });
      
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
      
      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  
  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    const user = db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, req.user.id)).get();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  // API Keys
  app.get('/api/keys', authenticateToken, async (req: any, res) => {
    const keys = db.select({ id: apiKeys.id, provider: apiKeys.provider, createdAt: apiKeys.createdAt }).from(apiKeys).where(eq(apiKeys.userId, req.user.id)).all();
    res.json(keys);
  });

  app.post('/api/keys', authenticateToken, async (req: any, res) => {
    const { provider, key } = req.body;
    try {
      // Upsert
      const existing = db.select().from(apiKeys).where(and(eq(apiKeys.userId, req.user.id), eq(apiKeys.provider, provider))).get();
      if (existing) {
        db.update(apiKeys).set({ key }).where(eq(apiKeys.id, existing.id)).run();
      } else {
        db.insert(apiKeys).values({
          id: crypto.randomUUID(),
          userId: req.user.id,
          provider,
          key,
          createdAt: Date.now()
        }).run();
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/keys/:provider', authenticateToken, async (req: any, res) => {
    const { provider } = req.params;
    db.delete(apiKeys).where(and(eq(apiKeys.userId, req.user.id), eq(apiKeys.provider, provider))).run();
    res.json({ success: true });
  });

  // Chats
  app.get('/api/chats', authenticateToken, async (req: any, res) => {
    const userChats = db.select().from(chats).where(eq(chats.userId, req.user.id)).orderBy(desc(chats.updatedAt)).all();
    res.json(userChats);
  });

  app.post('/api/chats', authenticateToken, async (req: any, res) => {
    const { title, provider } = req.body;
    const id = crypto.randomUUID();
    const now = Date.now();
    db.insert(chats).values({
      id,
      userId: req.user.id,
      title: title || 'New Chat',
      provider,
      createdAt: now,
      updatedAt: now
    }).run();
    res.json({ id, title, provider });
  });

  app.get('/api/chats/:id', authenticateToken, async (req: any, res) => {
    const chat = db.select().from(chats).where(and(eq(chats.id, req.params.id), eq(chats.userId, req.user.id))).get();
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    
    const msgs = db.select().from(messages).where(eq(messages.chatId, chat.id)).orderBy(messages.createdAt).all();
    const chatFiles = db.select().from(files).where(eq(files.chatId, chat.id)).orderBy(files.createdAt).all();
    
    res.json({ ...chat, messages: msgs, files: chatFiles });
  });

  app.delete('/api/chats/:id', authenticateToken, async (req: any, res) => {
    db.delete(chats).where(and(eq(chats.id, req.params.id), eq(chats.userId, req.user.id))).run();
    res.json({ success: true });
  });

  // Files
  app.post('/api/chats/:id/files', authenticateToken, upload.array('files'), async (req: any, res) => {
    const chat = db.select().from(chats).where(and(eq(chats.id, req.params.id), eq(chats.userId, req.user.id))).get();
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    
    const uploadedFiles: any[] = [];
    if (req.files) {
      for (const file of req.files as Express.Multer.File[]) {
        const id = crypto.randomUUID();
        db.insert(files).values({
          id,
          chatId: chat.id,
          filename: file.originalname,
          filepath: `/uploads/${file.filename}`,
          mimetype: file.mimetype,
          createdAt: Date.now()
        }).run();
        uploadedFiles.push({ id, filename: file.originalname, filepath: `/uploads/${file.filename}` });
      }
    }
    res.json(uploadedFiles);
  });

  // Chat API using AI SDK
  app.post('/api/chat', authenticateToken, async (req: any, res) => {
    const { chatId } = req.body;
    const requestMessages = req.body.messages || [];
    const lastMessage = requestMessages[requestMessages.length - 1];
    const content = lastMessage ? lastMessage.content : '';
    
    try {
      const chat = db.select().from(chats).where(and(eq(chats.id, chatId), eq(chats.userId, req.user.id))).get();
      if (!chat) return res.status(404).json({ error: 'Chat not found' });
      
      const apiKeyRecord = db.select().from(apiKeys).where(and(eq(apiKeys.userId, req.user.id), eq(apiKeys.provider, chat.provider))).get();
      if (!apiKeyRecord) return res.status(400).json({ error: `API key for ${chat.provider} not found` });

      // Build file context
      const chatFiles = db.select().from(files).where(eq(files.chatId, chatId)).all();
      let fileContext = '';
      if (chatFiles.length > 0) {
        fileContext = 'Attached files context:\n';
        for (const f of chatFiles) {
          if (f.mimetype.startsWith('text/') || f.filename.endsWith('.txt') || f.filename.endsWith('.md')) {
            try {
              const fullPath = path.join(process.cwd(), f.filepath);
              if (fs.existsSync(fullPath)) {
                const text = fs.readFileSync(fullPath, 'utf-8');
                fileContext += `\n--- ${f.filename} ---\n${text.slice(0, 10000)}\n`; // limit to 10k chars per file
              }
            } catch (e) {}
          }
        }
      }

      const finalContent = fileContext ? `${content}\n\n${fileContext}` : content;

      // Save user message
      const userMsgId = crypto.randomUUID();
      db.insert(messages).values({
        id: userMsgId,
        chatId,
        role: 'user',
        content, // save original content in DB
        createdAt: Date.now()
      }).run();
      
      db.update(chats).set({ updatedAt: Date.now() }).where(eq(chats.id, chatId)).run();

      const msgs = db.select({ role: messages.role, content: messages.content }).from(messages).where(eq(messages.chatId, chatId)).orderBy(messages.createdAt).all();
      
      // Override the last user message content with the injected context
      msgs[msgs.length - 1].content = finalContent;

      
      let model;
      if (chat.provider === 'openai') {
        const openai = createOpenAI({ apiKey: apiKeyRecord.key });
        model = openai('gpt-4o');
      } else if (chat.provider === 'anthropic') {
        const anthropic = createAnthropic({ apiKey: apiKeyRecord.key });
        model = anthropic('claude-3-5-sonnet-latest');
      } else if (chat.provider === 'gemini') {
        const google = createGoogleGenerativeAI({ apiKey: apiKeyRecord.key });
        model = google('gemini-3.5-flash'); // Use gemini-3.5-flash to match user API key quota
      } else if (chat.provider === 'openrouter') {
        const openrouter = createOpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: apiKeyRecord.key });
        model = openrouter('openai/gpt-4o'); // Default openrouter model or we'd need to let them pick, but V1 just uses this
      } else {
        throw new Error('Unsupported provider');
      }

      const result = await streamText({
        model,
        messages: msgs as any[],
        onFinish: ({ text }) => {
          db.insert(messages).values({
            id: crypto.randomUUID(),
            chatId,
            role: 'assistant',
            content: text,
            createdAt: Date.now()
          }).run();
        }
      });

      result.pipeDataStreamToResponse(res);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Settings / Account Delete
  app.delete('/api/auth/me', authenticateToken, async (req: any, res) => {
    db.delete(users).where(eq(users.id, req.user.id)).run();
    res.json({ success: true });
  });
  
  app.post('/api/auth/password', authenticateToken, async (req: any, res) => {
    const { password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    db.update(users).set({ passwordHash }).where(eq(users.id, req.user.id)).run();
    res.json({ success: true });
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
