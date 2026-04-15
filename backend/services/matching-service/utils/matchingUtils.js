function intersectionCount(arr1, arr2) {
  const set2 = new Set(arr2.map(v => v.toLowerCase()));
  return arr1.filter(v => set2.has(v.toLowerCase())).length;
}

function toMinutes(time) {
  // Supports both HH:mm strings and ISO timestamps
  if (!time) return NaN;

  const asDate = new Date(time);
  if (!Number.isNaN(asDate.getTime())) {
    return asDate.getUTCHours() * 60 + asDate.getUTCMinutes();
  }

  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return NaN;
  }
  return h * 60 + m;
}

function hasOverlap(slotsA, slotsB) {
  for (const a of slotsA) {
    for (const b of slotsB) {
      const dayA = a.dayOfWeek || new Date(a.startTime).toLocaleDateString("en-US", { weekday: "long" });
      const dayB = b.dayOfWeek || new Date(b.startTime).toLocaleDateString("en-US", { weekday: "long" });
      if (dayA !== dayB) continue;

      const startA = toMinutes(a.startTime);
      const endA = toMinutes(a.endTime);
      const startB = toMinutes(b.startTime);
      const endB = toMinutes(b.endTime);

      if ([startA, endA, startB, endB].some((v) => Number.isNaN(v))) {
        continue;
      }

      if (Math.max(startA, startB) < Math.min(endA, endB)) {
        return true;
      }
    }
  }
  return false;
}

function calculateScore(profileA, profileB) {
  let score = 0;
  const reasons = [];

  const sharedCourses = intersectionCount(
    profileA.courses.map(c => c.name),
    profileB.courses.map(c => c.name)
  );
  if (sharedCourses > 0) {
    score += 30;
    reasons.push(`Shared ${sharedCourses} course(s)`);
  }

  const sharedTopics = intersectionCount(
    profileA.topics.map(t => t.name),
    profileB.topics.map(t => t.name)
  );
  if (sharedTopics > 0) {
    score += 20;
    reasons.push(`Shared ${sharedTopics} topic(s)`);
  }

  if (hasOverlap(profileA.availabilitySlots, profileB.availabilitySlots)) {
    score += 30;
    reasons.push("Overlapping availability");
  }

  if (profileA.preferredMode && profileA.preferredMode.toLowerCase() === profileB.preferredMode.toLowerCase()) {
    score += 10;
    reasons.push("Same study mode");
  }

  if (profileA.preferredStyle && profileA.preferredStyle.toLowerCase() === profileB.preferredStyle.toLowerCase()) {
    score += 5;
    reasons.push("Same study style");
  }

  if (profileA.preferredPace && profileA.preferredPace.toLowerCase() === profileB.preferredPace.toLowerCase()) {
    score += 5;
    reasons.push("Same study pace");
  }

  if (profileA.preferredGroupSize && profileA.preferredGroupSize === profileB.preferredGroupSize) {
    score += 5;
    reasons.push("Same preferred group size");
  }

  return {
    score: Math.min(score, 100),
    reasons
  };
}

module.exports = {
  calculateScore
};