import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { availabilityClient, notificationClient } from "../clients/apolloClients.jsx";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month, year) {
  return new Date(year, month, 1).getDay();
}

function formatDayHeader(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

const GET_AVAILABILITY = gql`
  query GetAvailabilityByUser {
    getAvailabilityByUser {
      id
      startTime
      endTime
    }
  }
`;

const CREATE_AVAILABILITY = gql`
  mutation CreateAvailability($input: AvailabilityInput!) {
    createAvailability(input: $input) {
      success
      message
      slot {
        id
        startTime
        endTime
      }
    }
  }
`;

const UPDATE_AVAILABILITY = gql`
  mutation UpdateAvailability($id: ID!, $input: UpdateAvailabilityInput!) {
    updateAvailability(id: $id, input: $input) {
      success
      message
      slot {
        id
        startTime
        endTime
      }
    }
  }
`;

const DELETE_AVAILABILITY = gql`
  mutation DeleteAvailability($id: ID!) {
    deleteAvailability(id: $id) {
      success
      message
    }
  }
`;

const GET_NOTIFICATIONS_BADGE = gql`
  query GetNotificationsBadge {
    getNotifications {
      id
      isRead
    }
  }
`;

const GREEN = "#3fcf8e";
const LIGHT_GREEN_BG = "#f0faf5";
const GRAY_BORDER = "#e0e0e0";
const TEXT_MAIN = "#1a1a1a";
const TEXT_MUTED = "#888";

const SLOT_ICON_BTN = {
  width: 48,
  height: 48,
  background: "#fafafa",
  border: "none",
  borderRadius: 9,
  padding: 0,
  margin: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  boxSizing: "border-box",
};

const SLOT_ICON_INNER = {
  width: 31,
  height: 31,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const SLOT_ICON_IMG = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  objectPosition: "center",
  display: "block",
  flexShrink: 0,
};

export default function App() {
  const today = new Date();
  const todayDateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(GET_AVAILABILITY, {
    client: availabilityClient,
    fetchPolicy: "cache-and-network",
  });
  const [createAvailability] = useMutation(CREATE_AVAILABILITY, { client: availabilityClient });
  const [updateAvailability] = useMutation(UPDATE_AVAILABILITY, { client: availabilityClient });
  const [deleteAvailability] = useMutation(DELETE_AVAILABILITY, { client: availabilityClient });
  const { data: notificationData } = useQuery(GET_NOTIFICATIONS_BADGE, {
    client: notificationClient,
    fetchPolicy: "cache-and-network",
  });
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(todayDateKey);
  const [noAvailDates] = useState(["2025-09-05"]);
  const [draftSlots, setDraftSlots] = useState([]);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStart, setNewStart] = useState("09:00 AM");
  const [newEnd, setNewEnd] = useState("10:00 AM");
  const [mutationError, setMutationError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSavingChanges, setIsSavingChanges] = useState(false);

  const daysInMonth = getDaysInMonth(viewMonth, viewYear);
  const firstDay = getFirstDayOfMonth(viewMonth, viewYear);
  const unreadCount = (notificationData?.getNotifications ?? []).filter((n) => !n.isRead).length;

  const serverSlots = useMemo(() => {
    const slots = data?.getAvailabilityByUser ?? [];
    return slots.map((s) => ({
      id: s.id,
      startIso: s.startTime,
      endIso: s.endTime,
      start: isoToTime12(s.startTime),
      end: isoToTime12(s.endTime),
    }));
  }, [data]);

  useEffect(() => {
    if (!hasPendingChanges) {
      setDraftSlots(serverSlots);
    }
  }, [serverSlots, hasPendingChanges]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function dateKey(day) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function isSelected(day) { return dateKey(day) === selectedDate; }
  function isToday(day) {
    const t = new Date();
    return t.getFullYear() === viewYear && t.getMonth() === viewMonth && t.getDate() === day;
  }
  function isNoAvail(day) { return noAvailDates.includes(dateKey(day)); }

  function handleDayClick(day) {
    setSelectedDate(dateKey(day));
    setMutationError("");
  }

  async function deleteSlot(id) {
    setMutationError("");
    setSaveMessage("");
    setDraftSlots((prev) => prev.filter((slot) => slot.id !== id));
    setHasPendingChanges(true);
  }

  async function addSlot() {
    try {
      setMutationError("");
      setSaveMessage("");
      const startIso = timeOnSelectedDateToIso(selectedDate, to24(newStart));
      const endIso = timeOnSelectedDateToIso(selectedDate, to24(newEnd));
      setDraftSlots((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          startIso,
          endIso,
          start: isoToTime12(startIso),
          end: isoToTime12(endIso),
        },
      ]);
      setHasPendingChanges(true);
      setShowAddModal(false);
    } catch (err) {
      setMutationError(getMutationErrorMessage(err, "Could not create availability slot."));
    }
  }

  async function saveEditedSlot() {
    if (!editingSlot) return;

    try {
      setMutationError("");
      setSaveMessage("");
      const startIso = timeOnSelectedDateToIso(selectedDate, to24(newStart));
      const endIso = timeOnSelectedDateToIso(selectedDate, to24(newEnd));
      setDraftSlots((prev) =>
        prev.map((slot) =>
          slot.id === editingSlot.id
            ? {
                ...slot,
                startIso,
                endIso,
                start: isoToTime12(startIso),
                end: isoToTime12(endIso),
              }
            : slot
        )
      );
      setHasPendingChanges(true);
      setEditingSlot(null);
      setShowAddModal(false);
    } catch (err) {
      setMutationError(getMutationErrorMessage(err, "Could not update availability slot."));
    }
  }

  const currentSlots = useMemo(() => {
    return draftSlots.filter((s) => slotMatchesSelectedDate(s.startIso, selectedDate));
  }, [draftSlots, selectedDate]);

  async function saveAllChanges() {
    setMutationError("");
    setSaveMessage("");
    setIsSavingChanges(true);

    try {
      const originalById = new Map(serverSlots.map((slot) => [slot.id, slot]));
      const draftPersistentSlots = draftSlots.filter((slot) => !String(slot.id).startsWith("temp-"));
      const draftById = new Map(draftPersistentSlots.map((slot) => [slot.id, slot]));

      const deletedSlots = serverSlots.filter((slot) => !draftById.has(slot.id));
      const createdSlots = draftSlots.filter((slot) => String(slot.id).startsWith("temp-"));
      const updatedSlots = draftPersistentSlots.filter((slot) => {
        const original = originalById.get(slot.id);
        return original && (original.startIso !== slot.startIso || original.endIso !== slot.endIso);
      });

      for (const slot of deletedSlots) {
        const result = await deleteAvailability({ variables: { id: slot.id } });
        const response = result?.data?.deleteAvailability;
        if (!response?.success) {
          throw new Error(response?.message || "Could not delete availability slot.");
        }
      }

      for (const slot of updatedSlots) {
        const result = await updateAvailability({
          variables: {
            id: slot.id,
            input: { startTime: slot.startIso, endTime: slot.endIso },
          },
        });
        const response = result?.data?.updateAvailability;
        if (!response?.success) {
          throw new Error(response?.message || "Could not update availability slot.");
        }
      }

      for (const slot of createdSlots) {
        const result = await createAvailability({
          variables: {
            input: { startTime: slot.startIso, endTime: slot.endIso },
          },
        });
        const response = result?.data?.createAvailability;
        if (!response?.success) {
          throw new Error(response?.message || "Could not create availability slot.");
        }
      }

      setHasPendingChanges(false);
      await refetch();
      setSaveMessage("Changes saved successfully");
    } catch (err) {
      setMutationError(getMutationErrorMessage(err, "Could not save availability changes."));
    } finally {
      setIsSavingChanges(false);
    }
  }

  function cancelAllChanges() {
    setMutationError("");
    setSaveMessage("");
    setDraftSlots(serverSlots);
    setHasPendingChanges(false);
    setEditingSlot(null);
    setShowAddModal(false);
  }

  // Calendar grid
  const calCells = [];
  // Previous month padding
  const prevMonthDays = getDaysInMonth(viewMonth === 0 ? 11 : viewMonth - 1, viewMonth === 0 ? viewYear - 1 : viewYear);
  for (let i = firstDay - 1; i >= 0; i--) {
    calCells.push({ day: prevMonthDays - i, current: false, type: "prev" });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calCells.push({ day: d, current: true });
  }
  const remaining = 42 - calCells.length;
  for (let d = 1; d <= remaining; d++) {
    calCells.push({ day: d, current: false, type: "next" });
  }

  return (
    <div style={{ minHeight: "100vh", background: LIGHT_GREEN_BG, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
      {/* Navbar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 64, background: "#fff",
        borderBottom: `1px solid ${GRAY_BORDER}`, position: "sticky", top: 0, zIndex: 100
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: GREEN, letterSpacing: -0.5 }}>Learn Together</span>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {["Home","Dashboard","Matches","Study Sessions","About Us"].map(n => (
            <span key={n} style={{ fontSize: 14, color: "#555", cursor: "pointer", fontWeight: 500 }}
              onMouseEnter={e => e.target.style.color = GREEN}
              onMouseLeave={e => e.target.style.color = "#555"}>
              {n}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0, lineHeight: 0 }}>
          <div
            style={{
              position: "relative",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              flexShrink: 0,
              boxSizing: "border-box",
            }}
            onClick={() => navigate("/notifications")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/notifications");
            }}
            aria-label="Open notifications"
          >
            <img
              src="/bell_icon.svg"
              alt="Notifications"
              style={{ width: 36, height: 36, objectFit: "contain", display: "block" }}
            />
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

      {/* Main */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        {error && (
          <div style={{ background: "#fff", border: `1.5px solid ${GRAY_BORDER}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontWeight: 800, color: TEXT_MAIN, marginBottom: 4 }}>Couldn’t load availability</div>
            <div style={{ color: TEXT_MUTED, fontSize: 13 }}>{String(error.message || error)}</div>
          </div>
        )}
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: TEXT_MAIN }}>Set Your Study Availability</h1>
            <p style={{ color: TEXT_MUTED, marginTop: 8, fontSize: 15 }}>
              Choose the days and times when you are available to study with others.
            </p>
          </div>
          {/* Illustration */}
          <div>
            <img
              src="/image22861-u0ah.png"
              alt="Students studying together"
              style={{ width: 220, height: "auto", objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Two-panel card */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0,
          background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          overflow: "hidden"
        }}>
          {/* LEFT: Calendar */}
          <div style={{ padding: "32px 28px", borderRight: `1px solid ${GRAY_BORDER}` }}>
            <div style={{ textAlign: "center", marginBottom: 20, fontWeight: 600, fontSize: 16 }}>Select Date</div>

            {/* Month/Year controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, justifyContent: "center" }}>
              <button onClick={prevMonth} style={navBtnStyle}>‹</button>
              <select value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))}
                style={selectStyle}>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))}
                style={selectStyle}>
                {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button onClick={nextMonth} style={navBtnStyle}>›</button>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: 8 }}>
              {DAY_LABELS.map(d => (
                <div key={d} style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, padding: "4px 0" }}>{d}</div>
              ))}
            </div>

            {/* Calendar days */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {calCells.map((cell, i) => {
                const isCurr = cell.current;
                const sel = isCurr && isSelected(cell.day);
                const tod = isCurr && isToday(cell.day);
                const noAv = isCurr && isNoAvail(cell.day);
                return (
                  <button key={i} onClick={() => isCurr && handleDayClick(cell.day)}
                    style={{
                      width: "100%", aspectRatio: "1", border: "none",
                      borderRadius: "50%", fontSize: 14, fontWeight: 600,
                      cursor: isCurr ? "pointer" : "default",
                      background: sel ? GREEN : "transparent",
                      color: sel ? "#fff" : noAv ? "#bbb" : !isCurr ? "#ccc" : TEXT_MAIN,
                      outline: tod && !sel ? `2px solid ${GREEN}` : "none",
                      position: "relative",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { if (isCurr && !sel) e.currentTarget.style.background = "#e6f9f0"; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}
                  >
                    {cell.day}
                    {noAv && (
                      <span style={{
                        position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)",
                        width: 5, height: 5, borderRadius: "50%", background: "#ccc", display: "block"
                      }} />
                    )}
                  </button>
                );
              })}
            </div>

          </div>

          {/* RIGHT: Time Slots */}
          <div style={{ padding: "32px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: TEXT_MAIN }}>Available Time Slots</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: GREEN }}>
              {selectedDate ? formatDayHeader(selectedDate + "T12:00:00") : "Select a date"}
            </div>
            {hasPendingChanges && (
              <div style={{ fontSize: 13, color: "#b45309", fontWeight: 700 }}>
                You have unsaved changes.
              </div>
            )}
            {saveMessage && (
              <div style={{ fontSize: 13, color: "#166534", fontWeight: 700 }}>
                {saveMessage}
              </div>
            )}
            {mutationError && (
              <div
                style={{
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "10px 12px",
                }}
                role="alert"
              >
                {mutationError}
              </div>
            )}

            {/* Add Time Slot Button */}
            <button onClick={() => { setMutationError(""); setShowAddModal(true); }} style={{
              background: GREEN, color: "#fff", border: "none", borderRadius: 10,
              padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", transition: "opacity 0.15s"
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <span style={{ fontSize: 18, fontWeight: 900 }}>+</span> Add Time Slot
            </button>

            {/* Time Slot List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {currentSlots.length === 0 && (
                <div style={{ color: TEXT_MUTED, fontSize: 14, textAlign: "center", padding: 16 }}>
                  {loading ? "Loading..." : "No time slots added yet."}
                </div>
              )}
              {currentSlots.map(slot => (
                <div key={slot.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  border: `1.5px solid ${GRAY_BORDER}`, borderRadius: 10, padding: "12px 16px",
                  background: "#fafafa"
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_MAIN }}>
                    {slot.start} - {slot.end}
                  </span>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <button onClick={() => { setMutationError(""); setEditingSlot(slot); setNewStart(slot.start); setNewEnd(slot.end); setShowAddModal(true); }}
                      type="button"
                      style={{ ...SLOT_ICON_BTN, cursor: "pointer" }}
                      aria-label="Edit slot"
                    >
                      <span style={SLOT_ICON_INNER}>
                        <img src="/edit_button.svg" alt="" style={SLOT_ICON_IMG} />
                      </span>
                    </button>
                    <button disabled={isSavingChanges} onClick={() => deleteSlot(slot.id)}
                      type="button"
                      style={{
                        ...SLOT_ICON_BTN,
                        cursor: isSavingChanges ? "not-allowed" : "pointer",
                        opacity: isSavingChanges ? 0.45 : 1,
                      }}
                      aria-label="Delete slot"
                    >
                      <span style={SLOT_ICON_INNER}>
                        <img src="/delete_button.svg" alt="" style={SLOT_ICON_IMG} />
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button onClick={cancelAllChanges} disabled={isSavingChanges || !hasPendingChanges} style={{
                flex: 1, padding: "13px 0", borderRadius: 10, border: `1.5px solid ${GRAY_BORDER}`,
                background: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", color: TEXT_MAIN,
                opacity: isSavingChanges || !hasPendingChanges ? 0.6 : 1
              }}>Cancel</button>
              <button onClick={saveAllChanges} disabled={isSavingChanges || !hasPendingChanges} style={{
                flex: 1, padding: "13px 0", borderRadius: 10, border: "none",
                background: GREEN, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
                opacity: isSavingChanges || !hasPendingChanges ? 0.6 : 1
              }}>{isSavingChanges ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Time Slot Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999
        }} onClick={() => { setShowAddModal(false); setEditingSlot(null); setMutationError(""); }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 32, minWidth: 320,
            boxShadow: "0 8px 40px rgba(0,0,0,0.15)"
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 20px", fontWeight: 800 }}>{editingSlot ? "Edit Time Slot" : "Add Time Slot"}</h3>
            {mutationError && (
              <div style={{
                marginBottom: 14,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                padding: "10px 12px",
              }}>
                {mutationError}
              </div>
            )}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: TEXT_MUTED }}>Start</label>
                <input type="time" value={to24(newStart)} onChange={e => setNewStart(to12(e.target.value))}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${GRAY_BORDER}`, fontSize: 14 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: TEXT_MUTED }}>End</label>
                <input type="time" value={to24(newEnd)} onChange={e => setNewEnd(to12(e.target.value))}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${GRAY_BORDER}`, fontSize: 14 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowAddModal(false); setEditingSlot(null); setMutationError(""); }}
                style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: `1.5px solid ${GRAY_BORDER}`, background: "#fff", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={editingSlot ? saveEditedSlot : addSlot} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "none", background: GREEN, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                {editingSlot ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers for time conversion
function to24(time12) {
  if (!time12) return "09:00";
  const [time, modifier] = time12.split(" ");
  let [hours, minutes] = time.split(":");
  if (hours === "12") hours = "00";
  if (modifier === "PM") hours = String(parseInt(hours, 10) + 12);
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}
function to12(time24) {
  if (!time24) return "09:00 AM";
  let [hours, minutes] = time24.split(":");
  const modifier = parseInt(hours) >= 12 ? "PM" : "AM";
  hours = parseInt(hours) % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${modifier}`;
}

function isoToDateKey(iso) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function isoToUtcDateKey(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

function slotMatchesSelectedDate(slotIsoStart, selectedDate) {
  if (!slotIsoStart || !selectedDate) return false;
  // Accept local and UTC interpretations to avoid timezone boundary mismatches.
  return (
    isoToDateKey(slotIsoStart) === selectedDate ||
    isoToUtcDateKey(slotIsoStart) === selectedDate
  );
}

function isoToTime12(iso) {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return to12(`${hh}:${mm}`);
}

function timeOnSelectedDateToIso(dateKey, hhmm24) {
  // Keep a stable wall-clock time by storing and reading availability in UTC.
  return `${dateKey}T${hhmm24}:00.000Z`;
}

function getMutationErrorMessage(error, fallbackMessage) {
  const graphQLErrorMessage = error?.graphQLErrors?.[0]?.message;
  const networkErrorMessage = error?.networkError?.result?.errors?.[0]?.message;
  return graphQLErrorMessage || networkErrorMessage || error?.message || fallbackMessage;
}

const navBtnStyle = {
  background: "none", border: `1.5px solid ${GRAY_BORDER}`, borderRadius: 6,
  width: 28, height: 28, fontSize: 16, cursor: "pointer", color: "#555",
  display: "flex", alignItems: "center", justifyContent: "center"
};
const selectStyle = {
  padding: "5px 10px", borderRadius: 6, border: `1.5px solid ${GRAY_BORDER}`,
  fontSize: 14, fontWeight: 600, color: "#333", background: "#fff", cursor: "pointer"
};
