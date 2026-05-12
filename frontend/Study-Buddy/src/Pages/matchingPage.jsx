import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gql } from "@apollo/client";
import {
  authClient,
  matchingClient,
  profileClient,
} from "../clients/apolloClients.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "./Shared/Navbar.jsx";

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

const GET_CONNECTIONS = gql`
  query MatchingPageConnections {
    getBuddyRequests {
      id
      senderId
      receiverId
      status
    }
    getOutgoingBuddyRequests {
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

const PROFILE_BY_ID_QUERY = gql`
  query GetProfileById($userId: String!) {
    getProfileById(userId: $userId) {
      id
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

const FILTER_DEFAULTS = {
  university: "",
  academicYear: "",
  courses: [],
  topics: [],
  studyPace: [],
  studyMode: [],
  groupSize: [],
  studyStyle: [],
};

const ACADEMIC_YEAR_OPTIONS = ["Year 1", "Year 2", "Year 3", "Year 4", "Senior"];

const STUDY_PACE_OPTIONS = [
  ["slow", "Slow"],
  ["moderate", "Moderate"],
  ["fast", "Fast"],
];

const STUDY_MODE_OPTIONS = [
  ["online", "Online"],
  ["in-person", "In-Person"],
];

const GROUP_SIZE_OPTIONS = [
  ["solo", "Solo (1)"],
  ["small", "Small (2-4)"],
  ["large", "Large (5+)"],
];

const STUDY_STYLE_OPTIONS = [
  ["notes", "Writing Notes"],
  ["listening", "Listening"],
  ["discussion", "Discussing Out Loud"],
  ["quiet", "Studying Quietly"],
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
    return JSON.parse(
      localStorage.getItem(`outgoingBuddyRequests:${userId}`) || "[]",
    );
  } catch {
    return [];
  }
}


function storeOutgoingRequests(userId, requests) {
  if (!userId) return;
  localStorage.setItem(
    `outgoingBuddyRequests:${userId}`,
    JSON.stringify(requests),
  );
}

function fallbackProfile(userId) {
  const suffix = String(userId || "student")
    .slice(-5)
    .toUpperCase();
  return {
    id: userId,
    name: `Study Buddy ${suffix}`,
    university: "",
    academicYear: "",
    academic_year: "",
    courses: [],
    topics: [],
    preferences: {},
  };
}

function initials(name) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SB"
  );
}

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function checkboxValue(list, value, checked) {
  if (checked) return Array.from(new Set([...list, value]));
  return list.filter((item) => item !== value);
}

function getItemNames(items) {
  return (items || [])
    .map((item) => item?.name)
    .filter(Boolean)
    .map((name) => String(name));
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function formatList(values, fallback) {
  const clean = values.filter(Boolean);
  if (clean.length === 0) return fallback;
  if (clean.length <= 2) return clean.join(", ");
  return `${clean.slice(0, 2).join(", ")} +${clean.length - 2}`;
}

function preferenceLabel(options, value, fallback = "Not set") {
  if (!value) return fallback;
  return options.find(([optionValue]) => optionValue === value)?.[1] || value;
}

function buildProfileTags(profile) {
  const courses = getItemNames(profile.courses);
  const topics = getItemNames(profile.topics);
  const preferences = profile.preferences || {};
  return [
    courses[0],
    topics[0],
    preferenceLabel(STUDY_MODE_OPTIONS, preferences.studyMode, ""),
    preferenceLabel(STUDY_STYLE_OPTIONS, preferences.studyStyle, ""),
  ].filter(Boolean);
}

function getConnectedUserIds(connections, currentUserId) {
  const current = String(currentUserId || "");
  const ids = new Set();
  connections.forEach((connection) => {
    if (String(connection.userId1) === current) {
      ids.add(String(connection.userId2));
    } else if (String(connection.userId2) === current) {
      ids.add(String(connection.userId1));
    }
  });
  return ids;
}

function getPendingRequestUserIds(requests, currentUserId) {
  const current = String(currentUserId || "");
  const ids = new Set();
  requests.forEach((request) => {
    if (request.status !== "PENDING") return;
    if (String(request.senderId) === current) {
      ids.add(String(request.receiverId));
    }
    if (String(request.receiverId) === current) {
      ids.add(String(request.senderId));
    }
  });
  return ids;
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <section>
          <h2 className="footer-headline">
            People are Saying About Study Together
          </h2>
          <p className="footer-copy">
            Everything you need to start improving your academic performance
          </p>
          <div className="quote-mark">"</div>
          <p className="quote">
            This app completely changed how I study. I found a study partner in
            minutes and now I am more consistent than ever!
          </p>
          <div className="quote-author">- Aria Zinarino</div>
          <div className="review-avatars" aria-hidden="true">
            <span className="review-avatar avatar-one" />
            <span className="review-avatar avatar-two" />
            <span className="review-avatar avatar-three" />
            <span className="review-avatar avatar-four" />
            <button
              className="play-btn"
              type="button"
              aria-label="Play testimonial"
            >
              &gt;
            </button>
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
            <input
              type="email"
              placeholder="Enter your email here"
              aria-label="Email address"
            />
            <button className="send-btn" type="submit" aria-label="Subscribe">
              &gt;
            </button>
          </form>
        </section>
      </div>

      <div className="footer-bottom">
        <span>(c) 2026 Study Together Inc. Copyright and rights reserved</span>
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
        <span aria-hidden="true">v</span>
      </button>
      {children}
    </section>
  );
}

