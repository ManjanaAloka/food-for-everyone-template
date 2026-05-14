import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../state/auth';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['notifications'],
    refetchInterval: 10000,
    queryFn: async () => (await api.get('/notifications')).data,
    enabled: !!user
  });

  const { mutate: markRead } = useMutation({
    mutationFn: async (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] })
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: async () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] })
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllRead()}
                className="text-xs text-green-600 hover:text-green-700 font-semibold"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                <div className="text-4xl mb-2">📭</div>
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((n: any) => (
                  <div 
                    key={n.id} 
                    className={`p-4 transition-colors ${n.readAt ? 'bg-white opacity-70' : 'bg-green-50/30'}`}
                    onClick={() => {
                      if (!n.readAt) markRead(n.id);
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="text-2xl">
                        {n.type === 'DONATION_FULFILLED' ? '🎉' : 
                         n.type === 'ORDER_CREATED' ? '🛍️' : 
                         n.type === 'ORDER_UPDATE' ? '📦' :
                         n.type === 'APPROVAL' ? '✅' : '🔔'}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm text-gray-800 ${!n.readAt ? 'font-semibold' : ''}`}>
                          <span dangerouslySetInnerHTML={{ __html: n.payload?.message || 'New notification' }} />
                        </p>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                      {!n.readAt && (
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
