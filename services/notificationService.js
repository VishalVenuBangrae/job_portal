import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendEmail } from "../controllers/authController.js";
import { escapeHtml } from "./http.js";
export function platformLink(path = "/crew-profile.html") {
  const base =
    process.env.APP_URL ||
    process.env.ALLOWED_ORIGIN ||
    "http://localhost:8080";
  return new URL(path, base).href;
}
export function jobDateRange(start, end) {
  const a = new Date(start),
    b = new Date(end);
  const fmt = (d) =>
    new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(d);
  if (a.getUTCFullYear() !== b.getUTCFullYear())
    return `${fmt(a)}, ${a.getUTCFullYear()}–${fmt(b)}, ${b.getUTCFullYear()}`;
  if (a.getUTCMonth() === b.getUTCMonth())
    return a.getUTCDate() === b.getUTCDate()
      ? fmt(a)
      : `${fmt(a)}–${b.getUTCDate()}`;
  return `${fmt(a)}–${fmt(b)}`;
}
export function preselectionMessage(job) {
  const role =
    job.jobType === "Daywork"
      ? `${{ Deckhand: "Deck", "Deck hand": "Deck" }[job.position] || job.position} Dayworker`
      : job.position;
  return `You have been preselected for a ${role} position in ${job.location.city} from ${jobDateRange(job.startDate, job.endDate)}. The verified hiring party can now view your CV and contact you using the contact methods you have approved.`;
}
export function reminderHtml(name) {
  const link = escapeHtml(platformLink());
  return `<p>Dear ${escapeHtml(name)},</p>
<p>We notice that you have not logged into your profile for a month or so. Please log in at <a href="${link}">${link}</a> and update your profile, specifically:</p>
<ul><li>your current job search status (active/inactive)</li><li>your current location</li></ul>
<p>We use this information to connect candidates with opportunities so it is very important that your profile is up to date as it will mean that you have a greater chance of being selected for your ideal job.</p>
<p>Please also make sure that the CV you have uploaded is up to date including details of your most recent jobs and if you have any new verbal reference contacts to give us please also update this on your profile as well as uploading any new written references you might have.</p>
<p>If we don't hear from you in the next <strong>7 days</strong> we will automatically change your profile status to "inactive".</p>
<p>Please do not hesitate to contact us if you have any questions. We look forward to finding you your ideal position whether now or in the future.</p>
<p>Nauti Crew Agency</p>`;
}
export async function deliverNotification(notification) {
  if (!notification.emailSubject || notification.emailSentAt) return;
  try {
    const user = await User.findById(notification.user).select("email");
    if (!user) return;
    await sendEmail(
      user.email,
      notification.emailSubject,
      notification.emailHtml,
    );
    await Notification.updateOne(
      { _id: notification._id },
      { $set: { emailSentAt: new Date() } },
    );
  } catch (e) {
    console.error("Notification retained for email retry:", e.message);
  }
}
export async function notifyWithEmail({
  user,
  job,
  kind,
  message,
  subject,
  html,
}) {
  const notification = await Notification.create({
    user,
    job,
    kind,
    message,
    emailSubject: subject,
    emailHtml: html,
  });
  await deliverNotification(notification);
  return notification;
}
export async function retryNotificationEmails() {
  const pending = await Notification.find({
    emailSentAt: { $exists: false },
    emailSubject: { $exists: true },
  })
    .select("+emailSubject +emailHtml")
    .limit(100);
  for (const n of pending) await deliverNotification(n);
}
