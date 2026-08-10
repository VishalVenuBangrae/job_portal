import User from '../models/User.js';
import { sendEmail } from '../controllers/authController.js';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const REMINDER_DAYS_MS = 16 * 24 * 60 * 60 * 1000;

export async function checkProfileInactivity() {
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - THIRTY_DAYS_MS);
  const sixteenDaysAgo = new Date(now - REMINDER_DAYS_MS);

  const usersToDeactivate = await User.find({
    userType: 'jobseeker',
    'crewProfile.profileComplete': true,
    'crewProfile.profileStatus': 'active',
    'crewProfile.profileLastActive': { $lte: thirtyDaysAgo }
  });

  for (const user of usersToDeactivate) {
    user.crewProfile.profileStatus = 'inactive';
    await user.save();

    await sendEmail(
      user.email,
      'Your Nauti Crew Agency profile is now inactive',
      `<p>Hi ${user.crewProfile.firstName || user.name},</p>
       <p>Your crew profile has been automatically set to <strong>Inactive</strong> because it has not been updated in 30 days.</p>
       <p>To become available for work again, please log in and update your profile status to Active.</p>
       <p>— Nauti Crew Agency</p>`
    );
  }

  const usersToRemind = await User.find({
    userType: 'jobseeker',
    'crewProfile.profileComplete': true,
    'crewProfile.profileStatus': 'active',
    'crewProfile.profileLastActive': { $lte: sixteenDaysAgo, $gt: thirtyDaysAgo },
    $or: [
      { 'crewProfile.profileReminderSentAt': { $exists: false } },
      { 'crewProfile.profileReminderSentAt': null }
    ]
  });

  for (const user of usersToRemind) {
    user.crewProfile.profileReminderSentAt = new Date();
    await user.save();

    await sendEmail(
      user.email,
      'Reminder: Update your Nauti Crew Agency profile',
      `<p>Hi ${user.crewProfile.firstName || user.name},</p>
       <p>We notice that you have not logged into your profile in some time.</p>
       <p>Please log in and update:</p>
       <ul>
         <li>your current job search status (active/inactive)</li>
         <li>your current location</li>
       </ul>
       <p>Please also ensure your CV is up to date and add any new references.</p>
       <p>If we don't hear from you in the next <strong>14 days</strong>, your profile status will be automatically set to <strong>Inactive</strong>.</p>
       <p>— Nauti Crew Agency</p>`
    );
  }

  return {
    deactivated: usersToDeactivate.length,
    reminded: usersToRemind.length
  };
}

export function startProfileInactivityScheduler() {
  const run = async () => {
    try {
      const result = await checkProfileInactivity();
      if (result.deactivated || result.reminded) {
        console.log(`Profile inactivity check: ${result.deactivated} deactivated, ${result.reminded} reminded`);
      }
    } catch (err) {
      console.error('Profile inactivity check failed:', err.message);
    }
  };

  run();
  setInterval(run, 24 * 60 * 60 * 1000);
}
