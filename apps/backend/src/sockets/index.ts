import { Server } from 'socket.io';
export function registerSockets(io: Server) {
  io.on('connection', (socket) => {
    socket.on('subscribe', (room: string) => socket.join(room));
  });
}