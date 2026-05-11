import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import { notificationClient } from "../../clients/apolloClients.jsx";

const GET_NOTIFICATIONS_BADGE = gql`
  query GetNotificationsBadge {
    getNotifications {
      id
      isRead
    }
  }
`;

const GREEN = "#3fcf8e";
const GRAY_BORDER = "#e0e0e0";
const TEXT_MAIN = "#1a1a1a";

const NAV_ITEMS = [
  { label: "Home", path: "/dashboard" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Matches", path: "/matches" },
  { label: "Study Sessions", path: "/study-sessions" },
  { label: "Connections", path: "/connections" },
];

export function NotificationBell({ onClick }) {
  const navigate = useNavigate();
  const { data: notificationsData } = useQuery(GET_NOTIFICATIONS_BADGE, {
    client: notificationClient,
    fetchPolicy: "cache-first",
  });

  const unreadCount =
    notificationsData?.getNotifications?.filter((n) => !n.isRead).length || 0;

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

  const { data: notificationsData } = useQuery(GET_NOTIFICATIONS_BADGE, {
    client: notificationClient,
    fetchPolicy: "cache-first",
  });

  const unreadCount =
    notificationsData?.getNotifications?.filter((n) => !n.isRead).length || 0;

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
