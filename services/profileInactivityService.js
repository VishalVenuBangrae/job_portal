import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendEmail } from "../controllers/authController.js";
import { escapeHtml } from "./http.js";
import { checkHiringFollowups } from "./followupService.js";
const DAY = 86400000;
export async function checkProfileInactivity(now = new Date()) {
  const inactiveBefore = new Date(+now - 30 * DAY),
    remindBefore = new Date(+now - 23 * DAY);
  let deactivated = 0,
    reminded = 0;
  const users = await User.find({
    userType: "jobseeker",
    "crewProfile.profileComplete": true,
    "crewProfile.profileStatus": "active",
    "crewProfile.profileLastActive": { $lte: remindBefore },
  });
  for (const user of users) {
    const stale = user.crewProfile.profileLastActive <= inactiveBefore;
    if (!stale && user.crewProfile.profileReminderSentAt) continue;
    const message = stale
      ? "Your profile is now inactive. Update your availability to appear in matches again."
      : "Please confirm your availability and location within 7 days to keep your profile active.";
    if (stale) {
      const changed = await User.updateOne(
        {
          _id: user._id,
          "crewProfile.profileStatus": "active",
          "crewProfile.profileLastActive": user.crewProfile.profileLastActive,
        },
        { $set: { "crewProfile.profileStatus": "inactive" } },
      );
      if (!changed.modifiedCount) continue;
      deactivated++;
    }
    await Notification.updateOne(
      { user: user._id, message, createdAt: { $gte: remindBefore } },
      { $setOnInsert: { user: user._id, message } },
      { upsert: true },
    );
    try {
      await sendEmail(
        user.email,
        stale
          ? "Your NCA profile is now inactive"
          : "Confirm your NCA availability",
        `<p>Hi ${escapeHtml(user.crewProfile.firstName || user.name)},</p><p>${message}</p><p>Please also check that your CV and written references are current.</p>`,
      );
      if (!stale) {
        await User.updateOne(
          {
            _id: user._id,
            "crewProfile.profileLastActive": user.crewProfile.profileLastActive,
          },
          { $set: { "crewProfile.profileReminderSentAt": now } },
        );
        reminded++;
      }
    } catch (err) {
      console.error("Availability email delivery failed:", err.message);
    }
  }
  return { deactivated, reminded };
}
export function startProfileInactivityScheduler() {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await checkProfileInactivity();
      await checkHiringFollowups();
    } catch (e) {
      console.error("NCA scheduled check failed:", e.message);
    } finally {
      running = false;
    }
  };
  run();
  return setInterval(run, 24 * 60 * 60 * 1000);
}
