import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Replace these with your actual image URLs ───────────────────
const HERO_IMAGE_URL = "https://i.ibb.co/v6R7B1TR/landing-Hero.png"; // students at laptop
const FEATURE_IMG_MATCHING = "https://i.ibb.co/G3pHDc5W/compatibility.png"; // smart compatibility card
const FEATURE_IMG_SCHEDULE = "https://i.ibb.co/VY8mV6z0/Schedule.png"; // calendar / scheduling card
const FEATURE_IMG_BUDDY = "https://i.ibb.co/d4SJB8MZ/Request.png"; // buddy request card
const WHY_SECTION_IMG_URL = "https://i.ibb.co/RTpvXrcG/landing-laptop.png"; // laptop photo
const TESTIMONIAL_AVATARS = [
  "YOUR_AVATAR_1_URL",
  "YOUR_AVATAR_2_URL",
  "YOUR_AVATAR_3_URL",
  "YOUR_AVATAR_4_URL",
];
// ─────────────────────────────────────────────────────────────────
const SUBJECTS = [
  { icon: "▦", label: "Mathematics" },
  { icon: "⚗", label: "Sciences" },
  { icon: "◫", label: "Languages" },
  { icon: "▤", label: "History" },
  { icon: "🖥", label: "Tech" },
  { icon: "✦", label: "Arts" },
];

const FEATURES_RIGHT = [
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#4ADE80"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    title: "Smart Matching",
    desc: "Automatically matches students based on shared courses, topics, availability, and study style with a compatibility score.",
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#4ADE80"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: "Study Session Scheduling",
    desc: "Create, join, or cancel study sessions either online or in-person at university study rooms.",
  },
  {
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#4ADE80"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: "Profile & Study Preferences",
    desc: "Define your study pace, mode, group size, and style to get the most accurate matches.",
  },
];

const PLATFORM_CARDS = [
  {
    img: FEATURE_IMG_MATCHING,
    title: "Smart Compatibility Matching",
    desc: "Smart compatibility system to match you with the ideal study partners",
  },
  {
    img: FEATURE_IMG_SCHEDULE,
    title: "Study Session Scheduling",
    desc: "Easily book and manage your study sessions",
  },
  {
    img: FEATURE_IMG_BUDDY,
    title: "Buddy Request System",
    desc: "Send and receive study partners requests",
  },
];

const WHY_ITEMS = [
  "Study more consistently",
  "Reduce procrastination",
  "Find compatible partners",
  "Improve Academic Performance",
];

const FOOTER_LINKS = {
  Support: ["Help centre", "Account information", "About", "Contact us"],
  "Help and Solution": [
    "Talk to support",
    "Support docs",
    "System status",
    "Covid response",
  ],
  Product: ["Update", "Security", "Beta test", "Pricing product"],
};

// ─── Mock auth state — replace with your real auth context ───────

