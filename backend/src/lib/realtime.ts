import { Server as SocketIOServer } from 'socket.io';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import config from '../config';
import http from 'http';

let io: SocketIOServer | null = null;

export const initRealtime = async (server: http.Server) => {
  if (io) return io;

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // Tentar usar Redis adapter apenas se Redis estiver disponível
  const redisEnabled = process.env.REDIS_ENABLED !== 'false';
  if (redisEnabled) {
    try {
      const redisHost = process.env.REDIS_HOST || '127.0.0.1';
      const redisPort = parseInt(process.env.REDIS_PORT || '6379');

      const pubClient = new Redis({ 
        host: redisHost, 
        port: redisPort,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Não tentar reconectar
        lazyConnect: true // Não conectar automaticamente
      });
      
      const subClient = pubClient.duplicate();

      // Adicionar handler de erro para evitar crashes
      pubClient.on('error', () => {
        // Silenciar erros do Redis
      });
      subClient.on('error', () => {
        // Silenciar erros do Redis
      });

      // Testar conexão com timeout
      await Promise.race([
        pubClient.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000))
      ]);

      await pubClient.ping();
      io.adapter(createAdapter(pubClient as any, subClient as any));
      console.log('✅ Redis adapter conectado');
    } catch (err: any) {
      console.log('⚠️ Redis não disponível - continuando sem adapter (modo single-server)');
    }
  }

  // JWT handshake authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication error: token required'));

      jwt.verify(token, config.security.sessionSecret, (err: any, decoded: any) => {
        if (err) return next(new Error('Authentication error: invalid token'));
        socket.data.user = decoded;
        next();
      });
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    const userId = user?.id;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on('disconnect', () => {
      // noop for now
    });
  });

  console.log('✅ Socket.IO init complete');
  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Realtime not initialized');
  return io as SocketIOServer;
};

export default { initRealtime, getIO };
