import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  payload: any;
  is_read: boolean;
  created_at: string;
}

export const NotificationBadge: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await apiService.getUnreadNotificationCount();
        if (res.success && res.data) {
          setUnreadCount(res.data.count);
        }
      } catch (err) {
        console.error('Failed to fetch notification count:', err);
      }
    };
    
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button onClick={onClick} className="relative p-2 hover:bg-gray-700 rounded-lg transition-colors">
      <span className="text-xl">🔔</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export const NotificationsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await apiService.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trade_request': return '🃏';
      case 'trade_accepted': return '✅';
      case 'card_updated': return '🔄';
      case 'friend_request': return '👋';
      default: return '📌';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full max-h-[80vh] flex flex-col border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold">Notifications</h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-amber-500 hover:text-amber-400"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No notifications yet</div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg ${
                    notif.is_read ? 'bg-gray-700/50' : 'bg-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getTypeIcon(notif.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{notif.title}</span>
                        {!notif.is_read && (
                          <span className="w-2 h-2 bg-amber-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{notif.message}</p>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {formatDate(notif.created_at)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="p-1 text-gray-400 hover:text-white"
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="p-1 text-gray-400 hover:text-red-400"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
