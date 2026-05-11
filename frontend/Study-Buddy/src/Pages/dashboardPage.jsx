import { useState, useEffect, useCallback } from "react";
import {
  book,
  calendar,
  home,
  logouticon,
  network,
  profile,
  sessionCompleted,
  studySessions,
  upcomingCalender,
  userConnect,
  dashboard,
  globe,
} from "../assets/icons.jsx";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { NotificationBell } from "./Shared/navbar.jsx";
import { gql } from "@apollo/client";
import {
  authClient,
  sessionClient,
  matchingClient,
  profileClient,
} from "../clients/apolloClients.jsx";
import { useNavigate } from "react-router-dom";

// ── GraphQL helper ──────────────────────────────────────────────
const ME_QUERY = gql`
  query Me {
    me {
      id
      name
    }
  }
`;

const INVITATIONS_QUERY = gql`
  query invitationsByUser {
    invitationsByUser {
      id
      authorId
      session {
        id
        date
        sessionType
        topic
      }
    }
  }
`;

/** Profile-preferences API (`getProfileById` takes String!) */
const GET_PROFILE_BY_ID = gql`
  query ProfileById($userId: String!) {
    getProfileById(userId: $userId) {
      userId
      university
      academicYear
    }
  }
`;

/** Auth API: user display name */
const GET_USER_DISPLAY_NAME = gql`
  query UserDisplayName($userId: ID!) {
    getUserProfile(userId: $userId) {
      name
    }
  }
`;

const JOIN_STUDY_SESSION = gql`
  mutation JoinStudySession($sessionId: ID!) {
    joinStudySession(sessionId: $sessionId) {
      id
    }
  }
`;
const DELETE_INVITATION = gql`
  mutation DeleteInvitation($deleteInvitationId: ID!) {
    deleteInvitation(id: $deleteInvitationId) {
      id
    }
  }
`;

const GENERATE_MATCHES = gql`
  mutation generateMatches {
    generateMatches {
      id
      ignored
      score
      matchedUserId
    }
  }
`;

const SEND_BUDDY_REQUEST = gql`
  mutation SendBuddyRequest($receiverId: String!) {
    sendBuddyRequest(receiverId: $receiverId) {
      id
      status
    }
  }
`;

const GET_STUDY_SESSIONS = gql`
  query GetStudySessions {
    studySessions {
      id
      authorId
      topic
      date
      duration
      sessionType
      contactInfo
      participants
    }
  }
`;

const GET_BUDDY_REQUESTS = gql`
  query BuddyRequests {
    getBuddyRequests {
      id
      senderId
      receiverId
      status
    }
    getConnections {
      id
      userId1
      userId2
    }
  }
`;

// ── Constants ───────────────────────────────────────────────────
const HERO_IMAGE_URL = "https://i.ibb.co/nMXjdQgV/Untitled.png";

const NAV_TOP = [
  { icon: dashboard, label: "Dashboard", active: true },
  { icon: calendar, label: "Calendar" },
  { icon: studySessions, label: "Study Sessions" },
  { icon: network, label: "Network" },
  { icon: profile, label: "Profile" },
  { icon: globe, label: "Matches" },
];

const NAV_BOTTOM = [
  { icon: home, label: "Home" },
  { icon: logouticon, label: "Logout" },
];

// ── Tag color map ────────────────────────────────────────────────
const tagColor = (tag) => {
  if (tag === "ONLINE") return { bg: "#d1fae5", color: "#059669" };
  return { bg: "#fce7f3", color: "#be185d" };
};

// ── Avatar placeholder ───────────────────────────────────────────
function Avatar({ size = 36 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#4ADE80,#22c55e)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: size * 0.4,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      A
    </div>
  );
}

