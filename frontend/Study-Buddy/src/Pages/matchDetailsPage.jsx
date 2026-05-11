import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useAuth } from "../context/AuthContext";
import {
  authClient,
  profileClient,
  matchingClient,
  availabilityClient,
} from "../clients/apolloClients.jsx";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const GET_MATCH_BY_ID = gql`
  query MatchDetailsMatch($matchId: ID!) {
    getMatchById(matchId: $matchId) {
      id
      userId
      matchedUserId
      score
      reasons
      ignored
    }
  }
`;

const GET_PEER_PROFILE = gql`
  query PeerProfile($userId: String!) {
    getProfileById(userId: $userId) {
      userId
      university
      academicYear
      courses {
        id
        name
      }
      topics {
        id
        name
      }
      preferences {
        studyPace
        studyMode
        groupSize
        studyStyle
      }
    }
  }
`;

const GET_MY_PROFILE_MIN = gql`
  query MyProfileForSharedCourses {
    getProfile {
      courses {
        name
      }
      topics {
        name
      }
    }
  }
`;

const GET_AUTH_PEER = gql`
  query AuthPeer($userId: ID!) {
    getUserProfile(userId: $userId) {
      name
      university
      academic_year
    }
  }
`;

/** Current user's matching projection (includes availability used for matching) */
const GET_MY_MATCH_PROFILE = gql`
  query MyMatchProfileSlots {
    getMatchProfile {
      userId
      availabilitySlots {
        id
        dayOfWeek
        startTime
        endTime
        userId
      }
    }
  }
`;

const GET_AVAILABILITY_BY_USER = gql`
  query GetAvailabilityByUser {
    getAvailabilityByUser {
      id
      userId
      startTime
      endTime
    }
  }
`;

const SEND_BUDDY_REQUEST = gql`
  mutation MatchDetailsSendBuddy($receiverId: String!) {
    sendBuddyRequest(receiverId: $receiverId) {
      id
      status
    }
  }
`;

function courseNameSet(items) {
  return new Set((items ?? []).map((c) => String(c.name).toLowerCase()));
}

function intersectCourses(myCourses, peerCourses) {
  const mine = courseNameSet(myCourses);
  return (peerCourses ?? []).filter((c) =>
    mine.has(String(c.name).toLowerCase()),
  );
}

function intersectTopics(myTopics, peerTopics) {
  const mine = courseNameSet(myTopics);
  return (peerTopics ?? []).filter((t) =>
    mine.has(String(t.name).toLowerCase()),
  );
}

function slotWeekdayName(slot) {
  if (slot.dayOfWeek && String(slot.dayOfWeek).trim()) {
    return String(slot.dayOfWeek);
  }
  const asDate = new Date(slot.startTime);
  if (!Number.isNaN(asDate.getTime())) {
    return asDate.toLocaleDateString("en-US", { weekday: "long" });
  }
  return "";
}

function slotDayIndex(slot) {
  const asDate = new Date(slot.startTime);
  if (!Number.isNaN(asDate.getTime())) {
    return asDate.getDay();
  }
  const name = slotWeekdayName(slot).toLowerCase();
  const map = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  for (const [k, v] of Object.entries(map)) {
    if (name.includes(k)) return v;
  }
  return -1;
}

function formatTimeRange(startTime, endTime) {
  const fmt = (t) => {
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    const parts = String(t).split(":");
    const h = Number(parts[0]);
    const min = Number(parts[1]);
    if (Number.isNaN(h) || Number.isNaN(min)) return String(t);
    const d2 = new Date();
    d2.setHours(h, min, 0, 0);
    return d2.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };
  return `${fmt(startTime)} – ${fmt(endTime)}`;
}

function availabilityRowsFromSlots(slots) {
  return (slots ?? []).map((s) => ({
    id: s.id,
    day: slotWeekdayName(s) || "Day",
    time: formatTimeRange(s.startTime, s.endTime),
  }));
}

