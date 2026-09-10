import Job from "../models/Job.js";
import Notification from "../models/Notification.js";
// A daily follow-up after the scheduled job end. No vessel identity enters crew messages.
export async function checkHiringFollowups(now = new Date()) {
  const jobs = await Job.find({
    endDate: { $lte: new Date(+now - 86400000) },
    "contacts.0": { $exists: true },
  });
  let count = 0;
  for (const job of jobs) {
    for (const contact of job.contacts) {
      if (contact.followupSentAt) continue;
      for (const [user, message] of [
        [
          contact.crew,
          `Were you hired for the ${job.position} opportunity in ${job.location.city}? Record the outcome in My applications.`,
        ],
        [
          job.employer,
          `Did you hire ${contact.name} for your ${job.position} job? Record the outcome in the job's contact list.`,
        ],
      ]) {
        await Notification.updateOne(
          { user, job: job._id, message },
          { $setOnInsert: { user, job: job._id, message } },
          { upsert: true },
        );
      }
      contact.followupSentAt = now;
      count++;
    }
    await job.save({ validateBeforeSave: false });
  }
  return count;
}
