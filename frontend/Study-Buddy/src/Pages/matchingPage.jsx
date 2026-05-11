import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { gql } from "@apollo/client";
import { authClient, matchingClient } from "../clients/apolloClients.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const HERO_IMAGE_URL = "https://i.ibb.co/nMXjdQgV/Untitled.png";

const GET_USER_MATCHES = gql`
  query GetUserMatches {
    getUserMatches {
      id
      userId
      matchedUserId
      score
      reasons
      createdAt
    }
  }
`;

const SEND_REQUEST = gql`
  mutation SendBuddyRequest($receiverId: String!) {
    sendBuddyRequest(receiverId: $receiverId) {
      id
      senderId
      receiverId
      status
      createdAt
      updatedAt
    }
  }
`;

const USER_PROFILE_QUERY = gql`
  query GetUserProfile($userId: ID!) {
    getUserProfile(userId: $userId) {
      id
      name
      university
      academic_year
    }
  }
`;

const FILTER_DEFAULTS = {
  roles: [],
  styles: [],
  meeting: [],
  course: "",
  groupSize: 0,
};

const ROLE_OPTIONS = [
  ["software", "Software"],
  ["arts", "Arts"],
  ["law", "Law"],
  ["cyber", "Cyber Security"],
  ["business", "Business"],
  ["medicine", "Medicine"],
];

const STYLE_OPTIONS = [
  ["discussion", "Discussion"],
  ["writing", "Writing"],
  ["quiet", "Quiet"],
  ["listening", "Listening"],
];

const MEETING_OPTIONS = [
  ["online", "Online"],
  ["inperson", "In-person"],
];

const COURSE_OPTIONS = [
  ["", "Choose course"],
  ["course", "Shared courses"],
  ["topic", "Shared topics"],
  ["availability", "Overlapping availability"],
  ["mode", "Same study mode"],
];

function getStoredUserId(user) {
  if (user?.id) return String(user.id);

  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    return storedUser?.id ? String(storedUser.id) : "";
  } catch {
    return "";
  }
}

function getStoredOutgoingRequests(userId) {
  if (!userId) return [];

  try {
    return JSON.parse(localStorage.getItem(`outgoingBuddyRequests:${userId}`) || "[]");
  } catch {
    return [];
  }
}

function storeOutgoingRequests(userId, requests) {
  if (!userId) return;
  localStorage.setItem(`outgoingBuddyRequests:${userId}`, JSON.stringify(requests));
}

function fallbackProfile(userId) {
  const suffix = String(userId || "student").slice(-5).toUpperCase();
  return {
    id: userId,
    name: `Study Buddy ${suffix}`,
    university: "University student",
    academic_year: "Junior",
  };
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "SB";
}

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function inferField(profile, reasons) {
  const haystack = normalizeText(`${profile.name} ${profile.university} ${profile.academic_year} ${reasons.join(" ")}`);
  if (haystack.includes("business")) return "Business";
  if (haystack.includes("art")) return "Arts";
  if (haystack.includes("law")) return "Law";
  if (haystack.includes("medicine") || haystack.includes("medical")) return "Medicine";
  if (haystack.includes("cyber") || haystack.includes("security")) return "Cyber Security";
  return "Software";
}

function inferTags(reasons) {
  const joined = normalizeText(reasons.join(" "));
  const tags = [];
  if (joined.includes("course")) tags.push("Courses");
  if (joined.includes("topic")) tags.push("Topics");
  if (joined.includes("availability")) tags.push("Online");
  if (joined.includes("mode")) tags.push("Mode");
  if (joined.includes("style")) tags.push("Style");
  if (joined.includes("pace")) tags.push("Pace");
  return tags.length > 0 ? tags : ["Availability", "Study Style"];
}

function checkboxValue(list, value, checked) {
  if (checked) return Array.from(new Set([...list, value]));
  return list.filter((item) => item !== value);
}

