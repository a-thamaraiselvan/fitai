import React, { useState, useEffect } from 'react';
import { Bell, X, Heart, Droplets, Dumbbell, Apple } from 'lucide-react';
import Button from '../UI/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface AINotification {
  id: string;
  type: 'water' | 'workout' | 'diet' | 'motivation';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon: React.ReactNode;
  color: string;
}

const AINotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<AINotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAINotifications();
    const interval = setInterval(fetchAINotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAINotifications = async () => {
    try {
      const response = await api.get('/Ai/GetAiNotifications');
      const formattedNotifications = response.data.map((notif: any) => ({
        ...notif, timestamp: new Date(notif.timestamp),
        icon: getNotificationIcon(notif.type), color: getNotificationColor(notif.type)
      }));
      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter((n: AINotification) => !n.read).length);
    } catch (error) { console.error('Failed to fetch AI notifications:', error); }
  };

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-[18px] w-[18px]";
    switch (type) {
      case 'water': return <Droplets className={iconClass} />;
      case 'workout': return <Dumbbell className={iconClass} />;
      case 'diet': return <Apple className={iconClass} />;
      case 'motivation': return <Heart className={iconClass} />;
      default: return <Bell className={iconClass} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'water': return 'bg-ios-teal/10 text-ios-teal';
      case 'workout': return 'bg-ios-green/10 text-ios-green';
      case 'diet': return 'bg-ios-orange/10 text-ios-orange';
      case 'motivation': return 'bg-ios-purple/10 text-ios-purple';
      default: return 'bg-ios-gray5 text-ios-gray1';
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/Ai/MarkNotificationAsRead/${notificationId}`);
      setNotifications(prev => prev.map(notif => notif.id === notificationId ? { ...notif, read: true } : notif));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) { console.error('Failed to mark notification as read:', error); }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      await api.delete(`/Ai/DeleteNotification/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setUnreadCount(prev => {
        const notif = notifications.find(n => n.id === notificationId);
        return notif && !notif.read ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) { console.error('Failed to dismiss notification:', error); }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="fixed top-3 right-4 z-[60]">
        <button onClick={() => setShowNotifications(!showNotifications)}
          className="relative bg-white/90 backdrop-blur-lg rounded-full p-2.5 shadow-ios active:scale-95 transition-transform duration-150">
          <Bell className="h-5 w-5 text-gray-700" strokeWidth={2} />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 ios-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
      </div>

      {/* Backdrop */}
      {showNotifications && (
        <div className="fixed inset-0 z-50" onClick={() => setShowNotifications(false)} />
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed top-14 right-4 w-80 max-h-[28rem] bg-white rounded-2xl shadow-ios-xl z-[60] overflow-hidden ios-animate-scale-in">
          <div className="px-4 py-3 border-b border-ios-gray5">
            <div className="flex items-center justify-between">
              <h3 className="ios-headline text-gray-900">Notifications</h3>
              <Button onClick={() => setShowNotifications(false)} variant="ghost" icon={X} size="sm" />
            </div>
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {notifications.length > 0 ? (
              <div>
                {notifications.map((notification, index) => (
                  <div key={notification.id}>
                    {index > 0 && <div className="ios-separator" />}
                    <div className={`px-4 py-3 transition-colors duration-150 ${!notification.read ? 'bg-ios-blue/[0.03]' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${notification.color}`}>
                          {notification.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-[14px] font-semibold text-gray-900 truncate">{notification.title}</p>
                            <button onClick={() => dismissNotification(notification.id)}
                              className="text-ios-gray3 hover:text-ios-gray1 ml-2 shrink-0">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-[13px] text-ios-gray1 leading-relaxed mb-1.5">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-ios-gray2">{formatTimeAgo(notification.timestamp)}</p>
                            {!notification.read && (
                              <button onClick={() => markAsRead(notification.id)}
                                className="text-[12px] text-ios-blue font-medium">
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Bell className="h-10 w-10 text-ios-gray3 mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-[15px] text-ios-gray2 mb-1">No notifications</p>
                <p className="text-[13px] text-ios-gray3">AI tips will appear here</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AINotifications;