function initials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function MatchDetails() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [match, setMatch] = useState(null);
  const [peerProfile, setPeerProfile] = useState(null);
  const [authPeer, setAuthPeer] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [myMatchSlots, setMyMatchSlots] = useState([]);
  const [myAvailability, setMyAvailability] = useState([]);
  const [buddySending, setBuddySending] = useState(false);
  const [buddySent, setBuddySent] = useState(false);

  const [sendBuddyRequestMutation] = useMutation(SEND_BUDDY_REQUEST, {
    client: matchingClient,
  });

  const myUserId = useMemo(() => {
    if (user?.id) return String(user.id);
    try {
      const s = JSON.parse(localStorage.getItem("user") || "{}");
      return s?.id ? String(s.id) : "";
    } catch {
      return "";
    }
  }, [user?.id]);

  useEffect(() => {
    if (!matchId) {
      setError("Missing match id");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        let me = myUserId;
        if (!me && user?.id) me = String(user.id);
        if (!me) {
          try {
            const s = JSON.parse(localStorage.getItem("user") || "{}");
            if (s?.id) me = String(s.id);
          } catch {
            /* ignore */
          }
        }

        const matchRes = await matchingClient.query({
          query: GET_MATCH_BY_ID,
          variables: { matchId },
          fetchPolicy: "network-only",
        });

        if (cancelled) return;

        const m = matchRes.data?.getMatchById;
        if (!m) {
          throw new Error("Match not found or access denied");
        }
        setMatch(m);

        const uid = String(m.userId);
        const mid = String(m.matchedUserId);
        const other = uid === me ? mid : mid === me ? uid : mid;

        const [peerRes, authRes, myRes, myMatchRes] = await Promise.all([
          profileClient.query({
            query: GET_PEER_PROFILE,
            variables: { userId: other },
            fetchPolicy: "network-only",
          }),
          authClient.query({
            query: GET_AUTH_PEER,
            variables: { userId: other },
            fetchPolicy: "network-only",
          }),
          profileClient.query({
            query: GET_MY_PROFILE_MIN,
            fetchPolicy: "network-only",
          }),
          availabilityClient.query({
            query: GET_AVAILABILITY_BY_USER,
            fetchPolicy: "network-only",
          }),
        ]);

        if (cancelled) return;

        setPeerProfile(peerRes.data?.getProfileById ?? null);
        setAuthPeer(authRes.data?.getUserProfile ?? null);
        setMyProfile(myRes.data?.getProfile ?? null);
        const slots = myMatchRes.data?.getMatchProfile?.availabilitySlots ?? [];
        setMyMatchSlots(slots);
        const availability = myMatchRes.data?.getAvailabilityByUser ?? [];
        setMyAvailability(availability);
      } catch (e) {
        if (cancelled) return;
        const msg =
          e?.graphQLErrors?.[0]?.message ??
          e?.message ??
          "Failed to load match";
        setError(msg);
        setMatch(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [matchId, myUserId, user?.id]);

  const peerId = useMemo(() => {
    if (!match || !myUserId) return null;
    if (String(match.userId) === myUserId) return String(match.matchedUserId);
    return String(match.userId);
  }, [match, myUserId]);

  const sharedCourses = useMemo(
    () => intersectCourses(myProfile?.courses, peerProfile?.courses),
    [myProfile?.courses, peerProfile?.courses],
  );

  const sharedTopics = useMemo(
    () => intersectTopics(myProfile?.topics, peerProfile?.topics),
    [myProfile?.topics, peerProfile?.topics],
  );

  const displayName =
    authPeer?.name ??
    (peerProfile?.userId ? `User ${peerProfile.userId.slice(0, 8)}…` : "—");

  const subtitleParts = [];
  const uni = peerProfile?.university || authPeer?.university || "";
  const year = peerProfile?.academicYear || authPeer?.academic_year || "";
  if (uni) subtitleParts.push(uni);
  if (year) subtitleParts.push(year);
  const subtitle =
    subtitleParts.length > 0
      ? subtitleParts.join(" · ")
      : "Profile details from Study Buddy";

  const prefRows = [
    {
      label: "Preferred Study Pace",
      value: peerProfile?.preferences?.studyPace,
    },
    {
      label: "Preferred Study Mode",
      value: peerProfile?.preferences?.studyMode,
    },
    {
      label: "Preferred Group Size",
      value: peerProfile?.preferences?.groupSize,
    },
    {
      label: "Preferred Study Style",
      value: peerProfile?.preferences?.studyStyle,
    },
  ].filter((p) => p.value);

  const coursesToShow =
    sharedCourses.length > 0 ? sharedCourses : (peerProfile?.courses ?? []);
  const coursesTitle =
    sharedCourses.length > 0 ? "Shared Courses" : "Their Courses";

  const matchScoreRounded = match ? Math.round(Number(match.score)) : 0;

  /** Your availability slots from availability service. */
  const availabilityListData = useMemo(
    () => availabilityRowsFromSlots(myAvailability),
    [myAvailability],
  );

  const activeDayIndices = useMemo(() => {
    const set = new Set();
    for (const s of myAvailability) {
      const ix = slotDayIndex(s);
      if (ix >= 0) set.add(ix);
    }
    return set;
  }, [myAvailability]);

  const sendBuddyRequest = async () => {
    if (!peerId || buddySent) return;
    setBuddySending(true);
    try {
      await sendBuddyRequestMutation({
        variables: { receiverId: peerId },
      });
      setBuddySent(true);
    } catch (e) {
      const msg =
        e?.graphQLErrors?.[0]?.message ??
        e?.message ??
        "Could not send buddy request";
      const ok = /already exists|already been accepted|already connected/i.test(
        msg,
      );
      if (ok) setBuddySent(true);
      else {
        console.error(e);
        window.alert(msg);
      }
    } finally {
      setBuddySending(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Nunito', sans-serif; background: #e8eaed; min-height: 100vh; }

        .page {
          min-height: 100vh;
          padding: 32px 28px;
          background: #e8eaed;
        }

        h1 {
          font-size: 24px;
          font-weight: 800;
          color: #111;
          margin-bottom: 20px;
        }

        .back-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #4ADE80;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
          padding: 0;
        }

        .muted { color: #64748b; font-size: 13px; padding: 8px 0 0; line-height: 1.4; }
        .err {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 14px 16px;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .profile-card {
          background: white;
          border-radius: 16px;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
        }

        .avatar-circle {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: #1e2a3a;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #4ADE80;
          font-size: 28px;
          font-weight: 800;
        }

        .avatar-circle svg { color: #4ADE80; }

        .profile-info { flex: 1; }
        .profile-name {
          font-size: 20px;
          font-weight: 800;
          color: #111;
          margin-bottom: 4px;
        }
        .profile-sub {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 600;
        }
        .match-pill {
          display: inline-block;
          margin-top: 8px;
          background: #d1fae5;
          color: #059669;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
        }

        .btn-connect {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #4ADE80;
          color: white;
          border: none;
          border-radius: 30px;
          padding: 12px 26px;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(74,222,128,0.35);
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          white-space: nowrap;
        }
        .btn-connect:hover:not(:disabled) { background: #22c55e; transform: translateY(-1px); }
        .btn-connect.connected { background: #e2e8f0; color: #64748b; box-shadow: none; }
        .btn-connect:disabled { opacity: 0.75; cursor: not-allowed; transform: none; }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 640px) {
          .grid { grid-template-columns: 1fr; }
        }

        .card {
          background: white;
          border-radius: 16px;
          padding: 22px 24px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
        }

        .card-title {
          font-size: 14px;
          font-weight: 800;
          color: #111;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1.5px solid #f1f5f9;
        }

        .course-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #f8fafc;
        }
        .course-item:last-child { border-bottom: none; }
        .course-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #1e2a3a;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .course-icon svg { color: #4ADE80; }
        .course-code { font-size: 13px; font-weight: 700; color: #111; }

        .pref-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 0;
          border-bottom: 1px solid #f8fafc;
        }
        .pref-item:last-child { border-bottom: none; }
        .check-icon {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #4ADE80;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pref-label { font-size: 13px; font-weight: 700; color: #111; flex: 1; }
        .pref-value { font-size: 13px; color: #94a3b8; font-weight: 600; }

        .days-grid {
          display: flex;
          gap: 0;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .day-cell {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 4px;
          border-right: 1.5px solid #e2e8f0;
          background: white;
        }
        .day-cell:last-child { border-right: none; }
        .day-letter {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 6px;
        }
        .day-check {
          font-size: 13px;
          color: #4ADE80;
          font-weight: 800;
          min-height: 16px;
        }

        .avail-list { display: flex; flex-direction: column; gap: 14px; }
        .avail-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .avail-row:last-child { border-bottom: none; padding-bottom: 0; }
        .avail-dot-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #111;
        }
        .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #4ADE80;
          flex-shrink: 0;
        }
        .avail-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
        }

        .topic-chip {
          display: inline-block;
          background: #f1f5f9;
          color: #475569;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          margin: 4px 8px 4px 0;
        }
      `}</style>

      <div className="page">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        <h1>Match Details</h1>

        {loading && (
          <p className="muted" style={{ paddingTop: 0 }}>
            Loading…
          </p>
        )}
        {error && !loading && <div className="err">{error}</div>}

        {!loading && !error && match && (
          <>
            <div className="profile-card">
              <div className="avatar-circle">{initials(displayName)}</div>

              <div className="profile-info">
                <div className="profile-name">{displayName}</div>
                <div className="profile-sub">{subtitle}</div>
                <span className="match-pill">{matchScoreRounded}% match</span>
              </div>

              <button
                type="button"
                className={`btn-connect${buddySent ? " connected" : ""}`}
                disabled={buddySending || buddySent}
                onClick={sendBuddyRequest}
              >
                {buddySending ? (
                  "Sending…"
                ) : buddySent ? (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Request sent
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    Connect
                  </>
                )}
              </button>
            </div>

            <div className="grid">
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div className="card">
                  <div className="card-title">{coursesTitle}</div>
                  {coursesToShow.length === 0 ? (
                    <p className="muted" style={{ padding: 0 }}>
                      No courses listed on their profile.
                    </p>
                  ) : (
                    coursesToShow.map((c) => (
                      <div key={c.id} className="course-item">
                        <div className="course-icon">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M3 9h18M9 21V9" />
                          </svg>
                        </div>
                        <div>
                          <div className="course-code">{c.name}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {sharedTopics.length > 0 && (
                  <div className="card">
                    <div className="card-title">Shared topics</div>
                    <div>
                      {sharedTopics.map((t) => (
                        <span key={t.id} className="topic-chip">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="card">
                  <div className="card-title">Study Preferences</div>
                  {prefRows.length === 0 ? (
                    <p className="muted" style={{ padding: 0 }}>
                      No preferences saved for this buddy.
                    </p>
                  ) : (
                    prefRows.map((p) => (
                      <div key={p.label} className="pref-item">
                        <div className="check-icon">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </div>
                        <span className="pref-label">{p.label}</span>
                        <span className="pref-value">{p.value}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="card">
                  <div className="card-title">Why You Matched</div>
                  {match?.reasons && match.reasons.length > 0 ? (
                    <div>
                      {match.reasons.map((reason, index) => (
                        <div key={index} className="pref-item">
                          <div className="check-icon">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                          <span className="pref-label">{reason}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted" style={{ padding: 0 }}>
                      No specific reasons provided for this match.
                    </p>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-title">Overlapping Availability</div>

                <div className="days-grid">
                  {DAYS.map((d, i) => (
                    <div key={i} className="day-cell">
                      <span className="day-letter">{d}</span>
                      <span className="day-check">
                        {activeDayIndices.has(i) ? "✓" : ""}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="avail-list">
                  {availabilityListData.length === 0 ? (
                    <p className="muted" style={{ padding: 0 }}>
                      No times in your matching profile yet. Add availability so
                      matches can include schedule overlap.
                    </p>
                  ) : (
                    availabilityListData.map((a) => (
                      <div key={a.id} className="avail-row">
                        <div className="avail-dot-label">
                          <span className="dot" />
                          {a.day}
                        </div>
                        <div className="avail-time">
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          {a.time}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {match?.reasons?.some((r) =>
                  /overlap|availability/i.test(r),
                ) && (
                  <p className="muted">
                    Your match score includes overlapping availability. The
                    schedule below is your availability from the matching
                    service; your buddy’s slots are not exposed on the current
                    API.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