function Header() {
  return (
    <header className="match-header">
      <Link to="/dashboard" className="brand-link">Learn Together</Link>
      <nav className="header-nav" aria-label="Primary navigation">
        <Link to="/dashboard">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/matches" className="active">Matches</Link>
        <Link to="/dashboard">Study Sessions</Link>
        <Link to="/dashboard">About Us</Link>
      </nav>
      <div className="header-actions">
        <button className="icon-button" type="button" aria-label="Notifications">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#55c7a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="notification-dot">1</span>
        </button>
        <button className="icon-button profile-circle" type="button" aria-label="Profile">
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <section>
          <h2 className="footer-headline">People are Saying About Study Together</h2>
          <p className="footer-copy">Everything you need to start improving your academic performance</p>
          <div className="quote-mark">"</div>
          <p className="quote">This app completely changed how I study. I found a study partner in minutes and now I am more consistent than ever!</p>
          <div className="quote-author">- Aria Zinarino</div>
          <div className="review-avatars" aria-hidden="true">
            <span className="review-avatar avatar-one" />
            <span className="review-avatar avatar-two" />
            <span className="review-avatar avatar-three" />
            <span className="review-avatar avatar-four" />
            <button className="play-btn" type="button" aria-label="Play testimonial">▶</button>
          </div>
        </section>

        <section className="footer-col">
          <h3>Support</h3>
          <a href="#">Help centre</a>
          <a href="#">Account information</a>
          <a href="#">About</a>
          <a href="#">Contact us</a>
        </section>

        <section className="footer-col">
          <h3>Help and Solution</h3>
          <a href="#">Talk to support</a>
          <a href="#">Support docs</a>
          <a href="#">System status</a>
          <a href="#">Covid responde</a>
        </section>

        <section className="footer-col">
          <h3>Product</h3>
          <a href="#">Update</a>
          <a href="#">Security</a>
          <a href="#">Beta test</a>
          <a href="#">Pricing product</a>
        </section>
      </div>

      <div className="footer-grid newsletter">
        <div />
        <div />
        <section className="newsletter-box">
          <h2 className="newsletter-title">Study Together</h2>
          <p>Get news about our new features</p>
          <form className="email-form">
            <input type="email" placeholder="Enter your email here" aria-label="Email address" />
            <button className="send-btn" type="submit" aria-label="Subscribe">›</button>
          </form>
        </section>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Study Together Inc. Copyright and rights reserved</span>
        <div className="legal-links">
          <a>Terms and Conditions</a>
          <a>Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}

function FilterBox({ title, children }) {
  return (
    <section className="filter-box">
      <button className="filter-title" type="button">
        <span>{title}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {children}
    </section>
  );
}

function CheckOption({ checked, label, onChange }) {
  return (
    <label className="check-option">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function MatchCard({ match, onSend, busy }) {
  return (
    <article className="match-card">
      <div className="card-top">
        <div className="student-mark">{initials(match.profile.name)}</div>
        <div className="student-main">
          <h3>{match.profile.name}</h3>
          <p>{match.profile.university || "University student"} · {match.profile.academic_year || "Student"}</p>
        </div>
        <span className="score-pill">{Math.round(match.score)}%</span>
      </div>

      <div className="details-grid">
        <span>• {match.field}</span>
        <span>• {match.primaryStyle}</span>
        <span>• {match.secondaryStyle}</span>
        <span>• {match.meetingLabel}</span>
      </div>

      <div className="tag-row">
        {match.tags.slice(0, 2).map((tag, index) => (
          <span key={tag} className={`match-tag ${index === 0 ? "warm" : "dark"}`}>{tag}</span>
        ))}
      </div>

      <div className="time-row">
        <span className="calendar-icon" aria-hidden="true">▣</span>
        <span>{match.availabilityLabel}</span>
      </div>

      <div className="card-actions">
        <button className="outline-action" type="button">View Profile</button>
          <button
          className="green-action"
          type="button"
          disabled={busy || match.sent}
          onClick={() => onSend(match.buddyId)}
        >
          {match.sent ? "Sent" : "Send Request"}
        </button>
      </div>
    </article>
  );
}

export default function MatchingPage() {
  const { user } = useAuth();
  const currentUserId = getStoredUserId(user);
  const [matches, setMatches] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [appliedFilters, setAppliedFilters] = useState(FILTER_DEFAULTS);
  const [sortBy, setSortBy] = useState("best");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [sentIds, setSentIds] = useState(() => new Set(getStoredOutgoingRequests(currentUserId).map((request) => request.receiverId)));

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await matchingClient.query({
        query: GET_USER_MATCHES,
        fetchPolicy: "network-only",
      });
      const nextMatches = data?.getUserMatches || [];
      setMatches(nextMatches);

      const ids = nextMatches
        .map((match) => (match.userId === currentUserId ? match.matchedUserId : match.userId))
        .filter(Boolean);
      const loadedProfiles = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const result = await authClient.query({
              query: USER_PROFILE_QUERY,
              variables: { userId: id },
              fetchPolicy: "network-only",
            });
            loadedProfiles[id] = result.data?.getUserProfile || fallbackProfile(id);
          } catch {
            loadedProfiles[id] = fallbackProfile(id);
          }
        }),
      );

      setProfiles(loadedProfiles);
    } catch (err) {
      setError(err.message || "Could not load matches.");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMatches();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadMatches]);

  const decoratedMatches = useMemo(
    () =>
      matches.filter((match) => match.score >= 30).map((match, index) => {
        const buddyId = match.userId === currentUserId ? match.matchedUserId : match.userId;
        const profile = profiles[buddyId] || fallbackProfile(buddyId);
        const reasons = match.reasons || [];
        const tags = inferTags(reasons);
        const field = inferField(profile, reasons);
        return {
          ...match,
          buddyId,
          profile,
          field,
          fieldKey: normalizeText(field).split(" ")[0],
          primaryStyle: reasons[0] || "Focused study",
          secondaryStyle: reasons[1] || "Good match",
          meetingLabel: reasons.some((reason) => normalizeText(reason).includes("availability")) ? "Online" : "Flexible",
          availabilityLabel: reasons.some((reason) => normalizeText(reason).includes("availability")) ? "Tue, Thu 3-7 PM" : "Wed, Fri 3-7 PM",
          tags,
          sent: sentIds.has(buddyId),
          order: index,
        };
      }),
    [currentUserId, matches, profiles, sentIds],
  );

  const visibleMatches = useMemo(() => {
    const filtered = decoratedMatches.filter((match) => {
      const reasonText = normalizeText(match.reasons.join(" "));
      const profileText = normalizeText(`${match.profile.name} ${match.profile.university} ${match.profile.academic_year}`);
      const selectedRoles = appliedFilters.roles;
      const selectedStyles = appliedFilters.styles;
      const selectedMeeting = appliedFilters.meeting;

      const roleMatch = selectedRoles.length === 0 || selectedRoles.some((role) => profileText.includes(role) || normalizeText(match.field).includes(role));
      const courseMatch = !appliedFilters.course || reasonText.includes(appliedFilters.course);
      const styleMatch =
        selectedStyles.length === 0 ||
        selectedStyles.some((style) => reasonText.includes(style) || match.tags.some((tag) => normalizeText(tag).includes(style)));
      const meetingMatch =
        selectedMeeting.length === 0 ||
        selectedMeeting.some((meeting) => normalizeText(match.meetingLabel).includes(meeting === "inperson" ? "in" : meeting) || reasonText.includes(meeting));
      const scoreMatch = appliedFilters.groupSize === 0 || match.score >= Math.max(0, appliedFilters.groupSize - 2) * 5;

      return roleMatch && courseMatch && styleMatch && meetingMatch && scoreMatch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "newest") return String(b.createdAt).localeCompare(String(a.createdAt));
      if (sortBy === "name") return a.profile.name.localeCompare(b.profile.name);
      return b.score - a.score;
    });
  }, [appliedFilters, decoratedMatches, sortBy]);

  const handleSendRequest = async (receiverId) => {
    setBusyId(receiverId);
    setError("");

    try {
      const { data } = await matchingClient.mutate({
        mutation: SEND_REQUEST,
        variables: { receiverId },
      });
      const sentRequest = data?.sendBuddyRequest;
      if (sentRequest) {
        const storedRequests = getStoredOutgoingRequests(currentUserId);
        const nextStoredRequests = [
          sentRequest,
          ...storedRequests.filter((request) => request.receiverId !== sentRequest.receiverId),
        ];
        storeOutgoingRequests(currentUserId, nextStoredRequests);
      }
      setSentIds((current) => new Set([...current, receiverId]));
    } catch (err) {
      setError(err.message || "Could not send buddy request.");
    } finally {
      setBusyId("");
    }
  };

  const resetFilters = () => {
    setFilters(FILTER_DEFAULTS);
    setAppliedFilters(FILTER_DEFAULTS);
  };

  const showAllMatches = () => {
    setFilters(FILTER_DEFAULTS);
    setAppliedFilters(FILTER_DEFAULTS);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; font-family: 'Nunito', sans-serif; background: #f5faf8; color: #111; }
        button, input, select { font-family: inherit; }

        .matching-page { min-height: 100vh; background: #f5faf8; }
        .match-header { height: 62px; display: flex; align-items: center; padding: 0 20px; background: #f5faf8; }
        .brand-link { color: #4fc59a; font-size: 28px; font-weight: 800; text-decoration: none; line-height: 1; }
        .header-nav { display: flex; align-items: center; gap: 24px; margin-left: auto; }
        .header-nav a { color: #9aa3a0; font-size: 9px; font-weight: 800; text-decoration: none; }
        .header-nav a.active { color: #111; }
        .header-actions { display: flex; align-items: center; gap: 12px; margin-left: 22px; }
        .icon-button { position: relative; border: 0; background: transparent; color: #111; padding: 0; cursor: pointer; display: grid; place-items: center; }
        .notification-dot { position: absolute; top: -5px; right: -4px; width: 13px; height: 13px; border-radius: 50%; background: #55c7a0; color: white; font-size: 8px; font-weight: 800; display: grid; place-items: center; }
        .profile-circle { width: 40px; height: 40px; border-radius: 50%; background: #eff1ef; border: 1px solid #d7ddd9; }

        .match-main { width: min(1540px, calc(100vw - 32px)); margin: 0 auto; padding: 18px 0 54px; }
        .hero-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 24px; margin: 0 46px 16px; }
        .hero-copy h1 { margin: 0 0 18px; font-size: 42px; font-weight: 800; line-height: 1; }
        .hero-copy p { margin: 0; color: #3f4744; font-size: 16px; font-weight: 700; }
        .hero-art { width: 205px; height: 145px; object-fit: contain; }

        .content-frame { border: 1px solid #d6dedc; border-radius: 14px; background: #fbfefd; box-shadow: 0 5px 10px rgba(15, 23, 42, 0.16); overflow: hidden; }
        .match-layout { display: grid; grid-template-columns: 365px 1fr; min-height: 680px; }
        .filters-panel { border-right: 1px solid #d8e2df; padding: 22px 26px; background: #fbfefd; }
        .filters-heading { display: flex; align-items: center; gap: 10px; font-size: 23px; font-weight: 800; margin-bottom: 19px; }
        .filter-icon { width: 26px; height: 26px; display: grid; place-items: center; border-radius: 6px; color: #111; }
        .filter-box { border-top: 1px solid #e4ece9; padding: 13px 0 2px; }
        .filter-title { width: 100%; border: 0; background: transparent; padding: 0; display: flex; align-items: center; justify-content: space-between; color: #111; font-size: 17px; font-weight: 800; cursor: pointer; }
        .check-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 21px; margin-top: 14px; }
        .check-option { display: flex; align-items: center; gap: 9px; font-size: 14px; font-weight: 700; color: #1f2926; min-width: 0; }
        .check-option input { width: 18px; height: 18px; accent-color: #55c7a0; flex: 0 0 auto; }
        .course-select { margin-top: 13px; width: 100%; height: 40px; border-radius: 7px; border: 1px solid #ccd8d5; background: white; color: #7a8582; font-size: 14px; padding: 0 11px; }
        .group-label { display: flex; align-items: center; justify-content: space-between; margin: 13px 0 5px; color: #7b8784; font-size: 13px; font-weight: 800; }
        .group-slider { width: 100%; accent-color: #55c7a0; }
        .group-scale { display: flex; justify-content: space-between; color: #a3adaa; font-size: 12px; font-weight: 700; }
        .filter-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
        .filter-actions .wide { grid-column: 1 / -1; }
        .apply-btn, .reset-btn { height: 38px; border-radius: 999px; font-size: 12px; font-weight: 800; cursor: pointer; }
        .apply-btn { border: 0; background: #55c7a0; color: white; }
        .reset-btn { border: 1px solid #111; background: white; color: #111; }

        .matches-panel { padding: 24px 28px 30px; }
        .match-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 21px; }
        .matches-found { color: #55c7a0; font-size: 24px; font-weight: 800; }
        .sort-box { display: flex; align-items: center; gap: 10px; color: #111; font-size: 14px; font-weight: 800; }
        .sort-box select { height: 34px; border: 1px solid #cbd7d4; border-radius: 7px; background: white; font-size: 13px; font-weight: 700; color: #111; padding: 0 10px; }
        .cards-grid { display: grid; grid-template-columns: repeat(3, minmax(280px, 1fr)); gap: 22px; }
        .match-card { background: #fff; border: 1px solid #d5e0dc; border-radius: 10px; padding: 18px; min-height: 252px; box-shadow: 0 2px 5px rgba(15, 23, 42, 0.07); }
        .card-top { display: grid; grid-template-columns: 48px 1fr auto; align-items: center; gap: 12px; }
        .student-mark { width: 45px; height: 45px; border-radius: 50%; background: #f28f52; color: white; display: grid; place-items: center; font-size: 14px; font-weight: 800; }
        .student-main h3 { margin: 0; font-size: 17px; font-weight: 800; color: #111; line-height: 1.15; }
        .student-main p { margin: 4px 0 0; font-size: 12px; font-weight: 700; color: #6b7774; line-height: 1.25; }
        .score-pill { height: 28px; min-width: 52px; border-radius: 999px; background: #55c7a0; color: white; display: grid; place-items: center; font-size: 13px; font-weight: 800; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; margin: 18px 0 14px; color: #111; font-size: 13px; font-weight: 800; line-height: 1.25; }
        .tag-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .match-tag { min-height: 22px; border-radius: 999px; padding: 4px 11px; display: inline-flex; align-items: center; font-size: 10px; font-weight: 800; color: white; }
        .match-tag.warm { background: #f26365; }
        .match-tag.dark { background: #2f3b4f; }
        .time-row { border-top: 1px solid #e2ebe8; border-bottom: 1px solid #e2ebe8; min-height: 38px; display: flex; align-items: center; gap: 9px; color: #111; font-size: 13px; font-weight: 800; }
        .calendar-icon { color: #55c7a0; font-size: 17px; }
        .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 15px; }
        .outline-action, .green-action { height: 34px; border-radius: 999px; font-size: 12px; font-weight: 800; cursor: pointer; }
        .outline-action { border: 1px solid #111; background: white; color: #111; }
        .green-action { border: 0; background: #55c7a0; color: white; }
        .green-action:disabled { opacity: 0.55; cursor: default; }
        .state-box { padding: 60px 20px; text-align: center; color: #697572; font-size: 14px; font-weight: 800; }
        .error-box { margin-bottom: 14px; padding: 10px 14px; border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2; color: #b91c1c; font-size: 12px; font-weight: 800; }

        .site-footer { background: #2f3b4f; color: #f8fafc; padding: 84px 45px 27px; }
        .footer-grid { display: grid; grid-template-columns: minmax(260px, 1.5fr) 0.5fr 0.65fr 0.5fr; gap: 42px; max-width: 1140px; margin: 0 auto; }
        .footer-headline { margin: 0 0 18px; font-size: 38px; font-weight: 800; line-height: 1.05; }
        .footer-copy { max-width: 350px; color: #c2cbd7; font-size: 13px; line-height: 1.6; margin: 0 0 24px; }
        .quote-mark { color: #f4f7fb; font-size: 50px; font-weight: 800; height: 35px; margin-bottom: 30px; }
        .quote { color: #c2cbd7; max-width: 360px; font-size: 12px; line-height: 1.6; margin: 0 0 14px; }
        .quote-author { color: #e2e8f0; font-size: 12px; margin-bottom: 30px; }
        .review-avatars { display: flex; align-items: center; gap: 17px; }
        .review-avatar { width: 39px; height: 39px; border-radius: 50%; background: #d7dee8; border: 2px solid rgba(255,255,255,0.45); }
        .avatar-one { background: linear-gradient(135deg, #f7b267, #6b7280); }
        .avatar-two { background: linear-gradient(135deg, #cbd5e1, #334155); }
        .avatar-three { background: linear-gradient(135deg, #f97316, #111827); }
        .avatar-four { background: linear-gradient(135deg, #e2e8f0, #0f172a); }
        .play-btn { width: 43px; height: 43px; border-radius: 50%; border: 2px solid #fff; background: transparent; color: #fff; display: grid; place-items: center; }
        .footer-col h3 { margin: 0 0 22px; font-size: 12px; font-weight: 800; color: #fff; }
        .footer-col a { display: block; color: #c2cbd7; text-decoration: none; font-size: 12px; margin-bottom: 17px; }
        .newsletter { align-self: end; margin-top: 18px; }
        .newsletter-box { grid-column: span 2; }
        .newsletter-title { color: #55c7a0; font-size: 36px; font-weight: 800; margin: 0 0 10px; }
        .newsletter p { color: #c2cbd7; margin: 0 0 22px; font-size: 12px; }
        .email-form { width: min(330px, 100%); height: 37px; border-radius: 999px; border: 1px solid #fff; display: flex; align-items: center; padding-left: 17px; }
        .email-form input { flex: 1; min-width: 0; border: 0; outline: 0; color: #fff; background: transparent; font-size: 12px; }
        .email-form input::placeholder { color: #c7d0dc; }
        .send-btn { width: 31px; height: 31px; border: 0; border-radius: 50%; background: #55c7a0; color: #fff; font-size: 21px; display: grid; place-items: center; margin-right: 2px; cursor: pointer; }
        .footer-bottom { max-width: 1140px; margin: 58px auto 0; display: flex; align-items: center; justify-content: space-between; color: #fff; font-size: 11px; }
        .legal-links { display: flex; gap: 72px; }

        @media (max-width: 1020px) {
          .hero-row { margin: 0 0 14px; }
          .match-layout { grid-template-columns: 1fr; }
          .filters-panel { border-right: 0; border-bottom: 1px solid #d8e2df; }
          .cards-grid { grid-template-columns: repeat(2, minmax(260px, 1fr)); }
        }

        @media (max-width: 680px) {
          .match-header { height: auto; padding: 18px; flex-wrap: wrap; gap: 14px; }
          .brand-link { font-size: 25px; }
          .header-nav { order: 3; width: 100%; overflow-x: auto; gap: 16px; }
          .header-actions { margin-left: auto; }
          .hero-row { grid-template-columns: 1fr; }
          .hero-art { width: 140px; }
          .cards-grid { grid-template-columns: 1fr; }
          .check-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; }
          .newsletter-box { grid-column: auto; }
          .footer-bottom { align-items: flex-start; flex-direction: column; gap: 18px; }
          .legal-links { gap: 26px; }
        }
      `}</style>

      <div className="matching-page">
        <Header />

        <main className="match-main">
          <section className="hero-row">
            <div className="hero-copy">
              <h1>Find Your Study Buddy</h1>
              <p>Showing matches based on your courses, preferences, and availability</p>
            </div>
            <img className="hero-art" src={HERO_IMAGE_URL} alt="Students studying together" />
          </section>

          <section className="content-frame">
            <div className="match-layout">
              <aside className="filters-panel">
                <div className="filters-heading">
                  <span className="filter-icon" aria-hidden="true">
                    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 5h18" />
                      <path d="M7 12h10" />
                      <path d="M10 19h4" />
                    </svg>
                  </span>
                  <span>Filters</span>
                </div>

                <FilterBox title="Role / Field">
                  <div className="check-grid">
                    {ROLE_OPTIONS.map(([value, label]) => (
                      <CheckOption
                        key={value}
                        label={label}
                        checked={filters.roles.includes(value)}
                        onChange={(checked) => setFilters((current) => ({ ...current, roles: checkboxValue(current.roles, value, checked) }))}
                      />
                    ))}
                  </div>
                </FilterBox>

                <FilterBox title="Courses">
                  <select className="course-select" value={filters.course} onChange={(event) => setFilters((current) => ({ ...current, course: event.target.value }))}>
                    {COURSE_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </FilterBox>

                <FilterBox title="Study Style">
                  <div className="check-grid">
                    {STYLE_OPTIONS.map(([value, label]) => (
                      <CheckOption
                        key={value}
                        label={label}
                        checked={filters.styles.includes(value)}
                        onChange={(checked) => setFilters((current) => ({ ...current, styles: checkboxValue(current.styles, value, checked) }))}
                      />
                    ))}
                  </div>
                </FilterBox>

                <FilterBox title="Meeting Type">
                  <div className="check-grid">
                    {MEETING_OPTIONS.map(([value, label]) => (
                      <CheckOption
                        key={value}
                        label={label}
                        checked={filters.meeting.includes(value)}
                        onChange={(checked) => setFilters((current) => ({ ...current, meeting: checkboxValue(current.meeting, value, checked) }))}
                      />
                    ))}
                  </div>
                </FilterBox>

                <FilterBox title="Group Size">
                  <div className="group-label">
                    <span>{filters.groupSize === 0 ? "Any size" : `${filters.groupSize} students`}</span>
                    <span>12 students</span>
                  </div>
                  <input
                    className="group-slider"
                    type="range"
                    min="0"
                    max="12"
                    value={filters.groupSize}
                    onChange={(event) => setFilters((current) => ({ ...current, groupSize: Number(event.target.value) }))}
                  />
                  <div className="group-scale">
                    <span>Any</span>
                    <span>6</span>
                    <span>12</span>
                  </div>
                </FilterBox>

                <div className="filter-actions">
                  <button className="apply-btn wide" type="button" onClick={showAllMatches}>Show All Matches</button>
                  <button className="apply-btn" type="button" onClick={() => setAppliedFilters(filters)}>Apply Filters</button>
                  <button className="reset-btn" type="button" onClick={resetFilters}>Reset</button>
                </div>
              </aside>

              <section className="matches-panel">
                <div className="match-toolbar">
                  <div className="matches-found">{visibleMatches.length} Matches Found</div>
                  <label className="sort-box">
                    <span>Sort By:</span>
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                      <option value="best">Best Match</option>
                      <option value="newest">Newest</option>
                      <option value="name">Name</option>
                    </select>
                  </label>
                </div>

                {error && <div className="error-box">{error}</div>}

                {loading ? (
                  <div className="state-box">Finding your strongest study matches...</div>
                ) : visibleMatches.length === 0 ? (
                  <div className="state-box">No matches fit these filters. Reset filters or update your study profile.</div>
                ) : (
                  <div className="cards-grid">
                    {visibleMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        busy={busyId === match.buddyId}
                        onSend={handleSendRequest}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
