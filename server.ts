import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Simple in-memory stores (for demo purposes)
// In production, use a proper DB (Postgres, Mongo, etc.) and Session Store (Redis)
interface User {
    username: string;
    password: string; // In production, this MUST be hashed
    role: 'admin' | 'user';
    createdAt: Date;
}

interface Session {
    username: string;
    createdAt: Date;
}

const users: User[] = [];
const sessions: Record<string, Session> = {};

// Initialize users from env
const allowedUsersEnv = process.env.ALLOWED_USERS || 'admin:password';
allowedUsersEnv.split(',').forEach(pair => {
    const [u, p] = pair.split(':');
    if (u && p) {
        users.push({
            username: u,
            password: p,
            role: u === 'admin' ? 'admin' : 'user',
            createdAt: new Date()
        });
    }
});

// Authentication Middleware
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.cookies['auth_token'];
    if (token && sessions[token]) {
        (req as any).user = sessions[token];
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    const dbUser = users.find(u => u.username === user.username);
    if (dbUser && dbUser.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
};

// Login Endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Generate a simple token
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessions[token] = { username: user.username, createdAt: new Date() };
        
        // Set HTTP-only cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        res.json({ success: true, isAdmin: user.role === 'admin' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Register Endpoint
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'User already exists' });
    }

    // In a real app, hash the password here!
    const newUser: User = {
        username,
        password,
        role: 'user', // Default role is user
        createdAt: new Date()
    };

    users.push(newUser);

    // Auto-login after registration
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessions[token] = { username: newUser.username, createdAt: new Date() };

    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ success: true, isAdmin: false });
});

// Logout Endpoint
app.post('/api/auth/logout', (req, res) => {
    const token = req.cookies['auth_token'];
    if (token) {
        delete sessions[token];
    }
    res.clearCookie('auth_token');
    res.json({ success: true });
});

// Check Auth Status Endpoint
app.get('/api/auth/check', (req, res) => {
    const token = req.cookies['auth_token'];
    if (token && sessions[token]) {
        const session = sessions[token];
        const user = users.find(u => u.username === session.username);
        res.json({ authenticated: true, isAdmin: user?.role === 'admin', username: session.username });
    } else {
        res.json({ authenticated: false });
    }
});

// Admin Stats Endpoint
app.get('/api/admin/stats', authenticate, requireAdmin, (req, res) => {
    const activeSessions = Object.values(sessions).length;
    const totalUsers = users.length;
    
    // Don't send passwords!
    const safeUsers = users.map(u => ({
        username: u.username,
        role: u.role,
        createdAt: u.createdAt
    }));

    const safeSessions = Object.values(sessions).map(s => ({
        username: s.username,
        createdAt: s.createdAt
    }));

    res.json({
        activeSessions,
        totalUsers,
        users: safeUsers,
        sessions: safeSessions
    });
});

async function startServer() {
    // Vite middleware for development
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        // Serve static files in production
        app.use(express.static(path.join(__dirname, 'dist')));
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'dist', 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
