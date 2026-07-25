import { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@kubequest/shared';
import { registerRoomHandlers } from './handlers/room';
import { registerGameHandlers } from './handlers/game';
import { config } from '../config';

export function setupSocketServer(httpServer: import('http').Server): Server {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);

    socket.on('error', (err) => {
      console.error(`[socket] error on ${socket.id}:`, err);
    });
  });

  return io;
}