// ── Search Results Page (filters generated matches) ─────────────
function SearchPage({ query, onBack }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [localQuery, setLocalQuery] = useState(query);
  const [inputVal, setInputVal] = useState(query);
  /** match id -> { sending?: boolean, sent?: boolean } */
  const [buddyBtn, setBuddyBtn] = useState({});

  const doSearch = useCallback(async (q) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, errors } = await matchingClient.mutate({
        mutation: GENERATE_MATCHES,
      });
      if (errors?.length) {
        throw new Error(errors[0].message);
      }
      const matches = data?.generateMatches ?? [];
      const active = matches.filter((m) => !m.ignored);
      const needle = trimmed.toLowerCase();

      const enriched = await Promise.all(
        active.map(async (m) => {
          const uid = String(m.matchedUserId);
          try {
            const [profileRes, authRes] = await Promise.all([
              profileClient.query({
                query: GET_PROFILE_BY_ID,
                variables: { userId: uid },
              }),
              authClient.query({
                query: GET_USER_DISPLAY_NAME,
                variables: { userId: uid },
              }),
            ]);
            const p = profileRes.data?.getProfileById;
            const name = authRes.data?.getUserProfile?.name ?? "Unknown";
            return {
              id: m.id,
              matchedUserId: m.matchedUserId,
              name,
              university: p?.university ?? "—",
              academicYear: p?.academicYear ?? "",
              matchScore: Math.round(Number(m.score)),
            };
          } catch {
            return {
              id: m.id,
              matchedUserId: m.matchedUserId,
              name: "Unknown",
              university: "—",
              academicYear: "",
              matchScore: Math.round(Number(m.score)),
            };
          }
        }),
      );

      const filtered = enriched.filter((r) => {
        const hay = `${r.name} ${r.university} ${r.academicYear}`.toLowerCase();
        return hay.includes(needle);
      });

      setResults(filtered);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doSearch(query);
  }, [query, doSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setLocalQuery(inputVal);
    doSearch(inputVal);
  };

  const sendBuddyRequestFromSearch = async (matchId, receiverId) => {
    setBuddyBtn((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], sending: true },
    }));
    try {
      await matchingClient.mutate({
        mutation: SEND_BUDDY_REQUEST,
        variables: { receiverId: String(receiverId) },
      });
      setBuddyBtn((prev) => ({
        ...prev,
        [matchId]: { sending: false, sent: true },
      }));
    } catch (e) {
      const msg =
        e?.graphQLErrors?.[0]?.message ??
        e?.message ??
        "Could not send buddy request";
      const treatAsSent =
        /already exists|already been accepted|already connected/i.test(msg);
      setBuddyBtn((prev) => ({
        ...prev,
        [matchId]: { sending: false, ...(treatAsSent ? { sent: true } : {}) },
      }));
      if (!treatAsSent) {
        console.error(e);
        window.alert(msg);
      }
    }
  };

  return (
    <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#4ADE80",
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 20,
        }}
      >
        ← Back to Dashboard
      </button>

      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#111",
          marginBottom: 20,
        }}
      >
        Search Study Buddies
      </h2>

      <form
        onSubmit={handleSearch}
        style={{ display: "flex", gap: 10, marginBottom: 32 }}
      >
        <div style={{ position: "relative", flex: 1 }}>
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              fontSize: 16,
            }}
          >
            🔍
          </span>
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search for study buddies..."
            style={{
              width: "100%",
              padding: "12px 16px 12px 40px",
              border: "1.5px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
              background: "#f8fafc",
            }}
            autoFocus
          />
        </div>
        <button
          type="submit"
          style={{
            padding: "12px 24px",
            background: "#4ADE80",
            color: "white",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Search
        </button>
      </form>

      {loading && (
        <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: "3px solid #e2e8f0",
              borderTop: "3px solid #4ADE80",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          Searching...
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {results && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>
            {results.length} results for "<strong>{localQuery}</strong>"
          </p>
          {results.map((r) => (
            <div
              key={r.id}
              style={{
                background: "white",
                border: "1.5px solid #e2e8f0",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <Avatar size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>
                  {r.name}
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  {r.university}
                  {r.academicYear ? ` · ${r.academicYear}` : ""}
                </div>
              </div>
              <div
                style={{
                  background: "#d1fae5",
                  color: "#059669",
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {r.matchScore}% match
              </div>
              <button
                type="button"
                disabled={buddyBtn[r.id]?.sending || buddyBtn[r.id]?.sent}
                onClick={() =>
                  sendBuddyRequestFromSearch(r.id, r.matchedUserId)
                }
                style={{
                  background: buddyBtn[r.id]?.sent ? "#22c55e" : "#4ADE80",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  cursor:
                    buddyBtn[r.id]?.sending || buddyBtn[r.id]?.sent
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    buddyBtn[r.id]?.sending || buddyBtn[r.id]?.sent ? 0.85 : 1,
                  fontFamily: "inherit",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {buddyBtn[r.id]?.sending
                  ? "Sending…"
                  : buddyBtn[r.id]?.sent
                    ? "Request sent"
                    : "Connect"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────
export default function Dashboard() {
  const [searchInput, setSearchInput] = useState("");
  const [searchPage, setSearchPage] = useState(null); // null = dashboard, string = search query
  const [sessionRequests, setSessionRequests] = useState([]);
  const [acceptingInviteId, setAcceptingInviteId] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [recommendedError, setRecommendedError] = useState("");
  const [userData, setUserData] = useState(null);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const [upcomingSessionsCount, setUpcomingSessionsCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authClient.query({
          query: ME_QUERY,
        });

        setUserData(response.data);
        console.log("User data fetched:", response.data);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchSessionRequests = async () => {
      try {
        // 1. Fetch invitations
        const invitationsRes = await sessionClient.query({
          query: INVITATIONS_QUERY,
        });

        const invitations = invitationsRes?.data.invitationsByUser ?? [];
        console.log("Invitations fetched:", invitations);
        if (invitations.length > 0) {
          console.log(
            new Date(Number(invitations[0].session.date)).toLocaleTimeString(),
          );
        }

        // 2. For each invitation, fetch the author's profile + auth name
        const combined = await Promise.all(
          invitations.map(async (invite) => {
            const userId = String(invite.authorId);
            const [profileRes, authRes] = await Promise.all([
              profileClient.query({
                query: GET_PROFILE_BY_ID,
                variables: { userId },
              }),
              authClient.query({
                query: GET_USER_DISPLAY_NAME,
                variables: { userId },
              }),
            ]);

            const profile = profileRes.data?.getProfileById;
            const name = authRes.data?.getUserProfile?.name ?? "Unknown";

            return {
              id: invite.id,
              name,
              university: profile?.university ?? "—",
              topic: invite.session.topic,
              tags: invite.session.sessionType,
              day: new Date(Number(invite.session.date)).toLocaleString(
                "default",
                { month: "short" },
              ),
              avatars: null,

              time: new Date(Number(invite.session.date)).toLocaleTimeString(),
              date: new Date(Number(invite.session.date)).getDate(),
              sessionType: invite.session.sessionType,
              sessionId: invite.session.id,
            };
          }),
        );

        setSessionRequests(combined);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchUserSessions = async () => {
      try {
        // Get current user ID from auth context
        const currentUserId = user?.id;

        if (!currentUserId) {
          console.log("User ID not available yet");
          return;
        }

        // Fetch all study sessions
        const sessionsRes = await sessionClient.query({
          query: GET_STUDY_SESSIONS,
        });

        const allSessions = sessionsRes?.data?.studySessions ?? [];
        const now = new Date();

        // Filter sessions where user is a participant
        const userSessions = allSessions.filter((session) => {
          const participants = session.participants || [];
          return (
            participants.includes(currentUserId) ||
            participants.includes(String(currentUserId))
          );
        });

        // Separate completed and upcoming sessions
        const completed = userSessions.filter((session) => {
          const sessionDate = new Date(Number(session.date));
          return sessionDate < now;
        });

        const upcoming = userSessions.filter((session) => {
          const sessionDate = new Date(Number(session.date));
          return sessionDate >= now;
        });

        setCompletedSessionsCount(completed.length);
        setUpcomingSessionsCount(upcoming.length);

        console.log("Sessions summary:", {
          completed: completed.length,
          upcoming: upcoming.length,
          userSessions: userSessions.length,
        });
      } catch (error) {
        console.error("Error fetching user sessions:", error);
      }
    };

    const fetchRecommendedMatches = async () => {
      setRecommendedLoading(true);
      setRecommendedError("");
      try {
        // Get current user ID first
        const meResponse = await authClient.query({
          query: ME_QUERY,
        });
        const currentUserId = meResponse.data?.me?.id;

        if (!currentUserId) {
          throw new Error("Could not determine current user");
        }

        // Fetch buddy requests and connections to filter out
        const buddyData = await matchingClient.query({
          query: GET_BUDDY_REQUESTS,
        });

        const buddyRequests = buddyData.data?.getBuddyRequests ?? [];
        const connections = buddyData.data?.getConnections ?? [];

        // Extract user IDs to filter out
        const connectedUserIds = new Set();

        // Separate incoming and outgoing requests
        buddyRequests.forEach((req) => {
          // Outgoing requests - I sent the request
          if (req.senderId === currentUserId) {
            connectedUserIds.add(String(req.receiverId));
          }
          // Incoming requests - Someone sent me a request
          if (req.receiverId === currentUserId) {
            connectedUserIds.add(String(req.senderId));
          }
        });

        // Add already connected users
        connections.forEach((conn) => {
          if (conn.userId1 === currentUserId) {
            connectedUserIds.add(String(conn.userId2));
          } else if (conn.userId2 === currentUserId) {
            connectedUserIds.add(String(conn.userId1));
          }
        });

        // Generate matches
        const { data, errors } = await matchingClient.mutate({
          mutation: GENERATE_MATCHES,
        });
        if (errors?.length) {
          throw new Error(errors[0].message);
        }
        const matches = data?.generateMatches ?? [];
        const active = matches.filter((m) => !m.ignored);

        // Filter out users that are already connected or have pending requests
        const availableMatches = active.filter((m) => {
          const matchedUserIdStr = String(m.matchedUserId);
          return !connectedUserIds.has(matchedUserIdStr);
        });

        const withProfiles = await Promise.all(
          availableMatches.map(async (m) => {
            const uid = String(m.matchedUserId);
            try {
              const [profileRes, authRes] = await Promise.all([
                profileClient.query({
                  query: GET_PROFILE_BY_ID,
                  variables: { userId: uid },
                }),
                authClient.query({
                  query: GET_USER_DISPLAY_NAME,
                  variables: { userId: uid },
                }),
              ]);
              const p = profileRes.data?.getProfileById;
              const name = authRes.data?.getUserProfile?.name ?? "Unknown";
              return {
                id: m.id,
                matchedUserId: m.matchedUserId,
                score: Math.round(Number(m.score)),
                name,
                university: p?.university ?? "—",
                academicYear: p?.academicYear ?? "",
                buddyRequestSending: false,
                buddyRequestSent: false,
              };
            } catch {
              return {
                id: m.id,
                matchedUserId: m.matchedUserId,
                score: Math.round(Number(m.score)),
                name: "Unknown",
                university: "—",
                academicYear: "",
                buddyRequestSending: false,
                buddyRequestSent: false,
              };
            }
          }),
        );
        setRecommended(withProfiles);
      } catch (error) {
        console.error(error);
        setRecommendedError(
          error instanceof Error ? error.message : "Failed to load matches",
        );
        setRecommended([]);
      } finally {
        setRecommendedLoading(false);
      }
    };

    fetchUser();
    fetchSessionRequests();
    fetchRecommendedMatches();
    fetchUserSessions();
  }, []);

  const acceptSessionRequest = async (inviteId, sessionId) => {
    setAcceptingInviteId(inviteId);
    try {
      await sessionClient.mutate({
        mutation: JOIN_STUDY_SESSION,
        variables: { sessionId },
      });
      await sessionClient.mutate({
        mutation: DELETE_INVITATION,
        variables: { deleteInvitationId: inviteId },
      });
      setSessionRequests((prev) => prev.filter((s) => s.id !== inviteId));
    } catch (e) {
      const msg =
        e?.graphQLErrors?.[0]?.message ??
        e?.networkError?.result?.errors?.[0]?.message ??
        e?.message ??
        "Could not accept this invitation";
      console.error(e);
      window.alert(msg);
    } finally {
      setAcceptingInviteId(null);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) setSearchPage(searchInput.trim());
  };

  const sendBuddyRequestForMatch = async (matchId, receiverId) => {
    setRecommended((prev) =>
      prev.map((r) =>
        r.id === matchId ? { ...r, buddyRequestSending: true } : r,
      ),
    );
    try {
      await matchingClient.mutate({
        mutation: SEND_BUDDY_REQUEST,
        variables: { receiverId: String(receiverId) },
      });
      setRecommended((prev) =>
        prev.map((r) =>
          r.id === matchId
            ? { ...r, buddyRequestSending: false, buddyRequestSent: true }
            : r,
        ),
      );
    } catch (e) {
      const msg =
        e?.graphQLErrors?.[0]?.message ??
        e?.message ??
        "Could not send buddy request";
      const treatAsSent =
        /already exists|already been accepted|already connected/i.test(msg);
      setRecommended((prev) =>
        prev.map((r) =>
          r.id === matchId
            ? {
                ...r,
                buddyRequestSending: false,
                ...(treatAsSent ? { buddyRequestSent: true } : {}),
              }
            : r,
        ),
      );
      if (!treatAsSent) {
        console.error(e);
        window.alert(msg);
      }
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Nunito', sans-serif; background: #f1f5f9; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        .dash-layout { display: flex; min-height: 100vh; }

        /* ── Sidebar ── */
        .sidebar {
          width: 120px;
          background: #1e2433;
          display: flex;
          flex-direction: column;
          padding: 0;
          flex-shrink: 0;
        }
        .sidebar-brand {
          padding: 20px 12px 24px;
          font-size: 13px;
          font-weight: 800;
          color: #4ADE80;
          line-height: 1.3;
          text-align: center;
          border-bottom: 1px solid #2d3548;
        }
        .nav-group { flex: 1; padding: 12px 0; display: flex; flex-direction: column; gap: 2px; }
        .nav-bottom { padding: 12px 0; border-top: 1px solid #2d3548; display: flex; flex-direction: column; gap: 2px; }
        .nav-item {
          display: flex; flex-direction: column; align-items: center;
          gap: 4px; padding: 10px 8px; cursor: pointer; border-radius: 10px;
          margin: 0 8px; transition: background 0.15s;
          color: #7c8db0; font-size: 10px; font-weight: 600; text-align: center;
        }
        .nav-item:hover { background: #2d3548; color: #cbd5e1; }
        .nav-item.active { background: #4ADE80; color: #fff; }
        .nav-icon { font-size: 16px; }

        /* ── Content area ── */
        .content-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }

        /* ── Top bar ── */
        .topbar {
          background: #1e2433;
          padding: 10px 24px;
          display: flex; align-items: center; justify-content: space-between;
          color: #7c8db0; font-size: 13px;
        }
        .search-form { display: flex; align-items: center; flex: 1; max-width: 400px; }
        .search-wrap { position: relative; flex: 1; }
        .search-wrap input {
          width: 100%; padding: 9px 16px 9px 38px;
          background: #2d3548; border: 1.5px solid #3d4a63;
          border-radius: 30px; color: #cbd5e1; font-size: 13px;
          font-family: 'Nunito', sans-serif; outline: none;
          transition: border-color 0.2s;
        }
        .search-wrap input::placeholder { color: #5a6a8a; }
        .search-wrap input:focus { border-color: #4ADE80; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #5a6a8a; font-size: 14px; }
        .topbar-actions { display: flex; align-items: center; gap: 14px; }
        .notif-btn {
          position: relative; background: none; border: none; cursor: pointer;
          color: #7c8db0; font-size: 18px; padding: 4px;
        }
        .notif-badge {
          position: absolute; top: -2px; right: -4px;
          background: #4ADE80; color: white; font-size: 9px; font-weight: 800;
          width: 16px; height: 16px; border-radius: 50%; display: flex;
          align-items: center; justify-content: center;
        }
        .profile-btn {
          width: 34px; height: 34px; border-radius: 50%; background: #2d3548;
          border: 2px solid #3d4a63; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #7c8db0; font-size: 16px;
        }

        /* ── Main scroll ── */
        .main-scroll { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }

        /* ── Hero card ── */
        .hero-card {
          background: white; border-radius: 16px; padding: 28px 32px;
          display: flex; align-items: center; justify-content: space-between;
          overflow: hidden; position: relative; animation: fadeIn 0.4s ease;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .hero-text h2 { font-size: 22px; font-weight: 800; color: #111; margin-bottom: 6px; }
        .hero-text p { font-size: 14px; color: #64748b; margin-bottom: 20px; }
        .hero-btn {
          background: #4ADE80; color: white; border: none; border-radius: 30px;
          padding: 11px 22px; font-size: 14px; font-weight: 700;
          font-family: 'Nunito', sans-serif; cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          box-shadow: 0 4px 12px rgba(74,222,128,0.35);
        }
        .hero-btn:hover { background: #22c55e; transform: translateY(-1px); }
        .hero-img { height: 130px; object-fit: contain; }

        /* ── Stats ── */
        .stats-row { display: flex; gap: 14px; }
        .stat-card {
          background: white; border-radius: 14px; padding: 18px 24px;
          flex: 1; display: flex; align-items: center; gap: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          animation: fadeIn 0.4s ease;
        }
        .stat-icon { font-size: 22px; }
        .stat-val { font-size: 26px; font-weight: 800; color: #111; line-height: 1; }
        .stat-label { font-size: 11px; color: #94a3b8; font-weight: 600; white-space: pre-line; margin-top: 2px; }

        /* ── Section card ── */
        .section-card {
          background: white; border-radius: 16px; padding: 22px 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          animation: fadeIn 0.4s ease;
        }
        .section-title { font-size: 15px; font-weight: 800; color: #111; margin-bottom: 16px; }

        /* ── Session request card ── */
        .sessions-row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px; }
        .session-card {
          background: white; border: 1.5px solid #e2e8f0; border-radius: 12px;
          padding: 14px; min-width: 185px; flex-shrink: 0;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .session-card.active-card { border-color: #4ADE80; box-shadow: 0 0 0 3px rgba(74,222,128,0.12); }
        .session-top { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .session-info { flex: 1; min-width: 0; }
        .session-name { font-size: 12px; font-weight: 700; color: #111; }
        .session-role { font-size: 10px; color: #4ADE80; font-weight: 600; }
        .session-uni { font-size: 10px; color: #94a3b8; }
        .date-badge {
          background: #f1f5f9; border-radius: 8px; padding: 4px 8px;
          text-align: center; flex-shrink: 0;
        }
        .date-month { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .date-num { font-size: 16px; font-weight: 800; color: #111; line-height: 1; }
        .session-topic { font-size: 11px; color: #64748b; margin-bottom: 6px; }
        .tags-row { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 8px; }
        .tag { font-size: 10px; font-weight: 700; padding: 2px 9px; border-radius: 20px; }
        .session-time { font-size: 11px; color: #64748b; margin-bottom: 10px; }
        .session-actions { display: flex; gap: 6px; }
        .btn-profile {
          flex: 1; padding: 6px 0; border: 1.5px solid #e2e8f0; border-radius: 8px;
          background: white; font-size: 11px; font-weight: 700; color: #64748b;
          cursor: pointer; font-family: 'Nunito', sans-serif; transition: border-color 0.15s;
        }
        .btn-profile:hover { border-color: #4ADE80; color: #4ADE80; }
        .btn-accept {
          flex: 1; padding: 6px 0; border: none; border-radius: 8px;
          background: #4ADE80; font-size: 11px; font-weight: 700; color: white;
          cursor: pointer; font-family: 'Nunito', sans-serif;
          transition: background 0.15s;
        }
        .btn-accept:hover { background: #22c55e; }

        /* ── Recommended ── */
        .rec-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .show-all { font-size: 13px; color: #4ADE80; font-weight: 700; cursor: pointer; background: none; border: none; font-family: inherit; }
        .rec-row { display: flex; gap: 14px; }
        .rec-card {
          flex: 1; background: white; border: 1.5px solid #e2e8f0; border-radius: 14px;
          padding: 18px 14px; display: flex; flex-direction: column; align-items: center;
          gap: 8px; position: relative; transition: box-shadow 0.2s;
        }
        .rec-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .rec-score {
          position: absolute; top: 10px; left: 10px;
          background: #d1fae5; color: #059669; font-size: 10px; font-weight: 800;
          padding: 2px 7px; border-radius: 20px;
        }
        .rec-close {
          position: absolute; top: 8px; right: 8px; background: none; border: none;
          cursor: pointer; color: #cbd5e1; font-size: 14px; line-height: 1;
        }
        .rec-avatar {
          width: 52px; height: 52px; border-radius: 50%;
          background: #f1f5f9; display: flex; align-items: center; justify-content: center;
          font-size: 22px; color: #94a3b8;
        }
        .rec-name { font-size: 13px; font-weight: 700; color: #111; text-align: center; }
        .rec-uni { font-size: 11px; color: #94a3b8; text-align: center; }
        .btn-connect {
          margin-top: 4px; padding: 7px 18px; border-radius: 20px;
          font-size: 11px; font-weight: 700; font-family: 'Nunito', sans-serif;
          cursor: pointer; transition: all 0.2s;
          border: 1.5px solid #4ADE80; color: #4ADE80; background: white;
          display: flex; align-items: center; gap: 5px;
        }
        .btn-connect.connected { background: #4ADE80; color: white; }
        .btn-connect:hover:not(:disabled) { background: #4ADE80; color: white; }
        .btn-connect:disabled { opacity: 0.65; cursor: not-allowed; }
      `}</style>

      <div className="dash-layout">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            Learn
            <br />
            Together
          </div>
          <nav className="nav-group">
            {NAV_TOP.map((item) => (
              <div
                key={item.label}
                className={`nav-item${item.active ? " active" : ""}`}
                onClick={() => {
                  if (item.label === "Calendar") {
                    navigate("/availability");
                  }
                  if (item.label === "Study Sessions") {
                    navigate("/study-sessions");
                  }
                  if (item.label === "Matches") {
                    navigate("/matches");
                  }
                  if (item.label === "Profile") {
                    navigate("/user-activity");
                  }
                  if (item.label === "Network") {
                    navigate("/connections");
                  }
                }}
              >
                <img src={item.icon} alt={item.label} className="nav-icon" />
                {item.label}
              </div>
            ))}
          </nav>
          <nav className="nav-bottom">
            {NAV_BOTTOM.map((item) => (
              <div
                key={item.label}
                className="nav-item"
                onClick={() => {
                  if (item.label === "Logout") {
                    handleLogout();
                  }
                  if (item.label === "Home") {
                    navigate("/");
                  }
                }}
              >
                <img src={item.icon} alt={item.label} className="nav-icon" />
                {item.label}
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Content ── */}
        <div className="content-area">
          {/* Top bar */}
          <div className="topbar">
            <form className="search-form" onSubmit={handleSearchSubmit}>
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search for study buddies..."
                />
              </div>
            </form>
            <div className="topbar-actions">
              <NotificationBell />
            </div>
          </div>

          {/* Page content */}
          {searchPage ? (
            <SearchPage
              query={searchPage}
              onBack={() => {
                setSearchPage(null);
                setSearchInput("");
              }}
            />
          ) : (
            <div className="main-scroll">
              {/* Hero */}
              <div className="hero-card">
                <div className="hero-text">
                  <h2>Welcome back, {userData?.me.name} 👋</h2>
                  <p>Ready to find your next study buddy?</p>
                  <button
                    className="hero-btn"
                    onClick={() => {
                      navigate("/matches");
                    }}
                  >
                    Find Study Buddy
                  </button>
                </div>
                <img
                  src={HERO_IMAGE_URL}
                  alt="Students studying"
                  className="hero-img"
                />
              </div>

              {/* Stats */}
              <div className="stats-row">
                {[
                  {
                    icon: sessionCompleted,
                    value: completedSessionsCount,
                    label: "Sessions\nCompleted",
                  },
                  {
                    icon: upcomingCalender,
                    value: upcomingSessionsCount,
                    label: "Upcoming\nSessions",
                  },
                ].map((s) => (
                  <div key={s.label} className="stat-card">
                    <img src={s.icon} alt={s.label} className="stat-icon" />
                    <div>
                      <div className="stat-val">{s.value}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Session Requests */}
              <div className="section-card">
                <div className="section-title">Sessions Requests</div>
                <div className="sessions-row">
                  {sessionRequests.map((s) => (
                    <div
                      key={s.id}
                      className={`session-card${s.active ? " active-card" : ""}`}
                    >
                      <div className="session-top">
                        <Avatar size={32} />
                        <div className="session-info">
                          <div className="session-name">{s.name}</div>
                          <div className="session-uni">{s.university} </div>
                        </div>
                        <div className="date-badge">
                          <div className="date-month">{s.day}</div>
                          <div className="date-num">{s.date}</div>
                        </div>
                      </div>
                      <div className="session-topic">Topic: {s.topic}</div>
                      <div className="tags-row">
                        <span className="tag" style={tagColor(s.tags)}>
                          {s.tags}
                        </span>
                      </div>
                      <div className="session-time">Time: {s.time}</div>
                      <div className="session-actions">
                        <button
                          className="btn-profile"
                          onClick={() => navigate(`/match/${s.id}`)}
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          className="btn-accept"
                          disabled={acceptingInviteId !== null}
                          onClick={() =>
                            acceptSessionRequest(s.id, s.sessionId)
                          }
                        >
                          {acceptingInviteId === s.id ? "Accepting…" : "Accept"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended */}
              <div className="section-card">
                <div className="rec-header">
                  <div className="section-title" style={{ margin: 0 }}>
                    Recommended Study Buddies For You
                  </div>
                  <button className="show-all">Show all</button>
                </div>
                <div className="rec-row">
                  {recommendedLoading && (
                    <div
                      style={{
                        padding: "24px 16px",
                        color: "#64748b",
                        fontSize: 14,
                      }}
                    >
                      Loading recommendations…
                    </div>
                  )}
                  {!recommendedLoading && recommendedError && (
                    <div
                      style={{
                        padding: "24px 16px",
                        color: "#b91c1c",
                        fontSize: 14,
                      }}
                    >
                      {recommendedError}
                    </div>
                  )}
                  {!recommendedLoading &&
                    !recommendedError &&
                    recommended.length === 0 && (
                      <div
                        style={{
                          padding: "24px 16px",
                          color: "#64748b",
                          fontSize: 14,
                        }}
                      >
                        No study buddy matches yet. Complete your matching
                        profile to see suggestions.
                      </div>
                    )}
                  {!recommendedLoading &&
                    !recommendedError &&
                    recommended.map((r) => (
                      <div key={r.id} className="rec-card">
                        <span className="rec-score">{r.score}%</span>
                        <button type="button" className="rec-close">
                          ✕
                        </button>
                        <div className="rec-avatar">👤</div>
                        <Link
                          to={`/match/${r.id}`}
                          className="rec-name"
                          style={{
                            color: "inherit",
                            textDecoration: "none",
                          }}
                        >
                          {r.name}
                        </Link>
                        <div className="rec-uni">
                          {r.university}
                          {r.academicYear ? (
                            <>
                              <br />
                              {r.academicYear}
                            </>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className={`btn-connect${r.buddyRequestSent ? " connected" : ""}`}
                          disabled={r.buddyRequestSending || r.buddyRequestSent}
                          onClick={() =>
                            sendBuddyRequestForMatch(r.id, r.matchedUserId)
                          }
                        >
                          <img
                            src={userConnect}
                            alt="Connect"
                            className="btn-icon"
                          />
                          {r.buddyRequestSending
                            ? "Sending…"
                            : r.buddyRequestSent
                              ? "Request sent"
                              : "Connect"}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
