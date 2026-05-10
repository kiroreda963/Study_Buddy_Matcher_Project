import { useState } from "react";
import { book 
, calendar, home, logout, network, profile, sessionCompleted, studySessions, upcomingCalender, userConnect, dashboard, bell
} from "../assets/icons.jsx";
// ── GraphQL helper ──────────────────────────────────────────────
const SEARCH_QUERY = `
  query SearchStudyBuddies($query: String!) {
    searchStudyBuddies(query: $query) {
      id
      name
      university
      major
      matchScore
      avatarUrl
    }
  }
`;

async function graphqlRequest(query, variables = {}) {
  const res = await fetch("/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data;
}

// ── Constants ───────────────────────────────────────────────────
const HERO_IMAGE_URL = "https://i.ibb.co/nMXjdQgV/Untitled.png";

const STATS = [
  { icon: book, value: 5,  label: "Courses\nCompleted" },
  { icon: sessionCompleted, value: 20, label: "Sessions\nCompleted" },
  { icon: upcomingCalender, value: 3,  label: "Upcoming\nSessions" },
];

const SESSION_REQUESTS = [
  { id: 1, name: "Ahmed Hassan", role: "Software", university: "Cairo University", level: "Junior", topic: "Operating Systems", tags: ["Online", "Discussion", "Help Needed" , "Question"], time: "5:00 PM", day: "OCT", date: 19, avatar: null },
  { id: 2, name: "Ahmed Hassan", role: "Software", university: "Cairo University", level: "Junior", topic: "Operating Systems", tags: ["Online", "Discussion"], time: "5:00 PM", day: "Sep", date: 25, avatar: null},
  { id: 3, name: "Ahmed Hassan", role: "Software", university: "Cairo University", level: "Junior", topic: "Operating Systems", tags: ["Online", "Discussion"], time: "5:00 PM", day: "Sep", date: 25, avatar: null },
  { id: 4, name: "Ahmed Hassan", role: "Software", university: "Cairo University", level: "Junior", topic: "Operating Systems", tags: ["Online", "Discussion"], time: "5:00 PM", day: "Sep", date: 25, avatar: null },
];

const RECOMMENDED = [
  { id: 1, name: "Ahmed Hassan", university: "Cairo University", major: "Business", score: 82, connected: false },
  { id: 2, name: "Ahmed Hassan", university: "Cairo University", major: "Business", score: 92, connected: false },
  { id: 3, name: "Ahmed Hassan", university: "Cairo University", major: "Business", score: 92, connected: false },
  { id: 4, name: "Ahmed Hassan", university: "Cairo University", major: "Business", score: 92, connected: false },
];

const NAV_TOP = [
  { icon: dashboard, label: "Dashboard", active: true },
  { icon: calendar, label: "Calendar" },
  { icon: studySessions, label: "Study Sessions" },
  { icon: network, label: "Network" },
  { icon: profile, label: "Profile" },
];

const NAV_BOTTOM = [
  { icon: home, label: "Home" },
  { icon: logout, label: "Logout" },
];

// ── Tag color map ────────────────────────────────────────────────
const tagColor = (tag) => {
  if (tag === "Online") return { bg: "#d1fae5", color: "#059669" };
  return { bg: "#fce7f3", color: "#be185d" };
};

// ── Avatar placeholder ───────────────────────────────────────────
function Avatar({ size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg,#4ADE80,#22c55e)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontSize: size * 0.4, fontWeight: 700, flexShrink: 0,
    }}>A</div>
  );
}

