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
    const interval = setInterval(fetchAINotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAINotifications = async () => {
    try {
      const response = await api.get('/ai/notifications');
      const formattedNotifications = response.data.map((notif: any) => ({
        ...notif,
        timestamp: new Date(notif.timestamp),
        icon: getNotificationIcon(notif.type),
        color: getNotificationColor(notif.type)
      }));
      
      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter((n: AINotification) => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch AI notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'water': return <Droplets className="h-5 w-5" />;
      case 'workout': return <Dumbbell className="h-5 w-5" />;
      case 'diet': return <Apple className="h-5 w-5" />;
      case 'motivation': return <Heart className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'water': return 'from-blue-500 to-cyan-600';
      case 'workout': return 'from-green-500 to-emerald-600';
      case 'diet': return 'from-orange-500 to-red-600';
      case 'motivation': return 'from-purple-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/ai/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      await api.delete(`/ai/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setUnreadCount(prev => {
        const notif = notifications.find(n => n.id === notificationId);
        return notif && !notif.read ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
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
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Bell className="h-6 w-6 text-gray-700" />
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed top-16 right-4 w-80 max-h-96 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">AI Notifications</h3>
              <Button
                onClick={() => setShowNotifications(false)}
                variant="ghost"
                icon={X}
                size="sm"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors duration-200 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full bg-gradient-to-r ${notification.color} text-white flex-shrink-0`}>
                        {notification.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600 ml-2"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(notification.timestamp)}
                          </p>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notifications yet</p>
                <p className="text-sm text-gray-400">AI will send you personalized tips!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AINotifications;