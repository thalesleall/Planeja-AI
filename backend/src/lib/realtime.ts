import { Server as SocketIOServer } from 'socket.io';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import config from '../config';
import http from 'http';

let io: SocketIOServer | null = null;

export const initRealtime = async (server: http.Server) => {
  if (io) return io;

  const redisHost = process.env.REDIS_HOST || '127.0.0.1';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379');

  const pubClient = new Redis({ host: redisHost, port: redisPort });
  const subClient = pubClient.duplicate();
  // ioredis connects automatically on first command; ensure connection readiness if needed
  try {
    await pubClient.ping();
  } catch (err: any) {
    // ignore connection errors in local dev if Redis not available
    console.warn('Redis ping failed (continuing without adapter):', err?.message || err);
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  try {
    io.adapter(createAdapter(pubClient as any, subClient as any));
  } catch (err: any) {
    console.warn('Failed to set Redis adapter for Socket.IO, continuing without adapter:', err?.message || err);
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
