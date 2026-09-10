import { test } from "node:test";
import assert from "node:assert/strict";
import {
  availableFor,
  contactLimit,
  matchCrew,
  publicJob,
} from "../services/matching.js";
const now = new Date("2026-09-10T12:00:00Z");
const job = {
  status: "active",
  position: "Deckhand",
  jobType: "Daywork",
  location: { city: "Fort Lauderdale", country: "United States" },
  startDate: "2026-09-14",
  endDate: "2026-09-15",
  requiredCertificates: ["stcw"],
  tags: ["Washdown"],
};
const crew = () => ({
  emailVerified: true,
  crewProfile: {
    profileComplete: true,
    profileStatus: "active",
    profileLastActive: now,
    primaryPosition: "Deck hand",
    positions: ["Deck hand"],
    availability: { mode: "now" },
    currentLocation: { city: "Fort Lauderdale", country: "USA" },
    workEligibilityCountries: ["United States"],
    workTypes: ["Daywork"],
    documents: { stcw: { data: Buffer.from("test") } },
    keywords: ["Washdown"],
    experience: ["1 year +"],
  },
});
test("position and country aliases match structured profiles", () =>
  assert.ok(matchCrew(crew(), job, now)));
test("all required dates must be available", () => {
  assert.equal(
    availableFor(
      { mode: "weekdays", weekdays: [1] },
      job.startDate,
      job.endDate,
    ),
    false,
  );
  assert.equal(
    availableFor(
      { mode: "weekdays", weekdays: [1, 2] },
      job.startDate,
      job.endDate,
    ),
    true,
  );
  assert.equal(
    availableFor(
      { mode: "dates", start: "2026-09-14", end: "2026-09-14" },
      job.startDate,
      job.endDate,
    ),
    false,
  );
});
test("ineligible, stale, inactive and incomplete crew never rank", () => {
  for (const [k, v] of [
    ["workEligibilityCountries", []],
    ["profileStatus", "inactive"],
    ["profileComplete", false],
    ["profileLastActive", "2026-08-01"],
    ["documents", {}],
    ["positions", ["Chef"]],
  ]) {
    const u = crew();
    u.crewProfile[k] = v;
    assert.equal(matchCrew(u, job, now), null, k);
  }
});
test("unresolved distance never assumes a different city is close", () => {
  const u = crew();
  u.crewProfile.currentLocation.city = "Miami";
  u.crewProfile.travelKm = 100;
  assert.equal(matchCrew(u, job, now), null);
});
test("contact limits exactly follow requested brackets", () =>
  assert.deepEqual([1, 2, 3, 5, 6].map(contactLimit), [5, 8, 12, 12, 0]));
test("public job allowlist never leaks employer, application, or vessel data", () => {
  const safe = publicJob({
    ...job,
    employer: { email: "secret" },
    applications: [{ resume: "secret" }],
    contacts: ["secret"],
    vessel: "secret",
    company: "secret",
  });
  assert.equal(JSON.stringify(safe).includes("secret"), false);
});
