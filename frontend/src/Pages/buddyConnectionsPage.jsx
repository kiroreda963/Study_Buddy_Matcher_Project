import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gql } from "@apollo/client";
import { authClient, matchingClient } from "../clients/apolloClients.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "./Shared/Navbar.jsx";

const BUDDY_DATA_QUERY = gql`
  query BuddyConnectionsData {
    getBuddyRequests {
      id
      senderId
      receiverId
      status
      createdAt
      updatedAt
    }
    getConnections {
      id
      userId1
      userId2
      connectedAt
    }
  }
`;

const OUTGOING_REQUESTS_QUERY = gql`
  query OutgoingBuddyRequestsData {
    getOutgoingBuddyRequests {
      id
      senderId
      receiverId
      status
      createdAt
      updatedAt
    }
  }
`;

const QUERY_FIELDS_QUERY = gql`
  query QueryFields {
    __type(name: "Query") {
      fields {
        name
      }
    }
  }
`;

const GENERATE_MATCHES = gql`
  mutation GenerateMatches {
    generateMatches {
      id
      userId
      matchedUserId
      score
      reasons
    }
  }
`;

const GET_USER_MATCHES = gql`
  query BuddyConnectionMatches {
    getUserMatches {
      id
      userId
      matchedUserId
      score
      reasons
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

const ACCEPT_REQUEST = gql`
  mutation AcceptBuddyRequest($requestId: ID!) {
    acceptBuddyRequest(requestId: $requestId) {
      id
      status
    }
  }
`;

const REJECT_REQUEST = gql`
  mutation RejectBuddyRequest($requestId: ID!) {
    rejectBuddyRequest(requestId: $requestId) {
      id
      status
    }
  }
`;

const CANCEL_REQUEST = gql`
  mutation CancelBuddyRequest($requestId: ID!) {
    cancelBuddyRequest(requestId: $requestId) {
      id
      status
    }
  }
`;

const REMOVE_CONNECTION = gql`
  mutation RemoveConnection($connectedUserId: String!) {
    removeConnection(connectedUserId: $connectedUserId) {
      success
      message
    }
  }
