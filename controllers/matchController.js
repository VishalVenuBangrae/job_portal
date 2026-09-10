import {
  notifyWithEmail,
  preselectionMessage,
} from "../services/notificationService.js";
import { escapeHtml } from "../services/http.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import {
  matchCrew,
  contactLimit,
  crewPreview,
  openJob,
  dateKey,
} from "../services/matching.js";
import { endpoint, fail, sendDocument } from "../services/http.js";

async function owned(req) {
  const job = await Job.findOne({ _id: req.params.id, employer: req.user._id });
  if (!job) fail(404, "Job not found");
  return job;
}
export const getMatches = endpoint(async (req, res) => {
  const job = await owned(req);
  if (!openJob(job))
    return res.json({
      crew: [],
      contactLimit: contactLimit(job.crewNeeded),
      unlocked: [],
      closed: true,
    });
  const users = await User.find({
    userType: "jobseeker",
    emailVerified: true,
    "crewProfile.profileComplete": true,
    "crewProfile.profileStatus": "active",
  });
  const crew = users
    .map((u) => {
      const m = matchCrew(u, job);
      return m ? crewPreview(u, m) : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
  res.json({
    crew,
    contactLimit: contactLimit(job.crewNeeded),
    unlocked: job.contacts.map((c) => String(c.crew)),
    closed: false,
  });
});
export const unlockCrew = endpoint(async (req, res) => {
  const job = await owned(req);
  if (!openJob(job)) fail(409, "Contact access is closed for this job");
  if (job.contacts.some((c) => String(c.crew) === req.params.crewId))
    return res.json({ message: "Crew already selected" });
  const crew = await User.findById(req.params.crewId);
  if (!crew || !matchCrew(crew, job))
    fail(409, "This crew member no longer matches the job");
  const limit = contactLimit(job.crewNeeded);
  if (!limit) fail(403, "Contact NCA for jobs needing more than five crew");
  // Atomic predicate prevents parallel requests from exceeding the per-job limit.
  const updated = await Job.findOneAndUpdate(
    {
      _id: job._id,
      employer: req.user._id,
      status: "active",
      endDate: job.endDate,
      crewNeeded: job.crewNeeded,
      "contacts.crew": { $ne: crew._id },
      $expr: { $lt: [{ $size: { $ifNull: ["$contacts", []] } }, limit] },
    },
    {
      $push: {
        contacts: { crew: crew._id, name: crew.name, unlockedAt: new Date() },
      },
    },
    { new: true },
  );
  if (!updated)
    fail(409, "Contact limit reached or job changed. Refresh and try again.");
  const message = preselectionMessage(job);
  await notifyWithEmail({
    user: crew._id,
    job: job._id,
    kind: "preselection",
    message,
    subject: "You have been preselected for daywork",
    html: `<p>${escapeHtml(message)}</p>`,
  });

  res.status(201).json({
    message:
      "Crew selected. Contact access is available while this job is open.",
  });
});
export const getContacts = endpoint(async (req, res) => {
  const job = await owned(req);
  if (!openJob(job))
    return res.json(
      job.contacts.map((c) => ({
        _id: c.crew,
        name: c.name,
        closed: true,
        employerOutcome: c.employerOutcome,
      })),
    );
  const users = await User.find({
    _id: { $in: job.contacts.map((c) => c.crew) },
  });
  res.json(
    users.map((u) => {
      const cp = u.crewProfile,
        p = cp.contactPreferences || [];
      return {
        _id: u._id,
        name: u.name,
        email: p.includes("email") ? u.email : undefined,
        phone: p.some((x) => ["phone", "text"].includes(x))
          ? u.phone
          : undefined,
        whatsapp:
          p.includes("whatsapp") && cp.phoneWhatsApp ? u.phone : undefined,
        documents: ["cv", "references", "stcw", "eng1"].filter(
          (k) => cp.documents?.[k]?.data,
        ),
        employerOutcome: job.contacts.find(
          (c) => String(c.crew) === String(u._id),
        )?.employerOutcome,
      };
    }),
  );
});
export const contactDocument = endpoint(async (req, res) => {
  const job = await owned(req);
  if (
    !openJob(job) ||
    !job.contacts.some((c) => String(c.crew) === req.params.crewId)
  )
    fail(403, "Select Contact Crew on an open job first");
  if (!["cv", "references", "stcw", "eng1"].includes(req.params.docType))
    fail(403, "This document is private");
  const user = await User.findById(req.params.crewId);
  sendDocument(res, user?.crewProfile?.documents?.[req.params.docType]);
});
export const matchPhoto = endpoint(async (req, res) => {
  const job = await owned(req),
    user = await User.findById(req.params.crewId);
  if (!user || !matchCrew(user, job)) fail(404, "Photo unavailable");
  const doc = user.crewProfile.documents.photo;
  if (!doc?.data) fail(404, "Photo unavailable");
  res
    .set({
      "Content-Type": doc.contentType,
      "Cache-Control": "private, no-store",
    })
    .send(doc.data);
});
export const setOutcome = endpoint(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) fail(404, "Job not found");
  const employer = req.user.userType === "employer";
  if (employer && String(job.employer) !== String(req.user._id))
    fail(403, "Not your job");
  const crewId = employer ? req.params.crewId : String(req.user._id);
  const contact = job.contacts.find((c) => String(c.crew) === crewId);
  if (!contact) fail(404, "Introduction not found");
  const allowed = employer
    ? [
        "Yes",
        "No",
        "Waiting for a response",
        "Crew was unavailable",
        "Job was cancelled",
      ]
    : ["Yes", "No", "Contacted but not hired", "No response"];
  if (!allowed.includes(req.body.outcome)) fail(400, "Choose a valid outcome");
  contact[employer ? "employerOutcome" : "crewOutcome"] = req.body.outcome;
  await job.save();
  res.json({ message: "Thank you. Your response has been recorded." });
});
