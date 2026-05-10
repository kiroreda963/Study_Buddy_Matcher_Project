import { useState } from "react";

const GREEN = "#3fcf8e";
const LIGHT_BG = "#f0faf5";
const GRAY_BORDER = "#e0e0e0";
const TEXT_MAIN = "#1a1a1a";
const TEXT_MUTED = "#888";

const initialNotifications = [
  {
    id: 1,
    title: "New Study Buddy Match Found !",
    description: "You and Masoud share 3 courses and similar study prefrences.",
    time: "Just now",
    read: false,
    type: "match",
    action: { label: "View Match" },
  },
  {
    id: 2,
    title: "Buddy Request Received",
    description: "Sarah Ahmed wants to connect as a study partner",
    time: "2 hours ago",
    read: false,
    type: "request",
    action: { label: "Accept", secondary: "Decline" },
  },
  {
    id: 3,
    title: "Session Invitation",
    description: 'Leithy invited you to join a "Data Structures Study Session ".  Today 7:00 PM',
    time: "5 hours ago",
    read: true,
    type: "session",
    action: { label: "View Session" },
  },
  {
    id: 4,
    title: "Reminder: Study Session Starting Soon",
    description: 'Your " Algorithms Revision Session " begins in 30 mintues.',
    time: "1 day ago",
    read: true,
    type: "reminder",
    action: { label: "Join Session" },
  },
];

export default function NotificationPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [activeNav, setActiveNav] = useState("Study Sessions");

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function dismiss(id) {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  const filtered = notifications.filter(n => {
    const matchesTab = tab === "all" || (tab === "unread" && !n.read) || (tab === "read" && n.read);
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ minHeight: "100vh", background: LIGHT_BG, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>

      {/* Navbar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 64, background: "#fff",
        borderBottom: `1px solid ${GRAY_BORDER}`, position: "sticky", top: 0, zIndex: 100
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: GREEN, letterSpacing: -0.5 }}>Learn Together</span>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {["Home", "Dashboard", "Matches", "Study Sessions", "About Us"].map(n => (
            <span key={n}
              onClick={() => setActiveNav(n)}
              style={{
                fontSize: 14, cursor: "pointer", fontWeight: 500,
                color: "#555"
              }}
              onMouseEnter={e => e.target.style.color = GREEN}
              onMouseLeave={e => e.target.style.color = "#555"}
            >{n}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* Bell */}
          <div style={{ position: "relative", cursor: "pointer" }}>
            <img src="/notficationBell.png" alt="Notifications"
              style={{ width: 36, height: 36, objectFit: "contain", display: "block" }} />
          </div>
          {/* Avatar */}
          <div style={{
            width: 38, height: 38, borderRadius: "50%", border: `2px solid ${GRAY_BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#f5f5f5"
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="4" fill="#555" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#555" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div style={{ maxWidth: 780, margin: "48px auto", padding: "0 16px" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            {/* Bell icon */}
            <div style={{ marginTop: 4 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: TEXT_MAIN }}>Notifications</h1>
              <p style={{ color: TEXT_MUTED, marginTop: 8, fontSize: 15 }}>
                Stay updated with your study activities and invitations
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Unread badge */}
            <div style={{
              background: GREEN, color: "#fff", borderRadius: 20,
              padding: "6px 16px", fontSize: 13, fontWeight: 700
            }}>
              {unreadCount} Unread
            </div>
            {/* Mark all read */}
            <button onClick={markAllRead} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#fff", border: `1.5px solid ${GRAY_BORDER}`,
              borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", color: TEXT_MAIN
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Mark all as read
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#fff", border: `1.5px solid ${GRAY_BORDER}`,
          borderRadius: 10, padding: "10px 16px", marginBottom: 20
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notifications..."
            style={{
              border: "none", outline: "none", fontSize: 14, color: TEXT_MAIN,
              background: "transparent", width: "100%"
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", justifyContent: "center", marginBottom: 24
        }}>
          <div style={{
            display: "inline-flex", background: "#fff", border: `1.5px solid ${GRAY_BORDER}`,
            borderRadius: 30, padding: 4, gap: 2
          }}>
            {[
              { key: "all", label: `All (${notifications.length})` },
              { key: "unread", label: `Unread (${unreadCount})` },
              { key: "read", label: `Read (${readCount})` },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: "8px 28px", borderRadius: 24, border: "none",
                background: tab === t.key ? "#f0f0f0" : "transparent",
                fontWeight: tab === t.key ? 700 : 500,
                fontSize: 14, color: TEXT_MAIN, cursor: "pointer",
                transition: "background 0.15s"
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Notification Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: TEXT_MUTED, padding: 40, fontSize: 15 }}>
              No notifications found.
            </div>
          )}
          {filtered.map(notif => (
            <div key={notif.id} onClick={() => markRead(notif.id)} style={{
              background: notif.read ? "#fff" : "#f0f8ff",
              border: `1.5px solid ${notif.read ? GRAY_BORDER : "#ddeeff"}`,
              borderRadius: 14, padding: "20px 24px",
              cursor: "pointer", transition: "box-shadow 0.15s",
              position: "relative"
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              {/* Unread dot */}
              {!notif.read && (
                <div style={{
                  position: "absolute", top: 20, right: 20,
                  width: 10, height: 10, borderRadius: "50%", background: "#4a90d9"
                }} />
              )}

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: TEXT_MAIN, marginBottom: 6 }}>
                    {notif.title}
                  </div>
                  <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5, marginBottom: 12 }}>
                    {notif.description}
                  </div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>{notif.time}</div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  {notif.action.secondary && (
                    <button onClick={e => { e.stopPropagation(); dismiss(notif.id); }} style={{
                      padding: "8px 18px", borderRadius: 20,
                      border: `1.5px solid ${GRAY_BORDER}`, background: "#fff",
                      fontWeight: 600, fontSize: 13, cursor: "pointer", color: TEXT_MAIN
                    }}>{notif.action.secondary}</button>
                  )}
                  <button onClick={e => { e.stopPropagation(); markRead(notif.id); }} style={{
                    padding: "8px 18px", borderRadius: 20,
                    border: "none", background: GREEN,
                    color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                    transition: "opacity 0.15s"
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >{notif.action.label}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
