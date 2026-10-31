import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, ExternalLink, ArrowRight } from 'lucide-react';
import apiClient from '../../api/client';
import { Notification } from '../../types';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardContent } from '../../components/common/Card';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/notifications?limit=50');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.meta?.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string, link?: string | null) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      if (link) {
        navigate(link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Notification Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            System alerts, assignment dispatches, and SLA timeline notifications.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            icon={<Check className="w-4 h-4 text-emerald-600" />}
          >
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="divide-y divide-slate-100 p-0">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No notifications found.</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id, n.link)}
                className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-start justify-between gap-4 ${
                  !n.isRead ? 'bg-indigo-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      !n.isRead ? 'bg-indigo-600' : 'bg-transparent'
                    }`}
                  />
                  <div>
                    <h4 className="font-semibold text-xs text-slate-900">{n.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {n.link && (
                  <ArrowRight className="w-4 h-4 text-slate-300 hover:text-indigo-600 shrink-0 mt-1" />
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
