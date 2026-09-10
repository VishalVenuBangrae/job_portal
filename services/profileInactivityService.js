import User from "../models/User.js";
import {
  notifyWithEmail,
  reminderHtml,
  retryNotificationEmails,
  platformLink,
} from "./notificationService.js";
import { escapeHtml } from "./http.js";
import { checkHiringFollowups } from "./followupService.js";
const DAY = 86400000;
export const activityDate = (user) =>
  new Date(
    Math.max(
      +new Date(user.lastLoginAt || 0),
      +new Date(user.crewProfile?.profileLastActive || user.createdAt || 0),
    ),
  );
export async function checkProfileInactivity(now = new Date()) {
  let deactivated = 0,
    reminded = 0;
  const users = await User.find({
    userType: "jobseeker",
    "crewProfile.profileComplete": true,
    "crewProfile.profileStatus": "active",
  });
  for (const user of users) {
    const activity = activityDate(user),
      cp = user.crewProfile;
    if (+now - activity < 30 * DAY) continue;
    const reminder = cp.profileReminderSentAt;
    const predicate = {
      _id: user._id,
      "crewProfile.profileStatus": "active",
      "crewProfile.profileLastActive": cp.profileLastActive,
      lastLoginAt: user.lastLoginAt || { $exists: false },
    };
    if (
      reminder &&
      +new Date(reminder) > +activity &&
      +now - new Date(reminder) >= 7 * DAY
    ) {
      const changed = await User.updateOne(predicate, {
        $set: { "crewProfile.profileStatus": "inactive" },
      });
      if (!changed.modifiedCount) continue;
      await notifyWithEmail({
        user: user._id,
        kind: "inactive",
        message:
          "Your profile is now inactive. Update your availability to appear in matches again.",
        subject: "Your NCA profile is now inactive",
        html: `<p>Dear ${escapeHtml(cp.firstName || user.name)},</p><p>Your profile is now inactive following our reminder. <a href="${escapeHtml(platformLink())}">Update your profile</a> and mark yourself active when you are ready for work.</p>`,
      });
      deactivated++;
      continue;
    }
    if (reminder && +new Date(reminder) > +activity) continue;
    // Compare activity timestamps again so a simultaneous login/profile save wins.
    const changed = await User.updateOne(
      {
        ...predicate,
        "crewProfile.profileReminderSentAt": reminder || { $exists: false },
      },
      { $set: { "crewProfile.profileReminderSentAt": now } },
    );
    if (!changed.modifiedCount) continue;
    await notifyWithEmail({
      user: user._id,
      kind: "availability-reminder",
      message:
        "Please update your current location and active/inactive status. If we do not hear from you in the next 7 days, your profile will become inactive.",
      subject: "Please update your NCA crew profile",
      html: reminderHtml(cp.firstName || user.name),
    });
    reminded++;
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
      await retryNotificationEmails();
    } catch (e) {
      console.error("NCA scheduled check failed:", e.message);
    } finally {
      running = false;
    }
  };
  run();
  return setInterval(run, 60 * 60 * 1000);
}
