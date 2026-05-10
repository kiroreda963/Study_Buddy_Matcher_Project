import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import { notificationClient } from "../clients/apolloClients.jsx";

const GREEN = "#3fcf8e";
const LIGHT_BG = "#f0faf5";
const GRAY_BORDER = "#e0e0e0";
const TEXT_MAIN = "#1a1a1a";
const TEXT_MUTED = "#888";

const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    getNotifications {
      id
      type
      message
      isRead
      createdAt
      senderId
    }
  }
`;

const MARK_AS_READ = gql`
  mutation MarkAsRead($notificationId: ID!) {
    markAsRead(notificationId: $notificationId) {
      id
      isRead
    }
  }
`;

const LOCAL_READ_STORAGE_KEY = "studyBuddy.notifications.locallyReadIds";

function normalizeNotificationId(notificationId) {
  if (notificationId == null) return "";
  return String(notificationId).trim();
}

function loadLocallyReadIds() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(LOCAL_READ_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((id) => normalizeNotificationId(id)).filter(Boolean));
  } catch {
    return new Set();
  }
}

function saveLocallyReadIds(idsSet) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_READ_STORAGE_KEY, JSON.stringify(Array.from(idsSet)));
  } catch {
    /* ignore write failures */
  }
}

/** Updates normalized Notification cache entries (fixes UI when markAsRead API errors). */
function setNotificationReadInCache(client, notificationId) {
  const id = normalizeNotificationId(notificationId);
  if (!id) return;
  try {
    const cacheId = client.cache.identify({ __typename: "Notification", id });
    if (cacheId) {
      client.cache.modify({
        id: cacheId,
        fields: {
          isRead() {
            return true;
          },
        },
      });
      return;
    }
  } catch {
    /* use fallback */
  }
  fallbackMarkNotificationReadQuery(client, id);
}

function fallbackMarkNotificationReadQuery(client, notificationId) {
  try {
    const data = client.readQuery({ query: GET_NOTIFICATIONS });
    const rows = data?.getNotifications ?? [];
    if (!rows.length) return;
    client.writeQuery({
      query: GET_NOTIFICATIONS,
      data: {
        getNotifications: rows.map((n) =>
          normalizeNotificationId(n.id) === notificationId ? { ...n, isRead: true } : n,
        ),
      },
    });
  } catch {
    /* no cache yet */
  }
}

export default function NotificationPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [activeNav, setActiveNav] = useState("Study Sessions");
  const [mutationError, setMutationError] = useState("");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [locallyReadIds, setLocallyReadIds] = useState(() => loadLocallyReadIds());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  const { data, loading, error, refetch } = useQuery(GET_NOTIFICATIONS, {
    client: notificationClient,
    fetchPolicy: "cache-and-network",
  });
  const [markAsRead, markState] = useMutation(MARK_AS_READ, { client: notificationClient });

  const notifications = useMemo(() => {
    const rows = data?.getNotifications ?? [];
    return rows.map((n) => ({
      id: n.id,
      title: notificationTypeToTitle(n.type),
      description: n.message,
      time: formatNotificationTime(n.createdAt, nowTick),
      read: Boolean(n.isRead) || locallyReadIds.has(normalizeNotificationId(n.id)),
      rawType: n.type,
    }));
  }, [data, nowTick, locallyReadIds]);

  useEffect(() => {
    saveLocallyReadIds(locallyReadIds);
  }, [locallyReadIds]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  async function markAllRead() {
    setMutationError("");
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    unread.forEach((n) => setNotificationReadInCache(notificationClient, n.id));
    setLocallyReadIds((prev) => {
      const next = new Set(prev);
      unread.forEach((n) => {
        next.add(normalizeNotificationId(n.id));
      });
      return next;
    });

    try {
      await Promise.all(
        unread.map((n) =>
          markAsRead({
            variables: { notificationId: normalizeNotificationId(n.id) },
          }),
        ),
      );
      await refetch();
    } catch {
      // Cache already reflects read; server may still be failing
      setMutationError("");
    }
  }

  async function markRead(id) {
    const notificationId = normalizeNotificationId(id);
    if (!notificationId) return;

    setMutationError("");
    setNotificationReadInCache(notificationClient, notificationId);
    setLocallyReadIds((prev) => {
      const next = new Set(prev);
      next.add(notificationId);
      return next;
    });

    try {
      await markAsRead({ variables: { notificationId } });
      await refetch();
    } catch {
      // UI already updated via cache above
      setMutationError("");
    }
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
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0, lineHeight: 0 }}>
          {/* Bell */}
          <div style={{
            position: "relative",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            flexShrink: 0,
            boxSizing: "border-box",
          }}>
            <img src="/bell_icon.svg" alt="Notifications"
              style={{ width: 36, height: 36, objectFit: "contain", display: "block" }} />
            <span style={{
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
            }}>
              {unreadCount}
            </span>
          </div>
          {/* Avatar */}
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
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div style={{ maxWidth: 780, margin: "48px auto", padding: "0 16px" }}>
        {error && (
          <div style={{
            background: "#fff",
            border: `1.5px solid ${GRAY_BORDER}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 16
          }}>
            <div style={{ fontWeight: 800, color: TEXT_MAIN, marginBottom: 4 }}>Couldn’t load notifications</div>
            <div style={{ color: TEXT_MUTED, fontSize: 13 }}>{String(error.message || error)}</div>
          </div>
        )}
        {mutationError && (
          <div style={{
            background: "#fff",
            border: "1.5px solid #fecaca",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16
          }}>
            <div style={{ fontWeight: 800, color: "#b91c1c", marginBottom: 4 }}>Action failed</div>
            <div style={{ color: "#b91c1c", fontSize: 13 }}>{mutationError}</div>
          </div>
        )}

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
            <button onClick={markAllRead} disabled={markState.loading} style={{
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
              {loading ? "Loading notifications..." : "No notifications found."}
            </div>
          )}
          {filtered.map(notif => (
            <div key={notif.id} onClick={() => notif.read || markRead(notif.id)} style={{
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

                {/* Type-specific actions */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  {getNotificationActions(notif.rawType).map((action) => (
                    <button
                      key={action.label}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!notif.read) {
                          await markRead(notif.id);
                        }
                      }}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 20,
                        border: action.variant === "secondary" ? `1.5px solid ${GRAY_BORDER}` : "none",
                        background: action.variant === "secondary" ? "#fff" : GREEN,
                        color: action.variant === "secondary" ? TEXT_MAIN : "#fff",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getMutationErrorMessage(error, fallbackMessage) {
  const graphQLErrorMessage = error?.graphQLErrors?.[0]?.message;
  const networkErrorMessage = error?.networkError?.result?.errors?.[0]?.message;
  return graphQLErrorMessage || networkErrorMessage || error?.message || fallbackMessage;
}

function notificationTypeToTitle(type) {
  if (!type) return "Notification";
  const readable = String(type).toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  return readable;
}

/** Parses ISO strings, millis, unix seconds (number or numeric string). */
function parseNotificationDate(createdAt) {
  if (createdAt == null || createdAt === "") return null;
  if (createdAt instanceof Date) {
    const t = createdAt.getTime();
    return Number.isNaN(t) ? null : createdAt;
  }
  if (typeof createdAt === "number") {
    const ms = createdAt > 1e12 ? createdAt : createdAt * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const s = String(createdAt).trim();
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    const ms = n > 1e12 ? n : n * 1000;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatNotificationTime(createdAt, nowMs = Date.now()) {
  const date = parseNotificationDate(createdAt);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (!date) {
    return "recently";
  }

  const diffMs = Math.max(0, nowMs - date.getTime());

  if (diffMs < minute) return "just now";

  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  /* 60 min … up to before 24 h: hours (+ minutes when remainder) */
  if (diffMs < day) {
    const totalMinutes = Math.floor(diffMs / minute);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (m === 0) {
      return `${h} ${h === 1 ? "hour" : "hours"} ago`;
    }
    return `${h} ${h === 1 ? "hour" : "hours"} and ${m} ${m === 1 ? "minute" : "minutes"} ago`;
  }

  /* 24 h+: days (+ hours when remainder in whole hours) */
  const days = Math.floor(diffMs / day);
  const remainderMs = diffMs % day;
  const hRem = Math.floor(remainderMs / hour);
  if (hRem === 0) {
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
  return `${days} ${days === 1 ? "day" : "days"} and ${hRem} ${hRem === 1 ? "hour" : "hours"} ago`;
}

function getNotificationActions(type) {
  if (type === "MATCH_GENERATED") {
    return [{ label: "View Match", variant: "primary" }];
  }

  if (type === "BUDDY_REQUEST_SENT") {
    return [
      { label: "Decline", variant: "secondary" },
      { label: "Accept", variant: "primary" },
    ];
  }

  if (type === "SESSION_INVITATION" || type === "SESSION_CREATED") {
    return [{ label: "View Session", variant: "primary" }];
  }

  return [];
}
