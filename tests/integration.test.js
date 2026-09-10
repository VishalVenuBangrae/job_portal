import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import jwt from "jsonwebtoken";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "local-integration-only-secret-at-least-32-characters";
process.env.MONGOMS_DOWNLOAD_DIR = new URL(
  "../../../work/mongodb-binaries/",
  import.meta.url,
).pathname.replace(/^\/([A-Z]:)/, "$1");
const { app } = await import("../server.js");
const { default: User } = await import("../models/User.js");
const { default: Job } = await import("../models/Job.js");
let mongo, employer, other, crew, token, otherToken, crewToken, jobId;
const auth = (t) => ({ Authorization: `Bearer ${t}` });
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET);
const pdf = Buffer.from("%PDF-1.4\nTest document\n%%EOF");
before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  employer = await User.create({
    name: "Test Captain",
    email: "captain@example.test",
    password: "Password123!",
    phone: "123456789",
    userType: "employer",
    emailVerified: true,
    vessel: { name: "PRIVATE VESSEL", callSign: "PRIVATE-CALL" },
  });
  other = await User.create({
    name: "Other Captain",
    email: "other@example.test",
    password: "Password123!",
    phone: "123456780",
    userType: "employer",
    emailVerified: true,
  });
  token = sign(employer);
  otherToken = sign(other);
  const cp = {
    firstName: "Test",
    lastName: "Crew",
    profileComplete: true,
    profileStatus: "active",
    profileLastActive: new Date(),
    positions: ["Deckhand"],
    primaryPosition: "Deckhand",
    currentLocation: {
      city: "Fort Lauderdale",
      country: "United States",
      port: "Port Everglades",
    },
    workEligibilityCountries: ["United States"],
    availability: { mode: "now" },
    workTypes: ["Daywork"],
    contactPreferences: ["email"],
    experience: ["1 year +"],
    keywords: ["Washdown"],
    documents: {
      cv: { data: pdf, contentType: "application/pdf", originalName: "cv.pdf" },
      stcw: { data: pdf },
      eng1: { data: pdf },
      passport: { data: pdf },
    },
  };
  crew = await User.create({
    name: "Test Crew",
    email: "crew@example.test",
    password: "Password123!",
    phone: "123456781",
    userType: "jobseeker",
    emailVerified: true,
    crewProfile: cp,
  });
  crewToken = sign(crew);
  for (let i = 0; i < 6; i++)
    await User.create({
      name: `Crew ${i}`,
      email: `crew${i}@example.test`,
      password: "Password123!",
      phone: "123456782",
      userType: "jobseeker",
      emailVerified: true,
      crewProfile: cp,
    });
});
after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
test("real database workflow: privacy, atomic quotas, application isolation and closed access", async () => {
  const start = new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    end = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  let r = await request(app)
    .post("/api/v1/jobs")
    .set(auth(token))
    .send({
      title: "Deck washdown",
      company: "PRIVATE COMPANY",
      location: {
        country: "United States",
        city: "Fort Lauderdale",
        port: "Port Everglades",
        displayName: "Fort Lauderdale",
      },
      description: "Three days of deck work",
      salary: "USD 180/day",
      jobType: "Daywork",
      position: "Deckhand",
      vesselFlag: "Foreign Flagged",
      startDate: start,
      endDate: end,
      crewNeeded: 1,
      department: "Deck",
      tags: ["Washdown"],
      requiredCertificates: ["stcw"],
    });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  jobId = r.body._id;
  r = await request(app).get("/api/v1/jobs");
  assert.equal(r.status, 200);
  assert.equal(r.text.includes("PRIVATE"), false);
  assert.equal(r.body[0].employer, undefined);
  r = await request(app).get(`/api/v1/auth/users/${crew._id}/resume`);
  assert.equal(r.status, 401);
  r = await request(app)
    .get(`/api/v1/jobs/${jobId}/contacts/${crew._id}/documents/cv`)
    .set(auth(token));
  assert.equal(r.status, 403);
  r = await request(app)
    .get(`/api/v1/jobs/${jobId}/matches`)
    .set(auth(otherToken));
  assert.equal(r.status, 404);
  r = await request(app).get(`/api/v1/jobs/${jobId}/matches`).set(auth(token));
  assert.equal(r.status, 200);
  assert.equal(r.body.crew.length, 7);
  assert.equal(r.text.includes("crew@example.test"), false);
  assert.equal(r.text.includes("Buffer"), false);
  const ids = r.body.crew.map((c) => c._id);
  const unlocked = await Promise.all(
    ids.map((id) =>
      request(app)
        .post(`/api/v1/jobs/${jobId}/contacts/${id}`)
        .set(auth(token)),
    ),
  );
  assert.equal(unlocked.filter((r) => r.status === 201).length, 5);
  assert.equal((await Job.findById(jobId)).contacts.length, 5);
  const selected = (await Job.findById(jobId)).contacts[0].crew;
  r = await request(app)
    .get(`/api/v1/jobs/${jobId}/contacts/${selected}/documents/cv`)
    .set(auth(token));
  assert.equal(r.status, 200);
  r = await request(app)
    .get(`/api/v1/jobs/${jobId}/contacts/${selected}/documents/passport`)
    .set(auth(token));
  assert.equal(r.status, 403);
  r = await request(app).get(`/api/v1/jobs/${jobId}/contacts`).set(auth(token));
  assert.equal(r.body[0].phone, undefined);
  assert.ok(r.body[0].email);
  r = await request(app)
    .put(`/api/v1/jobs/${jobId}`)
    .set(auth(token))
    .send({ employer: other._id });
  assert.equal(r.status, 400);
  r = await request(app)
    .post(`/api/v1/jobs/${jobId}/apply`)
    .set(auth(crewToken))
    .field("email", "spoof@example.test")
    .attach("resume", pdf, "cv.pdf");
  assert.equal(r.status, 200, JSON.stringify(r.body));
  r = await request(app).get(`/api/v1/jobs/${jobId}`);
  assert.equal(r.body.applications, undefined);
  assert.equal(r.text.includes("crew@example.test"), false);
  r = await request(app).get("/api/v1/jobs/applied").set(auth(crewToken));
  assert.equal(r.body[0].applications, undefined);
  assert.equal(r.body[0].employer, undefined);
  r = await request(app)
    .post(`/api/v1/jobs/${jobId}/apply`)
    .set(auth(crewToken))
    .field("email", crew.email)
    .attach("resume", pdf, "cv.pdf");
  assert.equal(r.status, 400);
  r = await request(app)
    .put(`/api/v1/jobs/${jobId}`)
    .set(auth(token))
    .send({ status: "filled" });
  assert.equal(r.status, 200);
  r = await request(app)
    .get(`/api/v1/jobs/${jobId}/contacts/${selected}/documents/cv`)
    .set(auth(token));
  assert.equal(r.status, 403);
  r = await request(app).get(`/api/v1/jobs/${jobId}/contacts`).set(auth(token));
  assert.equal(r.body[0].email, undefined);
  assert.equal(r.body[0].closed, true);
});
test("password reset rejects a missing code and expires existing tokens after change", async () => {
  let r = await request(app)
    .post("/api/v1/auth/reset-password-email")
    .send({ email: crew.email, newPassword: "Attack123!" });
  assert.equal(r.status, 400);
  r = await request(app)
    .post("/api/v1/auth/reset-password")
    .send({ phone: crew.phone, newPassword: "Attack123!" });
  assert.equal(r.status, 400);
  r = await request(app)
    .post("/api/v1/auth/change-password")
    .set(auth(crewToken))
    .send({ currentPassword: "Password123!", newPassword: "NewPassword123!" });
  assert.equal(r.status, 200);
  r = await request(app).get("/api/v1/auth/me").set(auth(crewToken));
  assert.equal(r.status, 401);
});
test("unverified users cannot use authenticated APIs or receive registration tokens", async () => {
  let r = await request(app)
    .post("/api/v1/auth/register")
    .send({
      firstName: "New",
      lastName: "Crew",
      email: "new@example.test",
      phone: "123456789",
      password: "Password123!",
      userType: "jobseeker",
      termsAccepted: true,
    });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.token, undefined);
  const u = await User.findOne({ email: "new@example.test" });
  r = await request(app)
    .get("/api/v1/auth/me")
    .set(auth(sign(u)));
  assert.equal(r.status, 403);
  r = await request(app)
    .post("/api/v1/auth/verify-email")
    .send({ email: u.email, code: u.emailVerificationCode });
  assert.equal(r.status, 200);
});
test("profile saves structured availability and uploads without changing verified identity", async () => {
  const user = await User.findOne({ email: "new@example.test" }),
    t = sign(user);
  const fields = {
    firstName: "New",
    lastName: "Crew",
    email: user.email,
    confirmEmail: user.email,
    phone: "123456789",
    positions: JSON.stringify(["Deckhand"]),
    primaryPosition: "Deckhand",
    locationCity: "Fort Lauderdale",
    locationCountry: "United States",
    locationPort: "Port Everglades",
    duration: "3 days",
    nationality: "US",
    experience: JSON.stringify(["Green"]),
    keywords: JSON.stringify(["Washdown"]),
    travelKm: "30",
    availability: JSON.stringify({
      mode: "weekdays",
      weekdays: [1, 2, 3, 4, 5],
    }),
    workTypes: JSON.stringify(["Daywork"]),
    workEligibilityCountries: JSON.stringify(["United States"]),
    yachtSize: "New to yachting",
    dayRate: "Negotiable",
    contactPreferences: JSON.stringify(["email"]),
    profileStatus: "active",
  };
  let req = request(app).post("/api/v1/profile").set(auth(t));
  for (const [k, v] of Object.entries(fields)) req = req.field(k, v);
  for (const name of ["cv", "stcw", "eng1", "references", "passport"])
    req = req.attach(name, pdf, {
      filename: name + ".pdf",
      contentType: "application/pdf",
    });
  req = req.attach("photo", Buffer.from([0xff, 0xd8, 0xff]), {
    filename: "photo.jpg",
    contentType: "image/jpeg",
  });
  let r = await req;
  assert.equal(r.status, 200, JSON.stringify(r.body));
  r = await request(app).get("/api/v1/profile").set(auth(t));
  assert.equal(r.body.primaryPosition, "Deckhand");
  assert.equal(r.body.documents.photo.uploaded, true);
  assert.equal(r.body.availability.mode, "weekdays");
  assert.equal(r.text.includes("Buffer"), false);
  r = await request(app)
    .post("/api/v1/profile")
    .set(auth(t))
    .field("firstName", "New")
    .field("lastName", "Crew")
    .field("email", "changed@example.test")
    .field("confirmEmail", "changed@example.test");
  assert.equal(r.status, 400);
  assert.match(r.body.message, /verified email/);
  r = await request(app).get("/api/v1/profile/documents/passport").set(auth(t));
  assert.equal(r.status, 200);
});
