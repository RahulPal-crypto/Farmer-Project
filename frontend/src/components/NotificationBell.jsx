import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import { useAuth } from "../context/AuthContext";
import { fetchNotifications, markNotificationRead } from "../services/notificationService";

const getNotificationTarget = (notification, user) => {
  const orderId = notification.metadata?.orderId;

  if (notification.type === "chat" && orderId) {
    return `/chat/${orderId}`;
  }

  if ((notification.type === "order" || notification.type === "status") && orderId) {
    return user?.role === "farmer" ? "/farmer/orders" : "/orders";
  }

  if (notification.type === "review") {
    return "/farmer/dashboard";
  }

  if (notification.type === "group-order") {
    return user?.role === "customer" ? "/orders" : "/farmer/orders";
  }

  return user?.role === "farmer" ? "/farmer/dashboard" : "/";
};

function NotificationBell() {
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    let ignore = false;

    fetchNotifications({ limit: 8 })
      .then((data) => {
        if (!ignore) {
          setNotifications(data.notifications || []);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return undefined;
    }

    const socket = io("http://localhost:5000", {
      auth: { token },
    });

    socket.on("notification:new", (notification) => {
      setNotifications((current) => [notification, ...current].slice(0, 8));
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, token]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const handleNotificationClick = async (notification) => {
    setNotifications((current) =>
      current.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item))
    );
    setOpen(false);

    try {
      if (!notification.isRead) {
        await markNotificationRead(notification._id);
      }
    } catch (error) {}

    navigate(getNotificationTarget(notification, user));
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
      >
        Alerts
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-30 w-80 rounded-3xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="px-2 pb-2">
            <p className="font-semibold text-slate-900">Notifications</p>
          </div>
          {notifications.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 px-3 py-4 text-sm text-slate-500">No notifications yet.</p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full rounded-2xl px-3 py-3 text-left text-sm ${
                    notification.isRead ? "bg-slate-50 text-slate-600" : "bg-emerald-50 text-slate-900"
                  }`}
                >
                  <span className="block font-semibold">{notification.title}</span>
                  <span className="mt-1 block text-xs">{notification.message}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