// ── Search Results Page ──────────────────────────────────────────
function SearchPage({ query, onBack }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [localQuery, setLocalQuery] = useState(query);
  const [inputVal, setInputVal] = useState(query);

  const doSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    try {
      // Mocked results — replace with real graphqlRequest call when backend is ready
      // const data = await graphqlRequest(SEARCH_QUERY, { query: q });
      // setResults(data.searchStudyBuddies);
      await new Promise((r) => setTimeout(r, 700));
      setResults([
        { id: 1, name: "Sara Ahmed", university: "Cairo University", major: "CS", matchScore: 95, avatarUrl: null },
        { id: 2, name: "Omar Khalil", university: "AUC", major: "Engineering", matchScore: 88, avatarUrl: null },
        { id: 3, name: "Nour Mostafa", university: "GUC", major: "Business", matchScore: 76, avatarUrl: null },
      ]);
    } catch (e) {
      setError(e.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  useState(() => { doSearch(query); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setLocalQuery(inputVal);
    doSearch(inputVal);
  };

  return (
    <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "#4ADE80", fontFamily: "inherit", fontSize: 14,
        fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 20,
      }}>← Back to Dashboard</button>

      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 20 }}>
        Search Study Buddies
      </h2>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 32 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 16 }}>🔍</span>
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search for study buddies..."
            style={{
              width: "100%", padding: "12px 16px 12px 40px",
              border: "1.5px solid #e2e8f0", borderRadius: 10,
              fontSize: 14, fontFamily: "inherit", outline: "none",
              background: "#f8fafc",
            }}
            autoFocus
          />
        </div>
        <button type="submit" style={{
          padding: "12px 24px", background: "#4ADE80", color: "white",
          border: "none", borderRadius: 10, cursor: "pointer",
          fontFamily: "inherit", fontWeight: 600, fontSize: 14,
        }}>Search</button>
      </form>

      {loading && (
        <div style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>
          <div style={{
            width: 36, height: 36, border: "3px solid #e2e8f0",
            borderTop: "3px solid #4ADE80", borderRadius: "50%",
            animation: "spin 0.7s linear infinite", margin: "0 auto 12px",
          }} />
          Searching...
        </div>
      )}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: 10, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {results && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>{results.length} results for "<strong>{localQuery}</strong>"</p>
          {results.map((r) => (
            <div key={r.id} style={{
              background: "white", border: "1.5px solid #e2e8f0",
              borderRadius: 12, padding: "16px 20px",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <Avatar size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{r.name}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{r.university} · {r.major}</div>
              </div>
              <div style={{
                background: "#d1fae5", color: "#059669",
                borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700,
              }}>{r.matchScore}% match</div>
              <button style={{
                background: "#4ADE80", color: "white", border: "none",
                borderRadius: 8, padding: "8px 18px", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 600, fontSize: 13,
              }}>Connect</button>
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
  const [recommended, setRecommended] = useState(RECOMMENDED);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) setSearchPage(searchInput.trim());
  };

  const toggleConnect = (id) => {
    setRecommended((prev) =>
      prev.map((r) => r.id === id ? { ...r, connected: !r.connected } : r)
    );
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
        .btn-connect:hover { background: #4ADE80; color: white; }
      `}</style>

      <div className="dash-layout">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-brand">Learn<br />Together</div>
          <nav className="nav-group">
            {NAV_TOP.map((item) => (
              <div key={item.label} className={`nav-item${item.active ? " active" : ""}`}>
                <img src={item.icon} alt={item.label} className="nav-icon" />
                {item.label}
              </div>
            ))}
          </nav>
          <nav className="nav-bottom">
            {NAV_BOTTOM.map((item) => (
              <div key={item.label} className="nav-item">
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
              <button className="notif-btn">
                <img src={bell} alt="Notifications" width={20}  />
                <span className="notif-badge">8</span>
              </button>
              
            </div>
          </div>

          {/* Page content */}
          {searchPage ? (
            <SearchPage query={searchPage} onBack={() => { setSearchPage(null); setSearchInput(""); }} />
          ) : (
            <div className="main-scroll">
              {/* Hero */}
              <div className="hero-card">
                <div className="hero-text">
                  <h2>Welcome back, Kirolos 👋</h2>
                  <p>Ready to find your next study buddy?</p>
                  <button className="hero-btn">Find Study Buddy</button>
                </div>
                <img src={HERO_IMAGE_URL} alt="Students studying" className="hero-img" />
              </div>

              {/* Stats */}
              <div className="stats-row">
                {STATS.map((s) => (
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
                  {SESSION_REQUESTS.map((s) => (
                    <div key={s.id} className={`session-card${s.active ? " active-card" : ""}`}>
                      <div className="session-top">
                        <Avatar size={32} />
                        <div className="session-info">
                          <div className="session-name">{s.name}</div>
                          <div className="session-role">{s.role}</div>
                          <div className="session-uni">{s.university} · {s.level}</div>
                        </div>
                        <div className="date-badge">
                          <div className="date-month">{s.day}</div>
                          <div className="date-num">{s.date}</div>
                        </div>
                      </div>
                      <div className="session-topic">Topic: {s.topic}</div>
                      <div className="tags-row">
                        {s.tags.map((t) => (
                          <span key={t} className="tag" style={tagColor(t)}>{t}</span>
                        ))}
                      </div>
                      <div className="session-time">Time: {s.time}</div>
                      <div className="session-actions">
                        <button className="btn-profile">View Profile</button>
                        <button className="btn-accept">Accept</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended */}
              <div className="section-card">
                <div className="rec-header">
                  <div className="section-title" style={{ margin: 0 }}>Recommended Study Buddies For You</div>
                  <button className="show-all">Show all</button>
                </div>
                <div className="rec-row">
                  {recommended.map((r) => (
                    <div key={r.id} className="rec-card">
                      <span className="rec-score">{r.score}%</span>
                      <button className="rec-close">✕</button>
                      <div className="rec-avatar">👤</div>
                      <div className="rec-name">{r.name}</div>
                      <div className="rec-uni">{r.university}<br />{r.major}</div>
                      <button
                        className={`btn-connect${r.connected ? " connected" : ""}`}
                        onClick={() => toggleConnect(r.id)}
                      >
                        <img src={userConnect} alt="Connect" className="btn-icon" />
                        {r.connected ? "Connected" : "Connect"}
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