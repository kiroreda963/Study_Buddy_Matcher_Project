import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import {
  matchingClient,
  notificationClient,
} from "../clients/apolloClients.jsx";
import Navbar from "./Shared/Navbar.jsx";

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

const GET_BUDDY_REQUESTS = gql`
  query GetBuddyRequests {
    getBuddyRequests {
      id
      senderId
      status
    }
  }
`;

const ACCEPT_BUDDY_REQUEST = gql`
  mutation AcceptBuddyRequest($requestId: ID!) {
    acceptBuddyRequest(requestId: $requestId) {
      id
      status
    }
  }
`;

const REJECT_BUDDY_REQUEST = gql`
  mutation RejectBuddyRequest($requestId: ID!) {
    rejectBuddyRequest(requestId: $requestId) {
      id
      status
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
    return new Set(
      parsed.map((id) => normalizeNotificationId(id)).filter(Boolean),
    );
  } catch {
    return new Set();
  }
}

function saveLocallyReadIds(idsSet) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      LOCAL_READ_STORAGE_KEY,
      JSON.stringify(Array.from(idsSet)),
    );
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
          normalizeNotificationId(n.id) === notificationId
            ? { ...n, isRead: true }
            : n,
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
  const [actionMessage, setActionMessage] = useState("");
  const [buddyActionLoading, setBuddyActionLoading] = useState(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [locallyReadIds, setLocallyReadIds] = useState(() =>
    loadLocallyReadIds(),
  );
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  const { data, loading, error, refetch } = useQuery(GET_NOTIFICATIONS, {
    client: notificationClient,
    fetchPolicy: "cache-and-network",
  });
  const [markAsRead, markState] = useMutation(MARK_AS_READ, {
    client: notificationClient,
  });
  const {
    data: buddyData,
    refetch: refetchBuddyRequests,
    error: buddyQueryError,
  } = useQuery(GET_BUDDY_REQUESTS, {
    client: matchingClient,
    fetchPolicy: "cache-and-network",
  });
  const [acceptBuddyRequest] = useMutation(ACCEPT_BUDDY_REQUEST, {
    client: matchingClient,
  });
  const [rejectBuddyRequest] = useMutation(REJECT_BUDDY_REQUEST, {
    client: matchingClient,
  });

  const pendingBuddyRequests = buddyData?.getBuddyRequests ?? [];
  const pendingBuddySenderIds = useMemo(
    () => new Set(pendingBuddyRequests.map((req) => String(req.senderId))),
    [pendingBuddyRequests],
  );

  const notifications = useMemo(() => {
    const rows = data?.getNotifications ?? [];
    return rows.map((n) => ({
      id: n.id,
      title: notificationTypeToTitle(n.type),
      description: n.message,
      time: formatNotificationTime(n.createdAt, nowTick),
      read:
        Boolean(n.isRead) || locallyReadIds.has(normalizeNotificationId(n.id)),
      rawType: n.type,
      senderId: n.senderId ?? null,
    }));
  }, [data, nowTick, locallyReadIds]);
  const visibleNotifications = useMemo(
    () =>
      notifications.filter((n) => {
        const isBuddy =
          normalizeBuddyNotificationType(n.rawType) === "BUDDY_REQUEST_SENT";
        if (!isBuddy) return true;
        if (!n.senderId) return false;
        return pendingBuddySenderIds.has(String(n.senderId));
      }),
    [notifications, pendingBuddySenderIds],
  );

  useEffect(() => {
    saveLocallyReadIds(locallyReadIds);
  }, [locallyReadIds]);

  const unreadCount = visibleNotifications.filter((n) => !n.read).length;
  const readCount = visibleNotifications.filter((n) => n.read).length;

  async function markAllRead() {
    setMutationError("");
    setActionMessage("");
    const unread = visibleNotifications.filter((n) => !n.read);
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
    setActionMessage("");
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

  async function handleBuddyRequestAction(notification, buddyAction) {
    setMutationError("");
    setActionMessage("");
    if (!notification?.senderId) {
      setMutationError(
        "Missing sender info for this request. It may be an older notification.",
      );
      return;
    }
    let buddyList = pendingBuddyRequests;
    try {
      const { data: freshBuddy } = await refetchBuddyRequests();
      buddyList = freshBuddy?.getBuddyRequests ?? buddyList;
    } catch {
      /* refetch failure — try cached list below */
    }
    const pending =
      buddyList.find(
        (r) => String(r.senderId) === String(notification.senderId),
      ) ?? null;
    if (!pending) {
      setMutationError(
        buddyQueryError
          ? `Could not load buddy requests (${getMutationErrorMessage(buddyQueryError, "matching service unreachable")}). Check that VITE_MATCHING_API_URI matches your matching service URL.`
          : "That buddy request is no longer pending. Try refreshing.",
      );
      return;
    }

    setBuddyActionLoading(buddyAction);
    try {
      const mut =
        buddyAction === "accept" ? acceptBuddyRequest : rejectBuddyRequest;
      await mut({ variables: { requestId: pending.id } });
      await refetchBuddyRequests();
      await refetch();
      setActionMessage(
        buddyAction === "accept"
          ? "Buddy request accepted."
          : "Buddy request declined.",
      );
    } catch (err) {
      const fallback =
        buddyAction === "accept"
          ? "Could not accept buddy request."
          : "Could not decline buddy request.";
      setMutationError(getMutationErrorMessage(err, fallback));
      await refetchBuddyRequests().catch(() => {});
    } finally {
      setBuddyActionLoading(null);
    }
  }

  const filtered = visibleNotifications.filter((n) => {
    const matchesTab =
      tab === "all" ||
      (tab === "unread" && !n.read) ||
      (tab === "read" && n.read);
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: LIGHT_BG,
        fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      }}
    >
      <Navbar />

      {/* Page content */}
      <div style={{ maxWidth: 780, margin: "48px auto", padding: "0 16px" }}>
        {error && (
          <div
            style={{
              background: "#fff",
              border: `1.5px solid ${GRAY_BORDER}`,
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 800, color: TEXT_MAIN, marginBottom: 4 }}>
              Couldn’t load notifications
            </div>
            <div style={{ color: TEXT_MUTED, fontSize: 13 }}>
              {String(error.message || error)}
            </div>
          </div>
        )}
        {buddyQueryError && (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #fde68a",
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 800, color: "#92400e", marginBottom: 4 }}>
              Matching service
            </div>
            <div style={{ color: "#78350f", fontSize: 13 }}>
              {getMutationErrorMessage(
                buddyQueryError,
                "Unable to reach the matching GraphQL API. Set VITE_MATCHING_API_URI in .env if it is not running at the default URL.",
              )}
            </div>
          </div>
        )}
        {mutationError && (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #fecaca",
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 800, color: "#b91c1c", marginBottom: 4 }}>
              Action failed
            </div>
            <div style={{ color: "#b91c1c", fontSize: 13 }}>
              {mutationError}
            </div>
          </div>
        )}
        {actionMessage && (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #86efac",
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <div style={{ color: "#166534", fontSize: 13 }}>
              {actionMessage}
            </div>
          </div>
        )}

        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            {/* Bell icon */}
            <div style={{ marginTop: 4 }}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#333"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  margin: 0,
                  color: TEXT_MAIN,
                }}
              >
                Notifications
              </h1>
              <p style={{ color: TEXT_MUTED, marginTop: 8, fontSize: 15 }}>
                Stay updated with your study activities and invitations
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Unread badge */}
            <div
              style={{
                background: GREEN,
                color: "#fff",
                borderRadius: 20,
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {unreadCount} Unread
            </div>
            {/* Mark all read */}
            <button
              onClick={markAllRead}
              disabled={markState.loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#fff",
                border: `1.5px solid ${GRAY_BORDER}`,
                borderRadius: 20,
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                color: TEXT_MAIN,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Mark all as read
            </button>
          </div>
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#fff",
            border: `1.5px solid ${GRAY_BORDER}`,
            borderRadius: 10,
            padding: "10px 16px",
            marginBottom: 20,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#aaa"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications..."
            style={{
              border: "none",
              outline: "none",
              fontSize: 14,
              color: TEXT_MAIN,
              background: "transparent",
              width: "100%",
            }}
          />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              background: "#fff",
              border: `1.5px solid ${GRAY_BORDER}`,
              borderRadius: 30,
              padding: 4,
              gap: 2,
            }}
          >
            {[
              { key: "all", label: `All (${visibleNotifications.length})` },
              { key: "unread", label: `Unread (${unreadCount})` },
              { key: "read", label: `Read (${readCount})` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "8px 28px",
                  borderRadius: 24,
                  border: "none",
                  background: tab === t.key ? "#f0f0f0" : "transparent",
                  fontWeight: tab === t.key ? 700 : 500,
                  fontSize: 14,
                  color: TEXT_MAIN,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: TEXT_MUTED,
                padding: 40,
                fontSize: 15,
              }}
            >
              {loading ? "Loading notifications..." : "No notifications found."}
            </div>
          )}
          {filtered.map((notif) => (
            <div
              key={notif.id}
              style={{
                background: notif.read ? "#fff" : "#f0f8ff",
                border: `1.5px solid ${notif.read ? GRAY_BORDER : "#ddeeff"}`,
                borderRadius: 14,
                padding: "20px 24px",
                transition: "box-shadow 0.15s",
                position: "relative",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(0,0,0,0.08)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!notif.read) markRead(notif.id);
                  }}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    cursor: notif.read ? "default" : "pointer",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    font: "inherit",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 15,
                      color: TEXT_MAIN,
                      marginBottom: 6,
                    }}
                  >
                    {notif.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: TEXT_MUTED,
                      lineHeight: 1.5,
                      marginBottom: 12,
                    }}
                  >
                    {notif.description}
                  </div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>
                    {notif.time}
                  </div>
                </button>

                {/* Type-specific actions — outside mark-as-read clickable area */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  {/* Unread dot: top-right of action buttons when present */}
                  {!notif.read &&
                    getNotificationActions(
                      normalizeBuddyNotificationType(notif.rawType),
                    ).length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#4a90d9",
                          boxShadow: "0 0 0 2px #fff",
                        }}
                      />
                    )}

                  {/* Unread dot fallback: top-right of card when no actions */}
                  {!notif.read &&
                    getNotificationActions(
                      normalizeBuddyNotificationType(notif.rawType),
                    ).length === 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#4a90d9",
                          boxShadow: "0 0 0 2px #fff",
                        }}
                      />
                    )}
                  {getNotificationActions(
                    normalizeBuddyNotificationType(notif.rawType),
                  ).map((action) => {
                    const buddyBusy = Boolean(
                      action.buddyAction && buddyActionLoading,
                    );
                    return (
                      <button
                        key={action.label}
                        type="button"
                        disabled={buddyBusy}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (action.buddyAction) {
                            await handleBuddyRequestAction(
                              notif,
                              action.buddyAction,
                            );
                            return;
                          }
                          if (!notif.read) {
                            await markRead(notif.id);
                          }
                        }}
                        style={{
                          padding: "8px 18px",
                          borderRadius: 20,
                          border:
                            action.variant === "secondary"
                              ? `1.5px solid ${GRAY_BORDER}`
                              : "none",
                          background:
                            action.variant === "secondary" ? "#fff" : GREEN,
                          color:
                            action.variant === "secondary" ? TEXT_MAIN : "#fff",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: buddyBusy ? "not-allowed" : "pointer",
                          opacity: buddyBusy ? 0.65 : 1,
                          transition: "opacity 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (e.currentTarget.disabled) return;
                          e.currentTarget.style.opacity = "0.85";
                        }}
                        onMouseLeave={(e) => {
                          if (e.currentTarget.disabled) return;
                          e.currentTarget.style.opacity = "1";
                        }}
                      >
                        {action.buddyAction &&
                        buddyActionLoading === action.buddyAction
                          ? action.buddyAction === "accept"
                            ? "Accepting…"
                            : "Declining…"
                          : action.label}
                      </button>
                    );
                  })}
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
  return (
    graphQLErrorMessage ||
    networkErrorMessage ||
    error?.message ||
    fallbackMessage
  );
}

/** Normalize API enums (e.g. Prisma/GQL quirks) so action chips match reliably. */
function normalizeBuddyNotificationType(type) {
  if (type == null) return "";
  return String(type).trim().replace(/\s+/g, "_").toUpperCase();
}

function notificationTypeToTitle(type) {
  if (!type) return "Notification";
  const readable = String(type)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
  const t = normalizeBuddyNotificationType(type);
  if (t === "MATCH_GENERATED") {
    return [{ label: "View Match", variant: "primary" }];
  }

  if (t === "BUDDY_REQUEST_SENT") {
    return [
      { label: "Decline", variant: "secondary", buddyAction: "reject" },
      { label: "Accept", variant: "primary", buddyAction: "accept" },
    ];
  }

  if (t === "SESSION_INVITATION" || t === "SESSION_CREATED") {
    return [{ label: "View Session", variant: "primary" }];
  }

  return [];
}