`;

function getStoredUserId(user) {
  if (user?.id) return String(user.id);

  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    return storedUser?.id ? String(storedUser.id) : "";
  } catch {
    return "";
  }
}

function formatRelativeDate(value) {
  if (!value) return "Recently";

  const created = new Date(Number.isNaN(Number(value)) ? value : Number(value));
  if (Number.isNaN(created.getTime())) return "Recently";

  const diffMs = Date.now() - created.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / 86400000));

  if (diffDays === 0) return "Sent today";
  if (diffDays === 1) return "Sent 1 day ago";
  if (diffDays < 30) return `Sent ${diffDays} days ago`;

  return created.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function fallbackProfile(userId) {
  const suffix = String(userId || "student")
    .slice(-5)
    .toUpperCase();
  return {
    id: userId,
    name: `Study Buddy ${suffix}`,
    university: "University student",
    academic_year: "Student",
  };
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

function mergeRequests(primary, secondary) {
  const byId = new Map();
  [...primary, ...secondary].forEach((request) => {
    if (request?.id) byId.set(request.id, request);
  });
  return Array.from(byId.values()).sort((a, b) => {
    const aTime =
      new Date(
        Number.isNaN(Number(a.createdAt)) ? a.createdAt : Number(a.createdAt),
      ).getTime() || 0;
    const bTime =
      new Date(
        Number.isNaN(Number(b.createdAt)) ? b.createdAt : Number(b.createdAt),
      ).getTime() || 0;
    return bTime - aTime;
  });
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

function getOtherRequestUserId(request, currentUserId) {
  const current = String(currentUserId || "");
  if (String(request.senderId) === current) return String(request.receiverId);
  if (String(request.receiverId) === current) return String(request.senderId);
  return String(request.receiverId || request.senderId || "");
}

function newestRequest(a, b) {
  const aTime =
    new Date(
      Number.isNaN(Number(a.createdAt)) ? a.createdAt : Number(a.createdAt),
    ).getTime() || 0;
  const bTime =
    new Date(
      Number.isNaN(Number(b.createdAt)) ? b.createdAt : Number(b.createdAt),
    ).getTime() || 0;
  return aTime >= bTime ? a : b;
}

function dedupePendingRequestPairs(requests, currentUserId) {
  const byBuddy = new Map();
  requests.forEach((request) => {
    if (request.status !== "PENDING") return;
    const buddyId = getOtherRequestUserId(request, currentUserId);
    if (!buddyId || buddyId === String(currentUserId)) return;
    const existing = byBuddy.get(buddyId);
    byBuddy.set(buddyId, existing ? newestRequest(existing, request) : request);
  });
  return Array.from(byBuddy.values()).sort((a, b) => {
    const aTime =
      new Date(
        Number.isNaN(Number(a.createdAt)) ? a.createdAt : Number(a.createdAt),
      ).getTime() || 0;
    const bTime =
      new Date(
        Number.isNaN(Number(b.createdAt)) ? b.createdAt : Number(b.createdAt),
      ).getTime() || 0;
    return bTime - aTime;
  });
}

function getOtherMatchUserId(match, currentUserId) {
  const current = String(currentUserId || "");
  const userId = String(match?.userId || "");
  const matchedUserId = String(match?.matchedUserId || "");

  if (!current) return matchedUserId || userId;
  if (userId === current) return matchedUserId;
  if (matchedUserId === current) return userId;
  return matchedUserId || userId;
}

function Avatar({ profile, tone = "green" }) {
  return (
    <div className={`buddy-avatar ${tone}`} aria-hidden="true">
      {initials(profile.name)}
    </div>
  );
}

function EmptyRow({ text }) {
  return <div className="empty-row">{text}</div>;
}

export default function BuddyConnectionsPage() {
  const { user } = useAuth();
  const currentUserId = getStoredUserId(user);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState(() =>
    getStoredOutgoingRequests(currentUserId),
  );
  const [connections, setConnections] = useState([]);
  const [matches, setMatches] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [findQuery, setFindQuery] = useState("");
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [{ data }, schemaResult, matchesResult] = await Promise.all([
        matchingClient.query({
          query: BUDDY_DATA_QUERY,
          fetchPolicy: "network-only",
        }),
        matchingClient.query({
          query: QUERY_FIELDS_QUERY,
          fetchPolicy: "cache-first",
        }),
        matchingClient.query({
          query: GET_USER_MATCHES,
          fetchPolicy: "network-only",
        }),
      ]);
      const supportsOutgoingRequests = Boolean(
        schemaResult.data?.__type?.fields?.some(
          (field) => field.name === "getOutgoingBuddyRequests",
        ),
      );
      const storedOutgoing = getStoredOutgoingRequests(currentUserId);
      let backendOutgoing = [];

      if (supportsOutgoingRequests) {
        const outgoingResult = await matchingClient.query({
          query: OUTGOING_REQUESTS_QUERY,
          fetchPolicy: "network-only",
        });
        backendOutgoing = outgoingResult.data?.getOutgoingBuddyRequests || [];
      }

      const nextIncoming = data?.getBuddyRequests || [];
      const pendingRequests = dedupePendingRequestPairs(
        mergeRequests(
          nextIncoming,
          mergeRequests(backendOutgoing, storedOutgoing),
        ),
        currentUserId,
      );
      const normalizedIncoming = pendingRequests.filter(
        (request) => request.receiverId === currentUserId,
      );
      const nextOutgoing = pendingRequests.filter(
        (request) => request.senderId === currentUserId,
      );
      if (supportsOutgoingRequests) {
        storeOutgoingRequests(currentUserId, nextOutgoing);
      }

      const nextConnections = data?.getConnections || [];
      const nextMatches = matchesResult.data?.getUserMatches || [];
      setIncoming(normalizedIncoming);
      setOutgoing(nextOutgoing);
      setConnections(nextConnections);
      setMatches(nextMatches);

      const ids = new Set();
      nextIncoming.forEach((request) => {
        ids.add(request.senderId);
        ids.add(request.receiverId);
      });
      nextOutgoing.forEach((request) => {
        ids.add(request.senderId);
        ids.add(request.receiverId);
      });
      nextConnections.forEach((connection) => {
        ids.add(connection.userId1);
        ids.add(connection.userId2);
      });
      nextMatches.forEach((match) =>
        ids.add(getOtherMatchUserId(match, currentUserId)),
      );
      ids.delete(currentUserId);

      const loadedProfiles = {};
      await Promise.all(
        Array.from(ids).map(async (id) => {
          try {
            const result = await authClient.query({
              query: USER_PROFILE_QUERY,
              variables: { userId: id },
              fetchPolicy: "network-only",
            });
            loadedProfiles[id] =
              result.data?.getUserProfile || fallbackProfile(id);
          } catch {
            loadedProfiles[id] = fallbackProfile(id);
          }
        }),
      );

      setProfiles(loadedProfiles);
    } catch (err) {
      setError(err.message || "Could not load buddy requests.");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadData]);

  const incomingRequests = useMemo(
    () =>
      incoming.filter(
        (request) => request.receiverId === currentUserId || !currentUserId,
      ),
    [currentUserId, incoming],
  );

  const outgoingRequests = useMemo(
    () =>
      outgoing.filter(
        (request) => request.senderId === currentUserId || !currentUserId,
      ),
    [currentUserId, outgoing],
  );

  const myStudyBuddies = useMemo(
    () =>
      connections.map((connection) => {
        const otherId =
          connection.userId1 === currentUserId
            ? connection.userId2
            : connection.userId1;
        return {
          ...connection,
          otherId,
          matchId:
            matches.find(
              (match) => getOtherMatchUserId(match, currentUserId) === otherId,
            )?.id || "",
          profile: profiles[otherId] || fallbackProfile(otherId),
        };
      }),
    [connections, currentUserId, matches, profiles],
  );

  const outgoingReceiverIds = useMemo(
    () => new Set(outgoingRequests.map((request) => request.receiverId)),
    [outgoingRequests],
  );

  const pendingRequestUserIds = useMemo(() => {
    const ids = new Set();
    incomingRequests.forEach((request) => ids.add(String(request.senderId)));
    outgoingRequests.forEach((request) => ids.add(String(request.receiverId)));
    return ids;
  }, [incomingRequests, outgoingRequests]);

  const connectedUserIds = useMemo(
    () => new Set(myStudyBuddies.map((buddy) => buddy.otherId)),
    [myStudyBuddies],
  );

  const suggestedBuddies = useMemo(
    () =>
      matches
        .filter((match) => match.score >= 30)
        .map((match) => {
          const buddyId = getOtherMatchUserId(match, currentUserId);
          return {
            ...match,
            matchedUserId: buddyId,
            profile: profiles[buddyId] || fallbackProfile(buddyId),
            alreadySent: outgoingReceiverIds.has(buddyId),
            hasPendingRequest: pendingRequestUserIds.has(buddyId),
            alreadyConnected: connectedUserIds.has(buddyId),
          };
        })
        .filter(
          (match) =>
            match.matchedUserId !== currentUserId &&
            !match.hasPendingRequest &&
            !match.alreadyConnected,
        ),
    [
      connectedUserIds,
      currentUserId,
      matches,
      outgoingReceiverIds,
      pendingRequestUserIds,
      profiles,
    ],
  );

  const searchedBuddies = useMemo(() => {
    const query = findQuery.trim().toLowerCase();
    if (!query) return suggestedBuddies;

    return suggestedBuddies.filter((match) => {
      const haystack = [
        match.profile.name,
        match.profile.university,
        match.profile.academic_year,
        ...(match.reasons || []),
        `${Math.round(match.score)}%`,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [findQuery, suggestedBuddies]);

  const visible = (filter) => activeFilter === "all" || activeFilter === filter;

  const handleRequestAction = async (requestId, mutation) => {
    setBusyId(requestId);
    setError("");

    try {
      await matchingClient.mutate({
        mutation,
        variables: { requestId },
      });
      await loadData();
    } catch (err) {
      setError(err.message || "Action failed. Please try again.");
    } finally {
      setBusyId("");
    }
  };

  const handleCancelOutgoingRequest = async (requestId) => {
    setBusyId(requestId);
    setError("");

    try {
      await matchingClient.mutate({
        mutation: CANCEL_REQUEST,
        variables: { requestId },
      });
      const nextStoredRequests = getStoredOutgoingRequests(
        currentUserId,
      ).filter((request) => request.id !== requestId);
      storeOutgoingRequests(currentUserId, nextStoredRequests);
      setOutgoing(nextStoredRequests);
      await loadData();
    } catch (err) {
      setError(err.message || "Could not cancel buddy request.");
    } finally {
      setBusyId("");
    }
  };

  const handleRemoveConnection = async (connectedUserId) => {
    setBusyId(`connection-${connectedUserId}`);
    setError("");

    try {
      const { data } = await matchingClient.mutate({
        mutation: REMOVE_CONNECTION,
        variables: { connectedUserId },
      });

      if (data?.removeConnection?.success === false) {
        throw new Error(
          data.removeConnection.message || "Could not remove connection.",
        );
      }

      await loadData();
    } catch (err) {
      setError(err.message || "Could not remove connection.");
    } finally {
      setBusyId("");
    }
  };

  const handleFindBuddies = async () => {
    setActiveFilter("find");
    setFinding(true);
    setError("");

    try {
      const { data } = await matchingClient.mutate({
        mutation: GENERATE_MATCHES,
      });
      const nextMatches = data?.generateMatches || [];
      setMatches(nextMatches);

      const ids = nextMatches
        .map((match) => getOtherMatchUserId(match, currentUserId))
        .filter(Boolean);
      const loadedProfiles = {};
      await Promise.all(
        ids.map(async (id) => {
          if (profiles[id]) return;
          try {
            const result = await authClient.query({
              query: USER_PROFILE_QUERY,
              variables: { userId: id },
              fetchPolicy: "network-only",
            });
            loadedProfiles[id] =
              result.data?.getUserProfile || fallbackProfile(id);
          } catch {
            loadedProfiles[id] = fallbackProfile(id);
          }
        }),
      );
      if (Object.keys(loadedProfiles).length > 0) {
        setProfiles((current) => ({ ...current, ...loadedProfiles }));
      }
    } catch (err) {
      setError(err.message || "Could not find study buddies.");
    } finally {
      setFinding(false);
    }
  };

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
            (request) =>
              request.id !== sentRequest.id &&
              request.receiverId !== sentRequest.receiverId,
          ),
        ];
        storeOutgoingRequests(currentUserId, nextStoredRequests);
        setOutgoing(nextStoredRequests);
      }
      await loadData();
      setActiveFilter("outgoing");
    } catch (err) {
      setError(err.message || "Could not send buddy request.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; font-family: 'Nunito', sans-serif; background: #f4f8f7; color: #151515; }
        button, input { font-family: inherit; }

        .connections-page { min-height: 100vh; display: flex; flex-direction: column; background: #f4f8f7; }
        .site-header {
          height: 58px; display: flex; align-items: center; justify-content: space-between;
          padding: 0 34px; background: #f4f8f7;
        }
        .brand-link { color: #4fc59a; font-size: 35px; font-weight: 800; text-decoration: none; line-height: 1; }
        .header-nav { display: flex; align-items: center; gap: 31px; margin-left: auto; }
        .header-nav a { color: #9aa3a0; font-size: 11px; font-weight: 700; text-decoration: none; }
        .header-actions { display: flex; align-items: center; gap: 14px; margin-left: 25px; }
        .icon-button { position: relative; border: 0; background: transparent; color: #1c1c1c; padding: 0; cursor: pointer; display: grid; place-items: center; }
        .notification-dot {
          position: absolute; top: -6px; right: -5px; width: 15px; height: 15px; border-radius: 50%;
          background: #55c7a0; color: white; font-size: 9px; font-weight: 800; display: grid; place-items: center;
        }
        .profile-circle { width: 51px; height: 51px; border-radius: 50%; background: #eff1ef; border: 1px solid #d7ddd9; display: grid; place-items: center; }

        .connections-main { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 6px 18px 56px; }
        .page-title { font-size: 28px; font-weight: 800; margin: 2px 0 7px; letter-spacing: 0; }
        .page-subtitle { color: #9ba4a2; font-size: 15px; font-weight: 700; margin: 0 0 28px; text-align: center; }
        .request-shell { width: min(680px, 100%); }
        .status-pills { display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px; margin-bottom: 11px; align-items: center; }
        .pill {
          height: 19px; border-radius: 999px; border: 1px solid #202020; background: #f8fbfa; color: #111;
          font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .pill.green, .pill.active { background: #55c7a0; border-color: #55c7a0; color: #fff; }

        .panel {
          border: 1px solid #cddfdd; background: #fbfefd; margin-bottom: 17px; min-height: 62px;
        }
        .panel-header {
          display: flex; align-items: center; justify-content: space-between; padding: 9px 13px 8px;
          border-bottom: 1px solid #e6efee;
        }
        .panel-title { margin: 0; font-size: 13px; font-weight: 800; color: #111; }
        .show-more { border: 0; background: transparent; color: #95a09d; font-size: 9px; font-weight: 700; cursor: pointer; }
        .person-row {
          min-height: 58px; display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: center;
          padding: 8px 17px 9px 13px; border-top: 1px solid #e8efee;
        }
        .person-row:first-of-type { border-top: 0; }
        .person-info { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .buddy-avatar {
          width: 26px; height: 26px; border-radius: 50%; color: white; font-size: 9px; font-weight: 800;
          display: grid; place-items: center; flex: 0 0 auto;
        }
        .buddy-avatar.green { background: linear-gradient(135deg, #4fc59a, #1cae84); }
        .buddy-avatar.red { background: linear-gradient(135deg, #ff6262, #fa2f52); }
        .buddy-avatar.yellow { background: linear-gradient(135deg, #ffd15a, #ff9f43); }
        .person-name { font-size: 13px; font-weight: 800; color: #111; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .person-meta { color: #1b1b1b; font-size: 9px; font-weight: 700; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .row-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
        .request-age { color: #a1aaa8; font-size: 8px; font-weight: 800; }
        .button-pair { display: flex; align-items: center; gap: 8px; }
        .small-btn {
          min-width: 66px; height: 20px; border-radius: 999px; border: 1px solid #111; background: #fff;
          color: #1d1d1d; font-size: 8px; font-weight: 800; cursor: pointer;
        }
        .small-btn.primary { background: #55c7a0; border-color: #55c7a0; color: #fff; }
        .small-btn.danger { background: #fff; border-color: #ef4444; color: #ef4444; }
        .small-btn:disabled { opacity: 0.6; cursor: progress; }
        .empty-row { padding: 16px 13px; color: #95a09d; font-size: 11px; font-weight: 700; }
        .match-reasons { color: #7b8784; font-size: 9px; font-weight: 700; margin-top: 4px; max-width: 390px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .buddy-search { padding: 10px 13px; border-bottom: 1px solid #e6efee; }
        .buddy-search input {
          width: 100%; height: 32px; border: 1px solid #cddfdd; border-radius: 999px; outline: none;
          background: #fff; color: #111; padding: 0 13px; font-size: 12px; font-weight: 700;
        }
        .buddy-search input:focus { border-color: #55c7a0; box-shadow: 0 0 0 3px rgba(85, 199, 160, 0.12); }
        .buddy-search input::placeholder { color: #9ba4a2; }
        .error-box {
          width: min(680px, 100%); margin-bottom: 14px; padding: 10px 14px; border: 1px solid #fecaca;
          border-radius: 8px; background: #fef2f2; color: #b91c1c; font-size: 12px; font-weight: 700;
        }
        .loading-box { width: min(680px, 100%); color: #95a09d; font-size: 13px; font-weight: 800; text-align: center; padding: 32px 0; }

        .site-footer { background: #2f3b4f; color: #f8fafc; padding: 84px 45px 27px; }
        .footer-grid {
          display: grid; grid-template-columns: minmax(260px, 1.5fr) 0.5fr 0.65fr 0.5fr; gap: 42px;
          max-width: 1140px; margin: 0 auto;
        }
        .footer-headline { margin: 0 0 18px; font-size: 41px; font-weight: 800; line-height: 1.05; }
        .footer-copy { max-width: 350px; color: #c2cbd7; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
        .quote-mark { color: #f4f7fb; font-size: 52px; font-weight: 800; height: 35px; margin-bottom: 30px; }
        .quote { color: #c2cbd7; max-width: 360px; font-size: 13px; line-height: 1.6; margin: 0 0 14px; }
        .quote-author { color: #e2e8f0; font-size: 12px; margin-bottom: 30px; }
        .review-avatars { display: flex; align-items: center; gap: 17px; }
        .review-avatar { width: 45px; height: 45px; border-radius: 50%; background: #d7dee8; border: 2px solid rgba(255,255,255,0.45); }
        .play-btn { width: 49px; height: 49px; border-radius: 50%; border: 2px solid #fff; background: transparent; color: #fff; display: grid; place-items: center; }
        .footer-col h3 { margin: 0 0 22px; font-size: 12px; font-weight: 800; color: #fff; }
        .footer-col a { display: block; color: #c2cbd7; text-decoration: none; font-size: 13px; margin-bottom: 17px; }
        .newsletter { align-self: end; margin-top: 18px; }
        .newsletter-title { color: #55c7a0; font-size: 40px; font-weight: 800; margin: 0 0 10px; }
        .newsletter p { color: #c2cbd7; margin: 0 0 22px; font-size: 13px; }
        .email-form { width: min(368px, 100%); height: 39px; border-radius: 999px; border: 1px solid #fff; display: flex; align-items: center; padding-left: 17px; }
        .email-form input { flex: 1; min-width: 0; border: 0; outline: 0; color: #fff; background: transparent; font-size: 12px; }
        .email-form input::placeholder { color: #c7d0dc; }
        .send-btn { width: 34px; height: 34px; border: 0; border-radius: 50%; background: #55c7a0; color: #fff; font-size: 22px; display: grid; place-items: center; margin-right: 2px; cursor: pointer; }
        .footer-bottom { max-width: 1140px; margin: 58px auto 0; display: flex; align-items: center; justify-content: space-between; color: #fff; font-size: 12px; }
        .legal-links { display: flex; gap: 72px; }

        @media (max-width: 760px) {
          .site-header { height: auto; padding: 18px; flex-wrap: wrap; gap: 16px; }
          .brand-link { font-size: 29px; }
          .header-nav { order: 3; width: 100%; gap: 16px; overflow-x: auto; }
          .header-actions { margin-left: auto; }
          .status-pills { gap: 8px; }
          .person-row { grid-template-columns: 1fr; }
          .row-actions { align-items: flex-start; }
          .footer-grid { grid-template-columns: 1fr; }
          .footer-headline, .newsletter-title { font-size: 31px; }
          .footer-bottom { align-items: flex-start; flex-direction: column; gap: 18px; }
          .legal-links { gap: 26px; }
        }
      `}</style>

      <div className="connections-page">
        <Navbar />

        <main className="connections-main">
          <h1 className="page-title">Buddy Requests and Connections</h1>
          <p className="page-subtitle">
            Manage your incoming and outgoing study buddy requests, as well as
            your active connections
          </p>

          <div className="request-shell">
            <div className="status-pills" aria-label="Connection summary">
              <button
                className={`pill${activeFilter === "incoming" ? " active" : ""}`}
                type="button"
                onClick={() => setActiveFilter("incoming")}
              >
                Incoming ({incomingRequests.length})
              </button>
              <button
                className={`pill${activeFilter === "outgoing" ? " active" : ""}`}
                type="button"
                onClick={() => setActiveFilter("outgoing")}
              >
                Outgoing ({outgoingRequests.length})
              </button>
              <button
                className={`pill${activeFilter === "buddies" ? " active" : ""}`}
                type="button"
                onClick={() => setActiveFilter("buddies")}
              >
                My Study Buddies
              </button>
              <button
                className={`pill green${activeFilter === "find" ? " active" : ""}`}
                type="button"
                onClick={handleFindBuddies}
                disabled={finding}
              >
                {finding ? "Finding..." : "Find Buddies"}
              </button>
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}
          {loading ? (
            <div className="loading-box">Loading buddy requests...</div>
          ) : (
            <section
              className="request-shell"
              aria-label="Buddy requests and connections"
            >
              {visible("incoming") && (
                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">Incoming Requests</h2>
                    <button
                      className="show-more"
                      type="button"
                      onClick={() => setActiveFilter("all")}
                    >
                      Show More
                    </button>
                  </div>
                  {incomingRequests.length === 0 ? (
                    <EmptyRow text="No incoming buddy requests yet." />
                  ) : (
                    incomingRequests.map((request, index) => {
                      const profile =
                        profiles[request.senderId] ||
                        fallbackProfile(request.senderId);
                      return (
                        <div className="person-row" key={request.id}>
                          <div className="person-info">
                            <Avatar
                              profile={profile}
                              tone={index % 2 === 0 ? "red" : "yellow"}
                            />
                            <div>
                              <div className="person-name">{profile.name}</div>
                              <div className="person-meta">
                                {profile.university ||
                                  profile.academic_year ||
                                  "Study buddy"}
                              </div>
                            </div>
                          </div>
                          <div className="row-actions">
                            <span className="request-age">
                              {formatRelativeDate(request.createdAt)}
                            </span>
                            <div className="button-pair">
                              <button
                                className="small-btn primary"
                                type="button"
                                disabled={busyId === request.id}
                                onClick={() =>
                                  handleRequestAction(
                                    request.id,
                                    ACCEPT_REQUEST,
                                  )
                                }
                              >
                                Accept
                              </button>
                              <button
                                className="small-btn"
                                type="button"
                                disabled={busyId === request.id}
                                onClick={() =>
                                  handleRequestAction(
                                    request.id,
                                    REJECT_REQUEST,
                                  )
                                }
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {visible("outgoing") && (
                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">Outgoing Requests</h2>
                    <button
                      className="show-more"
                      type="button"
                      onClick={() => setActiveFilter("all")}
                    >
                      Show More
                    </button>
                  </div>
                  {outgoingRequests.length === 0 ? (
                    <EmptyRow text="No outgoing requests yet. Use Find Buddies to send one." />
                  ) : (
                    outgoingRequests.map((request) => {
                      const profile =
                        profiles[request.receiverId] ||
                        fallbackProfile(request.receiverId);
                      return (
                        <div className="person-row" key={request.id}>
                          <div className="person-info">
                            <Avatar profile={profile} tone="yellow" />
                            <div>
                              <div className="person-name">{profile.name}</div>
                              <div className="person-meta">
                                {profile.university ||
                                  profile.academic_year ||
                                  "Study buddy"}
                              </div>
                            </div>
                          </div>
                          <div className="row-actions">
                            <span className="request-age">
                              {formatRelativeDate(request.createdAt)}
                            </span>
                            <div className="button-pair">
                              <button
                                className="small-btn"
                                type="button"
                                disabled
                              >
                                Pending
                              </button>
                              <button
                                className="small-btn"
                                type="button"
                                disabled={busyId === request.id}
                                onClick={() =>
                                  handleCancelOutgoingRequest(request.id)
                                }
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {visible("buddies") && (
                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">My Study Buddies</h2>
                    <button
                      className="show-more"
                      type="button"
                      onClick={() => setActiveFilter("all")}
                    >
                      Show More
                    </button>
                  </div>
                  {myStudyBuddies.length === 0 ? (
                    <EmptyRow text="Accepted connections will appear here." />
                  ) : (
                    myStudyBuddies.map((buddy, index) => (
                      <div className="person-row" key={buddy.id}>
                        <div className="person-info">
                          <Avatar
                            profile={buddy.profile}
                            tone={index % 2 === 0 ? "yellow" : "red"}
                          />
                          <div>
                            <div className="person-name">
                              {buddy.profile.name}
                            </div>
                            <div className="person-meta">
                              {buddy.profile.university ||
                                buddy.profile.academic_year ||
                                "Study buddy"}
                            </div>
                          </div>
                        </div>
                        <div className="row-actions">
                          <div className="button-pair">
                            <button
                              className="small-btn primary"
                              type="button"
                              disabled={!buddy.matchId}
                              onClick={() =>
                                navigate(`/match/${buddy.matchId}`)
                              }
                            >
                              {buddy.matchId ? "View Profile" : "No Match"}
                            </button>
                            <button
                              className="small-btn danger"
                              type="button"
                              disabled={
                                busyId === `connection-${buddy.otherId}`
                              }
                              onClick={() =>
                                handleRemoveConnection(buddy.otherId)
                              }
                            >
                              {busyId === `connection-${buddy.otherId}`
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {visible("find") && (
                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">Find Buddies</h2>
                    <button
                      className="show-more"
                      type="button"
                      onClick={handleFindBuddies}
                      disabled={finding}
                    >
                      Refresh
                    </button>
                  </div>
                  <div className="buddy-search">
                    <input
                      type="search"
                      value={findQuery}
                      onChange={(event) => setFindQuery(event.target.value)}
                      placeholder="Search buddies by name, university, score, or match reason"
                      aria-label="Search study buddies"
                    />
                  </div>
                  {finding ? (
                    <EmptyRow text="Finding compatible study buddies..." />
                  ) : suggestedBuddies.length === 0 ? (
                    <EmptyRow text="Click Find Buddies to generate matches of 30% or higher." />
                  ) : searchedBuddies.length === 0 ? (
                    <EmptyRow text="No buddies match your search." />
                  ) : (
                    searchedBuddies.map((match, index) => (
                      <div className="person-row" key={match.id}>
                        <div className="person-info">
                          <Avatar
                            profile={match.profile}
                            tone={index % 2 === 0 ? "green" : "yellow"}
                          />
                          <div>
                            <div className="person-name">
                              {match.profile.name}
                            </div>
                            <div className="person-meta">
                              {match.profile.university ||
                                match.profile.academic_year ||
                                "Study buddy"}{" "}
                              · {Math.round(match.score)}% match
                            </div>
                            {match.reasons?.length > 0 && (
                              <div className="match-reasons">
                                {match.reasons.join(", ")}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="row-actions">
                          <div className="button-pair">
                            <button
                              className="small-btn primary"
                              type="button"
                              disabled={
                                busyId === match.matchedUserId ||
                                match.alreadySent ||
                                match.alreadyConnected
                              }
                              onClick={() =>
                                handleSendRequest(match.matchedUserId)
                              }
                            >
                              {match.alreadyConnected
                                ? "Connected"
                                : match.alreadySent
                                  ? "Sent"
                                  : "Send"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>
          )}
        </main>

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
                This app completely changed how I study. I found a study partner
                in minutes and now I am more consistent than ever!
              </p>
              <div className="quote-author">- Aria Zinarino</div>
              <div className="review-avatars" aria-hidden="true">
                <span className="review-avatar" />
                <span className="review-avatar" />
                <span className="review-avatar" />
                <span className="review-avatar" />
                <button
                  className="play-btn"
                  type="button"
                  aria-label="Play testimonial"
                >
                  ▶
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
            <section style={{ gridColumn: "span 2" }}>
              <h2 className="newsletter-title">Study Together</h2>
              <p>Get news about our new features</p>
              <form className="email-form">
                <input
                  type="email"
                  placeholder="Enter your email here"
                  aria-label="Email address"
                />
                <button
                  className="send-btn"
                  type="submit"
                  aria-label="Subscribe"
                >
                  ›
                </button>
              </form>
            </section>
          </div>

          <div className="footer-bottom">
            <span>
              © 2026 Study Together Inc. Copyright and rights reserved
            </span>
            <div className="legal-links">
              <a>Terms and Conditions</a>
              <a>Privacy Policy</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