function CheckOption({ checked, label, onChange }) {
  return (
    <label className="check-option">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function selectedSummary(selected, fallback) {
  if (!selected.length) return fallback;
  if (selected.length === 1) return selected[0];
  return `${selected.length} selected`;
}

function MultiSelectDropdown({ label, options, selected, emptyText, onChange }) {
  return (
    <details className="multi-select">
      <summary>{selectedSummary(selected, label)}</summary>
      <div className="multi-options">
        {options.length === 0 ? (
          <span className="empty-filter">{emptyText}</span>
        ) : (
          options.map((option) => (
            <CheckOption
              key={option}
              label={option}
              checked={selected.includes(option)}
              onChange={(checked) => onChange(option, checked)}
            />
          ))
        )}
      </div>
    </details>
  );
}

function MatchCard({ match, onSend, busy, onViewMatch }) {
  const profile = match.profile;
  const preferences = profile.preferences || {};
  const courses = getItemNames(profile.courses);
  const topics = getItemNames(profile.topics);
  const reasons = match.reasons || [];
  const metaLine = [
    profile.university,
    profile.academicYear || profile.academic_year,
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <article className="match-card">
      <div className="card-top">
        <div className="student-mark">{initials(profile.name)}</div>
        <div className="student-main">
          <h3>{profile.name}</h3>
          <p>{metaLine || "Study profile details not set"}</p>
        </div>
        <span className="score-pill">{Math.round(match.score)}%</span>
      </div>

      <div className="details-grid">
        <span>Courses: {formatList(courses, "No courses")}</span>
        <span>Topics: {formatList(topics, "No topics")}</span>
        <span>
          Pace: {preferenceLabel(STUDY_PACE_OPTIONS, preferences.studyPace)}
        </span>
        <span>
          Mode: {preferenceLabel(STUDY_MODE_OPTIONS, preferences.studyMode)}
        </span>
        <span>
          Group: {preferenceLabel(GROUP_SIZE_OPTIONS, preferences.groupSize)}
        </span>
        <span>
          Style: {preferenceLabel(STUDY_STYLE_OPTIONS, preferences.studyStyle)}
        </span>
      </div>

      <div className="tag-row">
        {(match.tags.length ? match.tags : reasons)
          .slice(0, 3)
          .map((tag, index) => (
            <span
              key={tag}
              className={`match-tag ${index === 0 ? "warm" : "dark"}`}
            >
              {tag}
            </span>
          ))}
      </div>

      <div className="time-row">
        <span className="calendar-icon" aria-hidden="true">
          -
        </span>
        <span>{formatList(reasons, "Matched from profile compatibility")}</span>
      </div>

      <div className="card-actions">
        <button className="outline-action" type="button" onClick={() => onViewMatch(match)}>
          View Profile
        </button>
        <button
          className="green-action"
          type="button"
          disabled={busy || match.sent || match.connected}
          onClick={() => onSend(match.buddyId)}
        >
          {match.connected
            ? "Connected"
            : match.sent
              ? "Request Pending"
              : "Send Request"}
        </button>
      </div>
    </article>
  );
}
export default function MatchingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentUserId = getStoredUserId(user);
  const [matches, setMatches] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [appliedFilters, setAppliedFilters] = useState(FILTER_DEFAULTS);
  const [sortBy, setSortBy] = useState("best");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [connectedIds, setConnectedIds] = useState(() => new Set());
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [sentIds, setSentIds] = useState(
    () =>
      new Set(
        getStoredOutgoingRequests(currentUserId).map(
          (request) => request.receiverId,
        ),
      ),
  );

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [{ data }, connectionsResult] = await Promise.all([
        matchingClient.query({
          query: GET_USER_MATCHES,
          fetchPolicy: "network-only",
        }),
        matchingClient.query({
          query: GET_CONNECTIONS,
          fetchPolicy: "network-only",
        }),
      ]);
      const nextMatches = data?.getUserMatches || [];
      setMatches(nextMatches);
      setConnectedIds(
        getConnectedUserIds(
          connectionsResult.data?.getConnections || [],
          currentUserId,
        ),
      );
      setPendingIds(
        getPendingRequestUserIds(
          [
            ...(connectionsResult.data?.getBuddyRequests || []),
            ...(connectionsResult.data?.getOutgoingBuddyRequests || []),
          ],
          currentUserId,
        ),
      );

      const ids = Array.from(new Set(nextMatches
        .map((match) =>
          match.userId === currentUserId ? match.matchedUserId : match.userId,
        )
        .filter(Boolean)));
      const loadedProfiles = {};
      await Promise.all(
        ids.map(async (id) => {
          const [authResult, profileResult] = await Promise.allSettled([
            authClient.query({
              query: USER_PROFILE_QUERY,
              variables: { userId: id },
              fetchPolicy: "network-only",
            }),
            profileClient.query({
              query: PROFILE_BY_ID_QUERY,
              variables: { userId: id },
              fetchPolicy: "network-only",
            }),
          ]);
          const authProfile =
            authResult.status === "fulfilled"
              ? authResult.value.data?.getUserProfile
              : null;
          const studyProfile =
            profileResult.status === "fulfilled"
              ? profileResult.value.data?.getProfileById
              : null;
          const fallback = fallbackProfile(id);
          loadedProfiles[id] = {
            ...fallback,
            ...studyProfile,
            id,
            name: authProfile?.name || fallback.name,
            university: studyProfile?.university || authProfile?.university || "",
            academicYear:
              studyProfile?.academicYear || authProfile?.academic_year || "",
            academic_year:
              studyProfile?.academicYear || authProfile?.academic_year || "",
            courses: studyProfile?.courses || [],
            topics: studyProfile?.topics || [],
            preferences: studyProfile?.preferences || {},
          };
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
      matches
        .filter((match) => match.score >= 30)
        .map((match, index) => {
          const buddyId =
            match.userId === currentUserId ? match.matchedUserId : match.userId;
          const profile = profiles[buddyId] || fallbackProfile(buddyId);
          return {
            ...match,
            buddyId,
            profile,
            tags: buildProfileTags(profile),
            sent: sentIds.has(buddyId) || pendingIds.has(buddyId),
            connected: connectedIds.has(buddyId),
            order: index,
          };
        }),
    [connectedIds, currentUserId, matches, pendingIds, profiles, sentIds],
  );

  const filterOptions = useMemo(() => {
    const courses = [];
    const topics = [];
    const universities = [];

    decoratedMatches.forEach((match) => {
      courses.push(...getItemNames(match.profile.courses));
      topics.push(...getItemNames(match.profile.topics));
      if (match.profile.university) universities.push(match.profile.university);
    });

    return {
      courses: uniqueSorted(courses),
      topics: uniqueSorted(topics),
      universities: uniqueSorted(universities),
    };
  }, [decoratedMatches]);

  const visibleMatches = useMemo(() => {
    const filtered = decoratedMatches.filter((match) => {
      const profile = match.profile;
      const preferences = profile.preferences || {};
      const courses = getItemNames(profile.courses).map(normalizeText);
      const topics = getItemNames(profile.topics).map(normalizeText);
      const year = profile.academicYear || profile.academic_year || "";
      const universityMatch =
        !appliedFilters.university ||
        normalizeText(profile.university).includes(
          normalizeText(appliedFilters.university),
        );
      const yearMatch =
        !appliedFilters.academicYear ||
        normalizeText(year) === normalizeText(appliedFilters.academicYear);
      const courseMatch =
        appliedFilters.courses.length === 0 ||
        appliedFilters.courses.some((course) =>
          courses.includes(normalizeText(course)),
        );
      const topicMatch =
        appliedFilters.topics.length === 0 ||
        appliedFilters.topics.some((topic) =>
          topics.includes(normalizeText(topic)),
        );
      const paceMatch =
        appliedFilters.studyPace.length === 0 ||
        appliedFilters.studyPace.includes(preferences.studyPace);
      const modeMatch =
        appliedFilters.studyMode.length === 0 ||
        appliedFilters.studyMode.includes(preferences.studyMode);
      const groupMatch =
        appliedFilters.groupSize.length === 0 ||
        appliedFilters.groupSize.includes(preferences.groupSize);
      const styleMatch =
        appliedFilters.studyStyle.length === 0 ||
        appliedFilters.studyStyle.includes(preferences.studyStyle);

      return (
        universityMatch &&
        yearMatch &&
        courseMatch &&
        topicMatch &&
        paceMatch &&
        modeMatch &&
        groupMatch &&
        styleMatch
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "newest")
        return String(b.createdAt).localeCompare(String(a.createdAt));
      if (sortBy === "name")
        return a.profile.name.localeCompare(b.profile.name);
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
          ...storedRequests.filter(
            (request) => request.receiverId !== sentRequest.receiverId,
          ),
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

  const handleViewMatch = useCallback(async (match) => {
    setError("");

    if (!match?.id) {
      setError("Could not open match. Missing match information.");
      return;
    }

    try {
      navigate(`/match/${match.id}`);
    } catch (err) {
      setError(err.message || "Could not open match.");
    }
  }, []);

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
        .filter-input { margin-top: 13px; width: 100%; height: 40px; border-radius: 7px; border: 1px solid #ccd8d5; background: white; color: #111; font-size: 14px; font-weight: 700; padding: 0 11px; outline: none; }
        .filter-input::placeholder { color: #8a9693; }
        .course-select { margin-top: 13px; width: 100%; height: 40px; border-radius: 7px; border: 1px solid #ccd8d5; background: white; color: #7a8582; font-size: 14px; padding: 0 11px; }
        .multi-select { position: relative; margin-top: 13px; }
        .multi-select summary { height: 40px; border-radius: 7px; border: 1px solid #ccd8d5; background: white; color: #52605c; font-size: 14px; font-weight: 800; padding: 0 11px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; list-style: none; }
        .multi-select summary::-webkit-details-marker { display: none; }
        .multi-select summary::after { content: "v"; color: #7a8582; font-size: 12px; }
        .multi-options { position: absolute; z-index: 10; top: calc(100% + 6px); left: 0; right: 0; max-height: 240px; overflow-y: auto; border: 1px solid #ccd8d5; border-radius: 8px; background: white; box-shadow: 0 8px 18px rgba(15, 23, 42, 0.14); padding: 12px; display: grid; gap: 10px; }
        .multi-options .check-option { font-size: 13px; }
        .preference-group { margin-top: 15px; }
        .preference-label { color: #52605c; font-size: 13px; font-weight: 900; margin-bottom: 10px; }
        .preference-group .check-grid { margin-top: 0; }
        .empty-filter { color: #8a9693; font-size: 13px; font-weight: 800; }
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
        <Navbar />

        <main className="match-main">
          <section className="hero-row">
            <div className="hero-copy">
              <h1>Find Your Study Buddy</h1>
              <p>
                Showing matches based on your courses, preferences, and
                availability
              </p>
            </div>
            <img
              className="hero-art"
              src={HERO_IMAGE_URL}
              alt="Students studying together"
            />
          </section>

          <section className="content-frame">
            <div className="match-layout">
              <aside className="filters-panel">
                <div className="filters-heading">
                  <span className="filter-icon" aria-hidden="true">
                    <svg
                      width="23"
                      height="23"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 5h18" />
                      <path d="M7 12h10" />
                      <path d="M10 19h4" />
                    </svg>
                  </span>
                  <span>Filters</span>
                </div>

                <FilterBox title="Profile Details">
                  <input
                    className="filter-input"
                    type="search"
                    placeholder="University"
                    value={filters.university}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        university: event.target.value,
                      }))
                    }
                  />
                  <select
                    className="course-select"
                    value={filters.academicYear}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        academicYear: event.target.value,
                      }))
                    }
                  >
                    <option value="">Any academic year</option>
                    {ACADEMIC_YEAR_OPTIONS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </FilterBox>

                <FilterBox title="Courses">
                  <MultiSelectDropdown
                    label="Select courses"
                    options={filterOptions.courses}
                    selected={filters.courses}
                    emptyText="No courses listed"
                    onChange={(course, checked) =>
                      setFilters((current) => ({
                        ...current,
                        courses: checkboxValue(
                          current.courses,
                          course,
                          checked,
                        ),
                      }))
                    }
                  />
                </FilterBox>

                <FilterBox title="Topics">
                  <MultiSelectDropdown
                    label="Select topics"
                    options={filterOptions.topics}
                    selected={filters.topics}
                    emptyText="No topics listed"
                    onChange={(topic, checked) =>
                      setFilters((current) => ({
                        ...current,
                        topics: checkboxValue(current.topics, topic, checked),
                      }))
                    }
                  />
                </FilterBox>

                <FilterBox title="Study Preferences">
                  <div className="preference-group">
                    <div className="preference-label">Pace</div>
                    <div className="check-grid">
                      {STUDY_PACE_OPTIONS.map(([value, label]) => (
                        <CheckOption
                          key={value}
                          label={label}
                          checked={filters.studyPace.includes(value)}
                          onChange={(checked) =>
                            setFilters((current) => ({
                              ...current,
                              studyPace: checkboxValue(
                                current.studyPace,
                                value,
                                checked,
                              ),
                            }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <div className="preference-group">
                    <div className="preference-label">Mode</div>
                    <div className="check-grid">
                      {STUDY_MODE_OPTIONS.map(([value, label]) => (
                        <CheckOption
                          key={value}
                          label={label}
                          checked={filters.studyMode.includes(value)}
                          onChange={(checked) =>
                            setFilters((current) => ({
                              ...current,
                              studyMode: checkboxValue(
                                current.studyMode,
                                value,
                                checked,
                              ),
                            }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <div className="preference-group">
                    <div className="preference-label">Group Size</div>
                    <div className="check-grid">
                      {GROUP_SIZE_OPTIONS.map(([value, label]) => (
                        <CheckOption
                          key={value}
                          label={label}
                          checked={filters.groupSize.includes(value)}
                          onChange={(checked) =>
                            setFilters((current) => ({
                              ...current,
                              groupSize: checkboxValue(
                                current.groupSize,
                                value,
                                checked,
                              ),
                            }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <div className="preference-group">
                    <div className="preference-label">Study Style</div>
                    <div className="check-grid">
                      {STUDY_STYLE_OPTIONS.map(([value, label]) => (
                        <CheckOption
                          key={value}
                          label={label}
                          checked={filters.studyStyle.includes(value)}
                          onChange={(checked) =>
                            setFilters((current) => ({
                              ...current,
                              studyStyle: checkboxValue(
                                current.studyStyle,
                                value,
                                checked,
                              ),
                            }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                </FilterBox>

                <div className="filter-actions">
                  <button
                    className="apply-btn wide"
                    type="button"
                    onClick={showAllMatches}
                  >
                    Show All Matches
                  </button>
                  <button
                    className="apply-btn"
                    type="button"
                    onClick={() => setAppliedFilters(filters)}
                  >
                    Apply Filters
                  </button>
                  <button
                    className="reset-btn"
                    type="button"
                    onClick={resetFilters}
                  >
                    Reset
                  </button>
                </div>
              </aside>

              <section className="matches-panel">
                <div className="match-toolbar">
                  <div className="matches-found">
                    {visibleMatches.length} Matches Found
                  </div>
                  <label className="sort-box">
                    <span>Sort By:</span>
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                    >
                      <option value="best">Best Match</option>
                      <option value="newest">Newest</option>
                      <option value="name">Name</option>
                    </select>
                  </label>
                </div>

                {error && <div className="error-box">{error}</div>}

                {loading ? (
                  <div className="state-box">
                    Finding your strongest study matches...
                  </div>
                ) : visibleMatches.length === 0 ? (
                  <div className="state-box">
                    No matches fit these filters. Reset filters or update your
                    study profile.
                  </div>
                ) : (
                  <div className="cards-grid">
                    {visibleMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        busy={busyId === match.buddyId}
                        onSend={handleSendRequest}
                        onViewMatch={handleViewMatch}
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
