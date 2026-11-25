/**
 * Send Expo push notifications to one or more Expo push tokens.
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export function isExpoPushToken(token) {
  return typeof token === "string" && /^ExponentPushToken\[.+\]$/.test(token.trim());
}

/**
 * @param {string[]} tokens
 * @param {{ title: string, body: string, data?: object, priority?: string }} payload
 */
export async function sendExpoPush(tokens, { title, body, data = {}, priority = "default" }) {
  const unique = [...new Set((tokens || []).filter(isExpoPushToken))];
  if (!unique.length) return { sent: 0, tickets: [] };

  const messages = unique.map((to) => ({
    to,
    sound: "default",
    title: String(title || "RA Trading").slice(0, 100),
    body: String(body || "").slice(0, 300),
    data,
    priority: priority === "urgent" || priority === "high" ? "high" : "default",
    channelId: "default",
  }));

  // Expo accepts batches of up to 100
  const tickets = [];
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
      const json = await res.json();
      if (Array.isArray(json?.data)) tickets.push(...json.data);
      else if (json?.data) tickets.push(json.data);
    } catch (err) {
      console.error("Expo push send error:", err);
    }
  }

  return { sent: unique.length, tickets };
}
