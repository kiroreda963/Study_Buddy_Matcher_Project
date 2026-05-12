import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  matchingClient,
  notificationClient,
} from "../../clients/apolloClients.jsx";

const GET_NOTIFICATIONS_BADGE = gql`
  query GetNotificationsBadge {
    getNotifications {
      id
      type
      isRead
      senderId
    }
  }
`;

const GET_BUDDY_REQUESTS_BADGE = gql`
  query GetBuddyRequestsBadge {
    getBuddyRequests {
      id
      senderId
      status
    }
  }
`;

const GET_MATCHES_BADGE = gql`
  query GetMatchesBadge {
    getUserMatches {
      id
      userId
      matchedUserId
    }
  }
`;

const GREEN = "#3fcf8e";
const GRAY_BORDER = "#e0e0e0";
const LOCAL_READ_STORAGE_KEY = "studyBuddy.notifications.locallyReadIds";
const NOTIFICATIONS_READ_EVENT = "studyBuddy:notifications-read";

const NAV_ITEMS = [
  { label: "Home", path: "/dashboard" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Matches", path: "/matches" },
  { label: "Study Sessions", path: "/study-sessions" },
  { label: "Connections", path: "/connections" },
];

function normalizeNotificationType(type) {
  if (type == null) return "";
  return String(type).trim().replace(/\s+/g, "_").toUpperCase();
}

function loadLocallyReadIds() {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(LOCAL_READ_STORAGE_KEY) || "[]",
    );
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function getStoredUserId() {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    return storedUser?.id ? String(storedUser.id) : "";
  } catch {
    return "";
  }
}

function getOtherMatchUserId(match, currentUserId) {
  const current = String(currentUserId || "");
  const userId = String(match?.userId || "");
  const matchedUserId = String(match?.matchedUserId || "");
  if (!current) return matchedUserId || userId;
  if (userId === current) return matchedUserId;
  if (matchedUserId === current) return userId;
  return matchedUserId || userId;
}

export function NotificationBell({ onClick }) {
  const navigate = useNavigate();
  const [locallyReadIds, setLocallyReadIds] = useState(() =>
    loadLocallyReadIds(),
  );
  const { data: notificationsData, refetch } = useQuery(GET_NOTIFICATIONS_BADGE, {
    client: notificationClient,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-and-network",
    pollInterval: 10000,
    notifyOnNetworkStatusChange: true,
  });
  const { data: buddyData, refetch: refetchBuddy } = useQuery(
    GET_BUDDY_REQUESTS_BADGE,
    {
      client: matchingClient,
      fetchPolicy: "cache-and-network",
      pollInterval: 10000,
    },
  );
  const { data: matchData, refetch: refetchMatches } = useQuery(
    GET_MATCHES_BADGE,
    {
      client: matchingClient,
      fetchPolicy: "cache-and-network",
      pollInterval: 10000,
    },
  );

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        refetch().catch(() => {});
        refetchBuddy().catch(() => {});
        refetchMatches().catch(() => {});
        setLocallyReadIds(loadLocallyReadIds());
      }
    };
    const syncLocalReads = () => setLocallyReadIds(loadLocallyReadIds());
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener(NOTIFICATIONS_READ_EVENT, syncLocalReads);
    window.addEventListener("storage", syncLocalReads);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener(NOTIFICATIONS_READ_EVENT, syncLocalReads);
      window.removeEventListener("storage", syncLocalReads);
    };
  }, [refetch, refetchBuddy, refetchMatches]);

  const unreadCount = useMemo(() => {
    const currentUserId = getStoredUserId();
    const realNotifications = notificationsData?.getNotifications ?? [];
    const realKeys = new Set(
      realNotifications.map(
        (n) => `${normalizeNotificationType(n.type)}:${n.senderId || ""}`,
      ),
    );
    const realUnread = realNotifications.filter((n) => !n.isRead).length;

    const buddyFallbackUnread = (buddyData?.getBuddyRequests ?? []).filter(
      (request) =>
        request.status === "PENDING" &&
        request.senderId &&
        !realKeys.has(`BUDDY_REQUEST_SENT:${String(request.senderId)}`) &&
        !locallyReadIds.has(`fallback-buddy-${request.id}`),
    ).length;

    const matchFallbackUnread = (matchData?.getUserMatches ?? []).filter(
      (match) => {
        const senderId = getOtherMatchUserId(match, currentUserId);
        return (
          senderId &&
          !realKeys.has(`MATCH_GENERATED:${String(senderId)}`) &&
          !locallyReadIds.has(`fallback-match-${match.id}`)
        );
      },
    ).length;

    return realUnread + buddyFallbackUnread + matchFallbackUnread;
  }, [buddyData, locallyReadIds, matchData, notificationsData]);

  return (
    <button
      type="button"
      onClick={onClick ?? (() => navigate("/notifications"))}
      style={{
        position: "relative",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        flexShrink: 0,
        boxSizing: "border-box",
        border: "none",
        background: "transparent",
        padding: 0,
      }}
      aria-label="Open notifications"
    >
      <img
        src="/bell_icon.svg"
        alt="Notifications"
        style={{
          width: 36,
          height: 36,
          objectFit: "contain",
          display: "block",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: -6,
          right: -8,
          minWidth: 18,
          height: 18,
          borderRadius: 999,
          background: GREEN,
          color: "#fff",
          fontSize: 11,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 5px",
          lineHeight: 1,
        }}
      >
        {unreadCount}
      </span>
    </button>
  );
}

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        height: 64,
        background: "#fff",
        borderBottom: `1px solid ${GRAY_BORDER}`,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <span
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: GREEN,
          letterSpacing: -0.5,
        }}
      >
        Learn Together
      </span>
      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        {NAV_ITEMS.map((item) => (
          <span
            key={item.label}
            style={{
              fontSize: 14,
              color: "#555",
              cursor: "pointer",
              fontWeight: 500,
            }}
            role="button"
            tabIndex={0}
            onClick={() => navigate(item.path)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                navigate(item.path);
              }
            }}
            onMouseEnter={(e) => (e.target.style.color = GREEN)}
            onMouseLeave={(e) => (e.target.style.color = "#555")}
          >
            {item.label}
          </span>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexShrink: 0,
          lineHeight: 0,
        }}
      >
        <NotificationBell />
        <div
          style={{
            width: 36,
            height: 36,
            boxSizing: "border-box",
            borderRadius: "50%",
            border: `2px solid ${GRAY_BORDER}`,
            overflow: "hidden",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            background: "#fafafa",
            lineHeight: 0,
            marginTop: -3,
          }}
          aria-label="Profile picture"
        >
          <img
            src="/pfp.png"
            alt=""
            onClick={() => {
              navigate("/user-activity");
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
