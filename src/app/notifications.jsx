import { Colors } from "@/constants/theme";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  ScrollView,
} from "react-native";

const { API_BASE_URL } = Constants.expoConfig.extra;

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [markingRead, setMarkingRead] = useState(null);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      // Poll every 30 seconds for new notifications
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const loadUserId = async () => {
    try {
      const user = JSON.parse(await AsyncStorage.getItem("user") || "null");
      if (user?._id) {
        setUserId(user._id);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.log("Error loading user:", error);
    }
  };

  const fetchNotifications = async () => {
    const user = JSON.parse(await AsyncStorage.getItem("user"));
    if (!user?._id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/user/notifications?userId=${user._id}`
      );
      const data = await res.json();
      if (data.success) {
        // ✅ Fix: Backend uses 'isRead', not 'read'
        const sorted = (data.notifications || []).sort((a, b) => {
          if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setNotifications(sorted);
      } else {
        console.log("Notifications fetch failed:", data.message);
      }
    } catch (err) {
      console.log("Notifications fetch error:", err);
    }
    setLoading(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id) => {
    // ✅ Fix: Check isRead instead of read
    const notif = notifications.find((n) => n._id === id);
    if (notif?.isRead) return;

    setMarkingRead(id);
    try {
      // ✅ Fix: Use correct endpoint with ID
      const res = await fetch(`${API_BASE_URL}/api/user/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success || res.ok) {
        // ✅ Fix: Update isRead field
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      } else {
        console.log("Mark read failed:", data.message || "Unknown error");
        // Still update UI optimistically
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.log("Mark read error:", err);
      // Update UI optimistically even on error
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } finally {
      setMarkingRead(null);
    }
  };

  const markAllAsRead = async () => {
    // ✅ Fix: Check isRead instead of read
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n._id);
    if (unreadIds.length === 0) return;

    try {
      const user = JSON.parse(await AsyncStorage.getItem("user"));
      
      // ✅ Fix: Use PUT with userId in query params
      const res = await fetch(
        `${API_BASE_URL}/api/user/notifications/mark-all-read?userId=${user._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await res.json();
      if (data.success || res.ok) {
        // ✅ Fix: Update isRead field
        setNotifications((prev) =>
          prev.map((n) => (n.isRead ? n : { ...n, isRead: true }))
        );
      } else {
        console.log("Mark all read failed:", data.message || "Unknown error");
        // Still update UI optimistically
        setNotifications((prev) =>
          prev.map((n) => (n.isRead ? n : { ...n, isRead: true }))
        );
      }
    } catch (err) {
      console.log("Mark all read error:", err);
      // Update UI optimistically even on error
      setNotifications((prev) =>
        prev.map((n) => (n.isRead ? n : { ...n, isRead: true }))
      );
    }
  };

  const handleNotificationPress = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
    
    // Navigate if actionUrl exists
    if (notif.actionUrl) {
      // Remove leading slash and convert to app route
      const route = notif.actionUrl.replace(/^\//, "");
      router.push(route);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "order":
        return <Ionicons name="bag" size={24} color={theme.tint} />;
      case "product":
        return <Ionicons name="cube" size={24} color={theme.tint} />;
      case "alert":
        return <Ionicons name="alert-circle" size={24} color="#ef4444" />;
      default:
        return <Ionicons name="information-circle" size={24} color={theme.tint} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "#ef4444";
      case "high":
        return "#f97316";
      case "medium":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: theme.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
        {/* ✅ Fix: Check isRead instead of read */}
        {notifications.filter((n) => !n.isRead).length > 0 && (
          <TouchableOpacity
            style={[styles.markAllBtn, { backgroundColor: theme.tint }]}
            onPress={markAllAsRead}
          >
            <Text style={[styles.markAllText, { color: theme.buttonText }]}>
              Mark All Read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.empty, { color: theme.icon }]}>
            No notifications yet
          </Text>
        </View>
      ) : (
        notifications.map((notif) => (
          <TouchableOpacity
            key={notif._id}
            style={[
              styles.notificationCard,
              {
                backgroundColor: notif.isRead
                  ? theme.background
                  : colorScheme === "dark"
                  ? "#1a1a1a"
                  : "#f0f7ff",
                borderColor: notif.isRead
                  ? theme.icon + "22"
                  : theme.tint + "44",
                borderWidth: notif.isRead ? 1 : 2,
                opacity: markingRead === notif._id ? 0.6 : 1,
              },
            ]}
            onPress={() => markAsRead(notif._id)}
            disabled={markingRead === notif._id || notif.isRead}
          >
            <View style={styles.notificationContent}>
              <Text style={styles.icon}>{getIcon(notif.type)}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={[styles.notifTitle, { color: theme.text }]}>
                    {notif.title}
                  </Text>
                  {/* ✅ Fix: Check isRead instead of read */}
                  {!notif.isRead && (
                    <View
                      style={[styles.unreadDot, { backgroundColor: theme.tint }]}
                    />
                  )}
                </View>
                <Text style={[styles.notifMessage, { color: theme.icon }]}>
                  {notif.message}
                </Text>
                <Text style={[styles.notifTime, { color: theme.icon }]}>
                  {formatDate(notif.createdAt)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  back: {
    fontSize: 24,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  markAllBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  notificationCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  icon: {
    marginRight: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  notifMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notifTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  empty: {
    fontSize: 16,
    marginTop: 16,
  },
});
