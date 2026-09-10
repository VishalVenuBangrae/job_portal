// Shared, deterministic rules. A CV is never parsed to decide eligibility.
export const POSITIONS = [
  "Captain",
  "Bosun",
  "Mate",
  "Deckhand",
  "Engineer",
  "Chef",
  "Interior",
  "Chief Stew",
  "Stewardess",
  "Exterior",
];
export const TAGS = {
  Deck: [
    "Washdown",
    "Detailing",
    "Teak work",
    "Polishing",
    "Line handling",
    "Tender work",
    "Boat-show preparation",
  ],
  Interior: [
    "Deep cleaning",
    "Laundry",
    "Turnaround",
    "Service support",
    "Provisioning",
    "Organization",
    "Boat-show hosting",
  ],
  Galley: [
    "Chef support",
    "Provisioning",
    "Galley cleaning",
    "Crew cooking",
    "Temporary chef coverage",
  ],
  Engineering: [
    "Bilge cleaning",
    "Parts inventory",
    "Mechanical assistance",
    "Yard-period support",
  ],
};
export const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
export function positionKey(value) {
  const key = normalize(value);
  return (
    {
      "deck hand": "deckhand",
      "chef/crew cook": "chef",
      "chief stewardess": "chief stew",
      "2nd stewardess": "stewardess",
    }[key] || key
  );
}
export function countryKey(value) {
  const key = normalize(value);
  return ["us", "usa", "united states of america", "united states"].includes(
    key,
  )
    ? "united states"
    : key;
}
export const contactLimit = (count) =>
  count === 1 ? 5 : count === 2 ? 8 : count >= 3 && count <= 5 ? 12 : 0;
export const dateKey = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";
export function openJob(job, now = new Date()) {
  return (
    job.status === "active" &&
    !!job.endDate &&
    dateKey(job.endDate) >= dateKey(now)
  );
}
export function availableFor(availability, start, end) {
  if (!availability || availability.mode === "unavailable" || !start || !end)
    return false;
  const from = new Date(dateKey(start)),
    to = new Date(dateKey(end));
  if (from > to) return false;
  if (availability.mode === "now") return true;
  if (availability.mode === "dates")
    return (
      !!availability.start &&
      !!availability.end &&
      dateKey(availability.start) <= dateKey(start) &&
      dateKey(availability.end) >= dateKey(end)
    );
  if (availability.mode === "weekdays") {
    const days = availability.weekdays || [];
    for (
      let i = 0;
      i < Math.min(7, Math.floor((to - from) / 86400000) + 1);
      i++
    ) {
      if (!days.includes(new Date(+from + i * 86400000).getUTCDay()))
        return false;
    }
    return true;
  }
  return false;
}
export function distanceKm(a, b) {
  if (
    ![a?.latitude, a?.longitude, b?.latitude, b?.longitude].every(
      Number.isFinite,
    )
  )
    return null;
  const rad = (n) => (n * Math.PI) / 180;
  const x =
    Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
export function matchCrew(user, job, now = new Date()) {
  const cp = user.crewProfile;
  const lastActivity = Math.max(
    +new Date(cp?.profileLastActive || 0),
    +new Date(user.lastLoginAt || 0),
  );
  const reminder = +new Date(cp?.profileReminderSentAt || 0);
  const expires =
    reminder > lastActivity
      ? reminder + 7 * 86400000
      : lastActivity + 37 * 86400000;
  if (
    !user.emailVerified ||
    !cp?.profileComplete ||
    cp.profileStatus !== "active" ||
    !cp.profileLastActive ||
    +now >= expires
  )
    return null;
  if (
    !openJob(job, now) ||
    !availableFor(cp.availability, job.startDate, job.endDate)
  )
    return null;
  if (
    !(cp.positions || []).some(
      (p) => positionKey(p) === positionKey(job.position),
    )
  )
    return null;
  if (
    countryKey(cp.currentLocation?.country) !==
    countryKey(job.location?.country)
  )
    return null;
  // Explicit crew attestation; a passport or B1/B2 selection is not work authorization.
  if (
    !(cp.workEligibilityCountries || []).some(
      (c) => countryKey(c) === countryKey(job.location.country),
    )
  )
    return null;
  if (!(cp.workTypes || []).includes(job.jobType)) return null;
  if ((job.requiredCertificates || []).some((c) => !cp.documents?.[c]?.data))
    return null;
  const distance = distanceKm(
    cp.currentLocation?.coordinates,
    job.location?.coordinates,
  );
  const sameCity =
    normalize(cp.currentLocation?.city) === normalize(job.location?.city);
  if (distance === null ? !sameCity : distance > (cp.travelKm || 0))
    return null;
  const skills = (job.tags || []).filter((t) =>
    (cp.keywords || []).includes(t),
  );
  const reasons = [
    positionKey(cp.primaryPosition) === positionKey(job.position)
      ? "Primary position match"
      : "Additional position match",
    sameCity ? "In the same city" : "Within travel distance",
    "Available for all job dates",
  ];
  if (skills.length) reasons.push(`${skills.length} matching skills`);
  const age = Math.min(
    30,
    Math.max(0, (+now - new Date(cp.profileLastActive)) / 86400000),
  );
  const score =
    (positionKey(cp.primaryPosition) === positionKey(job.position) ? 40 : 25) +
    (sameCity ? 20 : 10) +
    Math.min(20, skills.length * 5) +
    Math.round(10 * (1 - age / 30)) +
    (cp.experience?.includes("1 year +") ? 10 : 5);
  return {
    score,
    reasons,
    distanceKm: distance === null ? null : Math.round(distance),
  };
}
// Explicit allowlists keep new private model fields private by default.
export function publicJob(job) {
  return Object.fromEntries(
    [
      "_id",
      "title",
      "location",
      "description",
      "requirements",
      "salary",
      "jobType",
      "jobCategory",
      "position",
      "vesselFlag",
      "startDate",
      "endDate",
      "crewNeeded",
      "department",
      "tags",
      "requiredCertificates",
      "status",
      "createdAt",
      "updatedAt",
    ].map((k) => [k, job[k]]),
  );
}
export function crewPreview(user, match) {
  const cp = user.crewProfile;
  return {
    _id: user._id,
    name: `${cp.firstName || user.name.split(" ")[0]} ${cp.lastName?.[0] || ""}${cp.lastName ? "." : ""}`,
    positions: cp.positions,
    primaryPosition: cp.primaryPosition,
    location: cp.currentLocation,
    availability: cp.availability,
    experience: cp.experience,
    keywords: cp.keywords,
    yachtSize: cp.yachtSize,
    dayRate: cp.dayRate,
    profileLastActive: cp.profileLastActive,
    hasPhoto: !!cp.documents?.photo?.data,
    certificates: ["stcw", "eng1"].filter((k) => cp.documents?.[k]?.data),
    ...match,
  };
}