export default function LandingPage() {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: #fff; color: #111; overflow-x: hidden; }

        :root {
          --green: #4ADE80;
          --green-dark: #22c55e;
          --green-light: #d1fae5;
          --dark: #1a2236;
          --text: #374151;
          --muted: #6b7280;
        }

        @keyframes fadeUp   { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:none; } }
        @keyframes float    { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
        @keyframes shimmer  { 0% { background-position:200% center; } 100% { background-position:-200% center; } }

        /* ── NAV ── */
        nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(255,255,255,0.92); backdrop-filter: blur(12px);
          border-bottom: 1px solid #f0fdf4;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 48px; height: 64px;
        }
        .nav-brand {
          font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800;
          color: var(--green); letter-spacing: -0.5px; cursor: pointer;
        }
        .nav-actions { display: flex; align-items: center; gap: 12px; }
        .btn-login {
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
          color: var(--text); padding: 8px 16px; border-radius: 8px;
          transition: color 0.2s;
        }
        .btn-login:hover { color: var(--green); }
        .btn-signup {
          background: var(--green); color: white; border: none; border-radius: 30px;
          padding: 9px 22px; font-size: 14px; font-weight: 700;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 4px 12px rgba(74,222,128,0.35);
        }
        .btn-signup:hover { background: var(--green-dark); transform: translateY(-1px); box-shadow: 0 6px 18px rgba(74,222,128,0.4); }
        .profile-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--green); color: white;
          font-size: 13px; font-weight: 800; font-family: 'Sora', sans-serif;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; border: 2px solid #d1fae5;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .profile-avatar:hover { transform: scale(1.08); box-shadow: 0 4px 14px rgba(74,222,128,0.4); }

        /* ── HERO ── */
        .hero {
          min-height: 88vh;
          background: linear-gradient(145deg, #f0fdf4 0%, #ecfdf5 40%, #f8faff 100%);
          display: flex; align-items: center;
          padding: 60px 48px 40px;
          position: relative; overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute; top: -120px; right: -120px;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-left { flex: 1; max-width: 520px; animation: fadeUp 0.7s ease both; }
        .hero-left h1 {
          font-family: 'Sora', sans-serif;
          font-size: clamp(38px, 5vw, 56px);
          font-weight: 800; line-height: 1.1;
          color: #0f172a; margin-bottom: 20px; letter-spacing: -1.5px;
        }
        .hero-underline {
          width: 180px; height: 5px; border-radius: 4px;
          background: linear-gradient(90deg, var(--green), var(--green-dark));
          margin-bottom: 22px;
        }
        .hero-desc { font-size: 16px; color: var(--muted); line-height: 1.7; margin-bottom: 34px; max-width: 400px; }
        .btn-get-started {
          background: var(--green); color: white; border: none; border-radius: 30px;
          padding: 14px 32px; font-size: 15px; font-weight: 700;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          box-shadow: 0 6px 20px rgba(74,222,128,0.4);
          transition: all 0.2s;
        }
        .btn-get-started:hover { background: var(--green-dark); transform: translateY(-2px); box-shadow: 0 10px 28px rgba(74,222,128,0.45); }
        .hero-right {
          flex: 1; display: flex; justify-content: center; align-items: center;
          animation: float 5s ease-in-out infinite;
        }
        .hero-right img { max-height: 320px; object-fit: contain; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.08)); }

        /* ── STATS ── */
        .stats-section {
          background: white; padding: 56px 48px;
          text-align: center;
          border-top: 1px solid #f0fdf4;
        }
        .stats-heading { font-family: 'Sora', sans-serif; font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
        .stats-sub { font-size: 15px; color: var(--muted); margin-bottom: 36px; }
        .subjects-row { display: flex; justify-content: center; flex-wrap: wrap; gap: 28px; }
        .subject-item { display: flex; align-items: center; gap: 7px; font-size: 15px; color: var(--muted); font-weight: 500; }
        .subject-icon { font-size: 18px; color: var(--green); }

        /* ── HOW WE HELP ── */
        .how-section {
          background: linear-gradient(160deg, #f0fdf4 0%, #f8fff9 100%);
          padding: 80px 48px;
          display: flex; gap: 60px; align-items: flex-start;
        }
        .how-left { flex: 1; max-width: 380px; }
        .how-left h2 { font-family: 'Sora', sans-serif; font-size: 34px; font-weight: 800; color: #0f172a; line-height: 1.15; letter-spacing: -1px; margin-bottom: 18px; }
        .how-left p { font-size: 14px; color: var(--muted); line-height: 1.8; margin-bottom: 36px; }
        .stats-mini { display: flex; gap: 28px; }
        .stat-mini { text-align: center; }
        .stat-mini-val { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 800; color: #0f172a; }
        .stat-mini-label { font-size: 11px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }
        .how-right { flex: 1; display: flex; flex-direction: column; gap: 28px; }
        .feature-row { display: flex; align-items: flex-start; gap: 16px; }
        .feature-icon-wrap {
          width: 46px; height: 46px; border-radius: 14px;
          background: var(--green-light); display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .feature-title { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 5px; }
        .feature-desc  { font-size: 13px; color: var(--muted); line-height: 1.65; }

        /* ── PLATFORM SECTION ── */
        .platform-section { background: white; padding: 80px 48px; }
        .platform-header { text-align: center; margin-bottom: 52px; }
        .platform-header h2 { font-family: 'Sora', sans-serif; font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 12px; letter-spacing: -0.8px; }
        .platform-header p  { font-size: 14px; color: var(--muted); max-width: 520px; margin: 0 auto; line-height: 1.7; }
        .platform-cards { display: flex; gap: 24px; flex-wrap: wrap; }
        .platform-card {
          flex: 1; min-width: 220px; display: flex; flex-direction: column;
          border-radius: 20px; overflow: hidden;
          background: linear-gradient(160deg, #f0fdf4 0%, white 100%);
          border: 1.5px solid #e2e8f0;
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .platform-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(74,222,128,0.12); }
        .platform-card-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; background: var(--green-light); }
        .platform-card-img-placeholder {
          width: 100%; aspect-ratio: 4/3;
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          display: flex; align-items: center; justify-content: center;
          font-size: 36px;
        }
        .platform-card-body { padding: 20px; }
        .platform-card-title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 7px; }
        .platform-card-desc  { font-size: 13px; color: var(--muted); line-height: 1.6; }

        /* ── WHY SECTION ── */
        .why-section {
          background: linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 100%);
          padding: 80px 48px;
          display: flex; gap: 60px; align-items: center;
        }
        .why-left { flex: 1; max-width: 400px; }
        .why-left h2 { font-family: 'Sora', sans-serif; font-size: 36px; font-weight: 800; color: #0f172a; line-height: 1.15; letter-spacing: -1px; margin-bottom: 32px; }
        .why-item { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .why-check {
          width: 26px; height: 26px; border-radius: 50%; background: var(--green);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .why-text { font-size: 15px; color: var(--text); font-weight: 600; }
        .why-right { flex: 1; position: relative; }
        .why-img {
  width: 50%;
  border-radius: 20px;
  object-fit: cover;
  max-height: 360px;
  filter: grayscale(15%);

  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}
        .why-img-placeholder {
          width: 100%; border-radius: 20px; aspect-ratio: 16/10;
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          display: flex; align-items: center; justify-content: center;
          font-size: 64px;
        }
        .why-badge {
          position: absolute; bottom: 18px; left: 18px;
          background: white; border-radius: 30px; padding: 10px 18px;
          font-size: 13px; font-weight: 700; color: #0f172a;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          display: flex; align-items: center; gap: 8px;
        }
        .why-badge-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--green); }
        .why-chat {
          position: absolute; top: 18px; right: -16px;
          background: white; border-radius: 14px; padding: 12px 16px;
          box-shadow: 0 6px 24px rgba(0,0,0,0.1);
          display: flex; align-items: center; gap: 10px; max-width: 200px;
        }
        .why-chat-avatar {
          width: 32px; height: 32px; border-radius: 50%; background: var(--green);
          display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; flex-shrink: 0;
        }
        .why-chat-text .name { font-size: 12px; font-weight: 700; color: #0f172a; }
        .why-chat-text .msg  { font-size: 11px; color: var(--muted); }
        .session-badge {
          position: absolute; top: 18px; right: -16px; margin-top: 76px;
          background: white; border-radius: 14px; padding: 8px 14px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          font-size: 11px; font-weight: 700; color: #0f172a;
          display: flex; align-items: center; gap: 6px;
        }

        /* ── TESTIMONIALS + FOOTER ── */
        .dark-section {
          background: var(--dark);
          padding: 72px 48px 0;
          color: white;
        }
        .dark-top { display: flex; gap: 48px; flex-wrap: wrap; padding-bottom: 60px; }
        .testimonial-left { flex: 1; max-width: 340px; }
        .testimonial-left h2 { font-family: 'Sora', sans-serif; font-size: 30px; font-weight: 800; line-height: 1.2; margin-bottom: 10px; }
        .testimonial-left p { font-size: 13px; color: #94a3b8; margin-bottom: 28px; }
        .quote-mark { font-size: 52px; color: var(--green); line-height: 1; margin-bottom: 12px; font-family: Georgia, serif; }
        .quote-text { font-size: 14px; color: #cbd5e1; line-height: 1.75; font-style: italic; margin-bottom: 12px; }
        .quote-author { font-size: 13px; color: var(--green); font-weight: 700; margin-bottom: 24px; }
        .avatar-row { display: flex; gap: 10px; align-items: center; }
        .avatar-thumb {
          width: 40px; height: 40px; border-radius: 50%; object-fit: cover;
          border: 2px solid #2d3f5a; background: #2d3f5a;
          display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 18px;
          overflow: hidden;
        }
        .avatar-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .play-btn {
          width: 40px; height: 40px; border-radius: 50%;
          background: #2d3f5a; border: 2px solid #3d5070;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: white; font-size: 14px; transition: background 0.2s;
        }
        .play-btn:hover { background: var(--green); }

        .footer-links-grid { display: flex; gap: 48px; flex-wrap: wrap; flex: 1; }
        .footer-col h4 { font-size: 13px; font-weight: 700; color: white; margin-bottom: 16px; }
        .footer-col a { display: block; font-size: 13px; color: #94a3b8; text-decoration: none; margin-bottom: 10px; transition: color 0.2s; }
        .footer-col a:hover { color: var(--green); }
        .newsletter-box { min-width: 240px; }
        .newsletter-box h3 { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800; color: var(--green); margin-bottom: 6px; }
        .newsletter-box p { font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
        .newsletter-form { display: flex; gap: 0; border-radius: 30px; overflow: hidden; background: #2d3f5a; border: 1px solid #3d5070; }
        .newsletter-form input {
          flex: 1; padding: 11px 16px; background: none; border: none;
          font-size: 13px; color: white; font-family: 'DM Sans', sans-serif; outline: none;
        }
        .newsletter-form input::placeholder { color: #64748b; }
        .newsletter-btn {
          width: 38px; height: 38px; background: var(--green); border: none;
          color: white; cursor: pointer; font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          margin: 3px; border-radius: 50%; transition: background 0.2s;
        }
        .newsletter-btn:hover { background: var(--green-dark); }

        .footer-bottom {
          border-top: 1px solid #2d3f5a;
          padding: 20px 48px;
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 12px;
          background: var(--dark);
        }
        .footer-copy { font-size: 12px; color: #64748b; }
        .footer-legal { display: flex; gap: 24px; }
        .footer-legal a { font-size: 12px; color: #64748b; text-decoration: none; transition: color 0.2s; }
        .footer-legal a:hover { color: var(--green); }

        @media (max-width: 768px) {
          nav { padding: 0 20px; }
          .hero, .how-section, .platform-section, .why-section, .dark-section { padding-left: 20px; padding-right: 20px; }
          .hero { flex-direction: column; text-align: center; }
          .hero-underline { margin: 0 auto 22px; }
          .hero-right { display: none; }
          .how-section, .why-section { flex-direction: column; }
          .footer-bottom { padding: 16px 20px; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav>
        <div className="nav-brand" onClick={() => navigate("/")}>
          Learn Together
        </div>
        <div className="nav-actions">
          {isLoggedIn ? (
            <div
              className="profile-avatar"
              onClick={() => navigate("/dashboard")}
              title={user.name}
            >
              {user.initials}
            </div>
          ) : (
            <>
              <button className="btn-login" onClick={() => navigate("/login")}>
                Login
              </button>
              <button
                className="btn-signup"
                onClick={() => navigate("/register")}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-left">
          <h1>
            We're here to
            <br />
            Increase your
            <br />
            Productivity
          </h1>
          <div className="hero-underline" />
          <p className="hero-desc">
            Find your perfect study partner instantly with the Real-Time Study
            Buddy Matcher — making every study session smarter, easier, and more
            productive.
          </p>
          <button
            className="btn-get-started"
            onClick={() => navigate("/register")}
          >
            Get Started
          </button>
        </div>
        <div className="hero-right">
          {HERO_IMAGE_URL !== "YOUR_HERO_IMAGE_URL" ? (
            <img src={HERO_IMAGE_URL} alt="Students studying together" />
          ) : (
            <div
              style={{
                fontSize: 120,
                animation: "float 5s ease-in-out infinite",
              }}
            >
              📚
            </div>
          )}
        </div>
      </section>

      {/* ── STATS / SUBJECTS ── */}
      <section className="stats-section">
        <div className="stats-heading">More than 25,000 Learners</div>
        <div className="stats-sub">In More Than 40+ subjects</div>
        <div className="subjects-row">
          {SUBJECTS.map((s) => (
            <div key={s.label} className="subject-item">
              <span className="subject-icon">{s.icon}</span>
              {s.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW WE HELP ── */}
      <section className="how-section">
        <div className="how-left">
          <h2>How we help students find their perfect study match</h2>
          <p>
            We start by building your academic profile — your courses, study
            topics, and preferences. Then our smart matching engine analyzes
            your availability, study pace, and style to connect you with the
            most compatible study partners in real time. Once matched, you can
            schedule sessions online or reserve a university study room, get
            instant notifications, and stay in sync through our messaging
            feature — all in one seamless platform.
          </p>
          <div className="stats-mini">
            {[
              ["98%", "Match Accuracy"],
              ["1,000+", "Students Matched"],
              ["3sec", "Match Time"],
            ].map(([v, l]) => (
              <div className="stat-mini" key={l}>
                <div className="stat-mini-val">{v}</div>
                <div className="stat-mini-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="how-right">
          {FEATURES_RIGHT.map((f) => (
            <div key={f.title} className="feature-row">
              <div className="feature-icon-wrap">{f.icon}</div>
              <div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLATFORM ── */}
      <section className="platform-section">
        <div className="platform-header">
          <h2>What our platform provides</h2>
          <p>
            We provide a range of smart features designed to help students
            improve productivity and manage their study sessions more
            effectively.
          </p>
        </div>
        <div className="platform-cards">
          {PLATFORM_CARDS.map((c) => (
            <div key={c.title} className="platform-card">
              {c.img && !c.img.startsWith("YOUR_") ? (
                <img src={c.img} alt={c.title} className="platform-card-img" />
              ) : (
                <div className="platform-card-img-placeholder">
                  {c.title.includes("Match")
                    ? "🤝"
                    : c.title.includes("Schedule")
                      ? "📅"
                      : "📨"}
                </div>
              )}
              <div className="platform-card-body">
                <div className="platform-card-title">{c.title}</div>
                <div className="platform-card-desc">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY ── */}
      <section className="why-section">
        <div className="why-left">
          <h2>Why Students Use Learn Together</h2>
          {WHY_ITEMS.map((item) => (
            <div key={item} className="why-item">
              <div className="why-check">
                <svg
                  width="13"
                  height="13"
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
              <span className="why-text">{item}</span>
            </div>
          ))}
        </div>
        <div className="why-right">
          {WHY_SECTION_IMG_URL !== "YOUR_WHY_SECTION_IMAGE_URL" ? (
            <img
              src={WHY_SECTION_IMG_URL}
              alt="Student using laptop"
              className="why-img"
            />
          ) : (
            <div className="why-img-placeholder">💻</div>
          )}
        </div>
      </section>

      {/* ── DARK: TESTIMONIALS + FOOTER LINKS ── */}
      <div className="dark-section">
        <div className="dark-top">
          {/* Testimonial */}
          <div className="testimonial-left">
            <h2>People are Saying About Study Together</h2>
            <p>
              Everything you need to start improving your academic performance
            </p>
            <div className="quote-mark">"</div>
            <p className="quote-text">
              "This app completely changed how I study. I found a study partner
              in minutes and now I'm more consistent than ever!"
            </p>
            <div className="quote-author">_ Aria Zinanrio</div>
            <div className="avatar-row">
              {TESTIMONIAL_AVATARS.map((src, i) => (
                <div key={i} className="avatar-thumb">
                  {src && !src.startsWith("YOUR_") ? (
                    <img src={src} alt={`User ${i + 1}`} />
                  ) : (
                    <span style={{ fontSize: 18 }}>👤</span>
                  )}
                </div>
              ))}
              <div className="play-btn">▶</div>
            </div>
          </div>

          {/* Footer links */}
          <div className="footer-links-grid">
            {Object.entries(FOOTER_LINKS).map(([col, links]) => (
              <div key={col} className="footer-col">
                <h4>{col}</h4>
                {links.map((l) => (
                  <a key={l} href="#">
                    {l}
                  </a>
                ))}
              </div>
            ))}
            <div className="newsletter-box">
              <h3>Study Together</h3>
              <p>Get news about our new features</p>
              <div className="newsletter-form">
                <input
                  type="email"
                  placeholder="Enter your email here"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="newsletter-btn">→</button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="footer-bottom">
          <span className="footer-copy">
            © 2022 Learn Together Inc. Copyright and rights reserved
          </span>
          <div className="footer-legal">
            <a href="#">Terms and Conditions</a>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
      </div>
    </>
  );
}
