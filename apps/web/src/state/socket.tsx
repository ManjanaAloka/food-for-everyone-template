import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../env';
import { useAuth } from './auth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const s = io(WS_URL, {
      withCredentials: true,
      transports: ['polling', 'websocket']
    });

    s.on('connect', () => {
      console.log('Connected to socket server');
      s.emit('subscribe', `user:${user.id}`);
    });

    s.on('notification', (data: any) => {
      console.log('🔔 Real-time notification received:', data);
      
      // Play sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
      } catch (e) {
        console.error('Audio error:', e);
      }

      // Show toast
      const title = data.type === 'PAYMENT_SUCCESS' ? 'Payment Successful' : 'Order Update';
      const msg = data.message || 'Your order has been updated.';
      const cleanMsg = msg.replace(/<\/?[^>]+(>|$)/g, ""); // Strip HTML tags

      toast.success(title, {
        description: cleanMsg,
        duration: 8000,
        action: data.orderId ? {
          label: 'View Order',
          onClick: () => window.location.href = `/orders/${data.orderId}`
        } : undefined
      });

      // Refresh queries
      qc.invalidateQueries({ queryKey: ['notifications'] });
      if (data.orderId) {
        qc.invalidateQueries({ queryKey: ['order', data.orderId] });
      }
      qc.invalidateQueries({ queryKey: ['myOrders'] });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user, qc]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
