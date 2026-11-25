"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function NotificationBadge({ isAdmin = false, userId = null }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId && !isAdmin) return;
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAdmin, userId]);

  const fetchUnreadCount = async () => {
    try {
      const url = isAdmin 
        ? "/api/admin/notifications?unreadOnly=true&limit=1"
        : `/api/user/notifications?userId=${userId}&unreadOnly=true&limit=1`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const href = isAdmin 
    ? "/admin-dashboard/notifications"
    : "/user-dashboard/notifications";

  return (
    <Link href={href} className="relative">
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
